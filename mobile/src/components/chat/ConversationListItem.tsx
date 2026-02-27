import { memo, useMemo } from 'react';
import { View, Text, Pressable, type PressableProps } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import type { IConversation } from '@/features/chat';

interface IConversationListItemProps extends Omit<PressableProps, 'children'> {
  conversation: IConversation;
  currentUserId: string;
  userType?: 'client' | 'barber';
  onPress?: () => void;
}

/**
 * ConversationListItem - Conversation preview item for chat list
 *
 * Displays a single conversation with:
 * - Participant avatar
 * - Participant name
 * - Last message preview
 * - Timestamp
 * - Unread message count badge
 *
 * @example
 * ```tsx
 * <ConversationListItem
 *   conversation={conversation}
 *   currentUserId={userId}
 *   userType="client"
 *   onPress={() => router.push(`/chat/${conversation.id}`)}
 * />
 * ```
 */
function ConversationListItemComponent({
  conversation,
  currentUserId,
  userType = 'client',
  onPress,
  ...props
}: IConversationListItemProps) {
  // Get participant info from participants object or fallback to legacy fields
  const participants = useMemo(() => {
    if (Array.isArray(conversation.participants)) {
      return {
        clientName: conversation.clientName,
        clientAvatar: conversation.clientAvatar,
        barberName: conversation.barberName,
        barberAvatar: conversation.barberAvatar,
      };
    }
    return conversation.participants;
  }, [
    conversation.participants,
    conversation.clientName,
    conversation.clientAvatar,
    conversation.barberName,
    conversation.barberAvatar,
  ]);

  // Get other participant info based on user type
  const otherParticipant = useMemo(() => {
    if (userType === 'client') {
      return {
        name: participants?.barberName || conversation.barberName || 'Barber',
        avatar: participants?.barberAvatar || conversation.barberAvatar,
      };
    } else {
      return {
        name: participants?.clientName || conversation.clientName || 'Client',
        avatar: participants?.clientAvatar || conversation.clientAvatar,
      };
    }
  }, [participants, conversation, userType]);

  // Format timestamp (today shows time, other days show date)
  const formattedTime = useMemo(() => {
    if (!conversation.lastMessageAt) return '';

    const date = new Date(conversation.lastMessageAt);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }, [conversation.lastMessageAt]);

  // Get last message text
  const lastMessageText = useMemo(() => {
    if (!conversation.lastMessage) return 'No messages yet';

    if (typeof conversation.lastMessage === 'string') {
      return conversation.lastMessage;
    }

    if (conversation.lastMessage.type === 'image') {
      return '📷 Photo';
    }

    return conversation.lastMessage.content || 'No messages yet';
  }, [conversation.lastMessage]);

  // Truncate message
  const truncatedMessage = useMemo(() => {
    return lastMessageText.length > 50 ? `${lastMessageText.substring(0, 50)}...` : lastMessageText;
  }, [lastMessageText]);

  // Determine if current user sent the last message
  const isLastMessageFromMe = conversation.lastMessageSenderId === currentUserId;

  // Get unread count with fallback to 0
  const unreadCount = conversation.unreadCount ?? 0;
  const hasUnread = unreadCount > 0;

  const itemLabel = [
    otherParticipant.name,
    isLastMessageFromMe ? `You: ${truncatedMessage}` : truncatedMessage,
    formattedTime,
    hasUnread ? `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      onPress={onPress}
      {...props}
      accessibilityRole="button"
      accessibilityLabel={itemLabel}
      accessibilityHint="Tap to open this conversation"
    >
      <Card
        variant="default"
        padding="md"
        className={`flex-row items-center ${hasUnread ? 'bg-blue-50' : ''}`}
      >
        {/* Avatar */}
        <Avatar
          source={otherParticipant.avatar}
          size="lg"
          fallback={otherParticipant.name?.charAt(0) || '?'}
        />

        {/* Content */}
        <View className="flex-1 ml-3 min-w-0">
          {/* Top Row: Name and Time */}
          <View className="flex-row items-center justify-between mb-1">
            <Text
              className={`text-base font-semibold flex-1 mr-2 ${
                hasUnread ? 'text-gray-900' : 'text-gray-800'
              }`}
              numberOfLines={1}
            >
              {otherParticipant.name || 'Unknown'}
            </Text>
            <Text className="text-xs text-gray-500">{formattedTime}</Text>
          </View>

          {/* Bottom Row: Message Preview and Unread Badge */}
          <View className="flex-row items-center justify-between">
            <Text
              className={`text-sm flex-1 mr-2 ${
                hasUnread ? 'text-gray-900 font-medium' : 'text-gray-600'
              }`}
              numberOfLines={1}
            >
              {isLastMessageFromMe && 'You: '}
              {truncatedMessage}
            </Text>

            {/* Unread Badge */}
            {hasUnread && (
              <Badge variant="primary" size="sm">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export const ConversationListItem = memo(ConversationListItemComponent);

export default ConversationListItem;
