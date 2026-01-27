---
name: supabase-expert
description: Ensures correct Supabase patterns across database architecture, auth, storage, and RLS policies. Use when working with database queries, API routes, authentication, storage operations, RLS policies, or schema changes. Also use when the user mentions Supabase, database, migrations, RLS, storage buckets, or type generation.
---

# Supabase Expert

**Your job:** Ensure correct Supabase patterns across database architecture, auth, storage, and RLS policies in this project.

---

## Core Principles

1. **Centralized DB access** — All database operations go through API routes, never direct client-side queries (except auth)
2. **Type safety** — All queries use generated types from `@/types/database.types`, no `any` or loose typing
3. **RLS everywhere** — Every table has RLS enabled with appropriate policies
4. **Consistent storage** — Correct bucket selection and URL handling

---

## Client Selection

| Context | Client | Import |
|---------|--------|--------|
| Web pages (client-side) | `createClient()` | `@/lib/supabase/client` |
| API routes | `createApiClient()` | `@/lib/supabase/server` |
| Admin operations (bypass RLS) | `createAdminClient()` | `@/lib/supabase/admin` |

### API Route Pattern

```tsx
import { createApiClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createApiClient(); // Supports cookie + bearer token
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Database operations here...
}
```

### Mobile Auth

Mobile uses `Authorization: Bearer <token>` header. The `createApiClient()` function handles this automatically:

```tsx
// createApiClient checks Authorization header first, then cookies
const authHeader = headersList.get("authorization");
if (authHeader?.startsWith("Bearer ")) {
  // Creates client with bearer token
}
```

---

## Database Architecture

### Schema Health Checklist

When reviewing or modifying schema:

- [ ] **Unused fields** — Flag fields never read or written for removal
- [ ] **Data completeness** — If data shown in one place, ensure all relevant fields available elsewhere
- [ ] **Field utilization** — Verify all fields used in relevant features
- [ ] **Indexes** — Add indexes for frequently queried columns (`WHERE`, `ORDER BY`, `JOIN`)

### Type Generation

**Always regenerate types after schema changes:**

```bash
cd web && pnpm db:types
```

Or use the interactive migration flow:

```bash
cd web && pnpm db:migrate  # Push + regenerate types
```

### Migration Rules

1. **Always idempotent** — Use `DROP ... IF EXISTS` before `CREATE`
2. **Always regenerate types** — Run `pnpm db:types` after any migration
3. **Unique prefixes** — Each migration needs a unique numeric prefix
4. **Location:** `web/supabase/migrations/`

---

## RLS Policies

### Required Patterns

Every table must have RLS enabled with appropriate policies:

```sql
-- 1. Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- 2. Owner access pattern
CREATE POLICY "Users can read own data" ON table_name
  FOR SELECT USING (auth.uid() = user_id);

-- 3. Block checking (for public/discovery contexts)
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

### Policy Checklist for New Tables

- [ ] RLS enabled on table
- [ ] SELECT policy (who can read?)
- [ ] INSERT policy with `WITH CHECK` (who can create?)
- [ ] UPDATE policy (who can modify?)
- [ ] DELETE policy (who can remove?)
- [ ] Block checking in public contexts
- [ ] Status checking (`users.status = 'active'`) for discovery

### Admin Bypass

Service role bypasses RLS. Use `createAdminClient()` for admin-only operations:

```tsx
import { createAdminClient } from "@/lib/supabase/admin";

// Admin route - bypasses all RLS
const supabase = createAdminClient();
```

---

## Storage

### Buckets

| Bucket | Privacy | URL Type | Use Case |
|--------|---------|----------|----------|
| `avatars` | Public | Public URL | Profile pictures |
| `gallery` | Private | Signed URL | User photos (require auth) |
| `events` | Public | Public URL | Event images |

### URL Resolution

**Always use `resolveStorageUrl()` for consistent URL handling:**

```tsx
import { resolveStorageUrl } from "@/lib/supabase/url-utils";

// Single URL
const url = await resolveStorageUrl(supabase, path);

// Gallery items
const items = await resolveGalleryUrls(supabase, galleryData);

// Profile images in lists
const users = await resolveProfileImageUrls(supabase, userData);
```

### Path Extraction

When storing URLs, save the path only (not full URL):

```tsx
// ✅ Store path
const path = `${userId}/${filename}`;

// ❌ Don't store full URLs
const url = "https://xxx.supabase.co/storage/v1/object/..."
```

---

## API Patterns

### Complete Data Fetching

API responses should include all relevant fields:

```tsx
// ✅ Good: Select needed fields explicitly
const { data } = await supabase
  .from("users")
  .select("id, email, first_name, last_name, profile_image_url, status")
  .eq("id", userId)
  .single();

// ❌ Bad: Select * or arbitrary subset
const { data } = await supabase.from("users").select("id, email").single();
```

### Field Mapping

Watch for aliasing issues between API and DB:

```tsx
// If API uses camelCase but DB uses snake_case
const response = {
  firstName: data.first_name,  // Map correctly
  lastName: data.last_name,
};
```

---

## Auto-Fix Targets

When reviewing code, flag and fix:

| Issue | Action |
|-------|--------|
| Unused schema fields | Flag for removal or implement usage |
| Incomplete data fetching | Add missing fields to queries |
| Wrong Supabase client | Use `createApiClient()` in API routes |
| Missing type regeneration | Run `pnpm db:types` |
| Incorrect storage URLs | Use `resolveStorageUrl()` |
| Missing RLS policies | Add appropriate policies |
| Overly permissive RLS | Tighten policies with proper checks |
| Direct DB queries in client | Move to API route |

---

## MCP Server

If Supabase MCP is available, use it for:
- Schema inspection
- Query debugging
- Policy verification

---

## Pre-Completion Checklist

- [ ] Uses `createApiClient()` in API routes (not `createClient()`)
- [ ] All queries use generated types from `@/types/database.types`
- [ ] RLS enabled on any new tables
- [ ] Block checking in public/discovery queries
- [ ] Status filtering (`status = 'active'`) where appropriate
- [ ] Storage URLs resolved via `resolveStorageUrl()`
- [ ] Types regenerated if schema changed
- [ ] No direct client-side DB queries (except auth)

---

## Reference Files

| File | Purpose |
|------|---------|
| `web/src/lib/supabase/server.ts` | Server clients (`createClient`, `createApiClient`) |
| `web/src/lib/supabase/client.ts` | Browser client |
| `web/src/lib/supabase/admin.ts` | Admin client (bypasses RLS) |
| `web/src/lib/supabase/storage.ts` | Storage utilities and bucket config |
| `web/src/lib/supabase/url-utils.ts` | URL resolution utilities |
| `web/src/types/database.types.ts` | Generated database types |
| `web/supabase/migrations/` | Migration files |
| `web/supabase/migrations/00002_rls_policies.sql` | RLS policy examples |

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `cd web && pnpm db:types` | Regenerate TypeScript types |
| `cd web && pnpm db:migrate` | Push migrations + regenerate types |
| `cd web && pnpm db:status` | Check migration sync status |
