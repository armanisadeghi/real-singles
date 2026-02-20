# CLAUDE.md — RealSingles

Modern dating app with dual platforms sharing a single Supabase backend. Live on App Store, Play Store, and Vercel. 100+ API endpoints.

> **Official Next.js/React/TypeScript best practices:** `~/.arman/rules/nextjs-best-practices/nextjs-guide.md`
> That guide is the single source of truth for rendering, caching, performance, mobile, Tailwind, APIs, and more. This file covers project-specific conventions only.

---

## Codebase Structure

```
/mobile    → Expo app (iOS + Android)
/web       → Next.js app (API routes + Web UI + Admin/Matchmaker portals)
```

Admin portal is web-only. All other user-facing features must work on all platforms.

---

## Cross-Platform Parity (CRITICAL)

Every feature must work on iOS, Android, Web Desktop, and Web Mobile.

### Single Source of Truth

| Type | Location |
|------|----------|
| Business logic / DB ops | `web/src/lib/services/` |
| Validation | `web/src/lib/validation/` |
| API endpoints | `web/src/app/api/` |
| Constants (mobile) | `mobile/constants/options.ts` |
| Constants (web) | `web/src/types/index.ts` |

- Constants **must** be identical across both files — update both when changing one
- All business logic lives in API endpoints — clients never implement logic locally
- **Report any SSOT violation immediately**, even while working on unrelated tasks

---

## Performance Standards

### Forbidden → Required

| Forbidden | Use Instead |
|-----------|-------------|
| `select('*')` | Specify exact fields: `select('id, name, avatar_url')` |
| Query without `.limit()` | Always `.limit()` (default 20) |
| `<Image>` from `react-native` | `expo-image` with `cachePolicy="memory-disk"` |
| `ScrollView` + `.map()` for lists | `FlashList` with `estimatedItemSize` |
| `AsyncStorage` | `react-native-mmkv` |
| Full-resolution image URLs | Supabase transforms: `?width=800&quality=80&format=webp` |
| Multiple sequential API calls | Single batched endpoint or Supabase RPC |
| `next/image` without blur placeholder | Add `placeholder="blur"` + `blurDataURL` |

### Targets

| Platform | Metric | Target |
|----------|--------|--------|
| Mobile | App to cached content | < 500ms |
| Mobile | Screen transitions | < 16ms (60 FPS) |
| Web | Lighthouse Performance | > 90 |
| Web | LCP | < 2.5s |

---

## Platform-Native Requirements

### Icons

| Platform | Library | Never Use |
|----------|---------|-----------|
| iOS | SF Symbols (`expo-symbols`) | Icon fonts, PNGs |
| Android | Material Icons (`@expo/vector-icons/MaterialIcons`) | Icon fonts |
| Web | `lucide-react` | Emoji |

### Colors

- **Android:** All colors via `useTheme()` / `useThemeColors()` from `mobile/context/ThemeContext.tsx` — hardcoded hex forbidden
- **iOS:** `PlatformColor` + brand palette via `useTheme()`
- **Web:** Tailwind theme config + CSS custom properties

### Animations

All platforms use spring-based motion via `react-native-reanimated` `withSpring()`. Never use linear or basic ease curves for interactive elements. See `docs/ANDROID_16_NATIVE_UX_GUIDANCE.md` for M3 Expressive spring tokens.

### Accessibility

- Respect `prefers-reduced-motion` (web) / `useReducedMotion()` (mobile)
- Touch targets: minimum 48x48dp Android, 44x44pt iOS

---

## Key Reference Files

| File | Purpose |
|------|---------|
| `mobile/app/(tabs)/_layout.tsx` | Best example of native-first code |
| `mobile/constants/options.ts` | Shared dropdown options (must sync with web) |
| `mobile/lib/api.ts` | API client pattern |
| `web/src/app/api/users/me/route.ts` | User API route pattern |
| `web/src/hooks/useSupabaseMessaging.ts` | Real-time messaging pattern |
| `web/src/components/ui/` | Shared UI components (ShadCN/Radix) |

---

## API Endpoint Groups

`auth/` `users/` `matches/` `conversations/` `calls/` `matchmakers/` `events/` `rewards/` `admin/`

---

## Database

- **Migrations:** `web/supabase/migrations/`
- **Commands (from /web):** `pnpm db:migrate` | `pnpm db:types` | `pnpm db:status`
- All migrations must be idempotent (`DROP IF EXISTS` before `CREATE`, `IF NOT EXISTS` for tables/columns)
- Always regenerate types after schema changes

---

## Major Features

Matching system, real-time messaging, video/audio calls (LiveKit), events (speed dating), profiles/galleries, matchmaker portal (`/matchmaker-portal`), admin routes, rewards/referrals

---

## Available Commands

Run `/command-name` to invoke specialized workflows. See `.claude/commands/` for full list including: `/audit-api`, `/audit-performance`, `/verify-parity`, `/android-expert`, `/ios-expert`, `/supabase-help`, `/tailwind-expert`, `/plan-feature`
