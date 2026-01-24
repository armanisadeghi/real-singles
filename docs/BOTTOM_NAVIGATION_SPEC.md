# Bottom Navigation Specification

## Overview
This document specifies the bottom navigation implementation across all platforms (Web, iOS, Android) to ensure consistency and native feel.

## Tab Order & Labels (All Platforms)

All platforms use the **exact same order** and labels:

1. **Home**
2. **Discover**
3. **Chats**
4. **Favorites**
5. **Profile**

---

## Platform-Specific Implementations

### 🌐 Web App (`web/src/components/navigation/BottomNavigation.tsx`)

**Routes:**
- `/home` → Home
- `/discover` → Discover
- `/chats` → Chats
- `/favorites` → Favorites
- `/profile` → Profile

**Icons (lucide-react):**
- Home: `Home` icon
- Discover: `Compass` icon
- Chats: `MessageCircle` icon
- Favorites: `Heart` icon
- Profile: `User` icon

**Styling:**
- Height: 56px (matches iOS tab bar)
- Active color: `text-pink-600`
- Inactive color: `text-gray-500`
- Active state: Filled icon + scale-110 + font-semibold
- Background: `bg-white/95` with backdrop blur
- Safe area: `pb-[env(safe-area-inset-bottom)]`
- Visibility: Hidden on `md:` and up (desktop)

**Behavior:**
- Touch feedback: `active:bg-gray-100`
- Always visible labels
- Smooth transitions

---

### 📱 iOS App (`mobile/app/(tabs)/_layout.tsx`)

**Implementation:** Native `UITabBarController` via `expo-router/unstable-native-tabs`

**Routes:**
- `index` → Home (Expo Router convention)
- `discover` → Discover
- `chats` → Chats
- `favorites` → Favorites
- `profile` → Profile

**Icons (SF Symbols):**
- Home: `house` / `house.fill` (selected)
- Discover: `magnifyingglass`
- Chats: `bubble.left.and.bubble.right` / `.fill`
- Favorites: `heart` / `heart.fill`
- Profile: `person` / `person.fill`

**iOS Human Interface Guidelines:**
- 3-5 tabs recommended ✅
- Icon size: 25x25pt
- Always show labels ✅
- Subtle haptic feedback on selection (iOS 15+) ✅
- Supports Liquid Glass effect (iOS 26+) ✅

---

### 🤖 Android App (`mobile/app/(tabs)/_layout.tsx`)

**Implementation:** Native `BottomNavigationView` (Material Design 3) via `expo-router/unstable-native-tabs`

**Routes:**
- `index` → Home
- `discover` → Discover
- `chats` → Chats
- `favorites` → Favorites
- `profile` → Profile

**Icons (PNG assets from `/assets/icons/`):**
- Home: `home.png`
- Discover: `search.png` (aliased as `discover`)
- Chats: `chats.png`
- Favorites: `heart.png`
- Profile: `profile.png`

**Material Design 3 Specifications:**

```typescript
{
  // Icon size
  androidSize: 24,  // 24dp per MD3 spec
  
  // Colors
  activeColor: "#E91E63",          // Pink-600 for active state
  inactiveColor: "#49454F",        // On-surface-variant
  barBackgroundColor: "#FFFBFE",   // Surface container
  
  // Interaction
  rippleColor: "#E91E6340",        // 25% opacity ripple
  indicatorColor: "#E91E63",       // Active pill indicator
  
  // Layout
  compact: true,                   // Use 56dp height for 5 items
  labelVisibilityMode: "labeled",  // Always show labels
}
```

**Material Design 3 Guidelines:**
- 3-5 destinations recommended ✅
- Standard height: 80dp (3-4 items)
- Compact height: 56dp (5 items) ✅
- Icon size: 24dp ✅
- Active indicator: 64x32dp pill shape ✅
- Label typography: 12sp active, 10sp inactive
- Ripple feedback on touch ✅

**Android-Specific Features:**
- Native ripple effect
- Material 3 active pill indicator
- Compact mode for 5 items
- Surface elevation with proper shadows

---

## Icon Assets

### Web (Lucide React)
- Package: `lucide-react`
- Style: Outline icons with filled state for active
- Consistent stroke width

### iOS (SF Symbols)
- Native system icons
- Automatic filled variants for selected state
- Consistent with iOS system apps

### Android (PNG Assets)
- Location: `mobile/assets/icons/`
- Size: 24dp (scaled for different densities)
- Style: Material Design compatible
- Color: Tinted by the native component

---

## Color Palette

**Primary (Active State):**
- Hex: `#E91E63`
- Name: Pink-600
- Usage: Active tab color, indicator, ripple

**Secondary (Inactive State):**
- Web: `#6B7280` (gray-500)
- iOS: System default
- Android: `#49454F` (on-surface-variant)

**Background:**
- Web: `rgba(255, 255, 255, 0.95)` with backdrop blur
- iOS: Native system background
- Android: `#FFFBFE` (surface container)

---

## Accessibility

**All Platforms:**
- ✅ Always visible labels (no icon-only mode)
- ✅ Proper touch target sizes (44px/dp minimum)
- ✅ Clear active state indication
- ✅ Native screen reader support
- ✅ Proper color contrast ratios

**Web:**
- Semantic HTML: `<nav>` with proper links
- Touch target: 56px minimum height

**iOS:**
- VoiceOver support (built-in)
- Dynamic Type support

**Android:**
- TalkBack support (built-in)
- Material accessibility guidelines

---

## Implementation Files

### Web
- Component: `web/src/components/navigation/BottomNavigation.tsx`
- Usage: `web/src/app/(app)/layout.tsx`

### Mobile (iOS + Android)
- Tab Layout: `mobile/app/(tabs)/_layout.tsx`
- Icons Config: `mobile/constants/icons.ts`
- Tab Screens:
  - `mobile/app/(tabs)/index.tsx` (Home)
  - `mobile/app/(tabs)/discover.tsx` (Discover)
  - `mobile/app/(tabs)/chats.tsx` (Chats)
  - `mobile/app/(tabs)/favorites.tsx` (Favorites)
  - `mobile/app/(tabs)/profile.tsx` (Profile)

---

## Testing Checklist

### Visual Consistency
- [ ] All 5 tabs visible on all platforms
- [ ] Same order on all platforms
- [ ] Same labels on all platforms
- [ ] Icons semantically consistent

### Functionality
- [ ] Each tab navigates to correct screen
- [ ] Active state shows correctly
- [ ] Smooth transitions between tabs
- [ ] No performance issues

### Platform-Specific
- [ ] Web: Hidden on desktop (md: breakpoint)
- [ ] Web: Safe area padding on notched devices
- [ ] iOS: SF Symbols render correctly
- [ ] iOS: Filled variants on active state
- [ ] Android: Material Design 3 styling applied
- [ ] Android: Ripple effect on touch
- [ ] Android: Active pill indicator visible
- [ ] Android: Compact mode for 5 items

### Accessibility
- [ ] Screen reader announces tab names
- [ ] Touch targets are adequate size
- [ ] Color contrast meets WCAG standards
- [ ] Keyboard navigation works (web)

---

## Future Enhancements

### Potential Improvements
1. **Badge support** for notifications on Chats tab
2. **Animated transitions** between tabs (web)
3. **Custom tab bar height** based on content
4. **Tablet optimizations** (side nav on larger screens)
5. **Dark mode** support across all platforms

### Maintenance Notes
- Keep icon assets synced across platforms
- Test on multiple Android versions (Material 3 support)
- Verify iOS updates don't break SF Symbol names
- Monitor Expo Router updates for tab navigation changes

---

## Version History

- **v1.1** (2026-01-24): Enhanced Android Material Design 3 styling
- **v1.0** (2026-01-24): Initial implementation with 5 tabs across all platforms
