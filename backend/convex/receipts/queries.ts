import { query } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { requireIdentityEmail } from "../lib/authIdentity";
import { getIdentityOrDev } from "../lib/authIdentity";

/**
 * Receipt Queries
 * 
 * Fetch receipts for clients and barbers
 */

/**
 * Get all receipts for the current user (as client)
 */
export const getMyReceipts = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("refunded"),
      v.literal("partially_refunded")
    )),
  },
  handler: async (ctx, args) => {
    const userId = await getIdentityOrDev(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", requireIdentityEmail(userId)))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    let receipts = await ctx.db
      .query("receipts")
      .withIndex("by_client", (q) => q.eq("clientId", user._id))
      .order("desc")
      .collect();

    // Filter by status if provided
    if (args.status) {
      receipts = receipts.filter((r) => r.status === args.status);
    }

    // Apply limit if provided
    if (args.limit && args.limit > 0) {
      receipts = receipts.slice(0, args.limit);
    }

    // Enrich receipts with barber info
    const enrichedReceipts = await Promise.all(
      receipts.map(async (receipt) => {
        const barber = await ctx.db.get(receipt.barberId);
        const barberProfile = await ctx.db
          .query("barberProfiles")
          .withIndex("by_user", (q) => q.eq("userId", receipt.barberId))
          .first();

        return {
          ...receipt,
          barber: {
            name: barber?.name,
            businessName: barberProfile?.businessName,
            avatar: barber?.avatar,
          },
        };
      })
    );

    return enrichedReceipts;
  },
});

/**
 * Get a single receipt by ID with full details
 */
export const getReceiptById = query({
  args: {
    receiptId: v.id("receipts"),
  },
  handler: async (ctx, args) => {
    const userId = await getIdentityOrDev(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const receipt = await ctx.db.get(args.receiptId);
    if (!receipt) {
      return null;
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
      throw new ConvexError("Not authorized to view this receipt");
    }

    // Get client info
    const client = await ctx.db.get(receipt.clientId);
    
    // Get barber info
    const barber = await ctx.db.get(receipt.barberId);
    const barberProfile = await ctx.db
      .query("barberProfiles")
      .withIndex("by_user", (q) => q.eq("userId", receipt.barberId))
      .first();

    // Get appointment details if exists
    let appointment = null;
    if (receipt.appointmentId) {
      appointment = await ctx.db.get(receipt.appointmentId);
    }

    return {
      ...receipt,
      client: {
        name: client?.name,
        email: client?.email,
        phone: client?.phone,
        avatar: client?.avatar,
      },
      barber: {
        name: barber?.name,
        email: barber?.email,
        phone: barber?.phone,
        avatar: barber?.avatar,
        businessName: barberProfile?.businessName,
        businessDescription: barberProfile?.businessDescription,
        location: barberProfile?.location,
      },
      appointment: appointment ? {
        scheduledFor: appointment.scheduledFor,
        duration: appointment.duration,
        status: appointment.status,
      } : null,
    };
  },
});

/**
 * Get receipt by appointment ID
 */
export const getReceiptByAppointmentId = query({
  args: {
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    const userId = await getIdentityOrDev(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const receipt = await ctx.db
      .query("receipts")
      .withIndex("by_appointment", (q) => q.eq("appointmentId", args.appointmentId))
      .first();

    if (!receipt) {
      return null;
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

    return receipt;
  },
});

/**
 * Get receipts for barber (earnings view)
 */
export const getBarberReceipts = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getIdentityOrDev(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", requireIdentityEmail(userId)))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Only barbers can view their own receipts
    if (user.role !== "barber" && user.role !== "admin") {
      throw new ConvexError("Not authorized");
    }

    let receipts = await ctx.db
      .query("receipts")
      .withIndex("by_barber", (q) => q.eq("barberId", user._id))
      .order("desc")
      .collect();

    // Filter by date range if provided
    if (args.startDate) {
      receipts = receipts.filter((r) => r.createdAt >= args.startDate!);
    }
    if (args.endDate) {
      receipts = receipts.filter((r) => r.createdAt <= args.endDate!);
    }

    // Apply limit if provided
    if (args.limit && args.limit > 0) {
      receipts = receipts.slice(0, args.limit);
    }

    // Enrich with client info
    const enrichedReceipts = await Promise.all(
      receipts.map(async (receipt) => {
        const client = await ctx.db.get(receipt.clientId);
        return {
          ...receipt,
          client: {
            name: client?.name,
            avatar: client?.avatar,
          },
        };
      })
    );

    return enrichedReceipts;
  },
});

/**
 * Get receipt statistics for a user
 */
export const getReceiptStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getIdentityOrDev(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", requireIdentityEmail(userId)))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Get all receipts for this user
    const receipts = await ctx.db
      .query("receipts")
      .withIndex("by_client", (q) => q.eq("clientId", user._id))
      .collect();

    // Calculate stats
    const totalSpent = receipts
      .filter((r) => r.status === "paid" || r.status === "partially_refunded")
      .reduce((sum, r) => sum + r.total, 0);

    const totalRefunded = receipts
      .filter((r) => r.status === "refunded" || r.status === "partially_refunded")
      .reduce((sum, r) => sum + (r.refundedAmount || 0), 0);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const spentThisMonth = receipts
      .filter((r) => 
        (r.status === "paid" || r.status === "partially_refunded") &&
        r.paidAt && r.paidAt >= thisMonth.getTime()
      )
      .reduce((sum, r) => sum + r.total, 0);

    return {
      totalReceipts: receipts.length,
      totalSpent,
      totalRefunded,
      spentThisMonth,
    };
  },
});
