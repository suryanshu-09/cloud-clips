import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { IMessage } from '@/features/chat/types';

/**
 * MessageBubble Component
 *
 * Displays a single chat message with styling based on sender.
 *
 * Features:
 * - Different styling for sent/received messages
 * - Image message support
 * - Message status indicators
 * - Timestamp display
 * - Read receipts
 *
 * @example
 * ```tsx
 * <MessageBubble
 *   message={message}
 *   isCurrentUser={message.senderId === currentUserId}
 *   onImagePress={() => {}}
 * />
 * ```
 */

interface IMessageBubbleProps {
  message: IMessage;
  isCurrentUser: boolean;
  showTimestamp?: boolean;
  onImagePress?: (imageUrl: string) => void;
  onLongPress?: (message: IMessage) => void;
}

export const MessageBubble: React.FC<IMessageBubbleProps> = ({
  message,
  isCurrentUser,
  showTimestamp = true,
  onImagePress,
  onLongPress,
}) => {
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusIcon = (): string => {
    switch (message.status) {
      case 'sending':
        return '○';
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      case 'failed':
        return '⚠';
      default:
        return '';
    }
  };

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress(message);
    }
  };

  return (
    <Pressable
      onLongPress={handleLongPress}
      className={`mb-3 ${isCurrentUser ? 'items-end' : 'items-start'}`}
    >
      <View
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isCurrentUser ? 'bg-blue-500 rounded-br-sm' : 'bg-white rounded-bl-sm'
        } ${message.status === 'failed' ? 'bg-red-500' : ''}`}
      >
        {/* Image Message */}
        {message.type === 'image' && message.imageUrl && (
          <Pressable onPress={() => onImagePress?.(message.imageUrl!)}>
            <Image
              source={{ uri: message.imageUrl }}
              className="w-48 h-48 rounded-lg mb-1"
              resizeMode="cover"
            />
          </Pressable>
        )}

        {/* Text Content */}
        {message.content && (
          <Text className={`text-base ${isCurrentUser ? 'text-white' : 'text-gray-900'}`}>
            {message.content}
          </Text>
        )}

        {/* System Message */}
        {message.type === 'system' && (
          <Text className="text-sm italic text-gray-600">{message.content}</Text>
        )}

        {/* Timestamp and Status */}
        {showTimestamp && (
          <View className="flex-row items-center justify-end mt-1 space-x-1">
            <Text className={`text-xs ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>
              {formatTimestamp(message.createdAt)}
            </Text>

            {/* Status Indicator (only for current user's messages) */}
            {isCurrentUser && (
              <Text
                className={`text-xs ${
                  message.status === 'read'
                    ? 'text-blue-200'
                    : message.status === 'failed'
                      ? 'text-red-200'
                      : 'text-blue-100'
                }`}
              >
                {getStatusIcon()}
              </Text>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
};

export default MessageBubble;
