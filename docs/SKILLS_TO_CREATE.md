# Skills To Create

Specs for AI agent skills to be created. Each skill auto-fixes issues, not just reports them.

---

## 1. Supabase Expert

**Purpose:** Ensure correct Supabase patterns across auth, database, and storage.

**Key aspects to include:**

- **Auth client selection:** When to use `createClient()` (web pages) vs `createApiClient()` (API routes supporting both cookie + bearer)
- **Mobile auth flow:** Bearer token pattern via `Authorization` header, token refresh handling
- **Storage patterns:** Signed URLs for private buckets (`gallery`), public URLs for `avatars`, URL extraction from full paths
- **Type generation:** Always run `pnpm db:types` after schema changes, import from `@/types/database.types`
- **MCP awareness:** Supabase MCP server is available — use it for database queries, schema inspection, and debugging

**Auto-fix targets:**
- Wrong client used in context
- Missing type regeneration after migrations
- Incorrect storage URL handling

---

## 2. API Route Auditor

**Purpose:** Ensure consistency across all 76+ API routes.

**Key aspects to include:**

- **Standard response format:** `{ success: true, data, msg }` for success, `{ success: false, msg }` for errors
- **Auth pattern:** Always `const supabase = await createApiClient()` then check `user` before proceeding
- **Error status codes:** 401 for auth, 403 for forbidden, 404 for not found, 400 for bad input, 500 for server errors
- **Input handling:** Support both `PascalCase` (web) and `snake_case` (mobile) field names for backwards compatibility

**Auto-fix targets:**
- Non-standard response formats
- Missing auth checks
- Inconsistent error handling
- Missing field name aliases for mobile compatibility

---

## 3. Next.js 16 App Router Expert

**Purpose:** Ensure latest Next.js 16 patterns are used correctly.

**Key aspects to include:**

- **Async APIs:** `cookies()`, `headers()` are now async — must use `await`
- **Route handlers:** Use `NextResponse.json()`, proper method exports (`GET`, `POST`, etc.)
- **Server vs Client:** Default to Server Components, use `"use client"` only when needed (hooks, browser APIs, interactivity)
- **Caching:** Understand `revalidate`, `dynamic = 'force-dynamic'`, when to use each
- **Parallel routes:** `@folder` convention for simultaneous rendering

**Auto-fix targets:**
- Sync usage of async APIs (cookies, headers)
- Unnecessary `"use client"` directives
- Outdated patterns from Next.js 13/14

---

## 4. RLS Policy Auditor

**Purpose:** Verify Row Level Security policies match business requirements and have no security holes.

**Key aspects to include:**

- **Block checking:** Policies should exclude blocked users in both directions
- **Status checking:** Only show `active` users in discovery/public contexts
- **Owner patterns:** `auth.uid() = user_id` for personal data
- **Admin bypass:** Service role bypasses RLS — ensure admin routes use it correctly
- **New tables:** Every new table needs RLS enabled + appropriate policies

**Auto-fix targets:**
- Missing block checks in SELECT policies
- Missing status checks for public-facing queries
- New tables without RLS policies
- Overly permissive policies

---

## 5. Supabase Architecture Advisor

**Purpose:** Review code to identify opportunities where Supabase Realtime or Edge Functions would add significant value. Recommends, does not force.

**Key aspects to include:**

- **Realtime candidates:** Chat/messaging (currently Agora), notifications, live status updates, typing indicators
- **Edge Function candidates:** Webhook handlers, third-party API calls that need secrets, scheduled jobs
- **Evaluation criteria:** Would it simplify architecture? Reduce external dependencies? Improve latency? Lower costs?
- **Recommendation format:** Clear before/after comparison with tradeoffs

**When to recommend:**
- External service doing something Supabase handles natively
- Polling that could be replaced with subscriptions
- Client-side logic that should run server-side with secrets

**When NOT to recommend:**
- Current solution works well and is maintainable
- Migration cost outweighs benefit
- Feature requires capabilities Supabase doesn't have

---

## Priority Order

| # | Skill | Why |
|---|-------|-----|
| 1 | Supabase Expert | Auth + storage patterns are foundational |
| 2 | API Route Auditor | 76+ endpoints need consistency |
| 3 | Next.js 16 Expert | Prevents outdated patterns |
| 4 | RLS Policy Auditor | Security verification |
| 5 | Supabase Architecture Advisor | Optimization opportunities |

---

## Notes for Skill Creation

- Each skill should have a clear **scope restriction** (what it touches, what it never touches)
- Include a **pre-completion checklist** specific to that skill's domain
- Reference `mobile/lib/api.ts` and `web/src/lib/supabase/server.ts` as canonical patterns
- Skills should be usable independently or in sequence
