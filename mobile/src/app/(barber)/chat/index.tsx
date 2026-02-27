import React from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useChatList } from '@/features/chat';
import { IConversation } from '@/features/chat/types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SafeView } from '@/components/ui/SafeView';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function ChatListScreen() {
  const router = useRouter();
  const { userRole } = useAuth();

  const { conversations, isLoading, refreshConversations, totalUnreadCount } = useChatList();

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

  const handleConversationPress = (conversation: IConversation) => {
    router.push(`/(barber)/chat/${conversation._id || conversation.id}`);
  };

  const renderConversation = ({ item }: { item: IConversation }) => {
    const participants = Array.isArray(item.participants)
      ? {
          clientName: item.clientName,
          clientAvatar: item.clientAvatar,
          barberName: item.barberName,
          barberAvatar: item.barberAvatar,
        }
      : item.participants;

    const otherUser =
      userRole === 'client'
        ? {
            name: participants?.barberName || item.barberName || 'Barber',
            avatar: participants?.barberAvatar || item.barberAvatar,
          }
        : {
            name: participants?.clientName || item.clientName || 'Client',
            avatar: participants?.clientAvatar || item.clientAvatar,
          };

    let lastMessageText = 'No messages yet';
    if (item.lastMessage) {
      if (typeof item.lastMessage === 'string') {
        lastMessageText = item.lastMessage;
      } else if (item.lastMessage.type === 'image') {
        lastMessageText = '📷 Photo';
      } else {
        lastMessageText = item.lastMessage.content || 'No messages yet';
      }
    }

    return (
      <Pressable
        onPress={() => handleConversationPress(item)}
        className="flex-row items-center px-4 py-4 bg-white border-b border-gray-200 active:bg-gray-50"
      >
        <Avatar source={otherUser.avatar} size="lg" fallback={otherUser.name} />

        <View className="flex-1 ml-4">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-base font-semibold text-gray-900 flex-1 mr-2" numberOfLines={1}>
              {otherUser.name}
            </Text>
            <Text className="text-xs text-gray-500">{formatTime(item.lastMessageAt || 0)}</Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text
              className={`text-sm flex-1 mr-2 ${
                (item.unreadCount || 0) > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'
              }`}
              numberOfLines={1}
            >
              {lastMessageText}
            </Text>

            {(item.unreadCount || 0) > 0 && (
              <Badge variant="primary" size="sm">
                {(item.unreadCount || 0) > 99 ? '99+' : (item.unreadCount || 0).toString()}
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
        <View className="px-6 py-4 bg-white border-b border-gray-200">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-3xl font-bold text-gray-900">Messages</Text>
            {totalUnreadCount > 0 && (
              <Badge variant="primary">
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount.toString()}
              </Badge>
            )}
          </View>
          <Text className="text-sm text-gray-600">Chat with your clients</Text>
        </View>

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
              description="Start chatting with your clients when they book appointments"
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
