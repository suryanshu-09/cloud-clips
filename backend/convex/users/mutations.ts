import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * User Mutations
 */

// Update user profile
export const updateUserProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    avatar: v.optional(v.string()),
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

    await ctx.db.patch(user._id, {
      ...args,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(user._id);
  },
});

// Update push tokens
export const updatePushToken = mutation({
  args: {
    token: v.string(),
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

    const currentTokens = user.pushTokens || [];
    if (!currentTokens.includes(args.token)) {
      await ctx.db.patch(user._id, {
        pushTokens: [...currentTokens, args.token],
        updatedAt: Date.now(),
      });
    }

    return await ctx.db.get(user._id);
  },
});

// Remove push token
export const removePushToken = mutation({
  args: {
    token: v.string(),
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

    const currentTokens = user.pushTokens || [];
    await ctx.db.patch(user._id, {
      pushTokens: currentTokens.filter((t) => t !== args.token),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(user._id);
  },
});
