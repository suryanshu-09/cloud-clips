import { query } from "../_generated/server";
import { v } from "convex/values";

export const getMyOrders = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
      v.literal("refunded")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    let orders = await ctx.db
      .query("orders")
      .withIndex("by_client", (q) => q.eq("clientId", user._id))
      .collect();

    if (args.status) {
      orders = orders.filter((o) => o.status === args.status);
    }

    // Sort by creation date (newest first)
    orders.sort((a, b) => b.createdAt - a.createdAt);

    // Enrich with barber info
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const barber = await ctx.db.get(order.barberId);
        const barberProfile = barber
          ? await ctx.db
              .query("barberProfiles")
              .withIndex("by_user", (q) => q.eq("userId", order.barberId))
              .first()
          : null;

        return {
          ...order,
          barberName: barberProfile?.businessName || barber?.name || "Unknown",
        };
      })
    );

    const limit = args.limit || 50;
    return enrichedOrders.slice(0, limit);
  },
});

export const getOrderById = query({
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
      .withIndex("by_email", (q) => q.eq("email", userId.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      return null;
    }

    // Check authorization
    if (order.clientId !== user._id && order.barberId !== user._id && user.role !== "admin") {
      throw new Error("Not authorized to view this order");
    }

    // Get barber info
    const barber = await ctx.db.get(order.barberId);
    const barberProfile = barber
      ? await ctx.db
          .query("barberProfiles")
          .withIndex("by_user", (q) => q.eq("userId", order.barberId))
          .first()
      : null;

    // Get client info
    const client = await ctx.db.get(order.clientId);

    // Enrich items with product info
    const enrichedItems = await Promise.all(
      order.items.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        return {
          ...item,
          image: product?.images?.[0],
        };
      })
    );

    return {
      ...order,
      barberName: barberProfile?.businessName || barber?.name || "Unknown",
      clientName: client?.name || client?.email || "Unknown",
      items: enrichedItems,
    };
  },
});

export const getOrdersForBarber = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
      v.literal("refunded")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email))
      .first();

    if (!user || user.role !== "barber") {
      throw new Error("Not authorized");
    }

    let orders = await ctx.db
      .query("orders")
      .withIndex("by_barber", (q) => q.eq("barberId", user._id))
      .collect();

    if (args.status) {
      orders = orders.filter((o) => o.status === args.status);
    }

    // Sort by creation date (newest first)
    orders.sort((a, b) => b.createdAt - a.createdAt);

    // Enrich with client info
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const client = await ctx.db.get(order.clientId);
        return {
          ...order,
          clientName: client?.name || client?.email || "Unknown",
        };
      })
    );

    const limit = args.limit || 50;
    return enrichedOrders.slice(0, limit);
  },
});

export const getOrderStatus = query({
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
      .withIndex("by_email", (q) => q.eq("email", userId.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      return null;
    }

    // Check authorization - client, barber, or admin
    if (
      order.clientId !== user._id &&
      order.barberId !== user._id &&
      user.role !== "admin"
    ) {
      throw new Error("Not authorized to view this order");
    }

    // Return simplified status info
    return {
      _id: order._id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      trackingNumber: order.trackingNumber,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  },
});

export const getOrderCountByStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    let orders;
    if (user.role === "barber") {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_barber", (q) => q.eq("barberId", user._id))
        .collect();
    } else {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_client", (q) => q.eq("clientId", user._id))
        .collect();
    }

    const counts = {
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      refunded: 0,
    };

    for (const order of orders) {
      if (counts.hasOwnProperty(order.status)) {
        counts[order.status as keyof typeof counts]++;
      }
    }

    return counts;
  },
});
