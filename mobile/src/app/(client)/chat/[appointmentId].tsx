import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Text,
  Alert,
  type ListRenderItemInfo,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useChat, useChatList, chatService } from '@/features/chat';
import { IMessage, IChatUser, IConversation } from '@/features/chat/types';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { SafeView } from '@/components/ui/SafeView';

// Estimated message height for getItemLayout optimization
const MESSAGE_HEIGHT = 80;

/**
 * Chat Conversation Screen
 *
 * Real-time chat interface for a specific appointment.
 *
 * Features:
 * - Real-time message updates
 * - Send text messages
 * - Typing indicators
 * - Read receipts
 * - Message status
 * - Auto-scroll to bottom
 * - Mark messages as read
 *
 * Performance optimizations:
 * - Memoized message data
 * - Memoized renderItem callback
 * - getItemLayout for faster scrolling
 * - removeClippedSubviews for memory efficiency
 */

export default function ChatConversationScreen() {
  const router = useRouter();
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const flatListRef = useRef<FlatList>(null);

  // Get current user from auth context (mock for now)
  const currentUserId = 'client-1'; // TODO: Get from auth context
  const userType = 'client'; // TODO: Get from auth context

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<IConversation | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);

  const { getOrCreateConversation } = useChatList(currentUserId, userType);

  const {
    messages,
    sendMessage,
    isLoading: isLoadingMessages,
    otherUserTyping,
    setIsTyping,
    markAsRead,
  } = useChat(conversationId || '', currentUserId);

  // Memoized reversed messages to avoid recalculating on every render
  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  /**
   * Load or create conversation
   */
  useEffect(() => {
    const loadConversation = async () => {
      if (!appointmentId) return;

      try {
        setIsLoadingConversation(true);

        // Check if conversation exists
        const existingConversation = await chatService.getConversationByAppointment(
          appointmentId as string
        );

        if (existingConversation) {
          setConversationId(existingConversation.id);
          setConversation(existingConversation);
        } else {
          // Create new conversation
          // In production, fetch appointment details to get barber ID
          const mockBarberId = 'mock-barber-id'; // TODO: Fetch from appointment

          const newConversationId = await getOrCreateConversation(appointmentId as string, {
            appointmentId: appointmentId as string,
            clientId: currentUserId,
            barberId: mockBarberId,
          });

          setConversationId(newConversationId);

          // Fetch conversation details
          const conv = await chatService.getConversation(newConversationId);
          setConversation(conv);
        }
      } catch (err) {
        console.error('[ChatConversation] Error loading conversation:', err);
        Alert.alert('Error', 'Failed to load conversation');
      } finally {
        setIsLoadingConversation(false);
      }
    };

    loadConversation();
  }, [appointmentId, currentUserId, getOrCreateConversation]);

  /**
   * Mark messages as read when screen is focused
   */
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      markAsRead();
    }
  }, [conversationId, messages.length, markAsRead]);

  /**
   * Handle send message
   */
  const handleSendMessage = useCallback(
    async (content: string) => {
      try {
        await sendMessage(content);
      } catch (err) {
        console.error('[ChatConversation] Error sending message:', err);
        Alert.alert('Error', 'Failed to send message. Please try again.');
      }
    },
    [sendMessage]
  );

  /**
   * Handle image press (for future image message support)
   */
  const handleImagePress = useCallback(() => {
    // TODO: Implement image picker and send image message
    Alert.alert('Coming Soon', 'Image messages will be available soon!');
  }, []);

  /**
   * Handle message long press
   */
  const handleMessageLongPress = useCallback((_message: IMessage) => {
    // TODO: Show options menu (copy, delete, etc.)
    Alert.alert('Message Options', 'Copy or delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Copy', onPress: () => {} },
      { text: 'Delete', style: 'destructive', onPress: () => {} },
    ]);
  }, []);

  // Memoized key extractor
  const keyExtractor = useCallback((item: IMessage) => item.id, []);

  // Memoized render item function
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<IMessage>) => (
      <MessageBubble
        message={item}
        isCurrentUser={item.senderId === currentUserId}
        onImagePress={handleImagePress}
        onLongPress={handleMessageLongPress}
      />
    ),
    [currentUserId, handleImagePress, handleMessageLongPress]
  );

  // Memoized getItemLayout for message items
  const getItemLayout = useCallback(
    (_: ArrayLike<IMessage> | null | undefined, index: number) => ({
      length: MESSAGE_HEIGHT,
      offset: MESSAGE_HEIGHT * index,
      index,
    }),
    []
  );

  // Memoized empty component
  const renderEmptyComponent = useMemo(() => {
    if (isLoadingMessages) {
      return (
        <View
          className="flex-1 items-center justify-center"
          style={{ transform: [{ scaleY: -1 }] }}
        >
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      );
    }
    return (
      <View style={{ transform: [{ scaleY: -1 }] }}>
        <EmptyState
          icon="💬"
          title="No messages yet"
          description="Start the conversation by sending a message"
        />
      </View>
    );
  }, [isLoadingMessages]);

  /**
   * Get other user info
   */
  const otherUser = useMemo((): IChatUser | null => {
    if (!conversation) return null;

    // Get participant info from participants object or fallback to legacy fields
    const participants = Array.isArray(conversation.participants)
      ? {
          clientName: conversation.clientName,
          clientAvatar: conversation.clientAvatar,
          barberName: conversation.barberName,
          barberAvatar: conversation.barberAvatar,
        }
      : conversation.participants;

    const isClient = userType === 'client';
    return {
      id: isClient ? conversation.barberId : conversation.clientId,
      name: isClient
        ? participants?.barberName || conversation.barberName || 'Barber'
        : participants?.clientName || conversation.clientName || 'Client',
      avatar: isClient
        ? participants?.barberAvatar || conversation.barberAvatar
        : participants?.clientAvatar || conversation.clientAvatar,
      online: false, // TODO: Implement online status
    };
  }, [conversation, userType]);

  if (isLoadingConversation || !otherUser) {
    return (
      <SafeView>
        <View className="flex-1 items-center justify-center bg-gray-50">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-600 mt-4">Loading conversation...</Text>
        </View>
      </SafeView>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <ChatHeader user={otherUser} onBackPress={() => router.back()} isTyping={otherUserTyping} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={reversedMessages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          inverted
          className="flex-1 bg-gray-50"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          ListEmptyComponent={renderEmptyComponent}
          // Performance optimizations
          removeClippedSubviews={true}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={7}
          updateCellsBatchingPeriod={50}
        />

        {/* Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onTyping={setIsTyping}
          onImagePress={handleImagePress}
          placeholder="Type a message..."
          disabled={!conversationId}
        />
      </KeyboardAvoidingView>
    </View>
  );
}
