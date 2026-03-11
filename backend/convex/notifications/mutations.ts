import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireIdentityEmail } from "../lib/authIdentity";

/**
 * Notification Mutations
 */

// Create a notification for a user
export const createNotification = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("appointment_confirmed"),
      v.literal("appointment_reminder"),
      v.literal("appointment_cancelled"),
      v.literal("new_message"),
      v.literal("new_review"),
      v.literal("payment_received"),
      v.literal("order_shipped"),
      v.literal("order_delivered"),
      v.literal("system_announcement")
    ),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Verify the target user exists
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      body: args.body,
      data: args.data,
      isRead: false,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

// Mark a single notification as read
export const markNotificationAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
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

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    // Verify ownership
    if (notification.userId !== user._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.notificationId, {
      isRead: true,
      readAt: Date.now(),
    });

    return { success: true };
  },
});

// Mark all notifications as read for the current user
export const markAllNotificationsAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
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

    // Find all unread notifications for this user
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", user._id).eq("isRead", false)
      )
      .collect();

    const now = Date.now();

    // Mark each as read
    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, {
        isRead: true,
        readAt: now,
      });
    }

    return { success: true, markedCount: unreadNotifications.length };
  },
});

// Delete a notification (verify ownership)
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
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

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    // Verify ownership
    if (notification.userId !== user._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.notificationId);

    return { success: true };
  },
});
