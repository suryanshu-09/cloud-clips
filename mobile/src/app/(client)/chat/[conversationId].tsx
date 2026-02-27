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
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { IMessage, IChatUserWithStatus } from '@/features/chat/types';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { SafeView } from '@/components/ui/SafeView';
import { useAuth } from '@/features/auth/hooks/useAuth';

const MESSAGE_HEIGHT = 80;

export default function ChatRoomScreen() {
  const router = useRouter();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const flatListRef = useRef<FlatList>(null);
  const { currentUser, userRole } = useAuth();

  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const conversation = useQuery(
    api.messages.queries.getConversation,
    conversationId ? { conversationId: conversationId as Id<'conversations'> } : 'skip'
  );

  const messagesResult = useQuery(
    api.messages.queries.getChatMessages,
    conversationId ? { conversationId: conversationId as Id<'conversations'>, limit: 50 } : 'skip'
  );

  const sendMessageMutation = useMutation(api.messages.mutations.sendMessage);
  const markAsReadMutation = useMutation(api.messages.mutations.markAsRead);

  const messages = useMemo(() => {
    if (!messagesResult) return [];
    return messagesResult.messages || [];
  }, [messagesResult]);

  useEffect(() => {
    if (conversationId && messages.length > 0) {
      markAsReadMutation({ conversationId: conversationId as Id<'conversations'> }).catch((err) => {
        console.error('[ChatRoom] Error marking messages as read:', err);
      });
    }
  }, [conversationId, messages.length, markAsReadMutation]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !content.trim()) return;

      try {
        await sendMessageMutation({
          conversationId: conversationId as Id<'conversations'>,
          content: content.trim(),
        });
      } catch (err) {
        console.error('[ChatRoom] Error sending message:', err);
        Alert.alert('Error', 'Failed to send message. Please try again.');
      }
    },
    [conversationId, sendMessageMutation]
  );

  const handleTyping = useCallback((typing: boolean) => {
    setIsTyping(typing);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (typing) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    }
  }, []);

  const handleImagePress = useCallback(() => {
    Alert.alert('Coming Soon', 'Image messages will be available soon!');
  }, []);

  const handleMessageLongPress = useCallback((_message: IMessage) => {
    Alert.alert('Message Options', 'What would you like to do?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Copy', onPress: () => {} },
      { text: 'Delete', style: 'destructive', onPress: () => {} },
    ]);
  }, []);

  const keyExtractor = useCallback((item: IMessage) => item._id || item.id, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<IMessage>) => (
      <MessageBubble
        message={item}
        isCurrentUser={item.senderId === currentUser?.id}
        onImagePress={handleImagePress}
        onLongPress={handleMessageLongPress}
      />
    ),
    [currentUser?.id, handleImagePress, handleMessageLongPress]
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<IMessage> | null | undefined, index: number) => ({
      length: MESSAGE_HEIGHT,
      offset: MESSAGE_HEIGHT * index,
      index,
    }),
    []
  );

  const renderEmptyComponent = useMemo(() => {
    if (!messagesResult) {
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
  }, [messagesResult]);

  const otherUser = useMemo((): IChatUserWithStatus | null => {
    if (!conversation || !currentUser) return null;

    const isClient = userRole === 'client';
    return {
      _id: isClient ? conversation.barberId : conversation.clientId,
      id: isClient ? conversation.barberId : conversation.clientId,
      name: isClient ? conversation.barberName : conversation.clientName,
      avatar: isClient ? conversation.barberAvatar : conversation.clientAvatar,
      role: isClient ? 'barber' : 'client',
      isActive: true,
      online: false,
      lastSeen: undefined,
    };
  }, [conversation, userRole, currentUser]);

  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  if (!conversation || !otherUser) {
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
      <ChatHeader user={otherUser} onBackPress={() => router.back()} isTyping={isTyping} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
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
          removeClippedSubviews={true}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={7}
          updateCellsBatchingPeriod={50}
        />

        <ChatInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          onImagePress={handleImagePress}
          placeholder="Type a message..."
          disabled={!conversationId}
        />
      </KeyboardAvoidingView>
    </View>
  );
}
