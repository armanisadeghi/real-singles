# Mobile & Web Performance Standards - REQUIRED IMPLEMENTATION

> **Official guide:** `~/.arman/rules/nextjs-best-practices/nextjs-guide.md` — §15 (Operational Best Practices) covers web-side performance enforcement (forbidden patterns, image transforms, query rules, budgets). This document covers the full mobile + web implementation plan.

**Effective Immediately**: All applications must implement these performance standards. This is not optional.

---

## 1. LOCAL-FIRST DATA ARCHITECTURE (MANDATORY)

### Mobile (React Native/Expo)

**Install MMKV (Required):**

```bash
npm install react-native-mmkv
```

**Implement caching pattern:**

```typescript
import { MMKV } from 'react-native-mmkv'

const storage = new MMKV()

// Cache data with timestamp
const cacheData = (key: string, data: any) => {
  storage.set(key, JSON.stringify(data))
  storage.set(`${key}_timestamp`, Date.now())
}

// ALWAYS serve cached data first, refresh in background
const getData = async (key: string, fetchFn: () => Promise<any>, ttl: number = 300000) => {
  const cached = storage.getString(key)
  const timestamp = storage.getNumber(`${key}_timestamp`)

  if (cached && timestamp && Date.now() - timestamp < ttl) {
    // Return cached immediately, refresh in background
    fetchFn().then(fresh => cacheData(key, fresh))
    return JSON.parse(cached)
  }

  const fresh = await fetchFn()
  cacheData(key, fresh)
  return fresh
}
```

### Web (Next.js)

**Implement client-side caching:**

```typescript
// lib/cache.ts
const cache = new Map<string, { data: any; timestamp: number }>()

export const getCachedData = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 300000
): Promise<T> => {
  const cached = cache.get(key)

  if (cached && Date.now() - cached.timestamp < ttl) {
    // Return cached, refresh in background
    fetchFn().then(data => cache.set(key, { data, timestamp: Date.now() }))
    return cached.data
  }

  const data = await fetchFn()
  cache.set(key, { data, timestamp: Date.now() })
  return data
}
```

**Use Next.js caching aggressively:**

```typescript
// app/api/data/route.ts
export const revalidate = 300 // 5 minutes

export async function GET() {
  const data = await fetchFromSupabase()
  return Response.json(data)
}
```

### ACTION ITEMS:
- [ ] Replace ALL AsyncStorage usage with MMKV (mobile)
- [ ] Implement cache-first pattern for ALL data fetching
- [ ] Set appropriate TTLs per data type (user data: 5min, static content: 1hr)
- [ ] Show cached data immediately on app open

---

## 2. IMAGE OPTIMIZATION (CRITICAL)

### Mobile

**Use expo-image exclusively:**

```typescript
import { Image } from 'expo-image'

// REQUIRED pattern for all images
<Image
  source={{ uri: imageUrl }}
  placeholder={blurhash}
  contentFit="cover"
  cachePolicy="memory-disk"
  transition={200}
/>

// REQUIRED: Preload critical images
Image.prefetch(imageUrls)
```

### Web

**Use Next.js Image component:**

```typescript
import Image from 'next/image'

<Image
  src={imageUrl}
  alt="description"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL={blurhash}
  quality={80}
  priority={isCritical}
/>
```

### Supabase Image Transformations (REQUIRED)

**NEVER serve full-resolution images:**

```typescript
// Mobile
const optimizedUrl = `${imageUrl}?width=800&quality=80&format=webp`

// Web - desktop
const desktopUrl = `${imageUrl}?width=1200&quality=85&format=webp`

// Web - mobile
const mobileUrl = `${imageUrl}?width=600&quality=80&format=webp`
```

### ACTION ITEMS:
- [ ] Replace ALL Image components with expo-image (mobile) or next/image (web)
- [ ] Add Supabase transformation parameters to ALL image URLs
- [ ] Generate and store blurhash for ALL uploaded images
- [ ] Implement image preloading for next screens/pages
- [ ] Convert image uploads to WebP format server-side

---

## 3. DATABASE OPTIMIZATION (NON-NEGOTIABLE)

### Query Optimization

**NEVER use select('*'):**

```typescript
// ❌ FORBIDDEN
const { data } = await supabase.from('table').select('*')

// ✅ REQUIRED
const { data } = await supabase
  .from('table')
  .select('id, name, created_at, related_table(specific_fields)')
  .limit(20)
```

### Database Indexes (REQUIRED)

**Add indexes for ALL frequently queried columns:**

```sql
-- User queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Search/filter queries
CREATE INDEX idx_records_status ON records(status) WHERE status != 'archived';
CREATE INDEX idx_records_user_id ON records(user_id);

-- Geographic queries (if applicable)
CREATE INDEX idx_locations_geo ON locations USING GIST(coordinates);
```

### ACTION ITEMS:
- [ ] Audit ALL queries and specify exact fields needed
- [ ] Create indexes for ALL where, order by, and join columns
- [ ] Add composite indexes for multi-column queries
- [ ] Use `.limit()` on ALL queries (default: 20)

---

## 4. REACT PERFORMANCE (MANDATORY)

### Mobile

**Use FlashList, NEVER ScrollView with .map():**

```typescript
import { FlashList } from "@shopify/flash-list"

<FlashList
  data={items}
  renderItem={({ item }) => <ItemComponent item={item} />}
  estimatedItemSize={100}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

### Web

**Use virtualization for long lists:**

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 100,
})
```

### Both Platforms

**Memoization (REQUIRED for all list items):**

```typescript
const ItemComponent = React.memo(({ item }) => {
  return <div>{item.name}</div>
}, (prev, next) => prev.item.id === next.item.id)

// Use useMemo for expensive computations
const filteredData = useMemo(
  () => data.filter(item => item.status === 'active'),
  [data]
)
```

### ACTION ITEMS:
- [ ] Replace ALL ScrollView usage with FlashList (mobile)
- [ ] Implement virtualization for lists with 20+ items (web)
- [ ] Add React.memo to ALL list item components
- [ ] Use useMemo for ALL filter/sort/map operations

---

## 5. API OPTIMIZATION (REQUIRED)

### Batch Requests

**Combine related queries:**

```typescript
// ❌ FORBIDDEN - Multiple requests
const user = await getUser()
const posts = await getPosts()
const comments = await getComments()

// ✅ REQUIRED - Single request
const { user, posts, comments } = await supabase
  .rpc('get_dashboard_data', { user_id })
```

### Edge Functions (Next.js)

**Use edge runtime for ALL API routes:**

```typescript
// app/api/*/route.ts
export const runtime = 'edge'
export const revalidate = 300

export async function GET(request: Request) {
  // Your logic
}
```

### ACTION ITEMS:
- [ ] Create Supabase RPC functions for multi-table queries
- [ ] Combine related API calls into single endpoints
- [ ] Set `runtime = 'edge'` on ALL Next.js API routes
- [ ] Add appropriate revalidate times to ALL routes

---

## 6. NETWORK OPTIMIZATION (MANDATORY)

### Request Deduplication

```typescript
// lib/request-cache.ts
const pendingRequests = new Map<string, Promise<any>>()

export async function dedupedRequest<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!
  }

  const promise = fn().finally(() => pendingRequests.delete(key))
  pendingRequests.set(key, promise)
  return promise
}
```

### Background Sync (Mobile)

```typescript
import * as BackgroundFetch from 'expo-background-fetch'
import * as TaskManager from 'expo-task-manager'

TaskManager.defineTask('BACKGROUND_SYNC', async () => {
  await syncCriticalData()
  return BackgroundFetch.BackgroundFetchResult.NewData
})

BackgroundFetch.registerTaskAsync('BACKGROUND_SYNC', {
  minimumInterval: 15 * 60,
  stopOnTerminate: false,
  startOnBoot: true,
})
```

### ACTION ITEMS:
- [ ] Implement request deduplication for ALL data fetching
- [ ] Set up background sync for critical data (mobile)
- [ ] Use SWR or React Query for automatic request caching (web)

---

## 7. BUNDLE SIZE OPTIMIZATION (WEB ONLY)

### next.config.js (REQUIRED):

```javascript
module.exports = {
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    formats: ['image/webp'],
    remotePatterns: [
      { hostname: 'your-supabase-project.supabase.co' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
  },
}
```

### Dynamic imports for heavy components:

```typescript
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <Skeleton />,
  ssr: false,
})
```

### ACTION ITEMS:
- [ ] Enable production console removal
- [ ] Dynamic import ALL charts, modals, heavy components
- [ ] Analyze bundle with @next/bundle-analyzer
- [ ] Keep page bundles under 200KB

---

## 8. PERFORMANCE MONITORING (REQUIRED)

### Track Load Times

**Mobile:**

```typescript
import { performance } from 'react-native-performance'

performance.mark('screen-load-start')
// Load screen
performance.mark('screen-load-end')
performance.measure('screen-load', 'screen-load-start', 'screen-load-end')
```

**Web:**

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### ACTION ITEMS:
- [ ] Install performance monitoring on ALL apps
- [ ] Track critical user journeys (login, main screen load, data fetch)
- [ ] Set up Vercel Analytics and Speed Insights (web)
- [ ] Monitor and report performance metrics weekly

---

## 9. MANDATORY PERFORMANCE TARGETS

### Mobile (React Native/Expo):
- App opens to cached content in < 500ms
- Screen transitions complete in < 16ms (60 FPS)
- First data render in < 1 second
- Images appear with blurhash in < 100ms

### Web (Next.js):
- Lighthouse Performance score > 90
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
- Time to Interactive < 3.5s
- Cumulative Layout Shift < 0.1

---

## 10. IMPLEMENTATION CHECKLIST

### Week 1 (Critical Path)
- [ ] Install and configure MMKV (mobile)
- [ ] Replace ALL `select('*')` queries with specific fields
- [ ] Add Supabase image transformations to ALL image URLs
- [ ] Implement cache-first data pattern in 3 most-used screens/pages

### Week 2 (High Priority)
- [ ] Replace Image with expo-image (mobile) or next/image (web)
- [ ] Add database indexes for ALL frequently queried columns
- [ ] Replace ScrollView with FlashList (mobile)
- [ ] Add React.memo to ALL list item components

### Week 3 (Required Optimizations)
- [ ] Generate and store blurhash for ALL images
- [ ] Implement request deduplication
- [ ] Set up edge runtime for ALL API routes (web)
- [ ] Add performance monitoring to ALL apps

### Week 4 (Polish & Verification)
- [ ] Implement background sync (mobile)
- [ ] Dynamic imports for heavy components (web)
- [ ] Verify ALL apps meet performance targets
- [ ] Document performance metrics

---

## ENFORCEMENT

- Code reviews will block PRs that violate these standards
- Performance regressions will be rejected
- Weekly performance reports required for all projects

**These are not suggestions. These are requirements. Every app must meet these standards within 4 weeks.**

Questions or blockers should be escalated immediately.
