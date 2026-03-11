import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { requireIdentityEmail } from "../lib/authIdentity";

/**
 * Receipt Mutations
 * 
 * Handles receipt generation and updates for appointments and orders
 */

/**
 * Generate a receipt for an appointment payment
 * Called when payment is successfully processed
 */
export const generateReceipt = mutation({
  args: {
    appointmentId: v.id("appointments"),
    paymentIntentId: v.string(),
    paymentMethod: v.optional(v.object({
      type: v.string(),
      brand: v.optional(v.string()),
      last4: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    // Get the appointment
    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) {
      throw new ConvexError("Appointment not found");
    }

    // Verify authorization (must be the client or barber)
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", requireIdentityEmail(userId)))
      .first();

    if (!currentUser) {
      throw new ConvexError("User not found");
    }

    const isAuthorized = 
      appointment.clientId === currentUser._id || 
      appointment.barberId === currentUser._id;

    if (!isAuthorized) {
      throw new ConvexError("Not authorized to generate receipt");
    }

    // Check if receipt already exists for this appointment
    const existingReceipt = await ctx.db
      .query("receipts")
      .withIndex("by_appointment", (q) => q.eq("appointmentId", args.appointmentId))
      .first();

    if (existingReceipt) {
      // Update existing receipt with new payment info
      await ctx.db.patch(existingReceipt._id, {
        status: "paid",
        paymentIntentId: args.paymentIntentId,
        paymentMethod: args.paymentMethod,
        paidAt: Date.now(),
      });
      return existingReceipt._id;
    }

    // Get barber profile for business name
    const barberProfile = await ctx.db
      .query("barberProfiles")
      .withIndex("by_user", (q) => q.eq("userId", appointment.barberId))
      .first();

    // Get client info
    const client = await ctx.db.get(appointment.clientId);

    // Generate receipt number
    const receiptNumber = await generateReceiptNumber(ctx);

    // Calculate totals
    const subtotal = appointment.price;
    const total = subtotal;

    // Create receipt
    const receipt = await ctx.db.insert("receipts", {
      appointmentId: args.appointmentId,
      clientId: appointment.clientId,
      barberId: appointment.barberId,
      receiptNumber,
      items: [
        {
          name: appointment.serviceName,
          description: barberProfile?.businessName 
            ? `Service by ${barberProfile.businessName}` 
            : undefined,
          quantity: 1,
          unitPrice: appointment.price,
          total: appointment.price,
        },
      ],
      subtotal,
      total,
      paymentMethod: args.paymentMethod,
      paymentIntentId: args.paymentIntentId,
      status: "paid",
      location: {
        type: appointment.locationType,
        address: appointment.address,
      },
      paidAt: Date.now(),
      createdAt: Date.now(),
    });

    return receipt;
  },
});

/**
 * Generate a receipt for an order payment
 */
export const generateOrderReceipt = mutation({
  args: {
    orderId: v.id("orders"),
    paymentIntentId: v.string(),
    paymentMethod: v.optional(v.object({
      type: v.string(),
      brand: v.optional(v.string()),
      last4: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    // Get the order
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new ConvexError("Order not found");
    }

    // Verify authorization
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", requireIdentityEmail(userId)))
      .first();

    if (!currentUser || order.clientId !== currentUser._id) {
      throw new ConvexError("Not authorized");
    }

    // Check if receipt already exists
    const existingReceipt = await ctx.db
      .query("receipts")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .first();

    if (existingReceipt) {
      await ctx.db.patch(existingReceipt._id, {
        status: "paid",
        paymentIntentId: args.paymentIntentId,
        paymentMethod: args.paymentMethod,
        paidAt: Date.now(),
      });
      return existingReceipt._id;
    }

    // Generate receipt number
    const receiptNumber = await generateReceiptNumber(ctx);

    // Create receipt items from order items
    const items = order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      total: item.price * item.quantity,
    }));

    // Create receipt
    const receipt = await ctx.db.insert("receipts", {
      orderId: args.orderId,
      clientId: order.clientId,
      barberId: order.barberId,
      receiptNumber,
      items,
      subtotal: order.subtotal,
      tax: order.tax,
      discount: order.discount,
      discountCode: order.couponCode,
      total: order.total,
      paymentMethod: args.paymentMethod,
      paymentIntentId: args.paymentIntentId,
      status: "paid",
      paidAt: Date.now(),
      createdAt: Date.now(),
    });

    return receipt;
  },
});

/**
 * Update receipt status when refund is processed
 */
export const updateReceiptRefundStatus = mutation({
  args: {
    receiptId: v.id("receipts"),
    refundedAmount: v.number(),
    isPartialRefund: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const receipt = await ctx.db.get(args.receiptId);
    if (!receipt) {
      throw new ConvexError("Receipt not found");
    }

    // Verify authorization
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", requireIdentityEmail(userId)))
      .first();

    if (!currentUser) {
      throw new ConvexError("User not found");
    }

    const isAuthorized = 
      receipt.clientId === currentUser._id || 
      receipt.barberId === currentUser._id ||
      currentUser.role === "admin";

    if (!isAuthorized) {
      throw new ConvexError("Not authorized");
    }

    const status = args.isPartialRefund ? "partially_refunded" : "refunded";

    await ctx.db.patch(args.receiptId, {
      status,
      refundedAmount: args.refundedAmount,
      refundedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Helper function to generate unique receipt numbers
 * Format: RCP-YYYYMMDD-XXXXX
 */
async function generateReceiptNumber(ctx: any): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  
  // Get count of receipts for today to generate sequential number
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayReceipts = await ctx.db
    .query("receipts")
    .withIndex("by_created", (q: any) => 
      q.gte("createdAt", today.getTime()).lt("createdAt", tomorrow.getTime())
    )
    .collect();
  
  const sequence = String(todayReceipts.length + 1).padStart(5, "0");
  
  return `RCP-${dateStr}-${sequence}`;
}
