import { mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

const shippingAddressValidator = v.object({
  name: v.string(),
  address: v.string(),
  city: v.string(),
  state: v.string(),
  zipCode: v.string(),
  phone: v.optional(v.string()),
});

const orderItemValidator = v.object({
  productId: v.id("products"),
  name: v.string(),
  price: v.number(),
  quantity: v.number(),
});

export const createOrder = mutation({
  args: {
    items: v.array(orderItemValidator),
    subtotal: v.number(),
    tax: v.optional(v.number()),
    shipping: v.optional(v.number()),
    discount: v.optional(v.number()),
    total: v.number(),
    shippingAddress: shippingAddressValidator,
    couponCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email ?? ""))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Group items by barber and validate stock
    const barberOrders = new Map<Id<"users">, typeof args.items>();
    
    for (const item of args.items) {
      const product = await ctx.db.get(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.name}`);
      }
      if (!product.isActive) {
        throw new Error(`Product is no longer available: ${item.name}`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for: ${item.name}`);
      }

      const barberId = product.barberId;
      if (!barberOrders.has(barberId)) {
        barberOrders.set(barberId, []);
      }
      barberOrders.get(barberId)!.push(item);

      // Decrement stock
      await ctx.db.patch(item.productId, {
        stock: product.stock - item.quantity,
        updatedAt: Date.now(),
      });
    }

    // Create an order for each barber
    const orders: any[] = [];
    
    for (const [barberId, items] of barberOrders) {
      // Calculate totals for this barber's items
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const itemTax = args.tax ? (subtotal / args.subtotal) * args.tax : 0;
      const itemShipping = args.shipping ? (items.length / args.items.length) * args.shipping : 0;
      const itemDiscount = args.discount ? (subtotal / args.subtotal) * args.discount : 0;
      const total = subtotal + itemTax + itemShipping - itemDiscount;

      const order = await ctx.db.insert("orders", {
        clientId: user._id,
        barberId,
        items,
        subtotal,
        tax: args.tax ? itemTax : undefined,
        shipping: itemShipping > 0 ? itemShipping : undefined,
        discount: itemDiscount > 0 ? itemDiscount : undefined,
        total,
        shippingAddress: args.shippingAddress,
        status: "pending",
        paymentStatus: "pending",
        couponCode: args.couponCode,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      orders.push(order);
    }

    return orders;
  },
});

export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("confirmed"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    trackingNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email ?? ""))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Only barber who owns the order can update status
    if (order.barberId !== user._id && user.role !== "admin") {
      throw new Error("Not authorized to update this order");
    }

    const updates: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.status === "shipped") {
      updates.trackingNumber = args.trackingNumber;
      updates.shippedAt = Date.now();
    }

    if (args.status === "delivered") {
      updates.deliveredAt = Date.now();
    }

    // If cancelled, restore stock
    if (args.status === "cancelled") {
      for (const item of order.items) {
        const product = await ctx.db.get(item.productId);
        if (product) {
          await ctx.db.patch(item.productId, {
            stock: product.stock + item.quantity,
            updatedAt: Date.now(),
          });
        }
      }
    }

    await ctx.db.patch(args.orderId, updates);

    return await ctx.db.get(args.orderId);
  },
});

export const updatePaymentStatus = mutation({
  args: {
    orderId: v.id("orders"),
    paymentStatus: v.union(
      v.literal("paid"),
      v.literal("refunded"),
      v.literal("failed")
    ),
    paymentIntentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Only the client who placed the order or admin can update payment
    if (order.clientId !== userId.subject && userId.role !== "admin") {
      throw new Error("Not authorized");
    }

    const updates: any = {
      paymentStatus: args.paymentStatus,
      updatedAt: Date.now(),
    };

    if (args.paymentIntentId) {
      updates.paymentIntentId = args.paymentIntentId;
    }

    // If payment failed or refunded, restore stock
    if (args.paymentStatus === "failed" || args.paymentStatus === "refunded") {
      for (const item of order.items) {
        const product = await ctx.db.get(item.productId);
        if (product) {
          await ctx.db.patch(item.productId, {
            stock: product.stock + item.quantity,
            updatedAt: Date.now(),
          });
        }
      }
    }

    await ctx.db.patch(args.orderId, updates);

    return await ctx.db.get(args.orderId);
  },
});

export const cancelOrder = mutation({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email ?? ""))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Only the client who placed the order can cancel
    if (order.clientId !== user._id) {
      throw new Error("Not authorized to cancel this order");
    }

    // Can only cancel pending orders
    if (order.status !== "pending") {
      throw new Error("Cannot cancel order that is not pending");
    }

    // Restore stock
    for (const item of order.items) {
      const product = await ctx.db.get(item.productId);
      if (product) {
        await ctx.db.patch(item.productId, {
          stock: product.stock + item.quantity,
          updatedAt: Date.now(),
        });
      }
    }

    await ctx.db.patch(args.orderId, {
      status: "cancelled",
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.orderId);
  },
});
