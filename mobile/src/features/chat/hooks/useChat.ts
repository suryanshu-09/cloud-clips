import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { IMessage, ISendMessageParams } from '../types';

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
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setTypingMutation = useMutation(api.messages.mutations.setTypingStatus);
  const clearTypingMutation = useMutation(api.messages.mutations.clearTypingStatus);

  const typingStatus = useQuery(
    api.messages.queries.getTypingStatus,
    conversationId ? { conversationId: conversationId as Id<'conversations'> } : 'skip'
  );

  const otherUserTyping = typingStatus && typingStatus.length > 0;

  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { chatService } = await import('../services/chatService');
      const loadedMessages = await chatService.getMessages(conversationId, messageLimit);
      setMessages(loadedMessages);
    } catch (err) {
      console.error('[useChat] Error loading messages:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, messageLimit]);

  useEffect(() => {
    if (!conversationId) return;

    const messageMap = new Map<string, IMessage>();

    const loadAndSubscribe = async () => {
      const { chatService } = await import('../services/chatService');

      const unsubscribe = chatService.subscribeToMessages(
        conversationId,
        messageLimit,
        (update) => {
          const { message } = update;

          messageMap.set(message.id, message);

          const sortedMessages = Array.from(messageMap.values()).sort(
            (a, b) => a.createdAt - b.createdAt
          );

          setMessages(sortedMessages);
        }
      );

      loadMessages();

      return unsubscribe;
    };

    let unsubscribe: (() => void) | undefined;
    loadAndSubscribe().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [conversationId, messageLimit, loadMessages]);

  useEffect(() => {
    if (!conversationId || !isTyping) return;

    const sendTypingStatus = async () => {
      try {
        await setTypingMutation({ conversationId: conversationId as Id<'conversations'> });
      } catch (err) {
        console.error('[useChat] Error setting typing status:', err);
      }
    };

    sendTypingStatus();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(async () => {
      try {
        await clearTypingMutation({ conversationId: conversationId as Id<'conversations'> });
      } catch (err) {
        console.error('[useChat] Error clearing typing status:', err);
      }
    }, 4000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, isTyping, setTypingMutation, clearTypingMutation]);

  useEffect(() => {
    return () => {
      if (conversationId) {
        clearTypingMutation({ conversationId: conversationId as Id<'conversations'> }).catch(
          () => {}
        );
      }
    };
  }, []);

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

        const optimisticMessage: IMessage = {
          id: `temp-${Date.now()}`,
          _id: `temp-${Date.now()}`,
          conversationId,
          senderId: currentUserId,
          receiverId: '',
          content: params.content,
          type,
          imageUrl,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          readBy: [],
          read: false,
          status: 'sending',
        };

        setMessages((prev) => [...prev, optimisticMessage]);

        const { chatService } = await import('../services/chatService');
        const messageId = await chatService.sendMessage(params, currentUserId);

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticMessage.id
              ? { ...msg, id: messageId, _id: messageId, status: 'sent' }
              : msg
          )
        );

        setIsTypingState(false);
        await clearTypingMutation({ conversationId: conversationId as Id<'conversations'> }).catch(
          () => {}
        );
      } catch (err) {
        console.error('[useChat] Error sending message:', err);
        setError(err as Error);

        setMessages((prev) =>
          prev.map((msg) => (msg.status === 'sending' ? { ...msg, status: 'failed' } : msg))
        );

        throw err;
      }
    },
    [conversationId, currentUserId, clearTypingMutation]
  );

  /**
   * Mark messages as read
   */
  const markAsRead = useCallback(async () => {
    try {
      const { chatService } = await import('../services/chatService');
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
