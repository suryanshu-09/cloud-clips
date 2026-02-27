/**
 * Chat Feature Exports
 * Central export point for all chat and messaging functionality
 */

// Hooks
export { useChat } from './hooks/useChat';
export { useChatList } from './hooks/useChatList';

// Services
export { chatService } from './services/chatService';
export { mockChatService } from './services/mockChatService';

// Types
export type {
  // Attachment types
  AttachmentType,
  IAttachment,

  // Message types
  IMessage,
  IMessageWithSender,
  ISendMessageDTO,
  ISendMessageParams,
  IUpdateMessageDTO,
  IMessageUpdate,

  // Conversation types
  IConversation,
  IConversationWithDetails,
  ICreateConversationDTO,
  ICreateConversationParams,
  IUpdateConversationDTO,
  IConversationUpdate,

  // Chat user types
  IChatUser,
  IChatUserWithStatus,

  // Pagination & Query types
  IChatPaginationParams,
  IChatListParams,
  IGetMessagesParams,
  IPaginatedMessages,
  IPaginatedConversations,

  // Status & real-time types
  ITypingStatus,
  IMessageReadReceipt,

  // Action params
  IMarkAsReadParams,

  // Notification types
  IChatNotification,

  // Legacy aliases (deprecated)
  Message,
  MessageWithSender,
  SendMessageDTO,
  SendMessageParams,
  Conversation,
  ConversationWithDetails,
  CreateConversationDTO,
  CreateConversationParams,
  ChatUser,
  MarkAsReadParams,
  TypingStatus,
  MessageUpdate,
  ConversationUpdate,
} from './types';
