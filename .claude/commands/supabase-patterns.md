Supabase database patterns, RLS policies, storage operations, and migration templates.

Task: $ARGUMENTS

## Client Selection

| Context | Client | Import |
|---------|--------|--------|
| Web pages (client) | `createClient()` | `@/lib/supabase/client` |
| API routes | `createApiClient()` | `@/lib/supabase/server` |
| Admin (bypass RLS) | `createAdminClient()` | `@/lib/supabase/admin` |
| Mobile | `supabase` | `@/lib/supabase` |

## Storage & Images

### Buckets

| Bucket | Privacy | Use Case |
|--------|---------|----------|
| `avatars` | Public | Profile pictures |
| `gallery` | Private | User photos (signed URLs) |
| `events` | Public | Event images |
| `products` | Public | Product images |

### ALWAYS Use URL Utilities

```typescript
import { resolveStorageUrl, resolveGalleryUrls, resolveOptimizedImageUrl, IMAGE_SIZES } from "@/lib/supabase/url-utils";
const url = await resolveStorageUrl(supabase, path);
const url = await resolveOptimizedImageUrl(supabase, path, "thumbnail");
```

### Store Paths, Not URLs

```typescript
// CORRECT: media_url: "user123/photo.jpg"
// WRONG:   media_url: "https://xxx.supabase.co/storage/v1/..."
```

## RLS Policy Patterns

### Owner Access
```sql
CREATE POLICY "Users can read own data" ON table_name FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own data" ON table_name FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own data" ON table_name FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own data" ON table_name FOR DELETE USING (auth.uid() = user_id);
```

### Block Checking (Discovery)
```sql
CREATE POLICY "Users can read profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = profiles.user_id AND users.status = 'active')
  AND NOT EXISTS (
    SELECT 1 FROM blocks
    WHERE (blocks.blocker_id = auth.uid() AND blocks.blocked_id = profiles.user_id)
    OR (blocks.blocker_id = profiles.user_id AND blocks.blocked_id = auth.uid())
  )
);
```

### Participant Access
```sql
CREATE POLICY "Users can read own conversations" ON conversations FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_participants
    WHERE conversation_id = conversations.id AND user_id = auth.uid())
);
```

## Migration Template

```sql
CREATE TABLE IF NOT EXISTS feature_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_items_user_id ON feature_items(user_id);
ALTER TABLE feature_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "policy_name" ON feature_items;
CREATE POLICY "Users can read own items" ON feature_items FOR SELECT USING (auth.uid() = user_id);
```

All migrations MUST be idempotent: `IF NOT EXISTS`, `IF EXISTS`.

## Complex Query Patterns

### Join with Related Data
```typescript
const { data } = await supabase.from("conversations").select(`
  id, created_at,
  conversation_participants (user_id, users (id, first_name, profile_image_url))
`);
```

### Upsert
```typescript
const { data } = await supabase.from("user_filters").upsert(
  { user_id: userId, min_age: filters.minAge },
  { onConflict: "user_id" }
).select().single();
```

## Quick Commands

| Command | Purpose |
|---------|---------|
| `cd web && pnpm db:types` | Regenerate types |
| `cd web && pnpm db:migrate` | Push migrations + types |
| `cp web/src/types/database.types.ts mobile/types/database.types.ts` | Sync to mobile |

## Reference Files

| File | Purpose |
|------|---------|
| `web/src/lib/supabase/server.ts` | `createClient`, `createApiClient` |
| `web/src/lib/supabase/url-utils.ts` | URL resolution |
| `web/src/lib/supabase/storage.ts` | Storage helpers |
| `web/src/types/database.types.ts` | Generated types |
