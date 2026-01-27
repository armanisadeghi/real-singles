# Skills To Create

Specs for AI agent skills to be created. Each skill auto-fixes issues, not just reports them.

---

## 1. Supabase Expert

**Purpose:** Ensure correct Supabase patterns across database architecture, auth, storage, and RLS policies.

**Key aspects to include:**

### Database Architecture
- **Schema health:** Identify unused/dead fields and tables that are never read or written
- **Data completeness:** Ensure data shown fully in one place isn't partially shown elsewhere (forgotten fields, not intentional)
- **Field utilization:** Verify all schema fields are actually used in relevant features
- **Schema evolution:** Determine when new tables, fields, or indexes are needed based on feature requirements

### API & Type Safety
- **Centralized DB access:** All database interactions go through API routes, never direct client-side queries (except auth)
- **Type safety:** All queries use generated types from `@/types/database.types`, no `any` or loose typing
- **Complete data fetching:** API responses include all relevant fields, not arbitrary subsets
- **Field mapping:** Ensure API field names map correctly to DB columns (watch for aliasing issues)

### Auth Patterns
- **Client selection:** `createClient()` for web pages, `createApiClient()` for API routes (supports cookie + bearer)
- **Mobile auth:** Bearer token via `Authorization` header, proper token refresh handling
- **Session validation:** Always verify user before database operations

### Storage
- **URL patterns:** Signed URLs for private buckets (`gallery`), public URLs for `avatars`
- **Path extraction:** Correctly extract storage paths from full URLs when needed
- **Bucket selection:** Use correct bucket based on content type and privacy needs

### RLS Policies
- **Block checking:** Policies must exclude blocked users in both directions
- **Status checking:** Only show `active` users in public/discovery contexts
- **Owner patterns:** `auth.uid() = user_id` for personal data access
- **Admin bypass:** Service role bypasses RLS — ensure admin routes use correctly
- **New tables:** Every new table needs RLS enabled + appropriate policies
- **Policy completeness:** SELECT, INSERT, UPDATE, DELETE policies as needed per table

### Tooling
- **Type generation:** Always run `pnpm db:types` after schema changes
- **MCP awareness:** Supabase MCP server is available — use it for schema inspection, queries, debugging

**Auto-fix targets:**
- Unused schema fields (flag for removal or implement usage)
- Incomplete data fetching (add missing fields to queries)
- Wrong Supabase client used in context
- Missing type regeneration after migrations
- Incorrect storage URL handling
- Missing or overly permissive RLS policies
- Direct DB queries outside API routes

---

## 2. API Route Auditor

**Purpose:** Ensure API routes are the single source of truth for all business logic, properly typed, and production-hardened.

> **The API is the product** — every endpoint should be idempotent where it matters, validated at entry, rate-limited, transactional when needed, versioned for mobile longevity, and tested as if a malicious client will call it with garbage at 3 AM.

**Key aspects to include:**

### Logic Ownership
- **API owns all logic:** Business logic lives in API routes and services, NEVER in components
- **Components are dumb:** UI components call APIs and render responses — they don't compute, validate business rules, or make decisions
- **Detect logic leakage:** Flag any client-side code doing what should be server-side (calculations, state transitions, eligibility checks)
- **Algorithm separation:** Complex logic (matching, scoring, eligibility) lives in dedicated files under `lib/` (e.g., `lib/matching/algorithm.ts`), not inline in routes

### Type Safety
- **Strict types everywhere:** No `any`, no `as unknown as X`, no type assertions to silence errors
- **Database types:** All queries use generated types from `@/types/database.types`
- **Request/response types:** Define explicit types for request bodies and response shapes
- **End-to-end typing:** Types flow from DB → API → Client without breaks or manual casting

### Server-Side Validation
- **Server is ultimate authority:** Even if client validates, API must re-validate everything
- **Never trust client input:** Validate all fields, check permissions, verify ownership
- **Fail loudly:** Invalid input returns clear error messages, not silent failures

### Request Handling
- **Standard response format:** `{ success: true, data, msg }` for success, `{ success: false, msg, error? }` for errors
- **Auth pattern:** Always `await createApiClient()` → check `user` → proceed
- **Error taxonomy:** 400 bad input, 401 unauth, 403 forbidden, 404 not found, 409 conflict, 429 rate limit, 500 server error
- **Input compatibility:** Support both `PascalCase` (web) and `snake_case` (mobile) field names

### Production Hardening
- **Idempotency:** Mutating operations (POST/PUT/DELETE) should be safe to retry without side effects
- **Rate limiting:** Protect against abuse, especially auth and expensive operations
- **Transactional integrity:** Multi-step operations should succeed or fail atomically
- **Graceful degradation:** Handle external service failures without crashing

### Standards
- **Pagination:** Use cursor-based pagination for lists, consistent `limit`/`cursor` params
- **Audit logging:** Sensitive operations (account changes, payments, admin actions) should be logged
- **Versioning awareness:** Consider mobile app longevity — breaking changes need migration paths

**Auto-fix targets:**
- Business logic in components (move to API)
- `any` types or unsafe casting (add proper types)
- Missing server-side validation (add validation)
- Non-standard response formats (standardize)
- Missing auth checks (add checks)
- Inline complex logic (extract to `lib/` modules)
- Client-side eligibility/permission checks without server mirror (add server validation)

---

## 3. Next.js 16 App Router Expert

**Purpose:** Ensure latest Next.js 16 patterns are used correctly and enforce SSOT for data access.

> **Note:** This codebase already correctly uses async `cookies()`, `headers()`, `params`, and `searchParams` with proper `Promise<{...}>` typing. No rules needed for those patterns.

**Key aspects to include:**

### SSOT Violation: Web Direct DB Access

**Critical issue:** Web pages bypass API routes and query Supabase directly, while mobile calls `/api/...` endpoints. This breaks cross-platform parity.

```typescript
// ❌ CURRENT (16 pages do this) — web/src/app/(app)/profile/edit/page.tsx
"use client";
const supabase = createClient();
const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id);

// ✅ CORRECT — Call API routes (same as mobile)
const response = await fetch("/api/users/me");
const { data } = await response.json();
```

**Affected pages (audit needed):**
- `matches/page.tsx`, `favorites/page.tsx`, `profile/page.tsx`, `profile/edit/page.tsx`
- `discover/page.tsx`, `chats/page.tsx`, `chats/[id]/page.tsx`
- `settings/*.tsx`, `profile/gallery/page.tsx`, `speed-dating/page.tsx`

**Fix pattern:** Extract shared logic to `lib/services/`, call from both API routes and Server Components.

---

### Server vs Client Components

**Rule:** Only add `"use client"` when you need hooks, browser APIs, or event handlers.

```typescript
// ❌ WRONG — LoadingSkeleton.tsx has "use client" but uses nothing that requires it
"use client";
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-md bg-gray-200", className)} />;
}

// ✅ CORRECT — Remove directive, it's a pure render component
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-md bg-gray-200", className)} />;
}
```

**When "use client" IS needed:**
- `useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`
- Event handlers (`onClick`, `onChange`, `onSubmit`)
- Browser APIs (`window`, `localStorage`, `navigator`)
- Third-party client libraries (Agora, etc.)

---

### Caching Strategy (Not Yet Implemented)

Next.js 16 caching is opt-in. Currently **zero caching** in use — consider adding:

```typescript
// Enable in next.config.ts
const nextConfig = {
  cacheComponents: true,
}

// For expensive queries (discovery, products, events)
async function getDiscoveryProfiles(filters: Filters) {
  'use cache'
  cacheTag('discovery', `user-${userId}`)
  cacheLife('minutes')  // Presets: seconds, minutes, hours, days, max
  return await db.profiles.findMany(filters)
}

// Invalidation after mutations
'use server'
import { revalidateTag } from 'next/cache'

export async function likeProfile(targetId: string) {
  await db.likes.create(...)
  revalidateTag('discovery')  // Stale-while-revalidate
}
```

**Good candidates for caching:**
- Discovery profiles (per-user, cache 5 min)
- Events list (cache 1 hour)
- Products/rewards (cache 1 day)
- Life goals options (cache max)

---

### Route Handlers vs Server Actions

| Use Case | Use This | Why |
|----------|----------|-----|
| Mobile app calling backend | **Route Handlers** (`/api/...`) | Stable, versioned API contract |
| Web-only mutations (forms) | **Server Actions** | Type-safe, less boilerplate |
| Webhooks (Stripe, etc.) | **Route Handlers** | External services need stable URLs |

**Current pattern:** Server Actions only used for inline `signOut()`. Consider for:
- Profile edit form (currently client-side Supabase)
- Settings updates
- Any web-only mutation

---

### Data Access Layer (Recommended Pattern)

Extract shared logic from API routes to `lib/services/`:

```typescript
// lib/services/users.ts — Shared logic
export async function getUserProfile(userId: string) {
  const supabase = await createApiClient()
  const { data } = await supabase.from("profiles").select("*").eq("user_id", userId).single()
  return data
}

// app/api/users/me/route.ts — For mobile
export async function GET() {
  const user = await getAuthUser()
  const profile = await getUserProfile(user.id)
  return NextResponse.json({ success: true, data: profile })
}

// app/(app)/profile/page.tsx — For web (Server Component)
export default async function ProfilePage() {
  const user = await getAuthUser()
  const profile = await getUserProfile(user.id)
  return <ProfileView profile={profile} />
}
```

---

### next.config.ts Setup

Current config is empty. Recommended:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable caching components
  cacheComponents: true,
  
  // Turbopack settings (now default bundler)
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
};

export default nextConfig;
```

---

**Auto-fix targets:**
- Direct Supabase queries in pages (migrate to API calls or Server Actions)
- Unnecessary `"use client"` directives (audit all 64 files)
- Missing caching for expensive queries
- Empty next.config.ts

---

## 4. Supabase Architecture Advisor

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
| 1 | Supabase Expert | DB architecture, auth, storage, RLS — foundational |
| 2 | API Route Auditor | 76+ endpoints need consistency |
| 3 | Next.js 16 Expert | Prevents outdated patterns |
| 4 | Supabase Architecture Advisor | Optimization opportunities |

---

## Notes for Skill Creation

- Each skill should have a clear **scope restriction** (what it touches, what it never touches)
- Include a **pre-completion checklist** specific to that skill's domain
- Reference `mobile/lib/api.ts` and `web/src/lib/supabase/server.ts` as canonical patterns
- Skills should be usable independently or in sequence
