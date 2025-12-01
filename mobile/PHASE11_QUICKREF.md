# Phase 11 Quick Reference - Chat Feature

## Quick Start

### Using Chat in Your App

```typescript
import { useChat, useChatList } from '@/features/chat';

// In a screen component
const userId = 'user-123';
const conversationId = 'conv-456';

// Get chat messages
const { messages, sendMessage, isLoading } = useChat(conversationId, userId);

// Get conversation list
const { conversations, totalUnreadCount } = useChatList(userId, 'client');

// Send a message
await sendMessage('Hello!');
```

## Core Components

### MessageBubble
Displays a chat message with appropriate styling.

```tsx
<MessageBubble
  message={message}
  isCurrentUser={message.senderId === currentUserId}
  onImagePress={(url) => console.log('Image:', url)}
/>
```

### ChatInput
Input field for composing messages.

```tsx
<ChatInput
  onSendMessage={(text) => sendMessage(text)}
  onTyping={(typing) => setIsTyping(typing)}
  onImagePress={() => pickImage()}
  placeholder="Type a message..."
/>
```

### ChatHeader
Header with user info and status.

```tsx
<ChatHeader
  user={{
    id: '123',
    name: 'John Doe',
    avatar: 'https://...',
    online: true,
  }}
  onBackPress={() => router.back()}
  isTyping={otherUserTyping}
/>
```

## Custom Hooks

### useChat
Manages messages in a conversation.

**Parameters:**
- `conversationId: string` - The conversation ID
- `currentUserId: string` - Current user's ID
- `messageLimit?: number` - Max messages to load (default: 50)

**Returns:**
```typescript
{
  messages: IMessage[]           // Array of messages
  sendMessage: (content) => void // Send a message
  isLoading: boolean             // Loading state
  error: Error | null            // Error state
  isTyping: boolean              // Current user typing
  otherUserTyping: boolean       // Other user typing
  setIsTyping: (typing) => void  // Set typing status
  markAsRead: () => void         // Mark messages as read
  refreshMessages: () => void    // Refresh messages
}
```

### useChatList
Manages list of conversations.

**Parameters:**
- `userId: string` - Current user's ID
- `userType: 'client' | 'barber'` - User type

**Returns:**
```typescript
{
  conversations: IConversation[]        // Array of conversations
  createConversation: (params) => void  // Create conversation
  getOrCreateConversation: (...) => void // Get or create
  deleteConversation: (id) => void      // Delete conversation
  isLoading: boolean                    // Loading state
  error: Error | null                   // Error state
  refreshConversations: () => void      // Refresh list
  totalUnreadCount: number              // Total unread count
}
```

## Service Methods

### chatService

```typescript
import { chatService } from '@/features/chat';

// Create conversation
const conversationId = await chatService.createConversation({
  appointmentId: '123',
  clientId: 'user-1',
  barberId: 'user-2',
});

// Send message
const messageId = await chatService.sendMessage(
  {
    conversationId: 'conv-1',
    content: 'Hello!',
    type: 'text',
  },
  currentUserId
);

// Subscribe to messages (real-time)
const unsubscribe = chatService.subscribeToMessages(
  conversationId,
  50, // limit
  (update) => {
    console.log('New message:', update.message);
  }
);

// Unsubscribe when done
unsubscribe();

// Mark as read
await chatService.markAsRead({
  conversationId: 'conv-1',
  userId: currentUserId,
});

// Set typing status
await chatService.setTypingStatus(conversationId, userId, true);
```

## Type Definitions

### IMessage
```typescript
interface IMessage {
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
```

### IConversation
```typescript
interface IConversation {
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
```

### IChatUser
```typescript
interface IChatUser {
  id: string;
  name: string;
  avatar: string | null;
  online: boolean;
  lastSeen?: number;
}
```

## Firebase Database Structure

```
/conversations/{conversationId}
  - id: string
  - appointmentId: string
  - clientId: string
  - barberId: string
  - lastMessage: object
  - lastMessageAt: number
  - unreadCount: number
  - createdAt: number
  - updatedAt: number

/messages/{conversationId}/{messageId}
  - id: string
  - conversationId: string
  - senderId: string
  - receiverId: string
  - content: string
  - type: string
  - createdAt: number
  - read: boolean
  - status: string

/typing/{conversationId}/{userId}
  - userId: string
  - isTyping: boolean
  - timestamp: number

/userConversations/{userId}/{conversationId}
  - true (boolean flag)
```

## Screen Navigation

### Navigate to Chat List
```typescript
router.push('/(client)/chat');
```

### Navigate to Conversation
```typescript
router.push(`/(client)/chat/${appointmentId}`);
```

## Common Patterns

### Creating a conversation from appointment
```typescript
const { getOrCreateConversation } = useChatList(userId, 'client');

const conversationId = await getOrCreateConversation(appointmentId, {
  appointmentId,
  clientId: userId,
  barberId: appointment.barberId,
});

// Navigate to conversation
router.push(`/(client)/chat/${appointmentId}`);
```

### Displaying unread count badge
```typescript
const { totalUnreadCount } = useChatList(userId, 'client');

{totalUnreadCount > 0 && (
  <Badge variant="primary">
    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
  </Badge>
)}
```

### Handling message failures
```typescript
const { sendMessage, messages } = useChat(conversationId, userId);

try {
  await sendMessage(text);
} catch (error) {
  // Failed messages are automatically marked with 'failed' status
  Alert.alert('Error', 'Failed to send message');
}

// Show retry option for failed messages
const failedMessages = messages.filter(m => m.status === 'failed');
```

## Troubleshooting

### Messages not appearing
1. Check Firebase configuration in `.env`
2. Verify Firebase Realtime Database is enabled
3. Check Firebase security rules
4. Ensure conversationId is valid

### Typing indicator not working
1. Verify `setIsTyping` is called when typing
2. Check Firebase connection
3. Ensure proper debouncing (2 seconds default)

### Read receipts not updating
1. Call `markAsRead()` when viewing conversation
2. Check Firebase database rules
3. Verify userId matches message receiverId

## Best Practices

1. **Always unsubscribe** from real-time listeners when component unmounts
2. **Handle offline state** gracefully with optimistic updates
3. **Limit message count** to prevent performance issues (default: 50)
4. **Implement retry logic** for failed messages
5. **Use debouncing** for typing indicators (default: 2 seconds)
6. **Mark messages as read** when conversation is viewed
7. **Show loading states** during async operations
8. **Handle errors** with user-friendly messages

## Files Reference

### Feature Files
- `src/features/chat/types.ts` - Type definitions
- `src/features/chat/hooks/useChat.ts` - Message management
- `src/features/chat/hooks/useChatList.ts` - Conversation list
- `src/features/chat/services/chatService.ts` - Firebase integration
- `src/features/chat/index.ts` - Exports

### Components
- `src/components/chat/MessageBubble.tsx` - Message display
- `src/components/chat/ChatInput.tsx` - Message input
- `src/components/chat/ChatHeader.tsx` - Chat header

### Screens
- `src/app/(client)/chat/index.tsx` - Conversation list
- `src/app/(client)/chat/[appointmentId].tsx` - Chat interface

### Services
- `src/services/firebase/database.ts` - Firebase Realtime Database setup

---

**Quick Reference Version:** 1.0
**Last Updated:** December 1, 2025
