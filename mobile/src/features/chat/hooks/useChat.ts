import { useState, useEffect, useCallback } from 'react';
import { chatService } from '../services/chatService';
import { IMessage, ISendMessageParams, ITypingStatus } from '../types';

/**
 * useChat Hook
 *
 * Manages real-time chat messages for a conversation.
 *
 * Features:
 * - Real-time message updates
 * - Send messages
 * - Mark messages as read
 * - Typing indicators
 * - Optimistic updates
 *
 * @param conversationId - The conversation ID
 * @param currentUserId - The current user's ID
 * @param messageLimit - Maximum number of messages to load (default: 50)
 *
 * @example
 * ```tsx
 * const { messages, sendMessage, isLoading } = useChat(conversationId, userId);
 * ```
 */

interface IUseChatResult {
  messages: IMessage[];
  sendMessage: (content: string, type?: 'text' | 'image', imageUrl?: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  isTyping: boolean;
  otherUserTyping: boolean;
  setIsTyping: (typing: boolean) => void;
  markAsRead: () => Promise<void>;
  refreshMessages: () => Promise<void>;
}

export const useChat = (
  conversationId: string,
  currentUserId: string,
  messageLimit: number = 50
): IUseChatResult => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isTyping, setIsTypingState] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  // Load initial messages
  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loadedMessages = await chatService.getMessages(conversationId, messageLimit);
      setMessages(loadedMessages);
    } catch (err) {
      console.error('[useChat] Error loading messages:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, messageLimit]);

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!conversationId) return;

    const messageMap = new Map<string, IMessage>();

    const unsubscribe = chatService.subscribeToMessages(conversationId, messageLimit, (update) => {
      const { message } = update;

      // Update message map
      messageMap.set(message.id, message);

      // Convert to array and sort by timestamp
      const sortedMessages = Array.from(messageMap.values()).sort(
        (a, b) => a.createdAt - b.createdAt
      );

      setMessages(sortedMessages);
    });

    // Load initial messages
    loadMessages();

    return () => {
      unsubscribe();
    };
  }, [conversationId, messageLimit, loadMessages]);

  // Subscribe to typing status
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = chatService.subscribeToTypingStatus(
      conversationId,
      (status: ITypingStatus) => {
        // Only show typing indicator for other users
        if (status.userId !== currentUserId) {
          setOtherUserTyping(status.isTyping);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [conversationId, currentUserId]);

  // Send typing status when isTyping changes
  useEffect(() => {
    if (conversationId && currentUserId) {
      chatService.setTypingStatus(conversationId, currentUserId, isTyping).catch((err) => {
        console.error('[useChat] Error setting typing status:', err);
      });
    }
  }, [conversationId, currentUserId, isTyping]);

  /**
   * Send a new message
   */
  const sendMessage = useCallback(
    async (content: string, type: 'text' | 'image' = 'text', imageUrl?: string) => {
      try {
        if (!content.trim() && type === 'text') {
          return;
        }

        const params: ISendMessageParams = {
          conversationId,
          content: content.trim(),
          type,
          imageUrl,
        };

        // Optimistic update
        const optimisticMessage: IMessage = {
          id: `temp-${Date.now()}`,
          conversationId,
          senderId: currentUserId,
          receiverId: '', // Will be set by service
          content: params.content,
          type,
          imageUrl,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          read: false,
          status: 'sending',
        };

        setMessages((prev) => [...prev, optimisticMessage]);

        // Send message
        const messageId = await chatService.sendMessage(params, currentUserId);

        // Update optimistic message with real ID
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticMessage.id ? { ...msg, id: messageId, status: 'sent' } : msg
          )
        );

        // Clear typing status after sending
        setIsTypingState(false);
      } catch (err) {
        console.error('[useChat] Error sending message:', err);
        setError(err as Error);

        // Mark optimistic message as failed
        setMessages((prev) =>
          prev.map((msg) => (msg.status === 'sending' ? { ...msg, status: 'failed' } : msg))
        );

        throw err;
      }
    },
    [conversationId, currentUserId]
  );

  /**
   * Mark messages as read
   */
  const markAsRead = useCallback(async () => {
    try {
      await chatService.markAsRead({
        conversationId,
        userId: currentUserId,
      });
    } catch (err) {
      console.error('[useChat] Error marking messages as read:', err);
    }
  }, [conversationId, currentUserId]);

  /**
   * Set typing indicator
   */
  const setIsTyping = useCallback((typing: boolean) => {
    setIsTypingState(typing);
  }, []);

  /**
   * Refresh messages manually
   */
  const refreshMessages = useCallback(async () => {
    await loadMessages();
  }, [loadMessages]);

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    isTyping,
    otherUserTyping,
    setIsTyping,
    markAsRead,
    refreshMessages,
  };
};

export default useChat;
