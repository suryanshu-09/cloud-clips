import { query } from "../_generated/server";
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
      .withIndex("by_email", (q) => q.eq("email", userId.email ?? ""))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const conversations = (await ctx.db
      .query("conversations")
      .collect()).filter((conversation) =>
      conversation.participants.includes(user._id)
    );

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

// Get paginated messages for a conversation
export const getChatMessages = query({
  args: {
    conversationId: v.id("conversations"),
    cursor: v.optional(v.id("messages")),
    limit: v.optional(v.number()),
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

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Verify user is in the conversation
    if (!conversation.participants.includes(user._id)) {
      throw new Error("Not authorized");
    }

    const limit = Math.min(args.limit || 50, 100); // Cap at 100 messages

    // Build query with cursor support
    let messages;

    if (args.cursor) {
      const cursorMessage = await ctx.db.get(args.cursor);
      if (cursorMessage) {
        messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation_created", (q) =>
            q
              .eq("conversationId", args.conversationId)
              .lt("createdAt", cursorMessage.createdAt)
          )
          .order("desc")
          .take(limit + 1);
      } else {
        messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation_created", (q) =>
            q.eq("conversationId", args.conversationId)
          )
          .order("desc")
          .take(limit + 1);
      }
    } else {
      messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation_created", (q) =>
          q.eq("conversationId", args.conversationId)
        )
        .order("desc")
        .take(limit + 1);
    }

    // Check if there are more messages
    const hasMore = messages.length > limit;
    const paginatedMessages = hasMore ? messages.slice(0, limit) : messages;

    // Enrich with sender details
    const enrichedMessages = await Promise.all(
      paginatedMessages.map(async (msg) => {
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

    // Reverse to show oldest first
    const orderedMessages = enrichedMessages.reverse();

    return {
      messages: orderedMessages,
      nextCursor: hasMore ? paginatedMessages[paginatedMessages.length - 1]._id : null,
      hasMore,
    };
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

// Get conversation by ID with enriched participant data
export const getConversation = query({
  args: {
    conversationId: v.id("conversations"),
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

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Verify user is in the conversation
    if (!conversation.participants.includes(user._id)) {
      throw new Error("Not authorized");
    }

    // Get other participant info
    const otherParticipantId = conversation.participants.find(
      (p) => p !== user._id
    );

    let otherUser = null;
    let barberProfile = null;

    if (otherParticipantId) {
      otherUser = await ctx.db.get(otherParticipantId);

      // If other user is a barber, get their profile
      if (otherUser?.role === "barber") {
        barberProfile = await ctx.db
          .query("barberProfiles")
          .withIndex("by_user", (q) => q.eq("userId", otherParticipantId))
          .first();
      }
    }

    // Determine client and barber IDs
    const clientId = user.role === "client" ? user._id : otherParticipantId;
    const barberId = user.role === "barber" ? user._id : otherParticipantId;

    const client = user.role === "client" ? user : otherUser;
    const barber = user.role === "barber" ? user : otherUser;

    return {
      _id: conversation._id,
      id: conversation._id,
      participants: conversation.participants,
      clientId,
      barberId,
      clientName: client?.name || "Client",
      clientAvatar: client?.avatar,
      barberName: barberProfile?.businessName || barber?.name || "Barber",
      barberAvatar: barber?.avatar,
      appointmentId: conversation.appointmentId,
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
      lastMessageSenderId: conversation.lastMessageSenderId,
      unreadCounts: conversation.unreadCounts,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
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
      .withIndex("by_email", (q) => q.eq("email", userId.email ?? ""))
      .first();

    if (!user) {
      return 0;
    }

    const conversations = (await ctx.db
      .query("conversations")
      .collect()).filter((conversation) =>
      conversation.participants.includes(user._id)
    );

    return conversations.reduce((total, conv) => {
      return total + (conv.unreadCounts?.[user._id.toString()] || 0);
    }, 0);
  },
});

// Get typing status for other participants in a conversation
export const getTypingStatus = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userId.email ?? ""))
      .first();

    if (!user) {
      return [];
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (!conversation.participants.includes(user._id)) {
      throw new Error("Not authorized");
    }

    const typingRecords = await ctx.db
      .query("typingStatus")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    const now = Date.now();
    const TYPING_TIMEOUT = 5000;

    const activeTypingStatus = typingRecords.filter((record) => {
      if (record.userId === user._id) {
        return false;
      }
      if (!record.isTyping) {
        return false;
      }
      return now - record.updatedAt < TYPING_TIMEOUT;
    });

    return Promise.all(
      activeTypingStatus.map(async (record) => {
        const typingUser = await ctx.db.get(record.userId);
        return {
          userId: record.userId,
          userName: typingUser?.name || "Unknown",
          isTyping: true,
        };
      })
    );
  },
});
