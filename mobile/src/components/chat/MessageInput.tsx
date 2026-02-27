import React, { useState, useCallback, useRef } from 'react';
import { View, TextInput, Pressable, ActivityIndicator, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * MessageInput Component
 *
 * Text input component for composing and sending chat messages.
 *
 * Features:
 * - Multi-line text input with auto-growing height
 * - Send button with loading state
 * - Typing indicator callback
 * - Keyboard handling
 * - Disabled state
 * - Max length validation
 *
 * @example
 * ```tsx
 * <MessageInput
 *   onSendMessage={(text) => sendMessage(text)}
 *   onTyping={(isTyping) => setIsTyping(isTyping)}
 *   placeholder="Type a message..."
 * />
 * ```
 */

interface IMessageInputProps extends Omit<TextInputProps, 'onChange' | 'onChangeText'> {
  onSendMessage: (content: string) => Promise<void> | void;
  onTyping?: (isTyping: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  showSendButton?: boolean;
  minHeight?: number;
  maxHeight?: number;
}

export const MessageInput: React.FC<IMessageInputProps> = ({
  onSendMessage,
  onTyping,
  placeholder = 'Type a message...',
  disabled = false,
  maxLength = 2000,
  showSendButton = true,
  minHeight = 40,
  maxHeight = 120,
  ...textInputProps
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [inputHeight, setInputHeight] = useState(minHeight);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  /**
   * Clear typing timeout on unmount
   */
  const clearTypingTimeout = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  /**
   * Handle text input change
   */
  const handleChangeText = useCallback(
    (text: string) => {
      setMessage(text);

      // Trigger typing indicator
      if (onTyping) {
        onTyping(true);
        clearTypingTimeout();

        // Set timeout to clear typing indicator after 1.5 seconds
        typingTimeoutRef.current = setTimeout(() => {
          onTyping(false);
        }, 1500);
      }
    },
    [onTyping, clearTypingTimeout]
  );

  /**
   * Handle content size change for auto-growing input
   */
  const handleContentSizeChange = useCallback(
    (event: { nativeEvent: { contentSize: { height: number } } }) => {
      const newHeight = Math.min(
        Math.max(event.nativeEvent.contentSize.height, minHeight),
        maxHeight
      );
      setInputHeight(newHeight);
    },
    [minHeight, maxHeight]
  );

  /**
   * Handle send button press
   */
  const handleSendPress = useCallback(async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || isSending || disabled) {
      return;
    }

    try {
      setIsSending(true);
      clearTypingTimeout();

      // Send message
      await onSendMessage(trimmedMessage);

      // Clear input
      setMessage('');
      setInputHeight(minHeight);

      // Clear typing indicator
      if (onTyping) {
        onTyping(false);
      }
    } catch (error) {
      console.error('[MessageInput] Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  }, [message, isSending, disabled, onSendMessage, onTyping, clearTypingTimeout, minHeight]);

  const canSend = message.trim().length > 0 && !isSending && !disabled;
  const showSend = showSendButton && (message.trim().length > 0 || isSending);

  return (
    <View className="flex-row items-end px-3 py-2 bg-white border-t border-gray-200">
      {/* Text Input Container */}
      <View className="flex-1 min-h-[40px] bg-gray-100 rounded-full px-4">
        <TextInput
          ref={inputRef}
          value={message}
          onChangeText={handleChangeText}
          onContentSizeChange={handleContentSizeChange}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={maxLength}
          editable={!disabled && !isSending}
          returnKeyType="default"
          blurOnSubmit={false}
          className="text-base text-gray-900 py-2"
          style={{ height: inputHeight }}
          {...textInputProps}
        />
      </View>

      {/* Send Button */}
      {showSend && (
        <Pressable
          onPress={handleSendPress}
          disabled={!canSend}
          className="ml-2 mb-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View
            className={`w-10 h-10 rounded-full items-center justify-center ${
              canSend ? 'bg-blue-500 active:bg-blue-600' : 'bg-gray-300'
            }`}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={18} color="#FFFFFF" />
            )}
          </View>
        </Pressable>
      )}
    </View>
  );
};

export default MessageInput;
