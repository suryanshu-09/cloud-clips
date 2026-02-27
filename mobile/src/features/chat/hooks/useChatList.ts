import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { IConversation, ICreateConversationParams } from '../types';
import { useAuth } from '@/features/auth/hooks/useAuth';

const isDevMode = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

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

export const useChatList = (): IUseChatListResult => {
  const { currentUser } = useAuth();

  const conversationsData = useQuery(
    isDevMode ? 'skip' : undefined,
    api.messages.queries.getConversations
  );
  const createConversationMutation = useMutation(api.messages.mutations.createConversation);

  const [mockConversations, setMockConversations] = useState<IConversation[]>([]);
  const [isLoadingMock, setIsLoadingMock] = useState(isDevMode);

  useEffect(() => {
    if (isDevMode) {
      import('../services/mockChatService').then((module) => {
        const mockService = module.mockChatService;
        if (currentUser?.id) {
          mockService.subscribeToConversations(currentUser.id, (update) => {
            if (update.type === 'added') {
              setMockConversations((prev) => {
                const exists = prev.find((c) => c.id === update.conversation.id);
                if (exists) return prev;
                return [...prev, update.conversation];
              });
            }
          });
        }
        setIsLoadingMock(false);
      });
    }
  }, [currentUser?.id]);

  const conversations = useMemo(() => {
    if (isDevMode) return mockConversations;
    if (!conversationsData) return [];

    return conversationsData.map(
      (conv): IConversation => ({
        _id: conv._id,
        id: conv._id,
        participants: conv.participants,
        appointmentId: conv.appointmentId,
        clientName: conv.otherParticipant?.name,
        clientAvatar: conv.otherParticipant?.avatar,
        barberName: conv.otherParticipant?.name,
        barberAvatar: conv.otherParticipant?.avatar,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        lastMessageSenderId: conv.lastMessageSenderId,
        unreadCounts: conv.unreadCounts,
        unreadCount: conv.unreadCount,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      })
    );
  }, [conversationsData, mockConversations, isDevMode]);

  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
  }, [conversations]);

  const createConversation = async (params: ICreateConversationParams): Promise<string> => {
    if (!params.participantId) {
      throw new Error('Participant ID is required');
    }

    const result = await createConversationMutation({
      participantId: params.participantId as Id<'users'>,
      appointmentId: params.appointmentId as Id<'appointments'> | undefined,
      initialMessage: params.initialMessage,
    });

    return result._id;
  };

  const getOrCreateConversation = async (
    appointmentId: string,
    params: ICreateConversationParams
  ): Promise<string> => {
    const existing = conversations.find((c) => c.appointmentId === appointmentId);
    if (existing) {
      return existing._id;
    }
    return createConversation(params);
  };

  const deleteConversation = async (conversationId: string): Promise<void> => {
    console.warn(
      '[useChatList] Delete conversation not implemented - Convex does not support soft deletes for chat'
    );
  };

  const refreshConversations = async (): Promise<void> => {
    // Convex queries auto-refresh, no manual refresh needed
  };

  return {
    conversations,
    createConversation,
    getOrCreateConversation,
    deleteConversation,
    isLoading: isDevMode ? isLoadingMock : conversationsData === undefined,
    error: null,
    refreshConversations,
    totalUnreadCount,
  };
};

export default useChatList;
