import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * ChatInput Component
 *
 * Input field for composing and sending chat messages.
 *
 * Features:
 * - Text input with multi-line support
 * - Send button
 * - Image attachment button (optional)
 * - Typing indicator callback
 * - Auto-growing input
 * - Loading state
 *
 * @example
 * ```tsx
 * <ChatInput
 *   onSendMessage={(text) => sendMessage(text)}
 *   onTyping={(isTyping) => setIsTyping(isTyping)}
 *   placeholder="Type a message..."
 * />
 * ```
 */

interface IChatInputProps {
  onSendMessage: (content: string) => Promise<void>;
  onTyping?: (isTyping: boolean) => void;
  onImagePress?: () => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  showImageButton?: boolean;
}

export const ChatInput: React.FC<IChatInputProps> = ({
  onSendMessage,
  onTyping,
  onImagePress,
  placeholder = 'Type a message...',
  disabled = false,
  maxLength = 1000,
  showImageButton = true,
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Handle text input change
   */
  const handleChangeText = useCallback(
    (text: string) => {
      setMessage(text);

      // Trigger typing indicator
      if (onTyping) {
        onTyping(true);

        // Clear existing timeout
        if (typingTimeout) {
          clearTimeout(typingTimeout);
        }

        // Set new timeout to clear typing indicator after 2 seconds
        const timeout = setTimeout(() => {
          onTyping(false);
        }, 2000);

        setTypingTimeout(timeout);
      }
    },
    [onTyping, typingTimeout]
  );

  /**
   * Handle send button press
   */
  const handleSendPress = useCallback(async () => {
    if (!message.trim() || isSending || disabled) {
      return;
    }

    try {
      setIsSending(true);

      // Send message
      await onSendMessage(message.trim());

      // Clear input
      setMessage('');

      // Clear typing indicator
      if (onTyping) {
        onTyping(false);
      }

      // Clear typing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
    } catch (error) {
      console.error('[ChatInput] Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  }, [message, isSending, disabled, onSendMessage, onTyping, typingTimeout]);

  /**
   * Handle image button press
   */
  const handleImagePress = useCallback(() => {
    if (onImagePress && !disabled) {
      onImagePress();
    }
  }, [onImagePress, disabled]);

  const canSend = message.trim().length > 0 && !isSending && !disabled;

  return (
    <View className="flex-row items-end px-4 py-3 bg-white border-t border-gray-200">
      {/* Image Attachment Button */}
      {showImageButton && (
        <Pressable onPress={handleImagePress} disabled={disabled} className="mb-2 mr-2">
          <View className={`p-2 ${disabled ? 'opacity-50' : ''}`}>
            <Ionicons name="image-outline" size={24} color="#6B7280" />
          </View>
        </Pressable>
      )}

      {/* Text Input */}
      <View className="flex-1 min-h-[40px] max-h-[120px] px-4 py-2 bg-gray-100 rounded-full">
        <TextInput
          value={message}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={maxLength}
          editable={!disabled}
          className="text-base text-gray-900"
          style={{ minHeight: 24 }}
        />
      </View>

      {/* Send Button */}
      <Pressable onPress={handleSendPress} disabled={!canSend} className="ml-2 mb-2">
        <View
          className={`w-10 h-10 rounded-full items-center justify-center ${
            canSend ? 'bg-blue-500' : 'bg-gray-300'
          }`}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="send" size={20} color={canSend ? '#FFFFFF' : '#9CA3AF'} />
          )}
        </View>
      </Pressable>
    </View>
  );
};

export default ChatInput;
