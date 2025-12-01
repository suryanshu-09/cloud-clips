import React from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useChatList } from '@/features/chat';
import { IConversation } from '@/features/chat/types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SafeView } from '@/components/ui/SafeView';

/**
 * Chat List Screen
 *
 * Displays a list of chat conversations for the current user.
 *
 * Features:
 * - Real-time conversation updates
 * - Unread message indicators
 * - Last message preview
 * - Pull-to-refresh
 * - Empty state
 */

export default function ChatListScreen() {
  const router = useRouter();

  // Get current user from auth context (mock for now)
  const currentUserId = 'client-1'; // TODO: Get from auth context
  const userType = 'client'; // TODO: Get from auth context

  const { conversations, isLoading, refreshConversations, totalUnreadCount } = useChatList(
    currentUserId,
    userType
  );

  /**
   * Format timestamp to relative time
   */
  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else if (days < 7) {
      return `${days}d`;
    } else {
      return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  /**
   * Navigate to conversation
   */
  const handleConversationPress = (conversation: IConversation) => {
    router.push(`/(client)/chat/${conversation.appointmentId}`);
  };

  /**
   * Render conversation item
   */
  const renderConversation = ({ item }: { item: IConversation }) => {
    const otherUser =
      userType === 'client'
        ? {
            name: item.participants.barberName,
            avatar: item.participants.barberAvatar,
          }
        : {
            name: item.participants.clientName,
            avatar: item.participants.clientAvatar,
          };

    const lastMessageText = item.lastMessage
      ? item.lastMessage.type === 'image'
        ? '📷 Photo'
        : item.lastMessage.content
      : 'No messages yet';

    return (
      <Pressable
        onPress={() => handleConversationPress(item)}
        className="flex-row items-center px-4 py-4 bg-white border-b border-gray-200 active:bg-gray-50"
      >
        {/* Avatar */}
        <Avatar source={otherUser.avatar} size="lg" fallback={otherUser.name} />

        {/* Conversation Info */}
        <View className="flex-1 ml-4">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-base font-semibold text-gray-900 flex-1 mr-2" numberOfLines={1}>
              {otherUser.name}
            </Text>
            <Text className="text-xs text-gray-500">{formatTime(item.lastMessageAt)}</Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text
              className={`text-sm flex-1 mr-2 ${
                item.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'
              }`}
              numberOfLines={1}
            >
              {lastMessageText}
            </Text>

            {/* Unread Badge */}
            {item.unreadCount > 0 && (
              <Badge variant="primary" size="sm">
                {item.unreadCount > 99 ? '99+' : item.unreadCount.toString()}
              </Badge>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <SafeView>
        <View className="flex-1 items-center justify-center bg-gray-50">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeView>
    );
  }

  return (
    <SafeView>
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="px-6 py-4 bg-white border-b border-gray-200">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-3xl font-bold text-gray-900">Messages</Text>
            {totalUnreadCount > 0 && (
              <Badge variant="primary">
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount.toString()}
              </Badge>
            )}
          </View>
          <Text className="text-sm text-gray-600">Chat with your barbers</Text>
        </View>

        {/* Conversation List */}
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refreshConversations}
              tintColor="#3B82F6"
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="💬"
              title="No conversations yet"
              description="Start chatting with your barbers after booking an appointment"
            />
          }
          contentContainerStyle={{
            flexGrow: 1,
          }}
        />
      </View>
    </SafeView>
  );
}
