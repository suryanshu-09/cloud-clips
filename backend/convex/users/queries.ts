import { query } from "../_generated/server";
import { v, ConvexError } from "convex/values";

/**
 * User Queries
 * 
 * Queries for fetching user data with proper authentication checks
 */

/**
 * Get the current authenticated user's full profile
 * Returns null if not authenticated
 * Returns user data including role and profile information
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) {
      return null;
    }

    // Return full user object (excluding sensitive fields)
    return {
      _id: user._id,
      email: user.email,
      emailVerified: user.emailVerified,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      isActive: user.isActive,
      linkedAccounts: user.linkedAccounts,
      pushTokens: user.pushTokens,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },
});

// Get user by ID
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Check if user is a barber
export const isBarber = query({
  args: {},
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      return false;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email))
      .first();

    return user?.role === "barber";
  },
});
