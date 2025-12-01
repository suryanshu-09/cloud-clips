import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/ui/Avatar';
import { IChatUser } from '@/features/chat/types';

/**
 * ChatHeader Component
 *
 * Header for chat conversation screen with user info and actions.
 *
 * Features:
 * - User avatar and name
 * - Online status indicator
 * - Typing indicator
 * - Back button
 * - Options menu
 *
 * @example
 * ```tsx
 * <ChatHeader
 *   user={{ id: '123', name: 'John Doe', avatar: 'url', online: true }}
 *   onBackPress={() => router.back()}
 *   isTyping={false}
 * />
 * ```
 */

interface IChatHeaderProps {
  user: IChatUser;
  onBackPress: () => void;
  onOptionsPress?: () => void;
  isTyping?: boolean;
}

export const ChatHeader: React.FC<IChatHeaderProps> = ({
  user,
  onBackPress,
  onOptionsPress,
  isTyping = false,
}) => {
  const insets = useSafeAreaInsets();

  const formatLastSeen = (lastSeen?: number): string => {
    if (!lastSeen) return '';

    const now = Date.now();
    const diff = now - lastSeen;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  return (
    <View
      className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200"
      style={{ paddingTop: insets.top + 12 }}
    >
      {/* Back Button */}
      <Pressable onPress={onBackPress} className="mr-3">
        <Ionicons name="chevron-back" size={28} color="#111827" />
      </Pressable>

      {/* User Avatar with Online Status */}
      <View className="relative mr-3">
        <Avatar source={user.avatar} size="md" fallback={user.name} />
        {user.online && (
          <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
        )}
      </View>

      {/* User Info */}
      <View className="flex-1">
        <Text className="text-lg font-semibold text-gray-900">{user.name}</Text>
        <Text className="text-sm text-gray-500">
          {isTyping
            ? 'typing...'
            : user.online
              ? 'Active now'
              : user.lastSeen
                ? `Active ${formatLastSeen(user.lastSeen)}`
                : 'Offline'}
        </Text>
      </View>

      {/* Options Button */}
      {onOptionsPress && (
        <Pressable onPress={onOptionsPress} className="ml-2">
          <Ionicons name="ellipsis-vertical" size={24} color="#111827" />
        </Pressable>
      )}
    </View>
  );
};

export default ChatHeader;
