import {
  IMessage,
  IConversation,
  ISendMessageParams,
  ICreateConversationParams,
  IMarkAsReadParams,
  IMessageUpdate,
  IConversationUpdate,
  ITypingStatus,
} from '../types';

/**
 * Mock Chat Service
 *
 * Provides mock chat functionality for development without Firebase.
 * Simulates real-time messaging with in-memory data storage.
 */

console.log('[MOCK CHAT SERVICE] Module loaded');

// Mock data storage
const mockConversations: IConversation[] = [
  {
    id: 'conv-1',
    appointmentId: 'appointment-1',
    clientId: 'client-1',
    barberId: 'barber-1',
    participants: {
      clientName: 'John Doe',
      clientAvatar: 'https://i.pravatar.cc/150?img=1',
      barberName: "Mike's Barber Shop",
      barberAvatar: 'https://i.pravatar.cc/150?img=3',
    },
    lastMessage: {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'barber-1',
      receiverId: 'client-1',
      content: 'Looking forward to your appointment tomorrow!',
      type: 'text',
      createdAt: Date.now() - 3600000, // 1 hour ago
      updatedAt: Date.now() - 3600000,
      read: false,
      status: 'delivered',
    },
    lastMessageAt: Date.now() - 3600000,
    unreadCount: 2,
    createdAt: Date.now() - 86400000, // 1 day ago
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'conv-2',
    appointmentId: 'appointment-2',
    clientId: 'client-1',
    barberId: 'barber-2',
    participants: {
      clientName: 'John Doe',
      clientAvatar: 'https://i.pravatar.cc/150?img=1',
      barberName: "Sarah's Style Studio",
      barberAvatar: 'https://i.pravatar.cc/150?img=5',
    },
    lastMessage: {
      id: 'msg-2',
      conversationId: 'conv-2',
      senderId: 'client-1',
      receiverId: 'barber-2',
      content: 'Thanks for the great cut!',
      type: 'text',
      createdAt: Date.now() - 7200000, // 2 hours ago
      updatedAt: Date.now() - 7200000,
      read: true,
      status: 'read',
    },
    lastMessageAt: Date.now() - 7200000,
    unreadCount: 0,
    createdAt: Date.now() - 172800000, // 2 days ago
    updatedAt: Date.now() - 7200000,
  },
];

const mockMessages: Record<string, IMessage[]> = {
  'conv-1': [
    {
      id: 'msg-1-1',
      conversationId: 'conv-1',
      senderId: 'client-1',
      receiverId: 'barber-1',
      content: 'Hi! I have an appointment tomorrow at 2 PM',
      type: 'text',
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000,
      read: true,
      status: 'read',
    },
    {
      id: 'msg-1-2',
      conversationId: 'conv-1',
      senderId: 'barber-1',
      receiverId: 'client-1',
      content: 'Yes! I see your appointment. Looking forward to it!',
      type: 'text',
      createdAt: Date.now() - 82800000,
      updatedAt: Date.now() - 82800000,
      read: true,
      status: 'read',
    },
    {
      id: 'msg-1-3',
      conversationId: 'conv-1',
      senderId: 'barber-1',
      receiverId: 'client-1',
      content: 'Looking forward to your appointment tomorrow!',
      type: 'text',
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 3600000,
      read: false,
      status: 'delivered',
    },
  ],
  'conv-2': [
    {
      id: 'msg-2-1',
      conversationId: 'conv-2',
      senderId: 'client-1',
      receiverId: 'barber-2',
      content: 'Thanks for the great cut!',
      type: 'text',
      createdAt: Date.now() - 7200000,
      updatedAt: Date.now() - 7200000,
      read: true,
      status: 'read',
    },
    {
      id: 'msg-2-2',
      conversationId: 'conv-2',
      senderId: 'barber-2',
      receiverId: 'client-1',
      content: "You're welcome! Come back anytime!",
      type: 'text',
      createdAt: Date.now() - 7000000,
      updatedAt: Date.now() - 7000000,
      read: true,
      status: 'read',
    },
  ],
};

// Listeners for real-time updates
const conversationListeners = new Map<string, (update: IConversationUpdate) => void>();
const messageListeners = new Map<string, (update: IMessageUpdate) => void>();

class MockChatService {
  /**
   * Simulate network delay
   */
  private async delay(ms: number = 300): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generate a unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a new conversation
   */
  async createConversation(params: ICreateConversationParams): Promise<string> {
    console.log('[MOCK] Creating conversation:', params);
    await this.delay(500);

    const conversationId = this.generateId('conv');
    const now = Date.now();

    const conversation: IConversation = {
      id: conversationId,
      appointmentId: params.appointmentId,
      clientId: params.clientId,
      barberId: params.barberId,
      participants: {
        clientName: 'Mock Client',
        clientAvatar: 'https://i.pravatar.cc/150?img=1',
        barberName: 'Mock Barber',
        barberAvatar: 'https://i.pravatar.cc/150?img=3',
      },
      lastMessage: null,
      lastMessageAt: now,
      unreadCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    mockConversations.push(conversation);
    mockMessages[conversationId] = [];

    // Notify listeners
    this.notifyConversationListeners({
      type: 'added',
      conversation,
    });

    return conversationId;
  }

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string): Promise<IConversation | null> {
    await this.delay(200);
    return mockConversations.find((conv) => conv.id === conversationId) || null;
  }

  /**
   * Get conversation by appointment ID
   */
  async getConversationByAppointment(appointmentId: string): Promise<IConversation | null> {
    await this.delay(200);
    return mockConversations.find((conv) => conv.appointmentId === appointmentId) || null;
  }

  /**
   * Send a message
   */
  async sendMessage(params: ISendMessageParams, senderId: string): Promise<string> {
    console.log('[MOCK] Sending message:', params);
    await this.delay(300);

    const conversation = await this.getConversation(params.conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const messageId = this.generateId('msg');
    const now = Date.now();
    const receiverId =
      conversation.clientId === senderId ? conversation.barberId : conversation.clientId;

    const message: IMessage = {
      id: messageId,
      conversationId: params.conversationId,
      senderId,
      receiverId,
      content: params.content,
      type: params.type || 'text',
      imageUrl: params.imageUrl,
      createdAt: now,
      updatedAt: now,
      read: false,
      status: 'sent',
    };

    // Add to messages
    if (!mockMessages[params.conversationId]) {
      mockMessages[params.conversationId] = [];
    }
    mockMessages[params.conversationId].push(message);

    // Update conversation
    const conversationIndex = mockConversations.findIndex(
      (conv) => conv.id === params.conversationId
    );
    if (conversationIndex !== -1) {
      mockConversations[conversationIndex] = {
        ...mockConversations[conversationIndex],
        lastMessage: message,
        lastMessageAt: now,
        updatedAt: now,
        unreadCount: mockConversations[conversationIndex].unreadCount + 1,
      };

      // Notify conversation listeners
      this.notifyConversationListeners({
        type: 'modified',
        conversation: mockConversations[conversationIndex],
      });
    }

    // Notify message listeners
    this.notifyMessageListeners(params.conversationId, {
      type: 'added',
      message,
    });

    // Simulate message delivery after 1 second
    setTimeout(() => {
      message.status = 'delivered';
      this.notifyMessageListeners(params.conversationId, {
        type: 'modified',
        message,
      });
    }, 1000);

    return messageId;
  }

  /**
   * Listen to messages in a conversation
   */
  subscribeToMessages(
    conversationId: string,
    limit: number = 50,
    onUpdate: (update: IMessageUpdate) => void
  ): () => void {
    console.log('[MOCK] Subscribing to messages:', conversationId);

    // Send initial messages
    const messages = mockMessages[conversationId] || [];
    messages.slice(-limit).forEach((message) => {
      onUpdate({
        type: 'added',
        message,
      });
    });

    // Register listener
    const listenerId = this.generateId('listener');
    messageListeners.set(listenerId, onUpdate);

    // Return unsubscribe function
    return () => {
      messageListeners.delete(listenerId);
    };
  }

  /**
   * Listen to user's conversations
   */
  subscribeToConversations(
    userId: string,
    onUpdate: (update: IConversationUpdate) => void
  ): () => void {
    console.log('[MOCK] Subscribing to conversations for user:', userId);
    console.log('[MOCK] Available conversations:', mockConversations.length);

    // Send initial conversations
    const userConversations = mockConversations.filter(
      (conv) => conv.clientId === userId || conv.barberId === userId
    );

    console.log('[MOCK] User conversations found:', userConversations.length);

    // Send updates asynchronously to simulate real behavior
    setTimeout(() => {
      userConversations.forEach((conversation) => {
        console.log('[MOCK] Sending conversation update:', conversation.id);
        onUpdate({
          type: 'added',
          conversation,
        });
      });
    }, 100);

    // Register listener
    const listenerId = this.generateId('listener');
    conversationListeners.set(listenerId, onUpdate);

    // Return unsubscribe function
    return () => {
      conversationListeners.delete(listenerId);
    };
  }

  /**
   * Mark messages as read
   */
  async markAsRead(params: IMarkAsReadParams): Promise<void> {
    console.log('[MOCK] Marking messages as read:', params);
    await this.delay(200);

    const messages = mockMessages[params.conversationId] || [];
    messages.forEach((message) => {
      if (!message.read && message.receiverId === params.userId) {
        message.read = true;
        message.status = 'read';
      }
    });

    // Update conversation unread count
    const conversationIndex = mockConversations.findIndex(
      (conv) => conv.id === params.conversationId
    );
    if (conversationIndex !== -1) {
      mockConversations[conversationIndex].unreadCount = 0;

      this.notifyConversationListeners({
        type: 'modified',
        conversation: mockConversations[conversationIndex],
      });
    }
  }

  /**
   * Set typing status
   */
  async setTypingStatus(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    // Mock typing status - no-op for now
    console.log('[MOCK] Typing status:', { conversationId, userId, isTyping });
  }

  /**
   * Listen to typing status
   */
  subscribeToTypingStatus(
    conversationId: string,
    onUpdate: (status: ITypingStatus) => void
  ): () => void {
    // Mock typing status - no-op for now
    return () => {};
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    console.log('[MOCK] Deleting conversation:', conversationId);
    await this.delay(300);

    const index = mockConversations.findIndex((conv) => conv.id === conversationId);
    if (index !== -1) {
      const conversation = mockConversations[index];
      mockConversations.splice(index, 1);

      this.notifyConversationListeners({
        type: 'removed',
        conversation,
      });
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, limit: number = 50): Promise<IMessage[]> {
    await this.delay(200);
    const messages = mockMessages[conversationId] || [];
    return messages.slice(-limit);
  }

  /**
   * Notify all message listeners
   */
  private notifyMessageListeners(conversationId: string, update: IMessageUpdate): void {
    messageListeners.forEach((listener) => {
      if (update.message.conversationId === conversationId) {
        listener(update);
      }
    });
  }

  /**
   * Notify all conversation listeners
   */
  private notifyConversationListeners(update: IConversationUpdate): void {
    conversationListeners.forEach((listener) => {
      listener(update);
    });
  }
}

// Export singleton instance
export const mockChatService = new MockChatService();

console.log(
  '[MOCK CHAT SERVICE] Service instantiated with',
  mockConversations.length,
  'conversations'
);

export default mockChatService;
