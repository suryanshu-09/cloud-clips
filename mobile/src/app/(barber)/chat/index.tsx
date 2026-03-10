import React, { useCallback, useMemo } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useChatList } from '@/features/chat';
import { IConversation } from '@/features/chat/types';
import { ConversationListItem, ConversationListItemSkeleton } from '@/components/chat';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SafeView } from '@/components/ui/SafeView';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function ChatListScreen() {
  const router = useRouter();
  const { userRole, currentUser } = useAuth();

  const { conversations, isLoading, refreshConversations, totalUnreadCount } = useChatList();

  const handleConversationPress = useCallback(
    (conversation: IConversation) => {
      router.push(`/(barber)/chat/${conversation._id || conversation.id}`);
    },
    [router]
  );

  const keyExtractor = useCallback((item: IConversation) => item.id, []);

  const renderConversation = useCallback(
    ({ item }: { item: IConversation }) => (
      <View className="px-4 py-2">
        <ConversationListItem
          conversation={item}
          currentUserId={currentUser?.id || ''}
          userType={userRole || 'barber'}
          onPress={() => handleConversationPress(item)}
        />
      </View>
    ),
    [currentUser?.id, userRole, handleConversationPress]
  );

  const refreshControl = useMemo(
    () => (
      <RefreshControl refreshing={false} onRefresh={refreshConversations} tintColor="#3B82F6" />
    ),
    [refreshConversations]
  );

  const emptyComponent = useMemo(
    () => (
      <EmptyState
        icon="💬"
        title="No conversations yet"
        description="Start chatting with your clients when they book appointments"
      />
    ),
    []
  );

  if (isLoading) {
    return (
      <SafeView>
        <View className="px-4 py-3 gap-3 bg-gray-50 flex-1">
          {Array.from({ length: 6 }).map((_, index) => (
            <ConversationListItemSkeleton key={index} />
          ))}
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
          keyExtractor={keyExtractor}
          refreshControl={refreshControl}
          ListEmptyComponent={emptyComponent}
          contentContainerStyle={{ flexGrow: 1 }}
          removeClippedSubviews={true}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      </View>
    </SafeView>
  );
}
