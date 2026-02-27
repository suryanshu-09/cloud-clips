import React from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useChatList } from '@/features/chat';
import { IConversation } from '@/features/chat/types';
import { ConversationListItem } from '@/components/chat';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SafeView } from '@/components/ui/SafeView';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function ChatListScreen() {
  const router = useRouter();
  const { currentUser, userRole } = useAuth();

  const { conversations, isLoading, refreshConversations, totalUnreadCount } = useChatList();

  const handleConversationPress = (conversation: IConversation) => {
    router.push(`/(client)/chat/${conversation._id || conversation.id}`);
  };

  const renderConversation = ({ item }: { item: IConversation }) => {
    return (
      <View className="px-4 py-2">
        <ConversationListItem
          conversation={item}
          currentUserId={currentUser?.id || ''}
          userType={userRole || 'client'}
          onPress={() => handleConversationPress(item)}
        />
      </View>
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
          <Text className="text-sm text-gray-600">Chat with your barbers</Text>
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
