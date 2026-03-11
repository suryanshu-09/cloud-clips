import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireIdentityEmail } from "../lib/authIdentity";
import { getIdentityOrDev } from "../lib/authIdentity";

/**
 * Notification Queries
 */

// Get notifications for the current user, sorted by createdAt desc
export const getNotifications = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await getIdentityOrDev(ctx);
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", requireIdentityEmail(identity)))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    let notificationsQuery = ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc");

    if (args.limit) {
      return await notificationsQuery.take(args.limit);
    }

    return await notificationsQuery.collect();
  },
});

// Get count of unread notifications for the current user
export const getUnreadNotificationCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await getIdentityOrDev(ctx);
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", requireIdentityEmail(identity)))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", user._id).eq("isRead", false)
      )
      .collect();

    return unreadNotifications.length;
  },
});
