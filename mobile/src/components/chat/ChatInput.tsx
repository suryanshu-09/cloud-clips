import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';

import { Text } from 'react-native';

/**
 * ChatInput Component
 *
 * Comprehensive input field for composing and sending chat messages with full attachment support.
 *
 * Features:
 * - Text input with multi-line support and auto-growing height
 * - Send button with loading state
 * - Multiple attachment types: image, camera, file, voice
 * - Image attachment with preview and remove option
 * - Voice message recording with visual feedback
 * - Camera capture support
 * - File/document picker
 * - Attachment picker menu
 * - Typing indicator callback
 * - Auto-growing input
 * - Disabled state
 * - Reply preview
 * - Maximum length validation
 *
 * @example
 * ```tsx
 * <ChatInput
 *   onSendMessage={(text, attachments) => sendMessage(text, attachments)}
 *   onTyping={(isTyping) => setIsTyping(isTyping)}
 *   onRecordingStart={() => console.log('Recording started')}
 *   onRecordingStop={(uri) => sendVoiceMessage(uri)}
 *   replyToMessage={replyMessage}
 *   onCancelReply={() => setReplyMessage(null)}
 *   placeholder="Type a message..."
 * />
 * ```
 */

// Attachment type definition
export type AttachmentType = 'image' | 'file' | 'voice' | 'camera';

export interface IAttachment {
  type: AttachmentType;
  uri: string;
  name?: string;
  size?: number;
  mimeType?: string;
  duration?: number; // For voice messages
  width?: number; // For images
  height?: number; // For images
}

// Reply message type
interface IReplyMessage {
  id: string;
  content: string;
  senderName: string;
  senderId: string;
}

interface IChatInputProps {
  onSendMessage: (content: string, attachments?: IAttachment[]) => Promise<void>;
  onTyping?: (isTyping: boolean) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: (attachment: IAttachment) => Promise<void>;
  onImagePress?: () => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  showImageButton?: boolean;
  showCameraButton?: boolean;
  showFileButton?: boolean;
  showVoiceButton?: boolean;
  replyToMessage?: IReplyMessage | null;
  onCancelReply?: () => void;
}

// Recording timer component
const RecordingTimer: React.FC<{ duration: number }> = ({ duration }) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View className="flex-row items-center">
      <View className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse" />
      <Text className="text-red-500 font-medium">{formatTime(duration)}</Text>
    </View>
  );
};

// Reply preview component
const ReplyPreview: React.FC<{ message: IReplyMessage; onCancel: () => void }> = ({
  message,
  onCancel,
}) => {
  return (
    <View className="flex-row items-center px-4 py-2 bg-gray-50 border-b border-gray-200">
      <View className="flex-1 border-l-4 border-blue-500 pl-3">
        <Text className="text-sm font-medium text-blue-600">{message.senderName}</Text>
        <Text className="text-sm text-gray-600" numberOfLines={1}>
          {message.content}
        </Text>
      </View>
      <Pressable onPress={onCancel} className="p-2">
        <Ionicons name="close" size={20} color="#6B7280" />
      </Pressable>
    </View>
  );
};

// Attachment picker menu
interface IAttachmentPickerMenuProps {
  isVisible: boolean;
  onClose: () => void;
  onCameraPress: () => void;
  onGalleryPress: () => void;
  onFilePress: () => void;
  showCamera?: boolean;
  showGallery?: boolean;
  showFile?: boolean;
}

const AttachmentPickerMenu: React.FC<IAttachmentPickerMenuProps> = ({
  isVisible,
  onClose,
  onCameraPress,
  onGalleryPress,
  onFilePress,
  showCamera = true,
  showGallery = true,
  showFile = true,
}) => {
  if (!isVisible) return null;

  return (
    <>
      <Pressable className="absolute inset-0 bg-black/50" onPress={onClose} />
      <View className="absolute bottom-20 left-4 right-4 bg-white rounded-2xl shadow-lg overflow-hidden">
        {showCamera && (
          <Pressable
            onPress={() => {
              onCameraPress();
              onClose();
            }}
            className="flex-row items-center px-4 py-4 border-b border-gray-100 active:bg-gray-50"
          >
            <View className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center mr-3">
              <Ionicons name="camera" size={22} color="#9333EA" />
            </View>
            <Text className="text-base text-gray-900">Camera</Text>
          </Pressable>
        )}
        {showGallery && (
          <Pressable
            onPress={() => {
              onGalleryPress();
              onClose();
            }}
            className="flex-row items-center px-4 py-4 border-b border-gray-100 active:bg-gray-50"
          >
            <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
              <Ionicons name="images" size={22} color="#2563EB" />
            </View>
            <Text className="text-base text-gray-900">Photo & Video Library</Text>
          </Pressable>
        )}
        {showFile && (
          <Pressable
            onPress={() => {
              onFilePress();
              onClose();
            }}
            className="flex-row items-center px-4 py-4 active:bg-gray-50"
          >
            <View className="w-10 h-10 rounded-full bg-orange-100 items-center justify-center mr-3">
              <Ionicons name="document" size={22} color="#EA580C" />
            </View>
            <Text className="text-base text-gray-900">Document</Text>
          </Pressable>
        )}
      </View>
    </>
  );
};

export const ChatInput: React.FC<IChatInputProps> = ({
  onSendMessage,
  onTyping,
  onRecordingStart,
  onRecordingStop,
  onImagePress,
  placeholder = 'Type a message...',
  disabled = false,
  maxLength = 1000,
  showImageButton = true,
  showCameraButton = true,
  showFileButton = true,
  showVoiceButton = true,
  replyToMessage,
  onCancelReply,
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [selectedAttachments, setSelectedAttachments] = useState<IAttachment[]>([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

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
    const hasText = message.trim().length > 0;
    const hasAttachments = selectedAttachments.length > 0;

    if ((!hasText && !hasAttachments) || isSending || disabled) {
      return;
    }

    try {
      setIsSending(true);

      // Send message with optional attachments
      await onSendMessage(message.trim(), hasAttachments ? selectedAttachments : undefined);

      // Clear input and attachments
      setMessage('');
      setSelectedAttachments([]);

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
  }, [message, selectedAttachments, isSending, disabled, onSendMessage, onTyping, typingTimeout]);

  /**
   * Handle camera capture
   */
  const handleCameraPress = useCallback(async () => {
    if (disabled) return;

    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your camera to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const attachment: IAttachment = {
        type: 'camera',
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        mimeType: asset.mimeType,
      };
      setSelectedAttachments((prev) => [...prev, attachment]);
    }
  }, [disabled]);

  /**
   * Handle image picker
   */
  const handleImagePress = useCallback(async () => {
    if (disabled) return;

    // If a custom handler is provided, use it instead
    if (onImagePress) {
      onImagePress();
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to attach images.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const attachment: IAttachment = {
        type: 'image',
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        mimeType: asset.mimeType,
      };
      setSelectedAttachments((prev) => [...prev, attachment]);
    }
  }, [onImagePress, disabled]);

  /**
   * Handle file picker
   */
  const handleFilePress = useCallback(async () => {
    if (disabled) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const attachment: IAttachment = {
          type: 'file',
          uri: asset.uri,
          name: asset.name,
          size: asset.size,
          mimeType: asset.mimeType,
        };
        setSelectedAttachments((prev) => [...prev, attachment]);
      }
    } catch (error) {
      console.error('[ChatInput] Error picking file:', error);
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    }
  }, [disabled]);

  /**
   * Start voice recording
   */
  const startRecording = useCallback(async () => {
    if (disabled) return;

    try {
      const { status } = await Audio.requestPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow microphone access to record voice messages.'
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      onRecordingStart?.();
    } catch (error) {
      console.error('[ChatInput] Error starting recording:', error);
    }
  }, [disabled, onRecordingStart]);

  /**
   * Stop voice recording
   */
  const stopRecording = useCallback(async () => {
    if (!recording) return;

    try {
      // Stop timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        const attachment: IAttachment = {
          type: 'voice',
          uri,
          duration: recordingDuration,
        };

        if (onRecordingStop) {
          await onRecordingStop(attachment);
        } else {
          // Add to attachments for regular send
          setSelectedAttachments((prev) => [...prev, attachment]);
        }
      }

      setRecording(null);
      setIsRecording(false);
      setRecordingDuration(0);
    } catch (error) {
      console.error('[ChatInput] Error stopping recording:', error);
    }
  }, [recording, recordingDuration, onRecordingStop]);

  /**
   * Remove an attachment
   */
  const handleRemoveAttachment = useCallback((index: number) => {
    setSelectedAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const canSend =
    (message.trim().length > 0 || selectedAttachments.length > 0) && !isSending && !disabled;
  const showSendButton =
    !isRecording && (message.trim().length > 0 || selectedAttachments.length > 0);

  return (
    <View className="bg-white">
      {/* Reply Preview */}
      {replyToMessage && onCancelReply && (
        <ReplyPreview message={replyToMessage} onCancel={onCancelReply} />
      )}

      {/* Selected Attachments Preview */}
      {selectedAttachments.length > 0 && (
        <View className="flex-row flex-wrap px-4 pt-3 pb-2">
          {selectedAttachments.map((attachment, index) => (
            <View key={index} className="relative mr-2 mb-2">
              {attachment.type === 'image' || attachment.type === 'camera' ? (
                <View className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    source={{ uri: attachment.uri }}
                    style={{ width: 80, height: 80 }}
                    contentFit="cover"
                  />
                </View>
              ) : attachment.type === 'file' ? (
                <View className="w-20 h-20 rounded-lg bg-gray-100 items-center justify-center p-2">
                  <Ionicons name="document" size={24} color="#6B7280" />
                  <Text className="text-xs text-gray-600 mt-1" numberOfLines={1}>
                    {attachment.name || 'File'}
                  </Text>
                </View>
              ) : (
                <View className="w-20 h-20 rounded-lg bg-red-50 items-center justify-center">
                  <Ionicons name="mic" size={24} color="#EF4444" />
                  <Text className="text-xs text-red-600 mt-1">
                    {Math.floor((attachment.duration || 0) / 60)}:
                    {((attachment.duration || 0) % 60).toString().padStart(2, '0')}
                  </Text>
                </View>
              )}
              <Pressable
                onPress={() => handleRemoveAttachment(index)}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-800 items-center justify-center"
              >
                <Ionicons name="close" size={12} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <View className="flex-row items-center justify-center px-4 py-3 bg-red-50">
          <RecordingTimer duration={recordingDuration} />
          <Text className="text-gray-600 ml-2">Slide to cancel</Text>
        </View>
      )}

      {/* Input Row */}
      <View className="flex-row items-end px-4 py-3">
        {/* Attachment Button */}
        {!isRecording && (
          <Pressable
            onPress={() => setShowAttachmentMenu(true)}
            disabled={disabled}
            className="mb-2 mr-2"
          >
            <View className={`p-2 ${disabled ? 'opacity-50' : ''}`}>
              <Ionicons name="add-circle" size={28} color="#6B7280" />
            </View>
          </Pressable>
        )}

        {/* Text Input or Recording Button */}
        {!isRecording ? (
          <View className="flex-1 min-h-[40px] max-h-[120px] px-4 py-2 bg-gray-100 rounded-full">
            <TextInput
              ref={inputRef}
              value={message}
              onChangeText={handleChangeText}
              placeholder={placeholder}
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={maxLength}
              editable={!disabled && !isSending}
              className="text-base text-gray-900"
              style={{ minHeight: 24 }}
            />
          </View>
        ) : (
          <View className="flex-1 h-10 bg-gray-100 rounded-full items-center justify-center">
            <Text className="text-gray-500">Recording...</Text>
          </View>
        )}

        {/* Voice/Send Button */}
        {showVoiceButton && !showSendButton && !isRecording ? (
          <Pressable onPress={startRecording} disabled={disabled} className="ml-2 mb-2">
            <View className={`p-2 ${disabled ? 'opacity-50' : ''}`}>
              <Ionicons name="mic" size={24} color="#6B7280" />
            </View>
          </Pressable>
        ) : isRecording ? (
          <Pressable onPress={stopRecording} className="ml-2 mb-2">
            <View className="w-10 h-10 rounded-full bg-red-500 items-center justify-center">
              <Ionicons name="stop" size={20} color="#FFFFFF" />
            </View>
          </Pressable>
        ) : (
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
        )}
      </View>

      {/* Attachment Picker Menu */}
      <AttachmentPickerMenu
        isVisible={showAttachmentMenu}
        onClose={() => setShowAttachmentMenu(false)}
        onCameraPress={handleCameraPress}
        onGalleryPress={handleImagePress}
        onFilePress={handleFilePress}
        showCamera={showCameraButton}
        showGallery={showImageButton}
        showFile={showFileButton}
      />
    </View>
  );
};

export default ChatInput;
