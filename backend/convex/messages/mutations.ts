import { mutation, action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

/**
 * Message Mutations
 */

// Send message
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    attachments: v.optional(v.array(v.object({
      type: v.union(
        v.literal("image"),
        v.literal("file"),
        v.literal("voice")
      ),
      url: v.string(),
      name: v.optional(v.string()),
      size: v.optional(v.number()),
    }))),
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

    // Create message
    const message = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: user._id,
      content: args.content,
      attachments: args.attachments,
      readBy: [user._id],
      createdAt: Date.now(),
    });

    // Update conversation
    const otherParticipantId = conversation.participants.find(
      (p) => p !== user._id
    );
    const unreadCounts = conversation.unreadCounts || {};
    
    if (otherParticipantId) {
      unreadCounts[otherParticipantId.toString()] = 
        (unreadCounts[otherParticipantId.toString()] || 0) + 1;
    }

    await ctx.db.patch(args.conversationId, {
      lastMessage: args.content,
      lastMessageAt: Date.now(),
      lastMessageSenderId: user._id,
      unreadCounts,
      updatedAt: Date.now(),
    });

    // Schedule push notification to recipient
    if (otherParticipantId) {
      await (ctx.scheduler.runAfter as any)(0, sendPushNotification as any, {
        recipientId: otherParticipantId,
        senderName: user.name || "Someone",
        messageContent: args.content,
        conversationId: args.conversationId,
      });
    }

    return message;
  },
});

// Mark messages as read
export const markAsRead = mutation({
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

    // Get unread messages
    const messages = (await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect()).filter((message) => !message.readBy.includes(user._id));

    // Mark all as read
    for (const message of messages) {
      if (!message.readBy.includes(user._id)) {
        await ctx.db.patch(message._id, {
          readBy: [...message.readBy, user._id],
        });
      }
    }

    // Update unread count in conversation
    const unreadCounts = conversation.unreadCounts || {};
    unreadCounts[user._id.toString()] = 0;

    await ctx.db.patch(args.conversationId, {
      unreadCounts,
      updatedAt: Date.now(),
    });

    return { success: true, markedCount: messages.length };
  },
});

// Create conversation
export const createConversation = mutation({
  args: {
    participantId: v.id("users"),
    appointmentId: v.optional(v.id("appointments")),
    initialMessage: v.optional(v.string()),
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

    // Check if conversation already exists
    const existingConversation = (await ctx.db
      .query("conversations")
      .collect()).find((conversation) => {
      if (conversation.participants.length !== 2) {
        return false;
      }
      return (
        conversation.participants.includes(user._id) &&
        conversation.participants.includes(args.participantId)
      );
    });

    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation
    const conversation = await ctx.db.insert("conversations", {
      participants: [user._id, args.participantId],
      appointmentId: args.appointmentId,
      unreadCounts: {
        [args.participantId.toString()]: args.initialMessage ? 1 : 0,
        [user._id.toString()]: 0,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Send initial message if provided
    if (args.initialMessage) {
      await ctx.db.insert("messages", {
        conversationId: conversation,
        senderId: user._id,
        content: args.initialMessage,
        readBy: [user._id],
        createdAt: Date.now(),
      });

      await ctx.db.patch(conversation, {
        lastMessage: args.initialMessage,
        lastMessageAt: Date.now(),
        lastMessageSenderId: user._id,
      });
    }

    return await ctx.db.get(conversation);
  },
});

/**
 * Typing Status Mutations
 */

export const setTypingStatus = mutation({
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

    if (!conversation.participants.includes(user._id)) {
      throw new Error("Not authorized");
    }

    const existingStatus = await ctx.db
      .query("typingStatus")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", user._id)
      )
      .first();

    if (existingStatus) {
      await ctx.db.patch(existingStatus._id, {
        isTyping: true,
        updatedAt: Date.now(),
      });
      return existingStatus._id;
    }

    const typingStatus = await ctx.db.insert("typingStatus", {
      conversationId: args.conversationId,
      userId: user._id,
      isTyping: true,
      updatedAt: Date.now(),
    });

    return typingStatus;
  },
});

export const clearTypingStatus = mutation({
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

    const existingStatus = await ctx.db
      .query("typingStatus")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", user._id)
      )
      .first();

    if (existingStatus) {
      await ctx.db.patch(existingStatus._id, {
        isTyping: false,
        updatedAt: Date.now(),
      });
      return { success: true };
    }

    return { success: true };
  },
});

/**
 * Send push notification for new message
 * This is an action (not a mutation) because it makes external HTTP calls
 */
export const sendPushNotification = action({
  args: {
    recipientId: v.id("users"),
    senderName: v.string(),
    messageContent: v.string(),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    // @ts-ignore Convex generated reference typing can recurse deeply here.
    const notificationApi = (api as any).notifications.tokens;

    await ctx.runAction(notificationApi.sendPushNotification, {
      userId: args.recipientId,
      title: `New message from ${args.senderName}`,
      body: args.messageContent.length > 100 
        ? `${args.messageContent.substring(0, 100)}...` 
        : args.messageContent,
      data: {
        type: "new_message",
        conversationId: args.conversationId.toString(),
      },
    });
  },
});
