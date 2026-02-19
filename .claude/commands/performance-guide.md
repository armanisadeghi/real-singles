Performance optimization guide for mobile (Expo/React Native) and web (Next.js).

Task: $ARGUMENTS

> Every screen loads instantly from cache. Every image is optimized. Every query selects only what it needs.

## 1. Local-First Data Architecture

### Mobile — MMKV (required, replaces AsyncStorage)

```typescript
import { MMKV } from 'react-native-mmkv'
const storage = new MMKV()

const getData = async <T>(key: string, fetchFn: () => Promise<T>, ttl = 300000): Promise<T> => {
  const cached = storage.getString(key)
  const timestamp = storage.getNumber(`${key}_timestamp`)
  if (cached && timestamp && Date.now() - timestamp < ttl) {
    fetchFn().then(fresh => { storage.set(key, JSON.stringify(fresh)); storage.set(`${key}_timestamp`, Date.now()) })
    return JSON.parse(cached) as T
  }
  const fresh = await fetchFn()
  storage.set(key, JSON.stringify(fresh))
  storage.set(`${key}_timestamp`, Date.now())
  return fresh
}
```

### TTL Guidelines

| Data Type | TTL |
|-----------|-----|
| User profile | 5 min |
| Match list | 2 min |
| Static content | 1 hr |
| App config | 30 min |

## 2. Image Optimization

### Mobile — expo-image (required)

```typescript
import { Image } from 'expo-image'
<Image source={{ uri: `${imageUrl}?width=800&quality=80&format=webp` }} placeholder={blurhash} cachePolicy="memory-disk" transition={200} />
```

### Web — next/image (required)

```typescript
import Image from 'next/image'
<Image src={imageUrl} alt="..." width={800} height={600} placeholder="blur" blurDataURL={blurhash} quality={80} />
```

### Supabase Transform Sizes

| Context | Width | Quality |
|---------|-------|---------|
| Thumbnail/avatar | 200 | 75 |
| Card/list item | 400 | 80 |
| Full screen (mobile) | 800 | 80 |
| Full screen (web) | 1200 | 85 |

## 3. Database Query Optimization

```typescript
// FORBIDDEN
const { data } = await supabase.from('users').select('*')

// REQUIRED
const { data } = await supabase.from('users').select('id, display_name, avatar_url').limit(20)
```

Batch related data with RPC instead of sequential fetches.

## 4. React Rendering

### Mobile — FlashList (required)

```typescript
import { FlashList } from '@shopify/flash-list'
<FlashList data={items} renderItem={renderItem} estimatedItemSize={100} />
```

### List Item Memoization

```typescript
const ItemComponent = React.memo(({ item }: { item: ItemType }) => {
  return <View>...</View>
}, (prev, next) => prev.item.id === next.item.id)
```

## 5. Web Bundle Size

- Dynamic imports for heavy components: `dynamic(() => import(...), { ssr: false })`
- Keep page bundles under 200KB
- `optimizePackageImports: ['lucide-react', '@supabase/supabase-js']`

## 6. Network Optimization

Request deduplication:
```typescript
const pending = new Map<string, Promise<unknown>>()
export async function dedupedRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (pending.has(key)) return pending.get(key) as Promise<T>
  const promise = fn().finally(() => pending.delete(key))
  pending.set(key, promise)
  return promise
}
```

## Performance Targets

| Platform | Metric | Target |
|----------|--------|--------|
| Mobile | App to cached content | < 500ms |
| Mobile | Screen transitions | < 16ms (60 FPS) |
| Mobile | First data render | < 1s |
| Web | Lighthouse Performance | > 90 |
| Web | FCP | < 1.5s |
| Web | LCP | < 2.5s |
| Web | CLS | < 0.1 |

## Audit Commands

```bash
rg "\.select\(['\"]\\*['\"]\)" web/src/ mobile/        # select('*')
rg "from ['\"]react-native['\"]" mobile/ | rg "Image"  # wrong Image import
rg "ScrollView" mobile/ -l                              # ScrollView+map
rg "AsyncStorage" mobile/                               # should be MMKV
```
