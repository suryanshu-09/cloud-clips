/**
 * Firebase Firestore Chat Service
 *
 * Provides real-time chat functionality using Firebase Firestore.
 * Falls back to REST API when Firestore is not available.
 *
 * Features:
 * - Real-time message synchronization
 * - Typing indicators
 * - Read receipts
 * - Offline persistence
 */

import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  where,
  updateDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
  Firestore,
  Unsubscribe,
  limit,
  startAfter,
  DocumentSnapshot,
} from 'firebase/firestore';
import { app } from './config';
import apiClient from '../api/client';

// Initialize Firestore
let firestore: Firestore | null = null;

if (app) {
  try {
    firestore = getFirestore(app);
    console.log('[Firebase Chat] Firestore initialized successfully');
  } catch (error) {
    console.warn('[Firebase Chat] Failed to initialize Firestore:', error);
  }
}

/**
 * Chat message interface
 */
export interface IChatMessage {
  id: string;
  appointmentId: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: 'text' | 'image' | 'system';
  imageUrl?: string;
  createdAt: Date;
  readAt?: Date | null;
}

/**
 * Chat thread summary interface
 */
export interface IChatThread {
  appointmentId: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}

/**
 * Typing indicator interface
 */
export interface ITypingIndicator {
  appointmentId: string;
  userId: string;
  isTyping: boolean;
  updatedAt: Date;
}

/**
 * Convert Firestore document to IChatMessage
 */
const docToMessage = (id: string, data: any): IChatMessage => {
  return {
    id,
    appointmentId: data.appointmentId,
    senderId: data.senderId,
    receiverId: data.receiverId,
    content: data.content,
    messageType: data.messageType || 'text',
    imageUrl: data.imageUrl,
    createdAt:
      data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    readAt:
      data.readAt instanceof Timestamp
        ? data.readAt.toDate()
        : data.readAt
          ? new Date(data.readAt)
          : null,
  };
};

/**
 * Firebase Chat Service
 */
export const chatService = {
  /**
   * Check if Firestore is available
   */
  isAvailable: (): boolean => {
    return firestore !== null;
  },

  /**
   * Subscribe to messages for an appointment (real-time)
   * Returns an unsubscribe function
   */
  subscribeToMessages: (
    appointmentId: string,
    callback: (messages: IChatMessage[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe | null => {
    if (!firestore) {
      console.warn('[Firebase Chat] Firestore not available, cannot subscribe to messages');
      return null;
    }

    try {
      const messagesRef = collection(firestore, 'chats', appointmentId, 'messages');
      const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));

      return onSnapshot(
        messagesQuery,
        (snapshot) => {
          const messages: IChatMessage[] = [];
          snapshot.forEach((doc) => {
            messages.push(docToMessage(doc.id, doc.data()));
          });
          callback(messages);
        },
        (error) => {
          console.error('[Firebase Chat] Error subscribing to messages:', error);
          onError?.(error);
        }
      );
    } catch (error) {
      console.error('[Firebase Chat] Error setting up message subscription:', error);
      return null;
    }
  },

  /**
   * Get messages with pagination (for initial load or when Firestore subscription fails)
   */
  getMessages: async (
    appointmentId: string,
    limitCount: number = 50,
    lastDoc?: DocumentSnapshot
  ): Promise<{ messages: IChatMessage[]; lastDoc: DocumentSnapshot | null }> => {
    // Try Firestore first
    if (firestore) {
      try {
        const messagesRef = collection(firestore, 'chats', appointmentId, 'messages');
        let messagesQuery = query(messagesRef, orderBy('createdAt', 'desc'), limit(limitCount));

        if (lastDoc) {
          messagesQuery = query(messagesQuery, startAfter(lastDoc));
        }

        const snapshot = await getDocs(messagesQuery);
        const messages: IChatMessage[] = [];
        let lastDocument: DocumentSnapshot | null = null;

        snapshot.forEach((doc) => {
          messages.push(docToMessage(doc.id, doc.data()));
          lastDocument = doc;
        });

        // Reverse to get oldest first
        messages.reverse();

        return { messages, lastDoc: lastDocument };
      } catch (error) {
        console.warn(
          '[Firebase Chat] Firestore getMessages failed, falling back to REST API:',
          error
        );
      }
    }

    // Fallback to REST API
    try {
      const response = await apiClient.get<IChatMessage[]>(`/chats/${appointmentId}`);
      return { messages: response.data, lastDoc: null };
    } catch (error) {
      console.error('[Firebase Chat] Failed to get messages from REST API:', error);
      throw error;
    }
  },

  /**
   * Send a message
   */
  sendMessage: async (
    appointmentId: string,
    senderId: string,
    receiverId: string,
    content: string,
    messageType: 'text' | 'image' = 'text',
    imageUrl?: string
  ): Promise<IChatMessage> => {
    const messageData = {
      appointmentId,
      senderId,
      receiverId,
      content,
      messageType,
      imageUrl,
      createdAt: new Date().toISOString(),
      readAt: null,
    };

    // Try Firestore first
    if (firestore) {
      try {
        const messagesRef = collection(firestore, 'chats', appointmentId, 'messages');
        const docRef = await addDoc(messagesRef, {
          ...messageData,
          createdAt: serverTimestamp(),
        });

        // Also sync to backend REST API
        apiClient.post(`/chats/${appointmentId}`, messageData).catch((error) => {
          console.warn('[Firebase Chat] Failed to sync message to backend:', error);
        });

        return {
          id: docRef.id,
          ...messageData,
          createdAt: new Date(),
        };
      } catch (error) {
        console.warn(
          '[Firebase Chat] Firestore sendMessage failed, falling back to REST API:',
          error
        );
      }
    }

    // Fallback to REST API
    try {
      const response = await apiClient.post<IChatMessage>(`/chats/${appointmentId}`, messageData);
      return response.data;
    } catch (error) {
      console.error('[Firebase Chat] Failed to send message via REST API:', error);
      throw error;
    }
  },

  /**
   * Mark messages as read
   */
  markAsRead: async (appointmentId: string, userId: string): Promise<void> => {
    // Try Firestore first
    if (firestore) {
      try {
        const messagesRef = collection(firestore, 'chats', appointmentId, 'messages');
        const unreadQuery = query(
          messagesRef,
          where('receiverId', '==', userId),
          where('readAt', '==', null)
        );

        const snapshot = await getDocs(unreadQuery);

        if (!snapshot.empty) {
          const batch = writeBatch(firestore);
          snapshot.forEach((doc) => {
            batch.update(doc.ref, { readAt: serverTimestamp() });
          });
          await batch.commit();
        }

        // Also sync to backend
        apiClient.put(`/chats/${appointmentId}/read`).catch((error) => {
          console.warn('[Firebase Chat] Failed to sync read status to backend:', error);
        });

        return;
      } catch (error) {
        console.warn(
          '[Firebase Chat] Firestore markAsRead failed, falling back to REST API:',
          error
        );
      }
    }

    // Fallback to REST API
    try {
      await apiClient.put(`/chats/${appointmentId}/read`);
    } catch (error) {
      console.error('[Firebase Chat] Failed to mark messages as read via REST API:', error);
      throw error;
    }
  },

  /**
   * Subscribe to typing indicator for an appointment
   */
  subscribeToTypingIndicator: (
    appointmentId: string,
    currentUserId: string,
    callback: (isTyping: boolean, userId: string) => void
  ): Unsubscribe | null => {
    if (!firestore) {
      return null;
    }

    try {
      const typingRef = doc(firestore, 'chats', appointmentId, 'typing', 'status');

      return onSnapshot(typingRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          // Notify about other user's typing status
          Object.entries(data).forEach(([userId, status]: [string, any]) => {
            if (userId !== currentUserId) {
              // Consider typing indicator stale after 5 seconds
              const isTyping = status.isTyping && Date.now() - status.updatedAt?.toMillis() < 5000;
              callback(isTyping, userId);
            }
          });
        }
      });
    } catch (error) {
      console.error('[Firebase Chat] Error subscribing to typing indicator:', error);
      return null;
    }
  },

  /**
   * Update typing indicator
   */
  updateTypingIndicator: async (
    appointmentId: string,
    userId: string,
    isTyping: boolean
  ): Promise<void> => {
    if (!firestore) {
      return;
    }

    try {
      const typingRef = doc(firestore, 'chats', appointmentId, 'typing', 'status');
      await updateDoc(typingRef, {
        [userId]: {
          isTyping,
          updatedAt: serverTimestamp(),
        },
      });
    } catch (error) {
      // If document doesn't exist, create it
      try {
        const typingRef = doc(firestore, 'chats', appointmentId, 'typing', 'status');
        const { setDoc } = await import('firebase/firestore');
        await setDoc(typingRef, {
          [userId]: {
            isTyping,
            updatedAt: serverTimestamp(),
          },
        });
      } catch (setError) {
        console.warn('[Firebase Chat] Failed to update typing indicator:', setError);
      }
    }
  },

  /**
   * Get unread message count for a user
   */
  getUnreadCount: async (userId: string): Promise<number> => {
    // Try Firestore first
    if (firestore) {
      try {
        const { collectionGroup, getCountFromServer } = await import('firebase/firestore');
        const messagesRef = collectionGroup(firestore, 'messages');
        const unreadQuery = query(
          messagesRef,
          where('receiverId', '==', userId),
          where('readAt', '==', null)
        );

        const snapshot = await getCountFromServer(unreadQuery);
        return snapshot.data().count;
      } catch (error) {
        console.warn(
          '[Firebase Chat] Firestore getUnreadCount failed, falling back to REST API:',
          error
        );
      }
    }

    // Fallback to REST API
    try {
      const response = await apiClient.get<{ count: number }>('/chats/unread');
      return response.data.count;
    } catch (error) {
      console.error('[Firebase Chat] Failed to get unread count:', error);
      return 0;
    }
  },

  /**
   * Get chat threads for a user
   */
  getChatThreads: async (userId: string): Promise<IChatThread[]> => {
    try {
      const response = await apiClient.get<IChatThread[]>('/chats');
      return response.data;
    } catch (error) {
      console.error('[Firebase Chat] Failed to get chat threads:', error);
      return [];
    }
  },
};

export default chatService;
