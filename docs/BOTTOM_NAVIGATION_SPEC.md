# Bottom Navigation Specification

> See also: [NATIVE_FEEL_GUIDELINES.md](./NATIVE_FEEL_GUIDELINES.md) for general native implementation patterns.

## Core Implementation

**Uses actual platform-native components via `expo-router/unstable-native-tabs`:**
- iOS: `UITabBarController`
- Android: `BottomNavigationView` (Material Design 3)

This is NOT a JavaScript approximation. The native components handle haptics, animations, safe areas, and accessibility automatically.

---

## Tab Configuration

| Order | Label | iOS SF Symbol | Android Icon |
|-------|-------|---------------|--------------|
| 1 | Home | `house` / `house.fill` | `home.png` |
| 2 | Discover | `magnifyingglass` | `search.png` |
| 3 | Chats | `bubble.left.and.bubble.right` / `.fill` | `chats.png` |
| 4 | Favorites | `heart` / `heart.fill` | `heart.png` |
| 5 | Profile | `person` / `person.fill` | `profile.png` |

---

## Routes

- `index` → Home (Expo Router convention)
- `discover` → Discover
- `chats` → Chats
- `favorites` → Favorites
- `profile` → Profile

---

## Platform Details

### iOS
- SF Symbols with filled variants for selected state
- No custom styling—uses system defaults
- Automatic Liquid Glass support (iOS 26+)
- Built-in haptic feedback (iOS 15+)

### Android
- PNG icons from `/assets/icons/`
- No custom styling—uses Material Design 3 defaults
- Native ripple and indicator handled by system

### Web
- Component: `web/src/components/navigation/BottomNavigation.tsx`
- Lucide React icons with filled active state
- 56px height, backdrop blur, safe area padding
- Hidden on desktop (`md:` breakpoint)

---

## Implementation Files

| Platform | File |
|----------|------|
| Mobile | `mobile/app/(tabs)/_layout.tsx` |
| Icons | `mobile/constants/icons.ts` |
| Web | `web/src/components/navigation/BottomNavigation.tsx` |

---

## Version History

- **v1.2** (2026-01-24): Removed Android overrides for fully native behavior
- **v1.1** (2026-01-24): Enhanced Android Material Design 3 styling
- **v1.0** (2026-01-24): Initial implementation
