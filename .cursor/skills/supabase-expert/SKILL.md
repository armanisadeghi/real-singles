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

## Environment Setup Verification

### ALWAYS Check These First

Before attempting any database operations:

1. **Read `.env.local`** to verify:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
   ```

2. **Extract project ID** from the URL:
   - URL: `https://sotdovuprhztkrgtonyz.supabase.co`
   - Project ID: `sotdovuprhztkrgtonyz`

3. **Verify project access** (see MCP Server section below)

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

## MCP Server Usage

The Supabase MCP server provides tools for database operations. **CRITICAL: Always follow this workflow.**

### Step 1: Discover Available Projects

**ALWAYS call `list_projects` first** to see which projects the MCP can access:

```typescript
// Tool: list_projects (no arguments needed)
CallMcpTool({
  server: "user-supabase",
  toolName: "list_projects",
  arguments: {}
})
```

This returns an array of projects with their IDs and status.

### Step 2: Verify Project Access

**Check if your project is in the list:**

1. Read `.env.local` to get the project URL
2. Extract project_id from URL (e.g., `sotdovuprhztkrgtonyz` from `https://sotdovuprhztkrgtonyz.supabase.co`)
3. Verify it matches one of the projects from `list_projects`

### Step 3: Use MCP Tools (if accessible)

**Only if the project is in the list,** you can use:

- `execute_sql` - Run SQL queries
- `list_tables` - List database tables
- `get_project` - Get project details
- `list_migrations` - List migrations

**Example:**
```typescript
CallMcpTool({
  server: "user-supabase",
  toolName: "execute_sql",
  arguments: {
    project_id: "abc123xyz",  // From list_projects
    query: "SELECT COUNT(*) FROM profiles;"
  }
})
```

### Step 4: Fallback Strategy

**If MCP fails with "permission denied" or project not in list:**

The MCP is authenticated with a different Supabase account. **DO NOT keep trying MCP tools.**

Instead, create a TypeScript verification script:

1. Create script in `web/scripts/`
2. Use `@supabase/supabase-js` with credentials from `.env.local`
3. Use `SUPABASE_SERVICE_ROLE_KEY` for admin operations

**Example Fallback Script:**
```typescript
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Query database directly
const { data, error } = await supabase
  .from("profiles")
  .select("*")
  .limit(5);
```

### MCP Troubleshooting Guide

| Error | Cause | Solution |
|-------|-------|----------|
| "You do not have permission" | MCP on different account | Use fallback script |
| "Could not find function" | Wrong tool name or RPC doesn't exist | Check tool list with `ls mcps/user-supabase/tools/` |
| Project not in `list_projects` | Different organization | Use fallback script |
| No response/timeout | MCP server issue | Use fallback script |

---

## Database Query Strategies

When you need to query the database:

### Strategy Priority Order

1. **Check MCP Access First**
   ```typescript
   // Always start with list_projects
   const projects = await CallMcpTool("user-supabase", "list_projects", {});
   // Check if your project_id is in the list
   ```

2. **If MCP Available**: Use `execute_sql` tool

3. **If MCP Not Available**: Create TypeScript script
   ```bash
   # Location: web/scripts/verify-<feature-name>.ts
   cd web && pnpm tsx scripts/verify-<feature-name>.ts
   ```

4. **Always Include Both**: In verification scripts, provide:
   - Direct query results (what we found)
   - Sample data (examples of the data)
   - Statistics (counts, aggregations)
   - Recommendations (what to do next)

### Script Template

Save this template for future database scripts:

```typescript
#!/usr/bin/env tsx
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyData() {
  console.log("🔍 Checking database...\n");
  
  // Your queries here
  const { data, error } = await supabase
    .from("your_table")
    .select("*");
  
  if (error) {
    console.error("❌ Error:", error.message);
    return;
  }
  
  console.log("✅ Success!");
  console.log(`   Found ${data.length} records`);
}

verifyData().catch(console.error);
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

## Pre-Completion Checklist

- [ ] Read `.env.local` and verified project credentials exist
- [ ] If using MCP: Called `list_projects` to verify access
- [ ] If MCP failed: Created fallback TypeScript script
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
| `web/.env.local` | **START HERE** - Supabase credentials and project URL |
| `web/src/lib/supabase/server.ts` | Server clients (`createClient`, `createApiClient`) |
| `web/src/lib/supabase/client.ts` | Browser client |
| `web/src/lib/supabase/admin.ts` | Admin client (bypasses RLS) |
| `web/src/lib/supabase/storage.ts` | Storage utilities and bucket config |
| `web/src/lib/supabase/url-utils.ts` | URL resolution utilities |
| `web/src/types/database.types.ts` | Generated database types |
| `web/supabase/migrations/` | Migration files |
| `web/supabase/migrations/00002_rls_policies.sql` | RLS policy examples |
| `web/scripts/` | Database verification scripts (create as needed) |

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `cd web && pnpm db:types` | Regenerate TypeScript types |
| `cd web && pnpm db:migrate` | Push migrations + regenerate types |
| `cd web && pnpm db:status` | Check migration sync status |
| `cd web && pnpm tsx scripts/<script>.ts` | Run verification script |

---

## Common Pitfalls & Solutions

### ❌ Pitfall: Assuming MCP works without checking
**Solution:** Always call `list_projects` first

### ❌ Pitfall: Hardcoding project_id without verification
**Solution:** Extract from `.env.local` and verify with MCP

### ❌ Pitfall: Repeatedly trying MCP after permission error
**Solution:** Switch to fallback script immediately

### ❌ Pitfall: Not providing enough information in verification scripts
**Solution:** Include counts, samples, missing data analysis, and recommendations

### ❌ Pitfall: Creating scripts without proper error handling
**Solution:** Use the script template above with credential verification
