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
  DatabaseReference,
  DataSnapshot,
} from 'firebase/database';
import { db } from '@/services/firebase/database';
import apiClient from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
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

// Check if we should use mock data as fallback
const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

// Lazy load mock service only when needed
let mockChatService: typeof import('./mockChatService').mockChatService | null = null;

const getMockService = async () => {
  if (!mockChatService && DEV_MODE) {
    const module = await import('./mockChatService');
    mockChatService = module.mockChatService;
  }
  return mockChatService;
};

/**
 * Chat Service
 *
 * Handles all chat-related operations.
 * Supports multiple backends:
 * 1. REST API (primary) - for message persistence
 * 2. Firebase Realtime Database - for real-time updates
 * 3. Mock service - for development without backend
 *
 * Database Structure (Firebase):
 * /conversations/{conversationId}
 * /messages/{conversationId}/{messageId}
 * /typing/{conversationId}/{userId}
 * /userConversations/{userId}/{conversationId}
 */

class ChatService {
  /**
   * Get all chat threads for the current user
   */
  async getThreads(): Promise<IConversation[]> {
    try {
      const response = await apiClient.get<IConversation[]>(endpoints.chat.threads);
      return response.data;
    } catch (error: any) {
      // Try Firebase fallback
      if (db) {
        console.log('[CHAT] Falling back to Firebase for threads');
        return this.getThreadsFromFirebase();
      }

      if (DEV_MODE) {
        const mock = await getMockService();
        if (mock) {
          console.log('[CHAT] Using mock threads fallback');
          // Mock service doesn't have getConversations, return empty array
          // Real usage should go through subscribeToConversations
          return [];
        }
      }

      throw new Error(error.message || 'Failed to fetch chat threads');
    }
  }

  /**
   * Get threads from Firebase (fallback)
   */
  private async getThreadsFromFirebase(): Promise<IConversation[]> {
    if (!db) return [];

    const conversationsRef = ref(db, 'conversations');
    const snapshot = await get(conversationsRef);

    if (snapshot.exists()) {
      return Object.values(snapshot.val()) as IConversation[];
    }

    return [];
  }

  /**
   * Create a new conversation
   */
  async createConversation(params: ICreateConversationParams): Promise<string> {
    try {
      // Try REST API first
      const response = await apiClient.post<{ conversationId: string }>(endpoints.chat.threads, {
        appointmentId: params.appointmentId,
        clientId: params.clientId,
        barberId: params.barberId,
      });
      return response.data.conversationId;
    } catch (error: any) {
      // Fall back to Firebase
      if (db) {
        return this.createConversationInFirebase(params);
      }

      if (DEV_MODE) {
        const mock = await getMockService();
        if (mock) {
          console.log('[CHAT] Using mock create conversation fallback');
          return mock.createConversation(params);
        }
      }

      throw new Error(error.message || 'Failed to create conversation');
    }
  }

  /**
   * Create conversation in Firebase (fallback)
   */
  private async createConversationInFirebase(params: ICreateConversationParams): Promise<string> {
    if (!db) {
      throw new Error('Firebase database not initialized');
    }

    const { appointmentId, clientId, barberId } = params;
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

    await set(newConversationRef, conversation);

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
    try {
      const threads = await this.getThreads();
      return threads.find((t) => t.id === conversationId) || null;
    } catch {
      if (db) {
        const conversationRef = ref(db, `conversations/${conversationId}`);
        const snapshot = await get(conversationRef);
        return snapshot.exists() ? (snapshot.val() as IConversation) : null;
      }
      return null;
    }
  }

  /**
   * Get conversation by appointment ID
   */
  async getConversationByAppointment(appointmentId: string): Promise<IConversation | null> {
    try {
      const threads = await this.getThreads();
      return threads.find((t) => t.appointmentId === appointmentId) || null;
    } catch {
      if (db) {
        const conversationsRef = ref(db, 'conversations');
        const snapshot = await get(conversationsRef);

        if (snapshot.exists()) {
          const conversations = snapshot.val();
          const conversation = Object.values(conversations).find(
            (conv: any) => conv.appointmentId === appointmentId
          );
          return (conversation as IConversation) || null;
        }
      }
      return null;
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, limit: number = 50): Promise<IMessage[]> {
    try {
      const response = await apiClient.get<IMessage[]>(endpoints.chat.messages(conversationId), {
        params: { limit },
      });
      return response.data;
    } catch (error: any) {
      // Fall back to Firebase
      if (db) {
        console.log('[CHAT] Falling back to Firebase for messages');
        return this.getMessagesFromFirebase(conversationId, limit);
      }

      if (DEV_MODE) {
        const mock = await getMockService();
        if (mock) {
          console.log('[CHAT] Using mock messages fallback');
          return mock.getMessages(conversationId, limit);
        }
      }

      throw new Error(error.message || 'Failed to fetch messages');
    }
  }

  /**
   * Get messages from Firebase (fallback)
   */
  private async getMessagesFromFirebase(
    conversationId: string,
    limit: number
  ): Promise<IMessage[]> {
    if (!db) return [];

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

  /**
   * Send a message
   */
  async sendMessage(params: ISendMessageParams, senderId: string): Promise<string> {
    const { conversationId, content, type = 'text', imageUrl } = params;

    try {
      // Try REST API first
      const response = await apiClient.post<{ messageId: string; message: IMessage }>(
        endpoints.chat.send(conversationId),
        {
          content,
          type,
          imageUrl,
        }
      );

      // Also push to Firebase for real-time updates if available
      if (db) {
        this.syncMessageToFirebase(conversationId, response.data.message).catch(() => {
          // Ignore Firebase sync errors
        });
      }

      return response.data.messageId;
    } catch (error: any) {
      // Fall back to Firebase
      if (db) {
        console.log('[CHAT] Falling back to Firebase for sending message');
        return this.sendMessageViaFirebase(params, senderId);
      }

      if (DEV_MODE) {
        const mock = await getMockService();
        if (mock) {
          console.log('[CHAT] Using mock send message fallback');
          return mock.sendMessage(params, senderId);
        }
      }

      throw new Error(error.message || 'Failed to send message');
    }
  }

  /**
   * Sync message to Firebase for real-time updates
   */
  private async syncMessageToFirebase(conversationId: string, message: IMessage): Promise<void> {
    if (!db) return;

    const messageRef = ref(db, `messages/${conversationId}/${message.id}`);
    await set(messageRef, message);
  }

  /**
   * Send message via Firebase (fallback)
   */
  private async sendMessageViaFirebase(
    params: ISendMessageParams,
    senderId: string
  ): Promise<string> {
    if (!db) {
      throw new Error('Firebase database not initialized');
    }

    const { conversationId, content, type = 'text', imageUrl } = params;

    const conversation = await this.getConversation(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const receiverId =
      conversation.clientId === senderId ? conversation.barberId : conversation.clientId;

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

    await set(newMessageRef, message);

    const conversationRef = ref(db, `conversations/${conversationId}`);
    await update(conversationRef, {
      lastMessage: message,
      lastMessageAt: now,
      updatedAt: now,
      unreadCount: (conversation.unreadCount || 0) + 1,
    });

    return messageId;
  }

  /**
   * Subscribe to messages in a conversation (real-time)
   */
  subscribeToMessages(
    conversationId: string,
    limit: number = 50,
    onUpdate: (update: IMessageUpdate) => void
  ): () => void {
    if (!db) {
      console.warn('[CHAT] Firebase not available for real-time messages');
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

    return () => off(messagesQuery);
  }

  /**
   * Subscribe to user's conversations (real-time)
   */
  subscribeToConversations(
    userId: string,
    onUpdate: (update: IConversationUpdate) => void
  ): () => void {
    if (!db) {
      console.warn('[CHAT] Firebase not available for real-time conversations');
      return () => {};
    }

    const database = db;
    const userConversationsRef = ref(database, `userConversations/${userId}`);

    const listener = onValue(userConversationsRef, async (snapshot: DataSnapshot) => {
      if (snapshot.exists()) {
        const conversationIds = Object.keys(snapshot.val());

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

    return () => off(userConversationsRef);
  }

  /**
   * Mark messages as read
   */
  async markAsRead(params: IMarkAsReadParams): Promise<void> {
    const { conversationId, userId } = params;

    try {
      await apiClient.put(endpoints.chat.markRead(conversationId));
    } catch {
      // Fall back to Firebase
      if (db) {
        await this.markAsReadInFirebase(conversationId, userId);
        return;
      }
    }

    // Also update Firebase if available
    if (db) {
      this.markAsReadInFirebase(conversationId, userId).catch(() => {
        // Ignore Firebase errors
      });
    }
  }

  /**
   * Mark as read in Firebase
   */
  private async markAsReadInFirebase(conversationId: string, userId: string): Promise<void> {
    if (!db) return;

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

      updates[`conversations/${conversationId}/unreadCount`] = 0;

      if (Object.keys(updates).length > 0) {
        await update(ref(db), updates);
      }
    }
  }

  /**
   * Set typing status
   */
  async setTypingStatus(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    if (!db) return;

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
   * Subscribe to typing status
   */
  subscribeToTypingStatus(
    conversationId: string,
    onUpdate: (status: ITypingStatus) => void
  ): () => void {
    if (!db) {
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

    return () => off(typingRef);
  }

  /**
   * Delete a conversation (hides it for the user)
   */
  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    try {
      await apiClient.delete(`${endpoints.chat.threads}/${conversationId}`);
    } catch {
      // Fall back to Firebase
      if (db) {
        const userConversationRef = ref(db, `userConversations/${userId}/${conversationId}`);
        await set(userConversationRef, null);
      }
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();

if (__DEV__) {
  console.log('[Chat Service] Initialization:', {
    dbAvailable: !!db,
    devMode: process.env.EXPO_PUBLIC_DEV_MODE,
  });
}

export default chatService;
