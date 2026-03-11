import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";

export const createCoupon = mutation({
  args: {
    code: v.string(),
    description: v.optional(v.string()),
    discountType: v.union(v.literal("percentage"), v.literal("fixed_amount")),
    discountValue: v.number(),
    applicableTo: v.union(v.literal("services"), v.literal("products"), v.literal("both")),
    barberId: v.optional(v.id("users")),
    maxUses: v.optional(v.number()),
    maxUsesPerUser: v.optional(v.number()),
    minPurchaseAmount: v.optional(v.number()),
    validFrom: v.number(),
    validUntil: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email ?? ""))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    if (user.role !== "barber" && user.role !== "admin") {
      throw new ConvexError("Not authorized to create coupons");
    }

    if (args.barberId && user.role === "barber" && user._id !== args.barberId) {
      throw new ConvexError("Not authorized to create coupons for other barbers");
    }

    const existingCoupon = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (existingCoupon) {
      throw new ConvexError("A coupon with this code already exists");
    }

    if (args.discountType === "percentage" && (args.discountValue < 1 || args.discountValue > 100)) {
      throw new ConvexError("Percentage discount must be between 1 and 100");
    }

    if (args.discountType === "fixed_amount" && args.discountValue <= 0) {
      throw new ConvexError("Fixed discount must be greater than 0");
    }

    const coupon = await ctx.db.insert("coupons", {
      createdBy: user._id,
      code: args.code.toUpperCase(),
      description: args.description,
      discountType: args.discountType,
      discountValue: args.discountValue,
      applicableTo: args.applicableTo,
      barberId: args.barberId,
      maxUses: args.maxUses,
      maxUsesPerUser: args.maxUsesPerUser,
      minPurchaseAmount: args.minPurchaseAmount,
      validFrom: args.validFrom,
      validUntil: args.validUntil,
      currentUses: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return coupon;
  },
});

export const applyDiscount = mutation({
  args: {
    couponCode: v.string(),
    amount: v.number(),
    type: v.union(v.literal("service"), v.literal("product")),
    barberId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email ?? ""))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    const coupon = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", args.couponCode.toUpperCase()))
      .first();

    if (!coupon) {
      throw new ConvexError("Invalid coupon code");
    }

    if (!coupon.isActive) {
      throw new ConvexError("This coupon is no longer active");
    }

    const now = Date.now();
    if (now < coupon.validFrom) {
      throw new ConvexError("This coupon is not yet valid");
    }

    if (coupon.validUntil && now > coupon.validUntil) {
      throw new ConvexError("This coupon has expired");
    }

    if (coupon.maxUses !== undefined && coupon.currentUses >= coupon.maxUses) {
      throw new ConvexError("This coupon has reached its maximum number of uses");
    }

    const applicableTo = coupon.applicableTo;
    if (applicableTo === "services" && args.type !== "service") {
      throw new ConvexError("This coupon is only valid for services");
    }
    if (applicableTo === "products" && args.type !== "product") {
      throw new ConvexError("This coupon is only valid for products");
    }

    if (coupon.barberId) {
      if (!args.barberId || coupon.barberId !== args.barberId) {
        throw new ConvexError("This coupon is not valid for this barber");
      }
    }

    if (coupon.minPurchaseAmount !== undefined && args.amount < coupon.minPurchaseAmount) {
      throw new ConvexError(
        `Minimum purchase amount of $${coupon.minPurchaseAmount} required for this coupon`
      );
    }

    if (coupon.maxUsesPerUser !== undefined) {
      const userUsage = await ctx.db
        .query("couponUsage")
        .withIndex("by_coupon_user", (q) =>
          q.eq("couponId", coupon._id).eq("userId", user._id)
        )
        .first();

      if (userUsage && userUsage.usageCount >= coupon.maxUsesPerUser) {
        throw new ConvexError("You have reached the maximum uses for this coupon");
      }
    }

    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = (args.amount * coupon.discountValue) / 100;
    } else {
      discount = Math.min(coupon.discountValue, args.amount);
    }

    const finalAmount = Math.max(0, args.amount - discount);

    return {
      valid: true,
      discount,
      finalAmount,
      couponCode: coupon.code,
      description: coupon.description,
    };
  },
});

export const redeemCoupon = mutation({
  args: {
    couponCode: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email ?? ""))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    const coupon = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", args.couponCode.toUpperCase()))
      .first();

    if (!coupon) {
      throw new ConvexError("Invalid coupon code");
    }

    await ctx.db.patch(coupon._id, {
      currentUses: coupon.currentUses + 1,
      updatedAt: Date.now(),
    });

    const existingUsage = await ctx.db
      .query("couponUsage")
      .withIndex("by_coupon_user", (q) =>
        q.eq("couponId", coupon._id).eq("userId", user._id)
      )
      .first();

    if (existingUsage) {
      await ctx.db.patch(existingUsage._id, {
        usageCount: existingUsage.usageCount + 1,
        lastUsedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("couponUsage", {
        couponId: coupon._id,
        userId: user._id,
        usageCount: 1,
        lastUsedAt: Date.now(),
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});

export const toggleCoupon = mutation({
  args: {
    couponId: v.id("coupons"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email ?? ""))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    if (user.role !== "barber" && user.role !== "admin") {
      throw new ConvexError("Not authorized to manage coupons");
    }

    const coupon = await ctx.db.get(args.couponId);
    if (!coupon) {
      throw new ConvexError("Coupon not found");
    }

    if (user.role === "barber" && coupon.createdBy !== user._id) {
      throw new ConvexError("Not authorized to modify this coupon");
    }

    await ctx.db.patch(args.couponId, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.couponId);
  },
});

export const updateCoupon = mutation({
  args: {
    couponId: v.id("coupons"),
    description: v.optional(v.string()),
    discountType: v.optional(v.union(v.literal("percentage"), v.literal("fixed_amount"))),
    discountValue: v.optional(v.number()),
    applicableTo: v.optional(v.union(v.literal("services"), v.literal("products"), v.literal("both"))),
    maxUses: v.optional(v.number()),
    maxUsesPerUser: v.optional(v.number()),
    minPurchaseAmount: v.optional(v.number()),
    validUntil: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email ?? ""))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    if (user.role !== "barber" && user.role !== "admin") {
      throw new ConvexError("Not authorized to update coupons");
    }

    const coupon = await ctx.db.get(args.couponId);
    if (!coupon) {
      throw new ConvexError("Coupon not found");
    }

    if (user.role === "barber" && coupon.createdBy !== user._id) {
      throw new ConvexError("Not authorized to update this coupon");
    }

    if (args.discountType === "percentage" && args.discountValue && (args.discountValue < 1 || args.discountValue > 100)) {
      throw new ConvexError("Percentage discount must be between 1 and 100");
    }

    if (args.discountType === "fixed_amount" && args.discountValue && args.discountValue <= 0) {
      throw new ConvexError("Fixed discount must be greater than 0");
    }

    const updateData: Record<string, any> = {
      updatedAt: Date.now(),
    };

    if (args.description !== undefined) updateData.description = args.description;
    if (args.discountType !== undefined) updateData.discountType = args.discountType;
    if (args.discountValue !== undefined) updateData.discountValue = args.discountValue;
    if (args.applicableTo !== undefined) updateData.applicableTo = args.applicableTo;
    if (args.maxUses !== undefined) updateData.maxUses = args.maxUses;
    if (args.maxUsesPerUser !== undefined) updateData.maxUsesPerUser = args.maxUsesPerUser;
    if (args.minPurchaseAmount !== undefined) updateData.minPurchaseAmount = args.minPurchaseAmount;
    if (args.validUntil !== undefined) updateData.validUntil = args.validUntil;

    await ctx.db.patch(args.couponId, updateData);

    return await ctx.db.get(args.couponId);
  },
});

export const deleteCoupon = mutation({
  args: {
    couponId: v.id("coupons"),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email ?? ""))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    if (user.role !== "barber" && user.role !== "admin") {
      throw new ConvexError("Not authorized to delete coupons");
    }

    const coupon = await ctx.db.get(args.couponId);
    if (!coupon) {
      throw new ConvexError("Coupon not found");
    }

    if (user.role === "barber" && coupon.createdBy !== user._id) {
      throw new ConvexError("Not authorized to delete this coupon");
    }

    await ctx.db.delete(args.couponId);

    return { success: true };
  },
});

export const trackUsage = mutation({
  args: {
    couponCode: v.string(),
    appointmentId: v.optional(v.id("appointments")),
    orderId: v.optional(v.id("orders")),
    amount: v.number(),
    discountAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email ?? ""))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    const coupon = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", args.couponCode.toUpperCase()))
      .first();

    if (!coupon) {
      throw new ConvexError("Invalid coupon code");
    }

    if (!coupon.isActive) {
      throw new ConvexError("This coupon is no longer active");
    }

    const now = Date.now();
    if (now < coupon.validFrom) {
      throw new ConvexError("This coupon is not yet valid");
    }

    if (coupon.validUntil && now > coupon.validUntil) {
      throw new ConvexError("This coupon has expired");
    }

    if (coupon.maxUses !== undefined && coupon.currentUses >= coupon.maxUses) {
      throw new ConvexError("This coupon has reached its maximum number of uses");
    }

    if (coupon.maxUsesPerUser !== undefined) {
      const userUsage = await ctx.db
        .query("couponUsage")
        .withIndex("by_coupon_user", (q) =>
          q.eq("couponId", coupon._id).eq("userId", user._id)
        )
        .first();

      if (userUsage && userUsage.usageCount >= coupon.maxUsesPerUser) {
        throw new ConvexError("You have reached the maximum uses for this coupon");
      }
    }

    await ctx.db.patch(coupon._id, {
      currentUses: coupon.currentUses + 1,
      updatedAt: Date.now(),
    });

    const existingUsage = await ctx.db
      .query("couponUsage")
      .withIndex("by_coupon_user", (q) =>
        q.eq("couponId", coupon._id).eq("userId", user._id)
      )
      .first();

    if (existingUsage) {
      await ctx.db.patch(existingUsage._id, {
        usageCount: existingUsage.usageCount + 1,
        lastUsedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("couponUsage", {
        couponId: coupon._id,
        userId: user._id,
        usageCount: 1,
        lastUsedAt: Date.now(),
        createdAt: Date.now(),
      });
    }

    const usageRecord = await ctx.db
      .query("couponUsage")
      .withIndex("by_coupon_user", (q) =>
        q.eq("couponId", coupon._id).eq("userId", user._id)
      )
      .first();

    await ctx.db.insert("couponUsageDetails", {
      usageId: usageRecord!._id,
      couponId: coupon._id,
      userId: user._id,
      appointmentId: args.appointmentId,
      orderId: args.orderId,
      originalAmount: args.amount,
      discountAmount: args.discountAmount,
      finalAmount: args.amount - args.discountAmount,
      usedAt: Date.now(),
      createdAt: Date.now(),
    });

    return {
      success: true,
      couponCode: coupon.code,
      usageCount: (usageRecord?.usageCount ?? 1),
    };
  },
});
