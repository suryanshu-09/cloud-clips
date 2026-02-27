import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { IMessage, IAttachment } from '@/features/chat/types';
import { Avatar } from '@/components/ui/Avatar';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

/**
 * MessageBubble Component
 *
 * Displays a single chat message with comprehensive attachment support.
 *
 * Features:
 * - Different styling for sent/received messages
 * - Multiple attachment types: image, file, voice, location
 * - Message status indicators (sending, sent, delivered, read, failed)
 * - Timestamp display with smart formatting
 * - Reply-to preview for threaded conversations
 * - Reactions support (emoji reactions)
 * - Swipe-to-reply gesture
 * - Long press for message actions
 * - Selection mode for bulk actions
 *
 * @example
 * ```tsx
 * <MessageBubble
 *   message={message}
 *   isCurrentUser={message.senderId === currentUserId}
 *   status="read"
 *   onReply={() => handleReply(message)}
 *   onReaction={(emoji) => addReaction(message.id, emoji)}
 *   onImagePress={(url) => showImageModal(url)}
 * />
 * ```
 */

// Reaction type definition
interface IReaction {
  emoji: string;
  users: string[];
}

interface IMessageBubbleProps {
  message: IMessage;
  isCurrentUser: boolean;
  showTimestamp?: boolean;
  showAvatar?: boolean;
  senderAvatar?: string;
  senderName?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  isSelected?: boolean;
  selectionMode?: boolean;
  replyToMessage?: IMessage | null;
  reactions?: IReaction[];
  onImagePress?: (imageUrl: string) => void;
  onFilePress?: (attachment: IAttachment) => void;
  onLocationPress?: (latitude: number, longitude: number) => void;
  onVoicePlay?: (attachment: IAttachment) => void;
  onLongPress?: (message: IMessage) => void;
  onReply?: (message: IMessage) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onSelect?: (messageId: string) => void;
  onSwipeLeft?: (message: IMessage) => void;
}

// Voice message player component
interface IVoiceMessagePlayerProps {
  attachment: IAttachment;
  isCurrentUser: boolean;
  onPlay?: () => void;
}

const VoiceMessagePlayer: React.FC<IVoiceMessagePlayerProps> = ({
  attachment,
  isCurrentUser,
  onPlay,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [duration, _setDuration] = useState(attachment.duration || 0);

  const handlePlay = useCallback(async () => {
    if (onPlay) {
      onPlay();
      return;
    }

    try {
      if (isPlaying && sound) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        if (!sound && attachment.url) {
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: attachment.url },
            { shouldPlay: true }
          );
          setSound(newSound);

          newSound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded) {
              setProgress(status.positionMillis / (status.durationMillis || 1));
              setIsPlaying(status.isPlaying);
              if (status.didJustFinish) {
                setProgress(0);
                setIsPlaying(false);
              }
            }
          });
        } else if (sound) {
          await sound.playAsync();
        }
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('[VoiceMessagePlayer] Error playing audio:', error);
    }
  }, [isPlaying, sound, attachment.url, onPlay]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Pressable onPress={handlePlay} className="flex-row items-center py-2 px-3">
      <View
        className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
          isCurrentUser ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={20}
          color={isCurrentUser ? '#FFFFFF' : '#374151'}
        />
      </View>
      <View className="flex-1">
        <View className="h-1 bg-gray-300 rounded-full overflow-hidden">
          <View
            className={`h-full rounded-full ${isCurrentUser ? 'bg-white' : 'bg-blue-500'}`}
            style={{ width: `${progress * 100}%` }}
          />
        </View>
        <Text className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>
          {formatDuration(duration)}
        </Text>
      </View>
    </Pressable>
  );
};

// File attachment component
interface IFileAttachmentProps {
  attachment: IAttachment;
  isCurrentUser: boolean;
  onPress?: () => void;
}

const FileAttachment: React.FC<IFileAttachmentProps> = ({ attachment, isCurrentUser, onPress }) => {
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileName?: string): string => {
    if (!fileName) return 'document-outline';
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext || '')) return 'document-text-outline';
    if (['doc', 'docx'].includes(ext || '')) return 'document-outline';
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) return 'grid-outline';
    if (['ppt', 'pptx'].includes(ext || '')) return 'easel-outline';
    if (['zip', 'rar', '7z'].includes(ext || '')) return 'archive-outline';
    return 'document-outline';
  };

  return (
    <Pressable onPress={onPress} className="flex-row items-center p-3">
      <View
        className={`w-12 h-12 rounded-xl items-center justify-center mr-3 ${
          isCurrentUser ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <Ionicons
          name={getFileIcon(attachment.name) as any}
          size={24}
          color={isCurrentUser ? '#FFFFFF' : '#374151'}
        />
      </View>
      <View className="flex-1">
        <Text
          className={`text-sm font-medium ${isCurrentUser ? 'text-white' : 'text-gray-900'}`}
          numberOfLines={1}
        >
          {attachment.name || 'File'}
        </Text>
        <Text className={`text-xs ${isCurrentUser ? 'text-blue-200' : 'text-gray-500'}`}>
          {formatFileSize(attachment.size)}
        </Text>
      </View>
    </Pressable>
  );
};

// Location message component
interface ILocationMessageProps {
  latitude: number;
  longitude: number;
  isCurrentUser: boolean;
  onPress?: () => void;
}

const LocationMessage: React.FC<ILocationMessageProps> = ({
  latitude,
  longitude,
  _isCurrentUser,
  onPress,
}) => {
  return (
    <Pressable onPress={onPress} className="p-3">
      <View className="bg-gray-100 rounded-xl overflow-hidden">
        {/* Map preview placeholder - in production, use a static map image */}
        <View className="h-32 bg-gray-300 items-center justify-center">
          <Ionicons name="map" size={40} color="#6B7280" />
          <Text className="text-gray-600 text-xs mt-2">Tap to view location</Text>
        </View>
        <View className="p-2 bg-white">
          <Text className="text-sm font-medium text-gray-900">Location</Text>
          <Text className="text-xs text-gray-500">
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

// Reply preview component
interface IReplyPreviewProps {
  message: IMessage;
  isCurrentUser: boolean;
}

const ReplyPreview: React.FC<IReplyPreviewProps> = ({ message, isCurrentUser }) => {
  return (
    <View
      className={`mb-2 p-2 rounded-lg border-l-4 ${
        isCurrentUser ? 'bg-blue-600/30 border-blue-300' : 'bg-gray-100 border-gray-400'
      }`}
    >
      <Text className={`text-xs font-medium ${isCurrentUser ? 'text-blue-200' : 'text-gray-600'}`}>
        {message.sender?.name || 'Unknown'}
      </Text>
      <Text
        className={`text-sm mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-700'}`}
        numberOfLines={2}
      >
        {message.content || (message.attachments?.[0]?.type === 'image' ? 'Photo' : 'Attachment')}
      </Text>
    </View>
  );
};

// Reactions component
interface IReactionsProps {
  reactions: IReaction[];
  isCurrentUser: boolean;
  onReactionPress?: (emoji: string) => void;
}

const Reactions: React.FC<IReactionsProps> = ({ reactions, isCurrentUser, onReactionPress }) => {
  if (!reactions || reactions.length === 0) return null;

  return (
    <View className={`flex-row flex-wrap mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      {reactions.map((reaction, index) => (
        <Pressable
          key={index}
          onPress={() => onReactionPress?.(reaction.emoji)}
          className="flex-row items-center bg-white border border-gray-200 rounded-full px-2 py-1 mr-1 mb-1"
        >
          <Text className="text-sm">{reaction.emoji}</Text>
          {reaction.users.length > 1 && (
            <Text className="text-xs text-gray-600 ml-1">{reaction.users.length}</Text>
          )}
        </Pressable>
      ))}
    </View>
  );
};

export const MessageBubble: React.FC<IMessageBubbleProps> = ({
  message,
  isCurrentUser,
  showTimestamp = true,
  showAvatar = false,
  senderAvatar,
  senderName,
  status = 'sent',
  isSelected = false,
  selectionMode = false,
  replyToMessage,
  reactions,
  onImagePress,
  onFilePress,
  onLocationPress,
  onVoicePlay,
  onLongPress,
  _onReply,
  onReaction,
  onSelect,
  onSwipeLeft,
}) => {
  // Animation value for swipe gesture
  const pan = React.useRef(new Animated.ValueXY()).current;

  // Create pan responder for swipe-to-reply
  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only enable swipe left for reply
        return gestureState.dx < -20 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        // Limit swipe distance
        if (gestureState.dx < 0 && gestureState.dx > -100) {
          pan.setValue({ x: gestureState.dx, y: 0 });
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) {
          // Trigger reply
          onSwipeLeft?.(message);
        }
        // Reset position
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

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
    switch (status) {
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
    if (selectionMode) {
      onSelect?.(message._id);
    } else {
      onLongPress?.(message);
    }
  };

  const handlePress = () => {
    if (selectionMode) {
      onSelect?.(message._id);
    }
  };

  // Parse location from message content or attachment
  const getLocationData = (): { latitude: number; longitude: number } | null => {
    const locationAttachment = message.attachments?.find((att) => att.type === 'location');
    if (locationAttachment?.latitude && locationAttachment?.longitude) {
      return {
        latitude: locationAttachment.latitude,
        longitude: locationAttachment.longitude,
      };
    }
    return null;
  };

  const locationData = getLocationData();
  const voiceAttachment = message.attachments?.find((att) => att.type === 'voice');
  const fileAttachments = message.attachments?.filter((att) => att.type === 'file') || [];
  const imageAttachments = message.attachments?.filter((att) => att.type === 'image') || [];

  return (
    <Animated.View
      style={{
        transform: [{ translateX: pan.x }],
      }}
      {...panResponder.panHandlers}
    >
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        className={`mb-3 flex-row ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
      >
        {/* Selection Checkbox */}
        {selectionMode && (
          <View className="mr-2 justify-center">
            <View
              className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-400'
              }`}
            >
              {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </View>
          </View>
        )}

        {/* Avatar for received messages */}
        {showAvatar && !isCurrentUser && (
          <View className="mr-2 mt-auto">
            <Avatar source={senderAvatar} size="sm" fallback={senderName || '?'} />
          </View>
        )}

        <View className="max-w-[75%]">
          {/* Sender name for group chats */}
          {showAvatar && !isCurrentUser && senderName && (
            <Text className="text-xs text-gray-500 mb-1 ml-1">{senderName}</Text>
          )}

          {/* Reply Preview */}
          {replyToMessage && (
            <ReplyPreview message={replyToMessage} isCurrentUser={isCurrentUser} />
          )}

          {/* Message Bubble */}
          <View
            className={`rounded-2xl overflow-hidden ${
              isCurrentUser
                ? 'bg-blue-500 rounded-br-sm'
                : 'bg-white rounded-bl-sm border border-gray-200'
            } ${status === 'failed' ? 'bg-red-500' : ''} ${isSelected ? 'opacity-70' : ''}`}
          >
            {/* Image Attachments */}
            {imageAttachments.map((attachment, index) => (
              <Pressable
                key={index}
                onPress={() => onImagePress?.(attachment.url)}
                className="relative"
              >
                <OptimizedImage
                  source={attachment.url}
                  width={256}
                  height={256}
                  contentFit="cover"
                  style={{
                    marginTop: index === 0 ? 0 : 4,
                    marginBottom: index === imageAttachments.length - 1 && !message.content ? 0 : 4,
                  }}
                />
                {imageAttachments.length > 1 && (
                  <View className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded-full">
                    <Text className="text-white text-xs">
                      {index + 1}/{imageAttachments.length}
                    </Text>
                  </View>
                )}
              </Pressable>
            ))}

            {/* Voice Message */}
            {voiceAttachment && (
              <VoiceMessagePlayer
                attachment={voiceAttachment}
                isCurrentUser={isCurrentUser}
                onPlay={() => onVoicePlay?.(voiceAttachment)}
              />
            )}

            {/* File Attachments */}
            {fileAttachments.map((attachment, index) => (
              <FileAttachment
                key={index}
                attachment={attachment}
                isCurrentUser={isCurrentUser}
                onPress={() => onFilePress?.(attachment)}
              />
            ))}

            {/* Location Message */}
            {locationData && (
              <LocationMessage
                latitude={locationData.latitude}
                longitude={locationData.longitude}
                isCurrentUser={isCurrentUser}
                onPress={() => onLocationPress?.(locationData.latitude, locationData.longitude)}
              />
            )}

            {/* Text Content */}
            {message.content && (
              <View className="px-4 py-2">
                <Text
                  className={`text-base ${isCurrentUser ? 'text-white' : 'text-gray-900'}`}
                  style={{ lineHeight: 22 }}
                >
                  {message.content}
                </Text>
              </View>
            )}

            {/* Timestamp and Status */}
            {showTimestamp && (
              <View
                className={`flex-row items-center justify-end px-4 pb-2 ${
                  message.content ? 'pt-0' : 'pt-2'
                }`}
              >
                <Text className={`text-xs ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>
                  {formatTimestamp(message.createdAt)}
                </Text>

                {/* Status Indicator (only for current user's messages) */}
                {isCurrentUser && (
                  <Text
                    className={`text-xs ml-1 ${
                      status === 'read'
                        ? 'text-blue-200'
                        : status === 'failed'
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

          {/* Reactions */}
          {reactions && reactions.length > 0 && (
            <Reactions
              reactions={reactions}
              isCurrentUser={isCurrentUser}
              onReactionPress={onReaction}
            />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default MessageBubble;
