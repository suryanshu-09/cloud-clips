// Chat feature types and interfaces

export interface IMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'system';
  imageUrl?: string;
  createdAt: number;
  updatedAt: number;
  read: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface IConversation {
  id: string;
  appointmentId: string;
  clientId: string;
  barberId: string;
  lastMessage: IMessage | null;
  lastMessageAt: number;
  unreadCount: number;
  createdAt: number;
  updatedAt: number;
  participants: {
    clientName: string;
    clientAvatar: string | null;
    barberName: string;
    barberAvatar: string | null;
  };
}

export interface IChatUser {
  id: string;
  name: string;
  avatar: string | null;
  online: boolean;
  lastSeen?: number;
}

export interface ISendMessageParams {
  conversationId: string;
  content: string;
  type?: 'text' | 'image';
  imageUrl?: string;
}

export interface ICreateConversationParams {
  appointmentId: string;
  clientId: string;
  barberId: string;
}

export interface ITypingStatus {
  userId: string;
  conversationId: string;
  isTyping: boolean;
}

export interface IChatListParams {
  userId: string;
  userType: 'client' | 'barber';
}

export interface IMarkAsReadParams {
  conversationId: string;
  userId: string;
}

// Real-time update types
export interface IMessageUpdate {
  type: 'added' | 'modified' | 'removed';
  message: IMessage;
}

export interface IConversationUpdate {
  type: 'added' | 'modified' | 'removed';
  conversation: IConversation;
}
