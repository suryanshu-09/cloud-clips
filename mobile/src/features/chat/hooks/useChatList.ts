import { useState, useEffect, useCallback } from 'react';
import { chatService } from '../services/chatService';
import { IConversation, ICreateConversationParams } from '../types';

/**
 * useChatList Hook
 *
 * Manages the list of chat conversations for a user.
 *
 * Features:
 * - Real-time conversation updates
 * - Create new conversations
 * - Delete conversations
 * - Sort by last message time
 * - Unread message counts
 *
 * @param userId - The current user's ID
 * @param userType - Whether the user is a 'client' or 'barber'
 *
 * @example
 * ```tsx
 * const { conversations, createConversation, isLoading } = useChatList(userId, 'client');
 * ```
 */

interface IUseChatListResult {
  conversations: IConversation[];
  createConversation: (params: ICreateConversationParams) => Promise<string>;
  getOrCreateConversation: (
    appointmentId: string,
    params: ICreateConversationParams
  ) => Promise<string>;
  deleteConversation: (conversationId: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  refreshConversations: () => Promise<void>;
  totalUnreadCount: number;
}

export const useChatList = (userId: string, userType: 'client' | 'barber'): IUseChatListResult => {
  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to real-time conversation updates
  useEffect(() => {
    if (!userId) {
      console.log('[useChatList] No userId provided, skipping subscription');
      setIsLoading(false);
      return;
    }

    console.log('[useChatList] Setting up subscription for user:', userId);
    const conversationMap = new Map<string, IConversation>();
    let hasReceivedData = false;

    try {
      const unsubscribe = chatService.subscribeToConversations(userId, (update) => {
        console.log('[useChatList] Received update:', update.type, update.conversation?.id);
        hasReceivedData = true;
        const { conversation } = update;

        if (update.type === 'removed') {
          conversationMap.delete(conversation.id);
        } else {
          conversationMap.set(conversation.id, conversation);
        }

        // Convert to array and sort by last message time (newest first)
        const sortedConversations = Array.from(conversationMap.values()).sort(
          (a, b) => b.lastMessageAt - a.lastMessageAt
        );

        console.log('[useChatList] Setting conversations:', sortedConversations.length);
        setConversations(sortedConversations);
        setIsLoading(false);
      });

      // Set a timeout to ensure loading state is cleared even if no data
      const timeoutId = setTimeout(() => {
        if (!hasReceivedData) {
          console.log('[useChatList] No data received after timeout, clearing loading state');
          setIsLoading(false);
        }
      }, 2000);

      return () => {
        clearTimeout(timeoutId);
        unsubscribe();
      };
    } catch (err) {
      console.error('[useChatList] Error subscribing to conversations:', err);
      setError(err as Error);
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Create a new conversation
   */
  const createConversation = useCallback(
    async (params: ICreateConversationParams): Promise<string> => {
      try {
        setError(null);
        const conversationId = await chatService.createConversation(params);
        return conversationId;
      } catch (err) {
        console.error('[useChatList] Error creating conversation:', err);
        setError(err as Error);
        throw err;
      }
    },
    []
  );

  /**
   * Get existing conversation by appointment ID or create a new one
   */
  const getOrCreateConversation = useCallback(
    async (appointmentId: string, params: ICreateConversationParams): Promise<string> => {
      try {
        setError(null);

        // Check if conversation already exists
        const existingConversation = await chatService.getConversationByAppointment(appointmentId);

        if (existingConversation) {
          return existingConversation.id;
        }

        // Create new conversation
        const conversationId = await chatService.createConversation(params);
        return conversationId;
      } catch (err) {
        console.error('[useChatList] Error getting or creating conversation:', err);
        setError(err as Error);
        throw err;
      }
    },
    []
  );

  /**
   * Delete a conversation
   */
  const deleteConversation = useCallback(
    async (conversationId: string): Promise<void> => {
      try {
        setError(null);
        await chatService.deleteConversation(conversationId, userId);

        // Remove from local state
        setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
      } catch (err) {
        console.error('[useChatList] Error deleting conversation:', err);
        setError(err as Error);
        throw err;
      }
    },
    [userId]
  );

  /**
   * Refresh conversations manually
   */
  const refreshConversations = useCallback(async () => {
    // The subscription will handle updates automatically
    // This is a no-op for now but can be used for pull-to-refresh
  }, []);

  /**
   * Calculate total unread count
   */
  const totalUnreadCount = conversations.reduce(
    (total, conversation) => total + conversation.unreadCount,
    0
  );

  return {
    conversations,
    createConversation,
    getOrCreateConversation,
    deleteConversation,
    isLoading,
    error,
    refreshConversations,
    totalUnreadCount,
  };
};

export default useChatList;
