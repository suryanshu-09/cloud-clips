// Chat feature exports

// Hooks
export { useChat } from './hooks/useChat';
export { useChatList } from './hooks/useChatList';

// Services
export { chatService } from './services/chatService';
export { mockChatService } from './services/mockChatService';

// Types
export type {
  IMessage,
  IConversation,
  IChatUser,
  ISendMessageParams,
  ICreateConversationParams,
  IMarkAsReadParams,
  ITypingStatus,
  IChatListParams,
  IMessageUpdate,
  IConversationUpdate,
} from './types';
