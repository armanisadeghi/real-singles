---
name: nextjs-app-router-expert
description: Enforces SSOT for data access (web must use API routes, not direct Supabase), proper server/client component boundaries, and Next.js 16 patterns. Use when working with Next.js pages, components, API routes, data fetching, or when you see direct Supabase queries in web pages. Applies to all web code in /web directory.
---

# Next.js 16 App Router Expert

**Your job:** Enforce SSOT for data access, proper component boundaries, and Next.js 16 patterns.

---

## Scope: Web Only

| Action | Allowed |
|--------|---------|
| Modify `/web` Next.js code | ✅ Yes |
| Create/update API routes | ✅ Yes |
| Add Server Actions | ✅ Yes |
| Modify `/mobile` in any way | ❌ NEVER |

---

## VIOLATION #1: Direct Supabase Access in Web Pages (CRITICAL)

**This is a cross-platform parity violation.** Mobile calls API routes. Web MUST do the same.

### The Rule

| Location | Direct Supabase Query | Via API Route/Service |
|----------|----------------------|----------------------|
| Web pages/components | ❌ **FORBIDDEN** | ✅ Required |
| API routes (`/api/...`) | ✅ Allowed | ✅ Allowed |
| Server Actions | ✅ Allowed (via shared service) | ✅ Allowed |

### Violation Pattern

```typescript
// ❌ VIOLATION — Web page querying Supabase directly
"use client";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const supabase = createClient();
  
  useEffect(() => {
    // This bypasses API routes — mobile doesn't do this!
    supabase.from("profiles").select("*").eq("user_id", userId)
      .then(({ data }) => setProfile(data));
  }, []);
}
```

### Correct Patterns

**Option 1: Call API route (preferred for consistency with mobile)**

```typescript
// ✅ CORRECT — Web page calls API route
"use client";

export default function ProfilePage() {
  useEffect(() => {
    fetch("/api/users/me")
      .then(res => res.json())
      .then(({ data }) => setProfile(data));
  }, []);
}
```

**Option 2: Server Component with shared service**

```typescript
// ✅ CORRECT — Server Component uses shared service
// lib/services/users.ts
export async function getUserProfile(userId: string) {
  const supabase = await createServerClient();
  return supabase.from("profiles").select("*").eq("user_id", userId).single();
}

// app/(app)/profile/page.tsx — Server Component
import { getUserProfile } from "@/lib/services/users";

export default async function ProfilePage() {
  const { data: profile } = await getUserProfile(userId);
  return <ProfileView profile={profile} />;
}

// app/api/users/me/route.ts — API route uses same service
import { getUserProfile } from "@/lib/services/users";

export async function GET() {
  // ... auth check
  const { data } = await getUserProfile(user.id);
  return NextResponse.json({ success: true, data });
}
```

### Why This Matters

1. **Business logic drift:** Web implements logic differently than mobile
2. **Bug duplication:** Fix in API route doesn't fix web (and vice versa)
3. **Testing complexity:** Two code paths to test
4. **Maintainability:** Changes require updating multiple places

### Enforcement

When you encounter direct Supabase access in a web page/component:

1. **Stop and flag it** as a SSOT violation
2. **Check if API route exists** for this data
3. **If yes:** Refactor to call the API route
4. **If no:** Create shared service in `lib/services/`, use in both API route and page

---

## VIOLATION #2: Unnecessary "use client" Directives

**Only add `"use client"` when the component genuinely requires it.**

### When "use client" IS Required

| Requirement | Example |
|-------------|---------|
| React state hooks | `useState`, `useReducer` |
| Effect hooks | `useEffect`, `useLayoutEffect` |
| Ref hooks | `useRef`, `useImperativeHandle` |
| Event handlers | `onClick`, `onChange`, `onSubmit` |
| Browser APIs | `window`, `localStorage`, `navigator` |
| Third-party client libs | Agora, analytics SDKs |

### When "use client" is a VIOLATION

```typescript
// ❌ VIOLATION — No hooks, no events, no browser APIs
"use client";
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-md bg-gray-200", className)} />;
}

// ❌ VIOLATION — Pure display component
"use client";
export function UserAvatar({ src, name }: AvatarProps) {
  return <img src={src} alt={name} className="rounded-full" />;
}

// ❌ VIOLATION — Only receives and displays props
"use client";
export function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <div>
      <h2>{profile.name}</h2>
      <p>{profile.bio}</p>
    </div>
  );
}
```

### Correct Versions

```typescript
// ✅ CORRECT — Remove unnecessary directive
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-md bg-gray-200", className)} />;
}

// ✅ CORRECT — "use client" justified by onClick
"use client";
export function LikeButton({ profileId }: { profileId: string }) {
  const [liked, setLiked] = useState(false);
  return <button onClick={() => setLiked(!liked)}>♥</button>;
}
```

### Enforcement

When reviewing or creating components:

1. **Does it use hooks?** → `"use client"` justified
2. **Does it have event handlers?** → `"use client"` justified
3. **Does it access browser APIs?** → `"use client"` justified
4. **None of the above?** → **Remove `"use client"`**

---

## Data Access Architecture

### The SSOT Pattern for RealSingles

```
┌─────────────────────────────────────────────────────────────┐
│                     lib/services/                           │
│   Shared business logic, validation, Supabase queries       │
└─────────────────────────────────────────────────────────────┘
            ▲                           ▲
            │                           │
┌───────────┴───────────┐   ┌──────────┴──────────┐
│   API Routes          │   │   Server Components │
│   /api/users/me       │   │   app/(app)/...     │
│   /api/matches        │   │   (can use services │
│   (mobile + web)      │   │   directly)         │
└───────────────────────┘   └─────────────────────┘
            ▲                           ▲
            │                           │
┌───────────┴───────────┐   ┌──────────┴──────────┐
│   Mobile App          │   │   Web Client        │
│   fetch('/api/...')   │   │   Components        │
└───────────────────────┘   └─────────────────────┘
```

### Where Supabase Access IS Allowed

| Location | Allowed | Pattern |
|----------|---------|---------|
| `lib/services/*.ts` | ✅ | Shared service functions |
| `app/api/**/route.ts` | ✅ | Via services or direct |
| Server Actions | ✅ | Via services |
| Server Components | ✅ | Via services only |
| Client Components | ❌ | **NEVER** — call API route |

---

## Route Handlers vs Server Actions

| Use Case | Use This |
|----------|----------|
| Mobile app calling backend | **Route Handlers** (`/api/...`) |
| Web forms/mutations | **Server Actions** |
| Webhooks (Stripe, etc.) | **Route Handlers** |
| Third-party integrations | **Route Handlers** |
| Web-only internal mutations | **Server Actions** |

**Both should use shared services from `lib/services/`.**

---

## Async Request APIs (Reference)

> **Note:** This codebase already correctly uses async patterns. This section is for reference when writing new code.

These APIs return Promises in Next.js 16:

| API | Correct Usage |
|-----|---------------|
| `params` | `const { id } = await params` |
| `searchParams` | `const { page } = await searchParams` |
| `cookies()` | `const cookieStore = await cookies()` |
| `headers()` | `const headersList = await headers()` |

```typescript
// Correct page signature
export default async function Page({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<Record<string, string>>
}) {
  const { id } = await params;
  const { page } = await searchParams;
}

// Correct route handler signature
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
}
```

---

## Caching (Opt-In)

Next.js 16 caching is explicit. Use when beneficial for performance.

```typescript
// Enable in next.config.ts
const nextConfig = {
  cacheComponents: true,
}

// Cached function
async function getStaticData() {
  'use cache'
  cacheTag('static-data')
  cacheLife('hours')  // Presets: seconds, minutes, hours, days, max
  return await fetchData();
}

// Invalidation
import { revalidateTag } from 'next/cache'

export async function mutateData() {
  await updateData();
  revalidateTag('static-data');
}
```

---

## Pre-Completion Checklist

### SSOT Compliance (CRITICAL)

- [ ] No direct Supabase queries in web pages/components
- [ ] Client components call API routes for data
- [ ] Server components use shared services from `lib/services/`
- [ ] API routes use shared services (or have logic that should be extracted)

### Component Boundaries

- [ ] `"use client"` only on components that need hooks/events/browser APIs
- [ ] Pure display components are Server Components
- [ ] Business logic NOT in Client Components

### Next.js 16 Patterns

- [ ] All `params`, `searchParams` awaited
- [ ] All `cookies()`, `headers()` awaited
- [ ] Types include `Promise<>` wrappers

---

## What NOT to Do

- ❌ **NEVER** query Supabase directly from web pages/components
- ❌ **NEVER** add `"use client"` to pure display components
- ❌ **NEVER** duplicate business logic between web and API routes
- ❌ Don't put business logic in Client Components
- ❌ Don't access `params`/`searchParams` synchronously

---

## Reference

| File | Purpose |
|------|---------|
| `web/src/lib/services/` | Shared data access (create if missing) |
| `web/src/app/api/users/me/route.ts` | Route handler pattern |
| `web/src/app/(app)/layout.tsx` | Authenticated layout |

For detailed templates, see [nextjs16-patterns-reference.md](nextjs16-patterns-reference.md).
