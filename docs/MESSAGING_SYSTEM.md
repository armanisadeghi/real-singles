# RealSingles Messaging System

Internal documentation for the real-time messaging system.

## Overview

The messaging system enables direct and group chats between users using Supabase Realtime for instant message delivery, typing indicators, and online presence.

## Architecture

```
Client (Web/Mobile)
    ↓
React Hooks (useChat, useMessages, useTypingIndicator)
    ↓
MessagingService (singleton, manages Supabase channels)
    ↓
Supabase Realtime Channels
    - Broadcast events (immediate)
    - Postgres changes (reliable)
    - Presence (typing/online)
    ↓
PostgreSQL (messages, conversations, participants)
```

## File Locations

### Web

| File | Purpose |
|------|---------|
| `web/src/lib/supabase/messaging.ts` | Core MessagingService class |
| `web/src/hooks/useSupabaseMessaging.ts` | React hooks (useMessages, useTypingIndicator, useChat) |
| `web/src/hooks/useOnlinePresence.ts` | Online presence hooks |
| `web/src/app/api/conversations/route.ts` | Conversations API (GET, POST) |
| `web/src/app/api/conversations/[id]/route.ts` | Single conversation API |
| `web/src/app/api/conversations/[id]/participants/route.ts` | Participant management |
| `web/src/app/api/messages/route.ts` | Messages API (GET, POST) |
| `web/src/app/api/messages/[id]/route.ts` | Single message API |
| `web/src/components/chat/ChatThread.tsx` | Main chat UI component |
| `web/src/components/chat/MessageBubble.tsx` | Message display |
| `web/src/components/chat/MessageInput.tsx` | Message composer |
| `web/src/components/chat/ConversationList.tsx` | Conversation list |

### Mobile

| File | Purpose |
|------|---------|
| `mobile/services/supabaseMessaging.ts` | Functional messaging service |
| `mobile/hooks/useSupabaseMessaging.ts` | React Native hooks |
| `mobile/hooks/useOnlinePresence.ts` | Presence hooks |
| `mobile/app/chat/[userid].tsx` | Direct chat screen |
| `mobile/app/group/[groupid].tsx` | Group chat screen (still uses Agora) |
| `mobile/app/(tabs)/chats.tsx` | Chat list tab |
| `mobile/components/chat/Conversation.tsx` | Message display |
| `mobile/components/chat/ChatInput.tsx` | Native input component |

### Database

| File | Purpose |
|------|---------|
| `web/supabase/migrations/00001_initial_schema.sql` | conversations, conversation_participants |
| `web/supabase/migrations/00016_supabase_messaging.sql` | messages, reactions, read receipts |
| `web/supabase/migrations/00022_fix_conversation_rls_recursion.sql` | RLS fix |

## Database Schema

### Tables

**conversations**
- `id` UUID PK
- `type` TEXT (direct, group)
- `group_name` TEXT
- `group_image_url` TEXT
- `created_by` UUID FK users
- `created_at`, `updated_at` TIMESTAMPTZ

**conversation_participants**
- `id` UUID PK
- `conversation_id` UUID FK conversations
- `user_id` UUID FK users
- `role` TEXT (owner, admin, member)
- `joined_at` TIMESTAMPTZ
- `last_read_at` TIMESTAMPTZ
- `is_muted` BOOLEAN
- `is_archived` BOOLEAN
- UNIQUE(conversation_id, user_id)

**messages**
- `id` UUID PK
- `conversation_id` UUID FK conversations
- `sender_id` UUID FK users
- `content` TEXT
- `message_type` TEXT (text, image, video, audio, file, system)
- `media_url`, `media_thumbnail_url` TEXT
- `media_metadata` JSONB
- `status` TEXT (sending, sent, delivered, read, failed)
- `reply_to_id` UUID FK messages
- `deleted_at` TIMESTAMPTZ
- `deleted_for_everyone` BOOLEAN
- `created_at`, `edited_at` TIMESTAMPTZ
- `client_message_id` TEXT

**message_reactions**
- `id` UUID PK
- `message_id` UUID FK messages
- `user_id` UUID FK users
- `reaction` TEXT
- UNIQUE(message_id, user_id, reaction)

**message_read_receipts**
- `id` UUID PK
- `message_id` UUID FK messages
- `user_id` UUID FK users
- `read_at` TIMESTAMPTZ
- UNIQUE(message_id, user_id)

### Key Functions

**is_conversation_participant(conversation_id, user_id)**
- SECURITY DEFINER function
- Returns BOOLEAN
- Used by RLS policies to prevent recursion

**get_unread_count(conversation_id, user_id)**
- Returns INTEGER count of unread messages
- Compares messages.created_at to participant.last_read_at

**get_conversations_with_details(user_id)**
- Returns TABLE with conversation info + last message + unread count
- Used for conversation list

## API Endpoints

### Conversations

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/conversations | List user's conversations |
| POST | /api/conversations | Create conversation (returns existing for direct) |
| GET | /api/conversations/[id] | Get conversation details |
| PUT | /api/conversations/[id] | Update settings (mute, name) |
| DELETE | /api/conversations/[id] | Leave/delete conversation |
| POST | /api/conversations/[id]/participants | Add participant (groups) |
| DELETE | /api/conversations/[id]/participants | Remove participant |

### Messages

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/messages?conversation_id=X | List messages (paginated) |
| POST | /api/messages | Send message |
| GET | /api/messages/[id] | Get single message |
| PATCH | /api/messages/[id] | Edit/delete message |
| DELETE | /api/messages/[id] | Delete message |

## Real-time Patterns

### Channel Naming
- Messages & typing: `conversation:{conversationId}`
- Online presence: `presence:{conversationId}`

### Subscription Flow
```typescript
// 1. Get or create channel
const channel = supabase.channel(`conversation:${convId}`);

// 2. Subscribe to broadcast (immediate delivery)
channel.on("broadcast", { event: "new_message" }, callback);

// 3. Subscribe to postgres changes (reliable backup)
channel.on("postgres_changes", { 
  event: "INSERT", 
  table: "messages",
  filter: `conversation_id=eq.${convId}`
}, callback);

// 4. Subscribe to presence (typing)
channel.on("presence", { event: "sync" }, presenceCallback);

// 5. Subscribe and track presence
await channel.subscribe();
await channel.track({ user_id, is_typing: false });
```

### Optimistic Updates
```typescript
// 1. Generate client ID
const clientMessageId = `${userId}_${Date.now()}_${random}`;

// 2. Add optimistic message
setMessages(prev => [...prev, { 
  id: clientMessageId, // temporary
  status: "sending",
  client_message_id: clientMessageId
}]);

// 3. Send with same clientMessageId
await messagingService.sendMessage(convId, userId, content, { clientMessageId });

// 4. Real-time callback updates optimistic message by matching client_message_id
```

### Deduplication
Messages can arrive via multiple channels. Always check:
```typescript
const exists = prev.some(m => 
  m.id === newMessage.id || 
  (m.client_message_id && m.client_message_id === newMessage.client_message_id)
);
```

## Migration Status

| Feature | Web | Mobile |
|---------|-----|--------|
| Direct chat | Supabase | Supabase |
| Group chat | Supabase | Agora (legacy) |
| Chat list | Supabase | Agora (legacy) |
| Typing indicators | Supabase | Supabase |
| Online presence | Supabase | Supabase |

## Common Tasks

### Add a new message type

1. Update `message_type` CHECK constraint in migration
2. Update Zod schema in `/api/messages/route.ts`
3. Update TypeScript types
4. Handle in `MessageBubble` component

### Add message reactions UI

1. Create `/api/messages/[id]/reactions/route.ts`
2. Add reaction picker to `MessageBubble`
3. Subscribe to `message_reactions` postgres_changes

### Debug real-time issues

1. Check browser console for `[Messaging]` logs
2. Verify channel subscription status
3. Check Supabase dashboard > Realtime > Channels
4. Verify RLS policies allow SELECT

## Reusing in Other Projects

See `.cursor/skills/messaging-starter-kit/` for a complete guide to implementing this system in another Supabase + Next.js project.

Files included:
- `SKILL.md` - Step-by-step implementation guide
- `templates/migration.sql` - Standalone database migration
- `templates/architecture.md` - System diagrams
- `templates/api-routes-overview.md` - Full API documentation
