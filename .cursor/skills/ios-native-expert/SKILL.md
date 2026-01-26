---
name: ios-native-expert
description: Ensures iOS implementations use truly native components, latest iOS 26 design patterns (Liquid Glass), and Human Interface Guidelines. Use when implementing iOS-specific features, reviewing iOS code for native feel, or when the user mentions iOS native, UIKit, SwiftUI patterns, SF Symbols, iOS 26, Liquid Glass, or native iOS components. NEVER modifies web code or Android implementations.
---

# iOS Native Expert

**Your job:** Make iOS implementations authentically native using iOS 26 design patterns, Liquid Glass, and Human Interface Guidelines.

---

## Rules You Must Follow

### Scope: iOS-ONLY

| Action | Allowed |
|--------|---------|
| Modify `/mobile` iOS-specific code | ✅ Yes |
| Use `Platform.OS === 'ios'` conditionals | ✅ Yes |
| Add iOS-only features | ✅ Yes |
| Modify `/web` in any way | ❌ NEVER |
| Change shared logic that affects Android | ❌ NEVER |
| Remove Android implementations | ❌ NEVER |

### When Unsure: Research First

Search for latest patterns: `"iOS 26 [component] Liquid Glass"` or `"SwiftUI [component] iOS 26"`

---

## Liquid Glass (iOS 26)

Apple's translucent design language that reflects/refracts surroundings with real-time rendering. **Use for navigation and floating elements only.**

### Where to Apply

| ✅ Use Liquid Glass | ❌ Never Use |
|---------------------|--------------|
| Tab bars (automatic) | Lists/tables |
| Toolbars | Card backgrounds |
| Navigation bars (automatic) | Page content |
| Floating action buttons | Media content |
| Sheet headers | Text containers |

### Implementation

```tsx
import { GlassView, GlassContainer, isLiquidGlassAvailable, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { AccessibilityInfo, Platform } from 'react-native';

// Full availability check (includes iOS 26 beta edge cases)
const hasLiquidGlass = Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

// Respect user accessibility preferences
const [reduceTransparency, setReduceTransparency] = useState(false);
useEffect(() => {
  AccessibilityInfo.isReduceTransparencyEnabled().then(setReduceTransparency);
}, []);
const showGlass = hasLiquidGlass && !reduceTransparency;
```

### Critical Rules

1. **`isInteractive` is immutable** — set once on mount, remount with different `key` to change
2. **Never `opacity < 1`** on GlassView or parents (causes rendering bugs per Apple docs)
3. **Always use `isGlassEffectAPIAvailable()`** — prevents crashes on some iOS 26 betas

### System Colors

**Always use `PlatformColor`** — adapts to light/dark mode and Liquid Glass:

```tsx
backgroundColor: Platform.OS === 'ios' ? PlatformColor('systemBackground') : '#FFFFFF'
```

Common: `systemBackground`, `secondarySystemBackground`, `label`, `secondaryLabel`, `systemBlue`, `systemRed`, `systemGreen`, `systemPink`, `separator`

---

## Component Selection

**Use native-backed components. Never JS approximations.**

| Need | ✅ Use | ❌ Not |
|------|--------|--------|
| Tab bar | `expo-router/unstable-native-tabs` | `@react-navigation/bottom-tabs` |
| Liquid Glass | `expo-glass-effect` | Custom blur overlays |
| Bottom sheet | `@gorhom/bottom-sheet` | Custom `Animated.View` |
| Icons | `expo-symbols` | Icon fonts, PNGs |
| Date picker | `@react-native-community/datetimepicker` | Custom pickers |
| Haptics | `expo-haptics` | Vibration API |
| Blur | `expo-blur` | Custom opacity overlays |
| Gestures | `react-native-gesture-handler` | PanResponder |
| Animations | `react-native-reanimated` | Animated API |

---

## SF Symbols 7

**All iOS icons must use SF Symbols.** Never use icon fonts or PNGs on iOS.

### Basic Usage

```tsx
<SymbolView
  name="heart.fill"
  style={{ width: 24, height: 24 }}
  tintColor="systemRed"
  type="hierarchical" // 'monochrome' | 'hierarchical' | 'palette' | 'multicolor'
/>
```

### Tab Bar Icons

```tsx
<Icon sf={{ default: 'heart', selected: 'heart.fill' }} androidSrc={icons.heart} />
```

### Symbol Animations

| Type | Use For | Example |
|------|---------|---------|
| `bounce` | Attention/feedback | Like button tap |
| `pulse` | Loading/progress | Audio levels |
| `scale` | Emphasis | Selection |

```tsx
<SymbolView
  name="heart.fill"
  animationSpec={{ effect: { type: 'bounce', wholeSymbol: true }, repeating: false }}
/>
```

**Variable animations** for progress: add `variableAnimationSpec: { cumulative: true, dimInactiveLayers: true }`

### SF Symbols 7 New Features (iOS 26)

- **Draw animations**: Handwriting-style stroke animations (not yet in expo-symbols)
- **Gradients**: Automatic linear gradients from single source colors
- **6,900+ symbols**: Expanded library with new localized variants

**Find symbols:** SF Symbols 7 app or https://developer.apple.com/sf-symbols/

---

## Common iOS Patterns

### Haptic Feedback

**Add haptics to all interactive elements:**

| Action | Code |
|--------|------|
| Toggle/select | `Haptics.selectionAsync()` |
| Button tap | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` |
| Card press | `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` |
| Success | `Haptics.notificationAsync(NotificationFeedbackType.Success)` |
| Error | `Haptics.notificationAsync(NotificationFeedbackType.Error)` |

### Action Sheets

Use `ActionSheetIOS.showActionSheetWithOptions()` on iOS, bottom sheet on Android.

### Context Menus

Use `react-native-ios-context-menu` with SF Symbol icons (`iconType: 'SYSTEM'`, `iconValue: 'trash'`). Use `menuAttributes: ['destructive']` for delete actions.

---

## Native Alerts & Confirmations

**iOS alerts must be clean, professional, and informative.** Never use emojis or casual language.

### Alert Style Guidelines

| ✅ Native iOS | ❌ Avoid |
|---------------|----------|
| Clean, concise text | Emojis in alerts |
| Specific details (what, when, where) | Generic "Success!" messages |
| Actionable button labels | Vague buttons like "OK" alone |
| Title describes the action completed | Titles like "Done" or "Success" |

### Confirmation Alert Pattern

When an action completes (e.g., adding to calendar, saving data), provide:
1. **Title**: What was done (e.g., `"Event Name" Added`)
2. **Message**: Relevant details (date, time, location)
3. **Buttons**: Dismissive + actionable option

```tsx
// ✅ Good: Native iOS confirmation
Alert.alert(
  `"${eventName}" Added`,
  `${formattedDate} at ${formattedTime}\n${location}`,
  [
    { text: "OK", style: "cancel" },
    { 
      text: "View in Calendar", 
      style: "default",
      onPress: () => Linking.openURL("calshow:")
    },
  ]
);

// ❌ Bad: Generic, uninformative
Alert.alert("Success", "Event added to your calendar!");

// ❌ Bad: Emojis aren't native iOS style
Alert.alert("Added ✓", "📅 Event saved! 🎉");
```

### Error Alert Pattern

```tsx
Alert.alert(
  "Unable to Save Event",
  "Please check your calendar permissions in Settings.",
  [
    { text: "Cancel", style: "cancel" },
    { text: "Open Settings", onPress: () => Linking.openSettings() },
  ]
);
```

### Button Order (iOS Convention)

- **Cancel/dismiss** button: LEFT (style: "cancel")
- **Primary action** button: RIGHT (style: "default")
- **Destructive action**: RIGHT with `style: "destructive"`

---

## Forms

### TextInput iOS Props

Always add on iOS: `clearButtonMode="while-editing"`, `enablesReturnKeyAutomatically`, `keyboardAppearance="light"`

### Picker Selection

| Items | Use |
|-------|-----|
| 2-5 | `@react-native-segmented-control/segmented-control` |
| 3-10 | Wheel picker |
| 10+ | Menu/dropdown |

---

## Navigation

### Large Titles + Liquid Glass

```tsx
<Stack.Screen options={{
  headerLargeTitle: Platform.OS === 'ios',
  headerLargeTitleShadowVisible: false,
  headerBlurEffect: Platform.OS === 'ios' ? 'regular' : undefined,
  headerTransparent: Platform.OS === 'ios', // Enables Liquid Glass
}} />
```

### Native Search Bar

Use `headerSearchBarOptions` with `hideWhenScrolling: true`. **iOS 26 pattern:** Search in TabView replaces tab bar with full-width search bar (like Apple News).

### Tab Bar

Native tabs get Liquid Glass automatically via `expo-router/unstable-native-tabs`.

---

## Animations

**Always use spring physics** with `react-native-reanimated`:

| Use Case | Config |
|----------|--------|
| Button feedback | `{ damping: 20, stiffness: 300 }` |
| Card expand | `{ damping: 12, stiffness: 180 }` |
| Page transitions | `{ damping: 18, stiffness: 120 }` |
| Default | `{ damping: 15, stiffness: 150 }` |

---

## iOS Permissions (CRITICAL)

**Any feature requiring iOS permissions MUST have Info.plist entries.** Missing entries cause instant crashes.

### Info.plist Location

`mobile/ios/RealSingles/Info.plist` — This is a **bare workflow** project, so Info.plist must be manually updated (app.json `infoPlist` won't auto-sync).

### Required Permission Keys

**iOS 17+ introduced new permission keys.** You need BOTH legacy and new keys for compatibility.

| Feature | Required Keys |
|---------|---------------|
| **Calendar** | `NSCalendarsUsageDescription` (legacy), `NSCalendarsFullAccessUsageDescription` (iOS 17+), `NSCalendarsWriteOnlyAccessUsageDescription` (iOS 17+ write-only) |
| **Reminders** | `NSRemindersUsageDescription` (legacy), `NSRemindersFullAccessUsageDescription` (iOS 17+) |
| **Camera** | `NSCameraUsageDescription` |
| **Microphone** | `NSMicrophoneUsageDescription` |
| **Photo Library** | `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription` (save only) |
| **Location** | `NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription`, `NSLocationAlwaysUsageDescription` |
| **Contacts** | `NSContactsUsageDescription` |
| **Face ID** | `NSFaceIDUsageDescription` |

### expo-calendar Gotcha

**`expo-calendar` requires BOTH Calendar AND Reminders permissions** even if you only use calendar. The module initializes both permission requesters on load.

```xml
<!-- All 5 keys needed for expo-calendar -->
<key>NSCalendarsUsageDescription</key>
<string>App needs calendar access to add events.</string>
<key>NSCalendarsFullAccessUsageDescription</key>
<string>App needs calendar access to add events.</string>
<key>NSCalendarsWriteOnlyAccessUsageDescription</key>
<string>App needs calendar access to add events.</string>
<key>NSRemindersUsageDescription</key>
<string>App can create reminders for your events.</string>
<key>NSRemindersFullAccessUsageDescription</key>
<string>App can create reminders for your events.</string>
```

### Permission Request Pattern

Use the centralized utility at `mobile/utils/permissions.ts`:

```tsx
import { requestPermission, addEventToCalendar } from "@/utils/permissions";

// Simple permission check
const granted = await requestPermission("calendar");

// Or use the helper that handles everything
const result = await addEventToCalendar({
  title: "Event",
  startDate: new Date(),
  endDate: new Date(),
});
```

### Info.plist Changes Require Native Rebuild

**Metro reload is NOT enough.** After modifying Info.plist:

```bash
cd mobile && pnpm ios
# Or for clean rebuild:
cd mobile/ios && pod install && cd .. && pnpm ios
```

---

## Pre-Completion Checklist

- [ ] Native-backed components (not JS approximations)
- [ ] SF Symbols for all icons
- [ ] Haptic feedback on interactive elements
- [ ] `PlatformColor` for system colors
- [ ] `Platform.OS === 'ios'` isolates all iOS code
- [ ] Liquid Glass on floating/navigation elements (with `isGlassEffectAPIAvailable` check)
- [ ] Accessibility: respect `isReduceTransparencyEnabled`
- [ ] **Permissions: Info.plist has ALL required keys** (legacy + iOS 17+)
- [ ] **Permissions: Use `utils/permissions.ts` utility** (not inline requests)
- [ ] **Alerts: Clean, specific, no emojis** (include relevant details)
- [ ] Android unchanged, Web untouched

---

## Reference

| File | Purpose |
|------|---------|
| `mobile/app/(tabs)/_layout.tsx` | Native tabs with SF Symbols (best example) |
| `mobile/utils/permissions.ts` | Centralized iOS permissions utility |
| `mobile/ios/RealSingles/Info.plist` | iOS permission declarations |

---

## Installed Packages

| Package | Purpose |
|---------|---------|
| `expo-symbols` | SF Symbols 7 |
| `expo-glass-effect` | Liquid Glass (iOS 26) - includes `isLiquidGlassAvailable`, `isGlassEffectAPIAvailable` |
| `expo-haptics` | Haptic feedback |
| `expo-blur` | Native blur effects |
| `expo-calendar` | Calendar & reminders (requires 5 Info.plist keys!) |
| `expo-camera` | Camera access |
| `expo-image-picker` | Photo library access |
| `expo-location` | Location services |
| `@react-native-segmented-control/segmented-control` | Native segmented control |
| `react-native-ios-context-menu` | Native context menus |

---

## Quick Reference

- Apple HIG: https://developer.apple.com/design/human-interface-guidelines/
- SF Symbols 7: https://developer.apple.com/sf-symbols/
- expo-glass-effect: https://docs.expo.dev/versions/latest/sdk/glass-effect/
- expo-symbols: https://docs.expo.dev/versions/latest/sdk/symbols/
- WWDC 2025 Design System: https://developer.apple.com/videos/play/wwdc2025/356
