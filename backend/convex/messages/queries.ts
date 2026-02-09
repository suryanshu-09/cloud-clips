import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Message Queries
 */

// Get user's conversations
export const getConversations = query({
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

    const conversations = await ctx.db
      .query("conversations")
      .filter((q) => q.contains("participants", [user._id]))
      .collect();

    // Enrich with participant details and unread counts
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipantId = conv.participants.find(
          (p) => p !== user._id
        );
        const otherUser = otherParticipantId
          ? await ctx.db.get(otherParticipantId)
          : null;

        const unreadCount = conv.unreadCounts?.[user._id.toString()] || 0;

        return {
          ...conv,
          otherParticipant: {
            name: otherUser?.name,
            avatar: otherUser?.avatar,
            role: otherUser?.role,
          },
          unreadCount,
        };
      })
    );

    // Sort by last message time
    return enrichedConversations.sort(
      (a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0)
    );
  },
});

// Get messages for a conversation
export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
    cursor: v.optional(v.string()),
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

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Verify user is in the conversation
    if (!conversation.participants.includes(user._id)) {
      throw new Error("Not authorized");
    }

    const limit = args.limit || 50;

    let messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_created", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("desc")
      .take(limit);

    // Enrich with sender details
    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        return {
          ...msg,
          sender: {
            name: sender?.name,
            avatar: sender?.avatar,
          },
        };
      })
    );

    return enrichedMessages.reverse();
  },
});

// Get conversation by appointment
export const getConversationByAppointment = query({
  args: {
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_appointment", (q) => q.eq("appointmentId", args.appointmentId))
      .first();
  },
});

// Get unread message count
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      return 0;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email))
      .first();

    if (!user) {
      return 0;
    }

    const conversations = await ctx.db
      .query("conversations")
      .filter((q) => q.contains("participants", [user._id]))
      .collect();

    return conversations.reduce((total, conv) => {
      return total + (conv.unreadCounts?.[user._id.toString()] || 0);
    }, 0);
  },
});
