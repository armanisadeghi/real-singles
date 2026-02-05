---
name: performance-expert
description: Enforce mobile and web performance standards including cache-first data, image optimization, query efficiency, list rendering, bundle size, and monitoring. Use when implementing data fetching, displaying images, writing database queries, rendering lists, optimizing API routes, or when the user mentions performance, caching, MMKV, FlashList, image optimization, bundle size, or load times.
---

# Performance Expert

> Every screen loads instantly from cache. Every image is optimized. Every query selects only what it needs. No exceptions.

## 1. Local-First Data Architecture

### Mobile — MMKV (required, replaces AsyncStorage)

```typescript
import { MMKV } from 'react-native-mmkv'

const storage = new MMKV()

const cacheData = (key: string, data: unknown) => {
  storage.set(key, JSON.stringify(data))
  storage.set(`${key}_timestamp`, Date.now())
}

// Serve cached immediately, refresh in background
const getData = async <T>(key: string, fetchFn: () => Promise<T>, ttl = 300000): Promise<T> => {
  const cached = storage.getString(key)
  const timestamp = storage.getNumber(`${key}_timestamp`)

  if (cached && timestamp && Date.now() - timestamp < ttl) {
    fetchFn().then(fresh => cacheData(key, fresh))
    return JSON.parse(cached) as T
  }

  const fresh = await fetchFn()
  cacheData(key, fresh)
  return fresh
}
```

### Web — Client-Side Cache

```typescript
const cache = new Map<string, { data: unknown; timestamp: number }>()

export const getCachedData = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl = 300000
): Promise<T> => {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < ttl) {
    fetchFn().then(data => cache.set(key, { data, timestamp: Date.now() }))
    return cached.data as T
  }
  const data = await fetchFn()
  cache.set(key, { data, timestamp: Date.now() })
  return data
}
```

### TTL Guidelines

| Data Type | TTL |
|-----------|-----|
| User profile | 5 min |
| Match list | 2 min |
| Static content (events, FAQs) | 1 hr |
| App config | 30 min |

---

## 2. Image Optimization

### Mobile — expo-image (required)

```typescript
import { Image } from 'expo-image'

<Image
  source={{ uri: `${imageUrl}?width=800&quality=80&format=webp` }}
  placeholder={blurhash}
  contentFit="cover"
  cachePolicy="memory-disk"
  transition={200}
/>

// Preload next screen's images
Image.prefetch(imageUrls)
```

### Web — next/image (required)

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

### Supabase Transform Sizes

| Context | Width | Quality |
|---------|-------|---------|
| Thumbnail / avatar | 200 | 75 |
| Card / list item | 400 | 80 |
| Full screen (mobile) | 800 | 80 |
| Full screen (web desktop) | 1200 | 85 |

**Pattern:** `${baseUrl}?width=${w}&quality=${q}&format=webp`

**Never serve the original upload.** Always apply transforms.

---

## 3. Database Query Optimization

### Always specify fields

```typescript
// ❌ FORBIDDEN
const { data } = await supabase.from('users').select('*')

// ✅ REQUIRED
const { data } = await supabase
  .from('users')
  .select('id, display_name, avatar_url, created_at')
  .limit(20)
```

### Always add .limit()

Every query must have an explicit limit. Default to 20 for lists.

### Index frequently queried columns

```sql
-- Lookup columns
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Filter + sort columns
CREATE INDEX IF NOT EXISTS idx_records_status_created
  ON records(status, created_at DESC);

-- Geographic queries
CREATE INDEX IF NOT EXISTS idx_locations_geo
  ON locations USING GIST(coordinates);
```

### Batch related data with RPC

```typescript
// ❌ Three separate round-trips
const user = await getUser()
const posts = await getPosts()
const comments = await getComments()

// ✅ Single RPC call
const { data } = await supabase.rpc('get_dashboard_data', { user_id })
```

---

## 4. React Rendering Performance

### Mobile — FlashList (required, replaces ScrollView + map)

```typescript
import { FlashList } from '@shopify/flash-list'

<FlashList
  data={items}
  renderItem={({ item }) => <ItemComponent item={item} />}
  estimatedItemSize={100}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

### Web — Virtualization for 20+ items

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 100,
})
```

### Memoize list items (both platforms)

```typescript
const ItemComponent = React.memo(({ item }: { item: ItemType }) => {
  return <View>...</View>
}, (prev, next) => prev.item.id === next.item.id)
```

**Note:** React Compiler handles most memoization automatically in this project. Use explicit `React.memo` only for list item components where the custom comparator provides a measurable benefit.

---

## 5. API Route Optimization

### Batch related queries into single endpoints

Screens that need data from multiple tables should have a single endpoint that returns everything, or use a Supabase RPC.

### Set revalidation on GET routes

```typescript
export const revalidate = 300 // 5 minutes

export async function GET() {
  const data = await fetchFromSupabase()
  return Response.json(data)
}
```

---

## 6. Network Optimization

### Request deduplication

```typescript
const pending = new Map<string, Promise<unknown>>()

export async function dedupedRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (pending.has(key)) return pending.get(key) as Promise<T>
  const promise = fn().finally(() => pending.delete(key))
  pending.set(key, promise)
  return promise
}
```

### Background sync (mobile)

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

---

## 7. Bundle Size (Web)

### next.config.ts

```typescript
{
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    formats: ['image/webp'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
  },
}
```

### Dynamic imports for heavy components

```typescript
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <Skeleton />,
  ssr: false,
})
```

Keep page bundles under 200KB.

---

## 8. Performance Monitoring

### Mobile

```typescript
import { performance } from 'react-native-performance'

performance.mark('screen-load-start')
// Load screen
performance.mark('screen-load-end')
performance.measure('screen-load', 'screen-load-start', 'screen-load-end')
```

### Web

```typescript
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

// Add to root layout
<Analytics />
<SpeedInsights />
```

---

## 9. Performance Targets

| Platform | Metric | Target |
|----------|--------|--------|
| Mobile | App to cached content | < 500ms |
| Mobile | Screen transitions | < 16ms (60 FPS) |
| Mobile | First data render | < 1s |
| Mobile | Image with blurhash | < 100ms |
| Web | Lighthouse Performance | > 90 |
| Web | First Contentful Paint | < 1.5s |
| Web | Largest Contentful Paint | < 2.5s |
| Web | Time to Interactive | < 3.5s |
| Web | Cumulative Layout Shift | < 0.1 |

---

## Audit Commands

```bash
# Find select('*') violations
rg "\.select\(['\"]\\*['\"]\)" web/src/ mobile/

# Find missing .limit() on queries
rg "\.select\(" web/src/app/api/ -A5 | rg -v "\.limit\("

# Find react-native Image imports (should be expo-image)
rg "from ['\"]react-native['\"]" mobile/ | rg "Image"

# Find ScrollView + map patterns
rg "ScrollView" mobile/ -l

# Find AsyncStorage usage (should be MMKV)
rg "AsyncStorage" mobile/

# Find full-resolution image URLs (missing transforms)
rg "supabase.*storage.*getPublicUrl" web/src/ mobile/ -A3 | rg -v "width="
```

---

## Full Implementation Checklist

See [PERFORMANCE-STANDARDS.md](/PERFORMANCE-STANDARDS.md) for the complete week-by-week implementation plan.
