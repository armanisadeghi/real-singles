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

### When Unsure: Check Documentation First

**ALWAYS check the official Expo docs before implementing.** These APIs are actively evolving.

| Package | Documentation URL |
|---------|-------------------|
| expo-glass-effect | https://docs.expo.dev/versions/latest/sdk/glass-effect/ |
| expo-symbols | https://docs.expo.dev/versions/latest/sdk/symbols/ |
| expo-haptics | https://docs.expo.dev/versions/latest/sdk/haptics/ |
| expo-blur | https://docs.expo.dev/versions/latest/sdk/blur-view/ |
| expo-calendar | https://docs.expo.dev/versions/latest/sdk/calendar/ |
| Native Tabs | https://docs.expo.dev/versions/latest/sdk/router-native-tabs/ |
| Native Tabs Guide | https://docs.expo.dev/router/advanced/native-tabs/ |

**Quick Reference:** See `ios-components-reference.md` in this skill folder for verified API details.

---

## Liquid Glass (iOS 26)

Apple's translucent design language that reflects/refracts surroundings. **Use for navigation and floating elements only.**

> `GlassView` is only available on iOS 26+. Falls back to regular `View` on unsupported platforms.

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

// REQUIRED: Full availability check (prevents crashes on iOS 26 betas)
const hasLiquidGlass = Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

// Respect user accessibility preferences
const [reduceTransparency, setReduceTransparency] = useState(false);
useEffect(() => {
  AccessibilityInfo.isReduceTransparencyEnabled().then(setReduceTransparency);
}, []);
const showGlass = hasLiquidGlass && !reduceTransparency;
```

### GlassView Props

| Prop | Type | Default |
|------|------|---------|
| `glassEffectStyle` | `'regular'` \| `'clear'` | `'regular'` |
| `isInteractive` | `boolean` | `false` |
| `tintColor` | `string` | - |

### Known Issues (CRITICAL)

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

## SF Symbols (expo-symbols)

> **Note:** This library is in beta and subject to breaking changes.

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

### Tab Bar Icons (Native Tabs)

```tsx
// SDK 55+ syntax
<NativeTabs.Trigger.Icon sf={{ default: 'heart', selected: 'heart.fill' }} md="home" />
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
  animationSpec={{ 
    effect: { type: 'bounce', wholeSymbol: true }, 
    repeating: false 
  }}
/>
```

**Variable animations** for progress:
```tsx
variableAnimationSpec: { cumulative: true, dimInactiveLayers: true }
```

**Find symbols:** https://developer.apple.com/sf-symbols/

---

## Haptic Feedback (expo-haptics)

**Add haptics to all interactive elements:**

| Action | Code |
|--------|------|
| Toggle/select | `Haptics.selectionAsync()` |
| Button tap | `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` |
| Card press | `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)` |
| Success | `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)` |
| Error | `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)` |

### ImpactFeedbackStyle Options

`Light` | `Medium` | `Heavy` | `Rigid` | `Soft`

---

## Native Tabs (expo-router/unstable-native-tabs)

> Native tabs is alpha (SDK 54+). API subject to change.

### Basic Example (SDK 55+)

```tsx
import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
```

### Dynamic Colors for Liquid Glass

Liquid Glass changes colors based on background. Use `DynamicColorIOS`:

```tsx
import { DynamicColorIOS } from 'react-native';

<NativeTabs
  labelStyle={{ color: DynamicColorIOS({ dark: 'white', light: 'black' }) }}
  tintColor={DynamicColorIOS({ dark: 'white', light: 'black' })}
>
```

### iOS 26 Features

| Feature | Prop/Usage |
|---------|------------|
| Search tab | `role="search"` on Trigger |
| Minimize on scroll | `minimizeBehavior="onScrollDown"` |
| Prevent transparency | `disableTransparentOnScrollEdge={true}` |

### Known Limitations

- Max 5 tabs on Android
- Cannot measure tab bar height
- No nested native tabs
- FlatList: scroll-to-top not supported

---

## BlurView (expo-blur)

### Known Issue (CRITICAL)

BlurView must be rendered AFTER dynamic content:

```tsx
// ✅ Correct
<View>
  <FlatList />
  <BlurView />
</View>

// ❌ BlurView won't update
<View>
  <BlurView />
  <FlatList />
</View>
```

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

### Button Order (iOS Convention)

- **Cancel/dismiss**: LEFT (`style: "cancel"`)
- **Primary action**: RIGHT (`style: "default"`)
- **Destructive action**: RIGHT (`style: "destructive"`)

### Example

```tsx
Alert.alert(
  `"${eventName}" Added`,
  `${formattedDate} at ${formattedTime}\n${location}`,
  [
    { text: "OK", style: "cancel" },
    { text: "View in Calendar", style: "default", onPress: () => Linking.openURL("calshow:") },
  ]
);
```

---

## iOS Permissions (CRITICAL)

**Any feature requiring iOS permissions MUST have Info.plist entries.** Missing entries cause instant crashes.

### Info.plist Location

`mobile/ios/RealSingles/Info.plist` — This is a **bare workflow** project, so Info.plist must be manually updated.

### Required Permission Keys

**iOS 17+ introduced granular permission keys.** Include BOTH legacy and new keys for compatibility.

| Feature | Required Keys |
|---------|---------------|
| **Calendar** | `NSCalendarsUsageDescription`, `NSCalendarsFullAccessUsageDescription`, `NSCalendarsWriteOnlyAccessUsageDescription` |
| **Reminders** | `NSRemindersUsageDescription`, `NSRemindersFullAccessUsageDescription` |
| **Camera** | `NSCameraUsageDescription` |
| **Microphone** | `NSMicrophoneUsageDescription` |
| **Photo Library** | `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription` |
| **Location** | `NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription`, `NSLocationAlwaysUsageDescription` |
| **Contacts** | `NSContactsUsageDescription` |
| **Face ID** | `NSFaceIDUsageDescription` |

### expo-calendar Note

The current project's Info.plist already has all 5 required calendar/reminders keys configured.

### Permission Request Pattern

Use the centralized utility at `mobile/utils/permissions.ts`:

```tsx
import { requestPermission, addEventToCalendar } from "@/utils/permissions";

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

Use `headerSearchBarOptions` with `hideWhenScrolling: true`.

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

## Pre-Completion Checklist

- [ ] Native-backed components (not JS approximations)
- [ ] SF Symbols for all icons (via expo-symbols)
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

## Reference Files

| File | Purpose |
|------|---------|
| `ios-components-reference.md` | Detailed API reference for all iOS packages |
| `mobile/app/(tabs)/_layout.tsx` | Native tabs with SF Symbols (best example) |
| `mobile/utils/permissions.ts` | Centralized iOS permissions utility |
| `mobile/ios/RealSingles/Info.plist` | iOS permission declarations |

---

## Installed Packages

| Package | Purpose |
|---------|---------|
| `expo-symbols` | SF Symbols (beta) |
| `expo-glass-effect` | Liquid Glass (iOS 26+) |
| `expo-haptics` | Haptic feedback |
| `expo-blur` | Native blur effects |
| `expo-calendar` | Calendar & reminders |
| `expo-camera` | Camera access |
| `expo-image-picker` | Photo library access |
| `expo-location` | Location services |
| `@react-native-segmented-control/segmented-control` | Native segmented control |
| `react-native-ios-context-menu` | Native context menus |

---

## Official Documentation

**Always verify against official docs before implementing:**

- expo-glass-effect: https://docs.expo.dev/versions/latest/sdk/glass-effect/
- expo-symbols: https://docs.expo.dev/versions/latest/sdk/symbols/
- expo-haptics: https://docs.expo.dev/versions/latest/sdk/haptics/
- expo-blur: https://docs.expo.dev/versions/latest/sdk/blur-view/
- expo-calendar: https://docs.expo.dev/versions/latest/sdk/calendar/
- Native Tabs: https://docs.expo.dev/versions/latest/sdk/router-native-tabs/
- Native Tabs Guide: https://docs.expo.dev/router/advanced/native-tabs/
- Apple HIG: https://developer.apple.com/design/human-interface-guidelines/
- SF Symbols: https://developer.apple.com/sf-symbols/
