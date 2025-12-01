import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Text,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useChat, useChatList, chatService } from '@/features/chat';
import { IMessage, IChatUser, IConversation } from '@/features/chat/types';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { SafeView } from '@/components/ui/SafeView';

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
    error,
    otherUserTyping,
    setIsTyping,
    markAsRead,
  } = useChat(conversationId || '', currentUserId);

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
  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content);
    } catch (err) {
      console.error('[ChatConversation] Error sending message:', err);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  /**
   * Handle image press (for future image message support)
   */
  const handleImagePress = () => {
    // TODO: Implement image picker and send image message
    Alert.alert('Coming Soon', 'Image messages will be available soon!');
  };

  /**
   * Handle message long press
   */
  const handleMessageLongPress = (message: IMessage) => {
    // TODO: Show options menu (copy, delete, etc.)
    Alert.alert('Message Options', 'Copy or delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Copy', onPress: () => {} },
      { text: 'Delete', style: 'destructive', onPress: () => {} },
    ]);
  };

  /**
   * Get other user info
   */
  const getOtherUser = (): IChatUser | null => {
    if (!conversation) return null;

    const isClient = userType === 'client';
    return {
      id: isClient ? conversation.barberId : conversation.clientId,
      name: isClient ? conversation.participants.barberName : conversation.participants.clientName,
      avatar: isClient
        ? conversation.participants.barberAvatar
        : conversation.participants.clientAvatar,
      online: false, // TODO: Implement online status
    };
  };

  const otherUser = getOtherUser();

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
          data={[...messages].reverse()}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isCurrentUser={item.senderId === currentUserId}
              onImagePress={handleImagePress}
              onLongPress={handleMessageLongPress}
            />
          )}
          keyExtractor={(item) => item.id}
          inverted
          className="flex-1 bg-gray-50"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          ListEmptyComponent={
            isLoadingMessages ? (
              <View
                className="flex-1 items-center justify-center"
                style={{ transform: [{ scaleY: -1 }] }}
              >
                <ActivityIndicator size="large" color="#3B82F6" />
              </View>
            ) : (
              <View style={{ transform: [{ scaleY: -1 }] }}>
                <EmptyState
                  icon="💬"
                  title="No messages yet"
                  description="Start the conversation by sending a message"
                />
              </View>
            )
          }
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
