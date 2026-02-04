---
name: supabase-expert
description: Ensures correct Supabase patterns across database architecture, auth, storage, and RLS policies. Use when working with database queries, API routes, authentication, storage operations, RLS policies, or schema changes. Also use when the user mentions Supabase, database, migrations, RLS, storage buckets, or type generation.
---

# Supabase Expert

**Your job:** Ensure correct Supabase patterns using MCP tools and centralized utilities.

---

## MCP Tools (Direct Database Access)

You have direct MCP access to the database. **Always query before making changes.**

**Server:** `project-0-real-singles-supabase`

| Tool | Purpose |
|------|---------|
| `list_tables` | View all tables in schema |
| `execute_sql` | Query data (SELECT) or inspect schema |
| `apply_migration` | Apply DDL changes safely |
| `generate_typescript_types` | Generate types from schema |

### Query First

```typescript
// List tables
CallMcpTool("project-0-real-singles-supabase", "list_tables", { schemas: ["public"] })

// Check columns
CallMcpTool("project-0-real-singles-supabase", "execute_sql", {
  query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'"
})

// Check RLS policies
CallMcpTool("project-0-real-singles-supabase", "execute_sql", {
  query: "SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'users'"
})
```

---

## Schema Changes Workflow

### 1. Apply Migration via MCP

```typescript
CallMcpTool("project-0-real-singles-supabase", "apply_migration", {
  name: "add_field_to_users",
  query: `
    ALTER TABLE users ADD COLUMN IF NOT EXISTS new_field TEXT;
    CREATE INDEX IF NOT EXISTS idx_users_new_field ON users(new_field);
  `
})
```

### 2. Regenerate Types

```bash
cd web && pnpm db:types
```

### 3. Sync Types to Mobile

```bash
cp web/src/types/database.types.ts mobile/types/database.types.ts
```

### 4. Update Dependent Code

- API routes (queries/responses)
- Services (business logic)
- Mobile API client if response shapes changed

---

## Client Selection

| Context | Client | Import |
|---------|--------|--------|
| Web pages (client) | `createClient()` | `@/lib/supabase/client` |
| API routes | `createApiClient()` | `@/lib/supabase/server` |
| Admin (bypass RLS) | `createAdminClient()` | `@/lib/supabase/admin` |
| Mobile | `supabase` | `@/lib/supabase` |

### API Route Pattern

```typescript
import { createApiClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createApiClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Query database...
}
```

---

## Storage & Images

### Buckets

| Bucket | Privacy | Use Case |
|--------|---------|----------|
| `avatars` | Public | Profile pictures |
| `gallery` | Private | User photos (signed URLs) |
| `events` | Public | Event images |
| `products` | Public | Product images |

### ALWAYS Use URL Utilities

**Never call `getPublicUrl()` or `createSignedUrl()` directly.**

```typescript
import { 
  resolveStorageUrl,
  resolveGalleryUrls,
  resolveProfileImageUrls,
  resolveOptimizedImageUrl,
  IMAGE_SIZES 
} from "@/lib/supabase/url-utils";

// Single image
const url = await resolveStorageUrl(supabase, path);
const url = await resolveStorageUrl(supabase, path, { bucket: "events" });

// Optimized image
const url = await resolveOptimizedImageUrl(supabase, path, "thumbnail");

// Batch operations
const items = await resolveGalleryUrls(supabase, galleryData);
const users = await resolveProfileImageUrls(supabase, userData);
```

### Image Sizes

```typescript
IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150, quality: 70 },
  card: { width: 400, height: 400, quality: 75 },
  cardWide: { width: 600, height: 400, quality: 75 },
  medium: { width: 600, height: 600, quality: 80 },
  large: { width: 1200, height: 1200, quality: 85 },
  hero: { width: 800, height: 600, quality: 80 },
}
```

### Storage Path Helpers

```typescript
import { 
  getGalleryPath,
  getAvatarPath,
  getVoicePromptPath,
  getVideoIntroPath,
  validateFile,
  STORAGE_BUCKETS 
} from "@/lib/supabase/storage";

const path = getGalleryPath(userId, filename);
const { valid, error } = validateFile(file, STORAGE_BUCKETS.GALLERY);
```

### Store Paths, Not URLs

```typescript
// ✅ Correct
media_url: "user123/photo.jpg"

// ❌ Wrong
media_url: "https://xxx.supabase.co/storage/v1/object/gallery/..."
```

---

## RLS Policies

### Standard Owner Pattern

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data" ON table_name
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON table_name
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON table_name
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data" ON table_name
  FOR DELETE USING (auth.uid() = user_id);
```

### Discovery Context (with blocks)

```sql
CREATE POLICY "Users can read profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = profiles.user_id AND users.status = 'active')
    AND NOT EXISTS (
      SELECT 1 FROM blocks 
      WHERE (blocks.blocker_id = auth.uid() AND blocks.blocked_id = profiles.user_id)
      OR (blocks.blocker_id = profiles.user_id AND blocks.blocked_id = auth.uid())
    )
  );
```

---

## Migration Best Practices

### Always Idempotent

```sql
CREATE TABLE IF NOT EXISTS new_table (...);
ALTER TABLE users ADD COLUMN IF NOT EXISTS new_field TEXT;
CREATE INDEX IF NOT EXISTS idx_name ON table(column);

-- Policies: drop first
DROP POLICY IF EXISTS "policy_name" ON table;
CREATE POLICY "policy_name" ON table ...;
```

---

## Reference Files

| File | Purpose |
|------|---------|
| `web/src/lib/supabase/server.ts` | `createClient`, `createApiClient` |
| `web/src/lib/supabase/client.ts` | Browser client |
| `web/src/lib/supabase/admin.ts` | Admin client |
| `web/src/lib/supabase/url-utils.ts` | URL resolution |
| `web/src/lib/supabase/storage.ts` | Storage helpers |
| `web/src/types/database.types.ts` | Generated types (web) |
| `mobile/types/database.types.ts` | Generated types (mobile) |
| `mobile/lib/supabase.ts` | Mobile client |
| `mobile/lib/api.ts` | Mobile API client |

---

## Quick Commands

| Command | Purpose |
|---------|---------|
| `cd web && pnpm db:types` | Regenerate types |
| `cd web && pnpm db:migrate` | Push migrations + types |
| `cd web && pnpm db:status` | Check migration status |
| `cp web/src/types/database.types.ts mobile/types/database.types.ts` | Sync to mobile |

---

## Checklist

- [ ] Used MCP to query current state before changes
- [ ] Used `apply_migration` for DDL
- [ ] Regenerated types: `pnpm db:types`
- [ ] Synced types to mobile
- [ ] Updated dependent API routes/services
- [ ] Uses correct client (`createApiClient()` in API routes)
- [ ] Storage uses `resolveStorageUrl()` utilities
- [ ] New tables have RLS with appropriate policies
- [ ] Migrations are idempotent
