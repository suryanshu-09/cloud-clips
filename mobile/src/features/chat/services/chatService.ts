import {
  ref,
  push,
  set,
  update,
  query,
  orderByChild,
  limitToLast,
  onValue,
  off,
  get,
  serverTimestamp,
  DatabaseReference,
  DataSnapshot,
} from 'firebase/database';
import { db } from '@/services/firebase/database';
import { mockChatService } from './mockChatService';
import {
  IMessage,
  IConversation,
  ISendMessageParams,
  ICreateConversationParams,
  IMarkAsReadParams,
  IMessageUpdate,
  IConversationUpdate,
  ITypingStatus,
} from '../types';

/**
 * Chat Service
 *
 * Handles all chat-related operations using Firebase Realtime Database.
 *
 * Database Structure:
 * /conversations/{conversationId}
 * /messages/{conversationId}/{messageId}
 * /typing/{conversationId}/{userId}
 * /userConversations/{userId}/{conversationId}
 */

class ChatService {
  /**
   * Create a new conversation
   */
  async createConversation(params: ICreateConversationParams): Promise<string> {
    if (!db) {
      throw new Error('Firebase database not initialized');
    }

    const { appointmentId, clientId, barberId } = params;

    // Create conversation reference
    const conversationsRef = ref(db, 'conversations');
    const newConversationRef = push(conversationsRef);
    const conversationId = newConversationRef.key;

    if (!conversationId) {
      throw new Error('Failed to create conversation');
    }

    const now = Date.now();
    const conversation: Partial<IConversation> = {
      id: conversationId,
      appointmentId,
      clientId,
      barberId,
      lastMessage: null,
      lastMessageAt: now,
      unreadCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Save conversation
    await set(newConversationRef, conversation);

    // Create user conversation mappings
    const userConversationsRef = ref(db, 'userConversations');
    await update(userConversationsRef, {
      [`${clientId}/${conversationId}`]: true,
      [`${barberId}/${conversationId}`]: true,
    });

    return conversationId;
  }

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string): Promise<IConversation | null> {
    if (!db) {
      throw new Error('Firebase database not initialized');
    }

    const conversationRef = ref(db, `conversations/${conversationId}`);
    const snapshot = await get(conversationRef);

    if (snapshot.exists()) {
      return snapshot.val() as IConversation;
    }

    return null;
  }

  /**
   * Get conversation by appointment ID
   */
  async getConversationByAppointment(appointmentId: string): Promise<IConversation | null> {
    if (!db) {
      throw new Error('Firebase database not initialized');
    }

    const conversationsRef = ref(db, 'conversations');
    const conversationQuery = query(conversationsRef, orderByChild('appointmentId'));

    const snapshot = await get(conversationQuery);

    if (snapshot.exists()) {
      const conversations = snapshot.val();
      const conversation = Object.values(conversations).find(
        (conv: any) => conv.appointmentId === appointmentId
      );
      return (conversation as IConversation) || null;
    }

    return null;
  }

  /**
   * Send a message
   */
  async sendMessage(params: ISendMessageParams, senderId: string): Promise<string> {
    if (!db) {
      throw new Error('Firebase database not initialized');
    }

    const { conversationId, content, type = 'text', imageUrl } = params;

    // Get conversation to determine receiver
    const conversation = await this.getConversation(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const receiverId =
      conversation.clientId === senderId ? conversation.barberId : conversation.clientId;

    // Create message reference
    const messagesRef = ref(db, `messages/${conversationId}`);
    const newMessageRef = push(messagesRef);
    const messageId = newMessageRef.key;

    if (!messageId) {
      throw new Error('Failed to create message');
    }

    const now = Date.now();
    const message: IMessage = {
      id: messageId,
      conversationId,
      senderId,
      receiverId,
      content,
      type,
      imageUrl,
      createdAt: now,
      updatedAt: now,
      read: false,
      status: 'sent',
    };

    // Save message
    await set(newMessageRef, message);

    // Update conversation
    const conversationRef = ref(db, `conversations/${conversationId}`);
    await update(conversationRef, {
      lastMessage: message,
      lastMessageAt: now,
      updatedAt: now,
      unreadCount: conversation.unreadCount + 1,
    });

    return messageId;
  }

  /**
   * Listen to messages in a conversation
   */
  subscribeToMessages(
    conversationId: string,
    limit: number = 50,
    onUpdate: (update: IMessageUpdate) => void
  ): () => void {
    if (!db) {
      console.warn('Firebase database not initialized');
      return () => {};
    }

    const messagesRef = ref(db, `messages/${conversationId}`);
    const messagesQuery = query(messagesRef, orderByChild('createdAt'), limitToLast(limit));

    const listener = onValue(messagesQuery, (snapshot: DataSnapshot) => {
      snapshot.forEach((childSnapshot) => {
        const message = childSnapshot.val() as IMessage;
        onUpdate({
          type: 'added',
          message,
        });
      });
    });

    // Return unsubscribe function
    return () => off(messagesQuery);
  }

  /**
   * Listen to user's conversations
   */
  subscribeToConversations(
    userId: string,
    onUpdate: (update: IConversationUpdate) => void
  ): () => void {
    if (!db) {
      console.warn('Firebase database not initialized');
      return () => {};
    }

    // Capture db in a const for TypeScript narrowing inside the callback
    const database = db;

    // Get user's conversation IDs
    const userConversationsRef = ref(database, `userConversations/${userId}`);

    const listener = onValue(userConversationsRef, async (snapshot: DataSnapshot) => {
      if (snapshot.exists()) {
        const conversationIds = Object.keys(snapshot.val());

        // Fetch each conversation
        for (const conversationId of conversationIds) {
          const conversationRef = ref(database, `conversations/${conversationId}`);
          const conversationSnapshot = await get(conversationRef);

          if (conversationSnapshot.exists()) {
            const conversation = conversationSnapshot.val() as IConversation;
            onUpdate({
              type: 'modified',
              conversation,
            });
          }
        }
      }
    });

    // Return unsubscribe function
    return () => off(userConversationsRef);
  }

  /**
   * Mark messages as read
   */
  async markAsRead(params: IMarkAsReadParams): Promise<void> {
    if (!db) {
      throw new Error('Firebase database not initialized');
    }

    const { conversationId, userId } = params;

    // Get unread messages
    const messagesRef = ref(db, `messages/${conversationId}`);
    const messagesQuery = query(messagesRef, orderByChild('read'));
    const snapshot = await get(messagesQuery);

    if (snapshot.exists()) {
      const updates: Record<string, any> = {};

      snapshot.forEach((childSnapshot) => {
        const message = childSnapshot.val() as IMessage;
        if (!message.read && message.receiverId === userId) {
          updates[`messages/${conversationId}/${message.id}/read`] = true;
          updates[`messages/${conversationId}/${message.id}/status`] = 'read';
        }
      });

      // Update unread count
      updates[`conversations/${conversationId}/unreadCount`] = 0;

      if (db) {
        await update(ref(db), updates);
      }
    }
  }

  /**
   * Set typing status
   */
  async setTypingStatus(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    if (!db) {
      throw new Error('Firebase database not initialized');
    }

    const typingRef = ref(db, `typing/${conversationId}/${userId}`);

    if (isTyping) {
      await set(typingRef, {
        userId,
        isTyping: true,
        timestamp: Date.now(),
      });
    } else {
      await set(typingRef, null);
    }
  }

  /**
   * Listen to typing status
   */
  subscribeToTypingStatus(
    conversationId: string,
    onUpdate: (status: ITypingStatus) => void
  ): () => void {
    if (!db) {
      console.warn('Firebase database not initialized');
      return () => {};
    }

    const typingRef = ref(db, `typing/${conversationId}`);

    const listener = onValue(typingRef, (snapshot: DataSnapshot) => {
      if (snapshot.exists()) {
        const typingData = snapshot.val();
        Object.values(typingData).forEach((status: any) => {
          onUpdate({
            userId: status.userId,
            conversationId,
            isTyping: status.isTyping,
          });
        });
      }
    });

    // Return unsubscribe function
    return () => off(typingRef);
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    if (!db) {
      throw new Error('Firebase database not initialized');
    }

    // Remove from user's conversation list
    const userConversationRef = ref(db, `userConversations/${userId}/${conversationId}`);
    await set(userConversationRef, null);
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, limit: number = 50): Promise<IMessage[]> {
    if (!db) {
      throw new Error('Firebase database not initialized');
    }

    const messagesRef = ref(db, `messages/${conversationId}`);
    const messagesQuery = query(messagesRef, orderByChild('createdAt'), limitToLast(limit));

    const snapshot = await get(messagesQuery);

    if (snapshot.exists()) {
      const messages: IMessage[] = [];
      snapshot.forEach((childSnapshot) => {
        messages.push(childSnapshot.val() as IMessage);
      });
      return messages;
    }

    return [];
  }
}

// Export singleton instance
const realChatService = new ChatService();

// Use mock service when Firebase is not available or in dev mode
const USE_MOCK = !db || process.env.EXPO_PUBLIC_DEV_MODE === 'true';

export const chatService = USE_MOCK ? mockChatService : realChatService;

if (__DEV__) {
  console.log('[Chat Service] Initialization:', {
    dbAvailable: !!db,
    devMode: process.env.EXPO_PUBLIC_DEV_MODE,
    useMock: USE_MOCK,
  });
}

export default chatService;
