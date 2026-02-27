/**
 * Chat Feature Types
 * Type definitions for real-time chat and messaging
 *
 * Aligned with backend/convex/schema.ts messages and conversations tables
 * Maintains backward compatibility with existing Firebase-based code
 */

// ============================================================================
// Attachment Types
// ============================================================================

export type AttachmentType = 'image' | 'file' | 'voice' | 'location';

export interface IAttachment {
  type: AttachmentType;
  url: string;
  name?: string;
  size?: number;
  mimeType?: string;
  duration?: number; // For voice messages (in seconds)
  width?: number; // For images
  height?: number; // For images
  latitude?: number; // For location
  longitude?: number; // For location
}

// ============================================================================
// Message Types
// ============================================================================

// Reaction type
export interface IReaction {
  emoji: string;
  users: string[];
}

export interface IMessage {
  // Primary identifier (Convex uses _id, Firebase uses id)
  _id: string;
  id: string; // Alias for backward compatibility

  conversationId: string;
  senderId: string;

  // Content
  content: string;
  attachments?: IAttachment[];

  // Reply support
  replyTo?: string; // ID of message being replied to
  replyToMessage?: IMessage; // Enriched reply message

  // Reactions
  reactions?: IReaction[];

  // Legacy fields for Firebase compatibility
  receiverId?: string;
  type?: 'text' | 'image';
  imageUrl?: string;

  // Read status (Convex uses readBy array, Firebase uses read boolean)
  readBy: string[];
  read?: boolean; // Legacy field

  // Message status (legacy)
  status?: 'sending' | 'sent' | 'read' | 'failed';

  // Timestamps
  createdAt: number;
  updatedAt?: number; // Legacy field

  // Enriched sender info
  sender?: {
    name?: string;
    avatar?: string;
  };
}

export interface IMessageWithSender extends IMessage {
  sender: {
    name?: string;
    avatar?: string;
  };
}

// DTO for sending a new message (Convex-aligned)
export interface ISendMessageDTO {
  conversationId: string;
  content: string;
  attachments?: IAttachment[];
}

// Legacy params for backward compatibility
export interface ISendMessageParams {
  conversationId: string;
  content: string;
  type?: 'text' | 'image';
  imageUrl?: string;
  attachments?: IAttachment[];
}

// DTO for updating a message
export interface IUpdateMessageDTO {
  content?: string;
  attachments?: IAttachment[];
}

// ============================================================================
// Conversation Types
// ============================================================================

export interface IConversation {
  // Primary identifier (Convex uses _id, Firebase uses id)
  _id: string;
  id: string; // Alias for backward compatibility

  // Participants - can be array of IDs or object with user info (legacy support)
  participants:
    | string[]
    | {
        clientName?: string;
        clientAvatar?: string;
        barberName?: string;
        barberAvatar?: string;
      };

  // Optional appointment reference
  appointmentId?: string;

  // Legacy fields for Firebase compatibility
  clientId?: string;
  barberId?: string;
  clientName?: string;
  barberName?: string;
  clientAvatar?: string;
  barberAvatar?: string;

  // Last message info - can be string (content) or object (legacy)
  lastMessage?:
    | string
    | {
        id: string;
        conversationId: string;
        senderId: string;
        receiverId?: string;
        content: string;
        type?: 'text' | 'image';
        imageUrl?: string;
        createdAt: number;
        updatedAt?: number;
        read?: boolean;
        status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
      };
  lastMessageAt?: number;
  lastMessageSenderId?: string;

  // Unread counts
  unreadCounts?: Record<string, number>;
  unreadCount?: number; // Legacy field (total count)

  // Timestamps
  createdAt: number;
  updatedAt: number;
}

// Enriched conversation with participant info and unread count
export interface IConversationWithDetails extends IConversation {
  otherParticipant: {
    name?: string;
    avatar?: string;
    role?: 'client' | 'barber' | 'admin';
  };
  unreadCount: number;
}

// DTO for creating a new conversation (Convex-aligned)
export interface ICreateConversationDTO {
  participantId: string;
  appointmentId?: string;
  initialMessage?: string;
}

// Legacy params for backward compatibility
export interface ICreateConversationParams {
  participantId?: string;
  appointmentId?: string;
  initialMessage?: string;
  clientId?: string;
  barberId?: string;
}

// DTO for updating a conversation
export interface IUpdateConversationDTO {
  lastMessage?: string;
  lastMessageAt?: number;
  lastMessageSenderId?: string;
  unreadCounts?: Record<string, number>;
}

// ============================================================================
// Chat User Types
// ============================================================================

export interface IChatUser {
  _id: string;
  id: string; // Alias for backward compatibility
  name?: string;
  avatar?: string;
  role: 'client' | 'barber' | 'admin';
  isActive: boolean;
}

export interface IChatUserWithStatus extends IChatUser {
  online: boolean;
  lastSeen?: number;
}

// ============================================================================
// Pagination & Query Types
// ============================================================================

export interface IChatPaginationParams {
  cursor?: string;
  limit?: number;
}

export interface IChatListParams {
  cursor?: string;
  limit?: number;
}

export interface IGetMessagesParams extends IChatPaginationParams {
  conversationId: string;
}

export interface IPaginatedMessages {
  messages: IMessageWithSender[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface IPaginatedConversations {
  conversations: IConversationWithDetails[];
  nextCursor?: string;
  hasMore: boolean;
}

// ============================================================================
// Real-time Status Types
// ============================================================================

export interface ITypingStatus {
  userId: string;
  conversationId: string;
  isTyping: boolean;
}

export interface IMessageReadReceipt {
  messageId: string;
  userId: string;
  readAt: number;
}

// Update types for real-time subscriptions
export interface IMessageUpdate {
  type: 'added' | 'modified' | 'removed';
  message: IMessage;
}

export interface IConversationUpdate {
  type: 'added' | 'modified' | 'removed';
  conversation: IConversation;
}

// ============================================================================
// Action Params Types
// ============================================================================

export interface IMarkAsReadParams {
  conversationId: string;
  userId?: string; // Optional for Convex, required for Firebase
}

// ============================================================================
// Notification Types
// ============================================================================

export interface IChatNotification {
  conversationId: string;
  messageId: string;
  senderId: string;
  senderName?: string;
  content: string;
  createdAt: number;
}

// ============================================================================
// Legacy type aliases for backward compatibility
// ============================================================================

/** @deprecated Use IMessage instead */
export type Message = IMessage;

/** @deprecated Use IMessageWithSender instead */
export type MessageWithSender = IMessageWithSender;

/** @deprecated Use ISendMessageDTO instead */
export type SendMessageDTO = ISendMessageDTO;

/** @deprecated Use ISendMessageParams instead */
export type SendMessageParams = ISendMessageParams;

/** @deprecated Use IConversation instead */
export type Conversation = IConversation;

/** @deprecated Use IConversationWithDetails instead */
export type ConversationWithDetails = IConversationWithDetails;

/** @deprecated Use ICreateConversationDTO instead */
export type CreateConversationDTO = ICreateConversationDTO;

/** @deprecated Use ICreateConversationParams instead */
export type CreateConversationParams = ICreateConversationParams;

/** @deprecated Use IChatUser instead */
export type ChatUser = IChatUser;

/** @deprecated Use IMarkAsReadParams instead */
export type MarkAsReadParams = IMarkAsReadParams;

/** @deprecated Use ITypingStatus instead */
export type TypingStatus = ITypingStatus;

/** @deprecated Use IMessageUpdate instead */
export type MessageUpdate = IMessageUpdate;

/** @deprecated Use IConversationUpdate instead */
export type ConversationUpdate = IConversationUpdate;
