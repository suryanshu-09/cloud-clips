import { query } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { requireIdentityEmail } from "../lib/authIdentity";
import { getIdentityOrDev } from "../lib/authIdentity";

export const getCouponByCode = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();
  },
});

export const getCouponsByBarber = query({
  args: {
    barberId: v.id("users"),
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

    if (!user || (user._id !== args.barberId && user.role !== "admin")) {
      throw new ConvexError("Not authorized");
    }

    return await ctx.db
      .query("coupons")
      .withIndex("by_barber", (q) => q.eq("barberId", args.barberId))
      .collect();
  },
});

export const getCouponUsage = query({
  args: {
    couponId: v.id("coupons"),
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

    const coupon = await ctx.db.get(args.couponId);
    if (!coupon) {
      throw new ConvexError("Coupon not found");
    }

    if (user.role !== "admin" && coupon.createdBy !== user._id) {
      throw new ConvexError("Not authorized");
    }

    return await ctx.db
      .query("couponUsage")
      .withIndex("by_coupon", (q) => q.eq("couponId", args.couponId))
      .collect();
  },
});

export const getActiveCoupons = query({
  args: {
    barberId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const allCoupons = await ctx.db
      .query("coupons")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    return allCoupons.filter((coupon) => {
      if (now < coupon.validFrom) return false;
      if (coupon.validUntil && now > coupon.validUntil) return false;
      if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) return false;
      if (args.barberId && coupon.barberId && coupon.barberId !== args.barberId) return false;
      return true;
    });
  },
});

export const getCoupons = query({
  args: {
    barberId: v.optional(v.id("users")),
    activeOnly: v.optional(v.boolean()),
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

    let coupons;

    if (args.barberId) {
      coupons = await ctx.db
        .query("coupons")
        .withIndex("by_barber", (q) => q.eq("barberId", args.barberId))
        .collect();
    } else if (user.role === "barber" || user.role === "admin") {
      coupons = await ctx.db
        .query("coupons")
        .filter((q) => q.eq(q.field("createdBy"), user._id))
        .collect();
    } else {
      coupons = await ctx.db
        .query("coupons")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();
    }

    if (args.activeOnly) {
      const now = Date.now();
      coupons = coupons.filter((c) => {
        if (!c.isActive) return false;
        if (now < c.validFrom) return false;
        if (c.validUntil && now > c.validUntil) return false;
        if (c.maxUses && c.currentUses >= c.maxUses) return false;
        return true;
      });
    }

    return coupons.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const validateCoupon = query({
  args: {
    code: v.string(),
    amount: v.optional(v.number()),
    type: v.optional(v.union(v.literal("service"), v.literal("product"))),
    barberId: v.optional(v.id("users")),
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

    const coupon = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!coupon) {
      return {
        valid: false,
        error: "Invalid coupon code",
      };
    }

    if (!coupon.isActive) {
      return {
        valid: false,
        error: "This coupon is no longer active",
      };
    }

    const now = Date.now();
    if (now < coupon.validFrom) {
      return {
        valid: false,
        error: "This coupon is not yet valid",
      };
    }

    if (coupon.validUntil && now > coupon.validUntil) {
      return {
        valid: false,
        error: "This coupon has expired",
      };
    }

    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return {
        valid: false,
        error: "This coupon has reached its maximum number of uses",
      };
    }

    if (args.type) {
      const applicableTo = coupon.applicableTo;
      if (applicableTo === "services" && args.type !== "service") {
        return {
          valid: false,
          error: "This coupon is only valid for services",
        };
      }
      if (applicableTo === "products" && args.type !== "product") {
        return {
          valid: false,
          error: "This coupon is only valid for products",
        };
      }
    }

    if (coupon.barberId && args.barberId) {
      if (coupon.barberId !== args.barberId) {
        return {
          valid: false,
          error: "This coupon is not valid for this barber",
        };
      }
    }

    if (args.amount !== undefined && coupon.minPurchaseAmount !== undefined) {
      if (args.amount < coupon.minPurchaseAmount) {
        return {
          valid: false,
          error: `Minimum purchase amount of $${coupon.minPurchaseAmount} required`,
        };
      }
    }

    if (coupon.maxUsesPerUser !== undefined) {
      const userUsage = await ctx.db
        .query("couponUsage")
        .withIndex("by_coupon_user", (q) =>
          q.eq("couponId", coupon._id).eq("userId", user._id)
        )
        .first();

      if (userUsage && userUsage.usageCount >= coupon.maxUsesPerUser) {
        return {
          valid: false,
          error: "You have reached the maximum uses for this coupon",
        };
      }
    }

    let discount = 0;
    if (args.amount !== undefined) {
      if (coupon.discountType === "percentage") {
        discount = (args.amount * coupon.discountValue) / 100;
      } else {
        discount = Math.min(coupon.discountValue, args.amount);
      }
    }

    return {
      valid: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        applicableTo: coupon.applicableTo,
      },
      discount,
    };
  },
});

export const getCouponUsageStats = query({
  args: {
    couponId: v.optional(v.id("coupons")),
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

    if (user.role !== "barber" && user.role !== "admin") {
      throw new ConvexError("Not authorized to view coupon usage");
    }

    let couponUsages;

    if (args.couponId) {
      const couponId = args.couponId;
      const coupon = await ctx.db.get(args.couponId);
      if (!coupon) {
        throw new ConvexError("Coupon not found");
      }

      if (user.role === "barber" && coupon.createdBy !== user._id) {
        throw new ConvexError("Not authorized to view this coupon's usage");
      }

      couponUsages = await ctx.db
        .query("couponUsage")
        .withIndex("by_coupon", (q) => q.eq("couponId", couponId))
        .collect();
    } else {
      const coupons = await ctx.db
        .query("coupons")
        .filter((q) => q.eq(q.field("createdBy"), user._id))
        .collect();

      const couponIds = coupons.map((c) => c._id);
      couponUsages = [];

      for (const couponId of couponIds) {
        const usages = await ctx.db
          .query("couponUsage")
          .withIndex("by_coupon", (q) => q.eq("couponId", couponId))
          .collect();
        couponUsages.push(...usages);
      }
    }

    const usageWithDetails = await Promise.all(
      couponUsages.map(async (usage) => {
        const coupon = await ctx.db.get(usage.couponId);
        const userInfo = await ctx.db.get(usage.userId);
        return {
          ...usage,
          couponCode: coupon?.code,
          couponDescription: coupon?.description,
          userName: userInfo?.name,
          userEmail: userInfo?.email,
        };
      })
    );

    return usageWithDetails.sort((a, b) => b.lastUsedAt - a.lastUsedAt);
  },
});

export const getMyCouponUsage: any = query({
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

    const userUsages = await ctx.db
      .query("couponUsage")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const usagesWithDetails = await Promise.all(
      userUsages.map(async (usage) => {
        const coupon = await ctx.db.get(usage.couponId);
        return {
          ...usage,
          couponCode: coupon?.code,
          couponDescription: coupon?.description,
          discountType: coupon?.discountType,
          discountValue: coupon?.discountValue,
          isActive: coupon?.isActive,
          validUntil: coupon?.validUntil,
        };
      })
    );

    return usagesWithDetails.sort((a, b) => b.lastUsedAt - a.lastUsedAt);
  },
});
