Supabase specialist for database architecture, auth, storage, and RLS policies.

Task: $ARGUMENTS

## MCP Tools Available

Use Supabase MCP tools for all database operations:

| Tool | Purpose |
|------|---------|
| `list_tables` | View all tables in schema |
| `execute_sql` | Query data (SELECT) or inspect schema |
| `apply_migration` | Apply DDL changes safely (CREATE, ALTER, DROP) |
| `generate_typescript_types` | Generate updated types from schema |

Always query current state before making changes.

## Schema Changes Workflow

1. **Use `apply_migration` for DDL** — never raw `execute_sql` for schema changes
2. **Regenerate types:** `cd web && pnpm db:types`
3. **Sync types to mobile:** `cp web/src/types/database.types.ts mobile/types/database.types.ts`
4. **Update dependent code** — API routes, services, mobile API client

## Client Selection

| Context | Client | Import |
|---------|--------|--------|
| Web pages (client-side) | `createClient()` | `@/lib/supabase/client` |
| API routes | `createApiClient()` | `@/lib/supabase/server` |
| Admin operations (bypass RLS) | `createAdminClient()` | `@/lib/supabase/admin` |
| Mobile (client-side) | `supabase` | `@/lib/supabase` |

## Storage & Image Handling

### Buckets

| Bucket | Privacy | Use Case |
|--------|---------|----------|
| `avatars` | Public | Profile pictures |
| `gallery` | Private | User photos (signed URLs) |
| `events` | Public | Event images |
| `products` | Public | Store product images |

### ALWAYS Use URL Utilities

Never call `getPublicUrl()` or `createSignedUrl()` directly. Use:

```typescript
import { resolveStorageUrl, resolveGalleryUrls, resolveOptimizedImageUrl, IMAGE_SIZES } from "@/lib/supabase/url-utils";

const url = await resolveStorageUrl(supabase, path);
const url = await resolveOptimizedImageUrl(supabase, path, "thumbnail");
const items = await resolveGalleryUrls(supabase, galleryData);
```

### Store Paths, Not URLs

```typescript
// CORRECT: Store path only
await supabase.from("user_gallery").insert({ media_url: "user123/photo.jpg" });

// WRONG: Never store full URLs
await supabase.from("user_gallery").insert({ media_url: "https://xxx.supabase.co/..." });
```

## RLS Standard Owner Pattern

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

## Migration Best Practices

All migrations must be idempotent:
- Tables: `CREATE TABLE IF NOT EXISTS`
- Columns: `ADD COLUMN IF NOT EXISTS`
- Indexes: `CREATE INDEX IF NOT EXISTS`
- Policies: `DROP POLICY IF EXISTS` before `CREATE POLICY`

## Reference Files

| File | Purpose |
|------|---------|
| `web/src/lib/supabase/server.ts` | `createClient`, `createApiClient` |
| `web/src/lib/supabase/client.ts` | Browser client |
| `web/src/lib/supabase/admin.ts` | Admin client (bypasses RLS) |
| `web/src/lib/supabase/url-utils.ts` | URL resolution utilities |
| `web/src/lib/supabase/storage.ts` | Storage helpers and constants |
| `web/src/types/database.types.ts` | Generated types (web) |
| `mobile/types/database.types.ts` | Generated types (mobile) |

## Checklist Before Completing

- [ ] Used MCP to query current state before changes
- [ ] Used `apply_migration` for DDL (not raw `execute_sql`)
- [ ] Regenerated types: `cd web && pnpm db:types`
- [ ] Synced types to mobile
- [ ] Updated API routes/services if schema changed
- [ ] Uses correct client (`createApiClient()` in API routes)
- [ ] Storage uses `resolveStorageUrl()` utilities
- [ ] New tables have RLS enabled with appropriate policies
- [ ] Migrations are idempotent
