# Next.js 16 Patterns Reference

Detailed code patterns and templates for RealSingles Next.js 16 implementation.

---

## SSOT Fix Pattern: Shared Services

When you find a web page querying Supabase directly, extract to a shared service.

### Step 1: Create Service (if not exists)

```typescript
// lib/services/profiles.ts
import { createServerClient } from '@/lib/supabase/server'

export async function getUserProfile(userId: string) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error) throw error
  return data
}

export async function updateUserProfile(userId: string, updates: Partial<Profile>) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}
```

### Step 2: Use in API Route

```typescript
// app/api/users/me/route.ts
import { getUserProfile, updateUserProfile } from '@/lib/services/profiles'
import { createApiClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createApiClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ success: false, msg: 'Unauthorized' }, { status: 401 })
  }

  const profile = await getUserProfile(user.id)
  return NextResponse.json({ success: true, data: profile })
}
```

### Step 3: Web Page Calls API Route

```typescript
// app/(app)/profile/page.tsx
"use client";
import { useEffect, useState } from 'react'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  
  useEffect(() => {
    fetch('/api/users/me')
      .then(res => res.json())
      .then(({ data }) => setProfile(data))
  }, [])
  
  if (!profile) return <Loading />
  return <ProfileView profile={profile} />
}
```

### Alternative: Server Component with Service

```typescript
// app/(app)/profile/page.tsx — Server Component
import { getUserProfile } from '@/lib/services/profiles'
import { createServerClient } from '@/lib/supabase/server'

export default async function ProfilePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')
  
  const profile = await getUserProfile(user.id)
  return <ProfileView profile={profile} />
}
```

---

## Removing Unnecessary "use client"

### Audit Checklist

When reviewing a `"use client"` component, check:

| Check | If NO → Remove "use client" |
|-------|----------------------------|
| Uses `useState`? | |
| Uses `useEffect`? | |
| Uses `useRef`? | |
| Uses any other hook? | |
| Has `onClick`, `onChange`, etc.? | |
| Uses `window`, `localStorage`, etc.? | |

### Before/After Examples

```typescript
// ❌ BEFORE: Unnecessary "use client"
"use client";
import { cn } from "@/lib/utils";

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn("rounded-lg border bg-white p-4", className)}>
      {children}
    </div>
  );
}

// ✅ AFTER: Server Component
import { cn } from "@/lib/utils";

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn("rounded-lg border bg-white p-4", className)}>
      {children}
    </div>
  );
}
```

```typescript
// ❌ BEFORE: "use client" for props display only
"use client";

export function UserInfo({ user }: { user: User }) {
  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}

// ✅ AFTER: Server Component
export function UserInfo({ user }: { user: User }) {
  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

---

## Route Handler Template (RealSingles Standard)

Use this template for all 76+ API endpoints. Supports both mobile (snake_case) and web (camelCase).

```typescript
// app/api/[resource]/route.ts
import { createApiClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Support both mobile (snake_case) and web (camelCase)
const updateSchema = z.object({
  firstName: z.string().optional(),
  first_name: z.string().optional(),
}).transform(data => ({
  firstName: data.firstName ?? data.first_name,
}))

export async function GET(request: Request) {
  try {
    const supabase = await createApiClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, msg: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await fetchResource(user.id)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, msg: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createApiClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, msg: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validated = updateSchema.parse(body)
    
    // Business logic in data access layer
    const result = await updateResource(user.id, validated)
    
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, msg: 'Invalid input', errors: error.errors },
        { status: 400 }
      )
    }
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, msg: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## Dynamic Route Handler Template

For routes with `[id]` or other dynamic segments.

```typescript
// app/api/[resource]/[id]/route.ts
import { createApiClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params  // MUST await in Next.js 16
    
    const supabase = await createApiClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, msg: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await fetchResourceById(id, user.id)
    
    if (!data) {
      return NextResponse.json(
        { success: false, msg: 'Not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, msg: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const supabase = await createApiClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, msg: 'Unauthorized' },
        { status: 401 }
      )
    }

    await deleteResource(id, user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, msg: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## Page Component Template

For pages with dynamic params and searchParams.

```typescript
// app/(app)/[resource]/[id]/page.tsx
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string; filter?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const data = await fetchResource(id)
  
  return {
    title: data?.name ?? 'Not Found',
  }
}

export default async function ResourcePage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { tab = 'overview', filter } = await searchParams
  
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    notFound()
  }
  
  const data = await fetchResource(id)
  
  if (!data) {
    notFound()
  }
  
  return (
    <div>
      <h1>{data.name}</h1>
      {/* Render based on tab */}
    </div>
  )
}
```

---

## Server Action Template

For web-only mutations.

```typescript
// app/actions/profile.ts
'use server'

import { createApiClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const updateProfileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  bio: z.string().max(500).optional(),
})

export async function updateProfile(formData: FormData) {
  const supabase = await createApiClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  const raw = Object.fromEntries(formData)
  const validated = updateProfileSchema.parse(raw)
  
  const { error } = await supabase
    .from('users')
    .update(validated)
    .eq('id', user.id)
  
  if (error) {
    throw new Error('Failed to update profile')
  }
  
  revalidatePath('/profile')
  return { success: true }
}
```

---

## Server Action with Immediate Cache Update

When user expects to see changes immediately.

```typescript
// app/actions/favorites.ts
'use server'

import { createApiClient } from '@/lib/supabase/server'
import { updateTag } from 'next/cache'

export async function toggleFavorite(profileId: string) {
  const supabase = await createApiClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  // Check if already favorited
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('profile_id', profileId)
    .single()
  
  if (existing) {
    await supabase
      .from('favorites')
      .delete()
      .eq('id', existing.id)
  } else {
    await supabase
      .from('favorites')
      .insert({ user_id: user.id, profile_id: profileId })
  }
  
  // User sees changes immediately
  updateTag('favorites')
  updateTag(`profile-${profileId}`)
  
  return { success: true, favorited: !existing }
}
```

---

## Cached Data Fetching

For data that doesn't change frequently.

```typescript
// lib/data-access/events.ts
import { cacheLife, cacheTag } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export async function getUpcomingEvents() {
  'use cache'
  cacheTag('events')
  cacheLife('hours')  // Refresh every hour
  
  const supabase = await createServerClient()
  
  const { data } = await supabase
    .from('events')
    .select('*')
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(20)
  
  return data ?? []
}

// Invalidation (call from Server Action after event creation)
import { revalidateTag } from 'next/cache'

export async function createEvent(data: EventData) {
  // ... create event
  revalidateTag('events')
}
```

---

## Layout with Auth Check

```typescript
// app/(app)/layout.tsx
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  return (
    <div className="min-h-dvh">
      <Header user={user} />
      <main>{children}</main>
      <BottomNav />
    </div>
  )
}
```

---

## Client Component with Server Action

```typescript
// components/LikeButton.tsx
'use client'

import { useState, useTransition } from 'react'
import { toggleLike } from '@/app/actions/likes'
import { Heart } from 'lucide-react'

interface LikeButtonProps {
  profileId: string
  initialLiked: boolean
}

export function LikeButton({ profileId, initialLiked }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [isPending, startTransition] = useTransition()
  
  const handleClick = () => {
    // Optimistic update
    setLiked(!liked)
    
    startTransition(async () => {
      try {
        const result = await toggleLike(profileId)
        setLiked(result.liked)
      } catch {
        // Revert on error
        setLiked(liked)
      }
    })
  }
  
  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="p-2 rounded-full"
    >
      <Heart
        className={liked ? 'fill-red-500 text-red-500' : 'text-gray-400'}
      />
    </button>
  )
}
```

---

## Proxy (Middleware) Example

```typescript
// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Redirect old URLs
  if (pathname.startsWith('/app/')) {
    return NextResponse.redirect(
      new URL(pathname.replace('/app', ''), request.url)
    )
  }
  
  // Add headers
  const response = NextResponse.next()
  response.headers.set('x-pathname', pathname)
  
  return response
}

export const config = {
  matcher: [
    // Skip static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
}
```

---

## Type Definitions

```typescript
// types/next.ts

// Page props with async params
export interface PageProps<
  TParams extends Record<string, string> = Record<string, string>,
  TSearchParams extends Record<string, string> = Record<string, string>
> {
  params: Promise<TParams>
  searchParams: Promise<TSearchParams>
}

// Layout props
export interface LayoutProps {
  children: React.ReactNode
  params: Promise<Record<string, string>>
}

// Route handler context
export interface RouteContext<TParams extends Record<string, string>> {
  params: Promise<TParams>
}

// Usage example
export default async function UserPage({ params }: PageProps<{ id: string }>) {
  const { id } = await params
  // ...
}
```

---

## Migration Checklist

### 1. Run Codemod

```bash
npx @next/codemod@canary upgrade latest
```

### 2. Search for Manual Fixes

Search codebase for:
- `@next-codemod-error` — codemod couldn't fix
- `params.` without preceding `await params`
- `searchParams.` without preceding `await searchParams`
- `cookies()` without `await`
- `headers()` without `await`
- `draftMode()` without `await`

### 3. Update Types

Find and update all page/layout types:

```typescript
// Before
{ params: { id: string } }

// After
{ params: Promise<{ id: string }> }
```

### 4. Rename Middleware

```bash
mv middleware.ts proxy.ts
```

Update config flags if present.

### 5. Verify Build

```bash
pnpm build
```

Fix any type errors or runtime issues.

---

## next.config.ts Template

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable new caching system
  cacheComponents: true,
  
  // Turbopack configuration
  turbopack: {
    resolveAlias: {
      // Handle any Node.js modules if needed
    },
  },
  
  // Enable filesystem cache for faster dev
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

export default nextConfig
```

---

## Common Errors and Fixes

### "params is not defined"

```typescript
// ❌ Error
export async function GET(request: Request, { params }) {
  const { id } = params  // params is Promise, not object
}

// ✅ Fix
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
}
```

### "cookies() is a function, not a cookies object"

```typescript
// ❌ Error
const session = cookies().get('session')

// ✅ Fix
const cookieStore = await cookies()
const session = cookieStore.get('session')
```

### "Cannot read properties of Promise"

```typescript
// ❌ Error
export default async function Page({ searchParams }) {
  const page = searchParams.page  // searchParams is Promise

// ✅ Fix
export default async function Page({ 
  searchParams 
}: { 
  searchParams: Promise<{ page?: string }> 
}) {
  const { page } = await searchParams
}
```

### Type error with params

```typescript
// ❌ Error: Property 'slug' does not exist on type 'Promise<...>'
function Page({ params }: { params: { slug: string } }) {
  return <div>{params.slug}</div>
}

// ✅ Fix: Add Promise wrapper and await
async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <div>{slug}</div>
}
```
