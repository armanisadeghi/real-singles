Audit code for performance violations across mobile (Expo/React Native) and web (Next.js).

Scope: $ARGUMENTS (specific files, a screen, a feature area, or full codebase)

> **Speed is a feature.** Every screen loads from cache. Every image is optimized. Every query is efficient. Violations are bugs.

## Audit Checklist

```
Performance Audit: [scope]
- [ ] No select('*') — all queries specify exact fields
- [ ] All queries have .limit()
- [ ] No react-native Image — using expo-image with cachePolicy
- [ ] No ScrollView + .map() — using FlashList
- [ ] No AsyncStorage — using MMKV
- [ ] All image URLs use Supabase transforms (width, quality, format=webp)
- [ ] Cache-first data pattern implemented
- [ ] No sequential API calls that could be batched
- [ ] List item components use React.memo with custom comparator
- [ ] Heavy web components use dynamic imports
- [ ] Web images use next/image with placeholder="blur"
- [ ] Blurhash generated for user-uploaded images
```

## Violation Severity

### Critical (Must Fix)
- `select('*')` on any table with > 10 columns
- Missing `.limit()` on user-facing list queries
- react-native `Image` instead of `expo-image`
- Full-resolution images served without transforms
- `AsyncStorage` usage (sync-blocking, slow)

### High (Should Fix)
- `ScrollView` + `.map()` for lists with 10+ items
- No cache-first pattern on frequently loaded screens
- Sequential API calls that could be batched
- Missing blurhash placeholders on images
- Web images without `placeholder="blur"`

### Medium (Improve)
- Missing `React.memo` on list item components
- Heavy components loaded synchronously on web
- No request deduplication for concurrent fetches

## Fix Patterns

| Violation | Fix |
|-----------|-----|
| `select('*')` | List exact fields needed by the consuming UI |
| Missing `.limit()` | Add `.limit(20)` (or appropriate page size) |
| react-native `Image` | Replace with `expo-image`, add `cachePolicy="memory-disk"` |
| `ScrollView` + map | Replace with `FlashList`, add `estimatedItemSize` |
| `AsyncStorage` | Replace with `react-native-mmkv` |
| No image transforms | Append `?width=800&quality=80&format=webp` to URL |
| Sequential fetches | Combine into single RPC or batched endpoint |
| No cache-first | Wrap in MMKV cache pattern (mobile) or Map cache (web) |
| No `React.memo` | Wrap list item component, add ID-based comparator |
| Heavy sync import | Use `dynamic(() => import(...), { ssr: false })` |

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

## Output Format

1. **Summary** — Total violations by severity
2. **Critical Issues** — Must fix, with file path, line, and exact fix
3. **High Issues** — Should fix, with file path and recommended change
4. **Medium Issues** — Brief list with suggestions
5. **Performance Score** — Estimated impact on targets
