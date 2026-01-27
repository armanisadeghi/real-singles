# Supabase Patterns Reference

Detailed patterns and examples for complex Supabase operations.

---

## RLS Policy Patterns

### Pattern 1: Owner Access

User can only access their own data:

```sql
CREATE POLICY "Users can read own data" ON user_filters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON user_filters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON user_filters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data" ON user_filters
  FOR DELETE USING (auth.uid() = user_id);
```

### Pattern 2: Block Checking (Discovery)

Exclude blocked users in both directions:

```sql
CREATE POLICY "Users can read profiles" ON profiles
  FOR SELECT USING (
    -- User must be active
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = profiles.user_id 
      AND users.status = 'active'
    )
    -- No blocks in either direction
    AND NOT EXISTS (
      SELECT 1 FROM blocks 
      WHERE (blocks.blocker_id = auth.uid() AND blocks.blocked_id = profiles.user_id)
      OR (blocks.blocker_id = profiles.user_id AND blocks.blocked_id = auth.uid())
    )
  );
```

### Pattern 3: Participant Access

Users can only access resources they're participants in:

```sql
CREATE POLICY "Users can read own conversations" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
    )
  );
```

### Pattern 4: Public + Owner

Public resources visible to all, but ownership for modifications:

```sql
-- Read: public or owner
CREATE POLICY "Users can read events" ON events
  FOR SELECT USING (is_public = true OR created_by = auth.uid());

-- Modify: owner only
CREATE POLICY "Creators can update events" ON events
  FOR UPDATE USING (auth.uid() = created_by);
```

### Pattern 5: Conditional Public

Some fields public, full access for authenticated:

```sql
CREATE POLICY "Anyone can read active products" ON products
  FOR SELECT USING (is_active = true);
```

---

## API Route Examples

### Standard GET with User Verification

```tsx
import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createApiClient();
  
  // Always verify user first
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch data
  const { data, error } = await supabase
    .from("user_filters")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

### POST with Validation

```tsx
export async function POST(request: Request) {
  const supabase = await createApiClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  
  // Validate required fields
  if (!body.title || !body.content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      title: body.title,
      content: body.content,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
```

### Dynamic Route with ID Parameter

```tsx
// app/api/items/[id]/route.ts
import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createApiClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
```

---

## Storage Operations

### Upload Flow

```tsx
import { STORAGE_BUCKETS, validateFile, uploadFile, getGalleryPath } from "@/lib/supabase/storage";

// 1. Validate file
const validation = validateFile(file, STORAGE_BUCKETS.GALLERY);
if (!validation.valid) {
  throw new Error(validation.error);
}

// 2. Generate path
const path = getGalleryPath(userId, `${Date.now()}-${file.name}`);

// 3. Upload
const { path: uploadedPath, error } = await uploadFile(
  STORAGE_BUCKETS.GALLERY,
  path,
  file,
  { upsert: false }
);

// 4. Store path in database (NOT the full URL)
await supabase
  .from("user_gallery")
  .insert({ user_id: userId, media_url: uploadedPath });
```

### URL Resolution in API Routes

```tsx
import { resolveStorageUrl, resolveGalleryUrls } from "@/lib/supabase/url-utils";

// Single image
const { data: user } = await supabase
  .from("users")
  .select("profile_image_url")
  .eq("id", userId)
  .single();

const resolvedUrl = await resolveStorageUrl(supabase, user.profile_image_url);

// Gallery items (batch)
const { data: gallery } = await supabase
  .from("user_gallery")
  .select("*")
  .eq("user_id", userId);

const resolvedGallery = await resolveGalleryUrls(supabase, gallery);
```

---

## Complex Query Patterns

### Join with Related Data

```tsx
const { data } = await supabase
  .from("conversations")
  .select(`
    id,
    created_at,
    conversation_participants (
      user_id,
      users (
        id,
        first_name,
        last_name,
        profile_image_url
      )
    )
  `)
  .eq("conversation_participants.user_id", userId);
```

### Filtered Discovery Query

```tsx
const { data } = await supabase
  .from("users")
  .select(`
    id,
    first_name,
    last_name,
    profile_image_url,
    profiles (
      age,
      gender,
      location_city,
      bio
    )
  `)
  .eq("status", "active")
  .neq("id", currentUserId)
  .gte("profiles.age", filters.minAge)
  .lte("profiles.age", filters.maxAge)
  .order("created_at", { ascending: false })
  .limit(20);
```

### Upsert Pattern

```tsx
const { data, error } = await supabase
  .from("user_filters")
  .upsert(
    {
      user_id: userId,
      min_age: filters.minAge,
      max_age: filters.maxAge,
      // ... other fields
    },
    {
      onConflict: "user_id",
    }
  )
  .select()
  .single();
```

---

## Migration Examples

### Adding a Column

```sql
-- web/supabase/migrations/00014_add_new_field.sql

-- Add column with default
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS new_field TEXT DEFAULT '';

-- Or nullable
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS optional_field TEXT;
```

### Creating a Table with RLS

```sql
-- web/supabase/migrations/00015_new_feature_table.sql

-- Create table
CREATE TABLE IF NOT EXISTS feature_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feature_items_user_id ON feature_items(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_items_created_at ON feature_items(created_at);

-- Enable RLS
ALTER TABLE feature_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own items" ON feature_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own items" ON feature_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own items" ON feature_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own items" ON feature_items
  FOR DELETE USING (auth.uid() = user_id);
```

### Modifying RLS Policy

```sql
-- Always drop existing policy first (idempotent)
DROP POLICY IF EXISTS "Old policy name" ON table_name;

-- Create new policy
CREATE POLICY "New policy name" ON table_name
  FOR SELECT USING (/* new conditions */);
```

---

## Common Mistakes

### Wrong Client Usage

```tsx
// ❌ Wrong: Using browser client in API route
import { createClient } from "@/lib/supabase/client";

export async function GET() {
  const supabase = createClient(); // Won't have user session!
}

// ✅ Correct: Using API client
import { createApiClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createApiClient(); // Handles cookies + bearer
}
```

### Missing Type Safety

```tsx
// ❌ Wrong: Untyped or any
const { data } = await supabase.from("users").select("*");
const user: any = data[0];

// ✅ Correct: Types from database.types
import type { Database } from "@/types/database.types";
type User = Database["public"]["Tables"]["users"]["Row"];

const { data } = await supabase.from("users").select("*");
const user: User = data[0];
```

### Storing Full URLs

```tsx
// ❌ Wrong: Storing full URL
await supabase.from("user_gallery").insert({
  media_url: "https://xxx.supabase.co/storage/v1/object/gallery/user123/photo.jpg"
});

// ✅ Correct: Store path only
await supabase.from("user_gallery").insert({
  media_url: "user123/photo.jpg"
});
```

### Forgetting Block Checks

```tsx
// ❌ Wrong: No block checking in discovery
const { data } = await supabase
  .from("users")
  .select("*")
  .eq("status", "active");

// ✅ Correct: Either use RLS (preferred) or explicit filter
// RLS handles this automatically if policies are correct
// For explicit queries:
const blockedIds = await getBlockedUserIds(userId);
const { data } = await supabase
  .from("users")
  .select("*")
  .eq("status", "active")
  .not("id", "in", `(${blockedIds.join(",")})`);
```

---

## Type Generation

After any schema change:

```bash
cd web && pnpm db:types
```

This regenerates `web/src/types/database.types.ts` with current schema.

**Common triggers for type regeneration:**
- New migration applied
- Column added/removed/modified
- Table created/deleted
- Enum values changed
