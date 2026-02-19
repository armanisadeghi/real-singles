Scaffold a complete real-time messaging system using Supabase Realtime.

Task: $ARGUMENTS

## Architecture

```
CLIENT: useChat() -> useMessages() + useTypingIndicator() -> MessagingService (singleton) -> Supabase Realtime Channels
API: /api/conversations (list/create) | /api/conversations/[id] (CRUD) | /api/messages (list/send) | /api/messages/[id] (edit/delete)
DB: conversations -> conversation_participants -> messages -> message_reactions -> message_read_receipts
```

## Implementation Steps

### Step 1: Database Migration
- Tables: conversations, conversation_participants, messages, message_reactions, message_read_receipts
- RLS with `is_conversation_participant()` SECURITY DEFINER function (prevents recursion)
- Run: `pnpm supabase db push && pnpm supabase gen types typescript --local > src/types/database.types.ts`

### Step 2: MessagingService (singleton)
- Location: `src/lib/supabase/messaging.ts`
- Patterns: singleton, channel Map for reuse, dual subscription (broadcast + postgres_changes), `client_message_id` deduplication, cleanup with `removeChannel()`

### Step 3: React Hooks
- `useMessages()` — state, loading, pagination, send
- `useTypingIndicator()` — track who's typing
- `useChat()` — combined convenience hook
- `useOnlinePresence()` — track online users

### Step 4: API Routes
| Route | Methods | Purpose |
|-------|---------|---------|
| `conversations/route.ts` | GET, POST | List/create |
| `conversations/[id]/route.ts` | GET, PUT, DELETE | Single conversation |
| `conversations/[id]/participants/route.ts` | POST, DELETE | Add/remove |
| `messages/route.ts` | GET, POST | List/send |
| `messages/[id]/route.ts` | GET, PATCH, DELETE | Edit/delete |

## Key Patterns

### Optimistic Updates
```typescript
const clientMessageId = `${userId}_${Date.now()}_${randomString()}`;
setMessages(prev => [...prev, { ...optimisticMsg, status: "sending" }]);
await messagingService.sendMessage(convId, userId, content, { clientMessageId });
```

### Real-time Deduplication
```typescript
const exists = prev.some(m =>
  m.id === newMessage.id ||
  (m.client_message_id && m.client_message_id === newMessage.client_message_id)
);
```

### Channel Cleanup
```typescript
useEffect(() => {
  const unsubscribe = messagingService.subscribeToMessages(convId, onMessage);
  return () => unsubscribe();
}, [convId]);
```

## Customization Checklist

| Feature | Default | Remove if not needed |
|---------|---------|---------------------|
| Media messages | Yes | `media_*` columns |
| Reactions | Yes | `message_reactions` table |
| Read receipts | Yes | `message_read_receipts` table |
| Message editing | Yes | `edited_at` column |
| Threaded replies | Yes | `reply_to_id` column |
| Group chats | Yes | Set type CHECK to 'direct' only |
| Typing indicators | Yes | Presence code |

## Reference Files
- Service: `web/src/lib/supabase/messaging.ts`
- Hooks: `web/src/hooks/useSupabaseMessaging.ts`, `web/src/hooks/useOnlinePresence.ts`
- API: `web/src/app/api/conversations/`, `web/src/app/api/messages/`
- Migration: `web/supabase/migrations/00016_supabase_messaging.sql`
