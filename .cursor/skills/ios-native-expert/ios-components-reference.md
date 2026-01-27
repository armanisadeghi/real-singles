# iOS Native Components Quick Reference

**Quick lookups for iOS 26 development.** All packages pre-installed.

> **Documentation Sources:** All API information verified against official Expo SDK 54/55 documentation.
> When in doubt, check the official docs linked at the bottom of each section.

---

## expo-glass-effect (Liquid Glass)

**Docs:** https://docs.expo.dev/versions/latest/sdk/glass-effect/

> `GlassView` is only available on iOS 26+. Falls back to regular `View` on unsupported platforms.

### GlassView Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `glassEffectStyle` | `'regular'` \| `'clear'` | `'regular'` | Glass effect style |
| `isInteractive` | `boolean` | `false` | Whether glass responds to touches |
| `tintColor` | `string` | - | Tint color overlay |

### GlassContainer Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `spacing` | `number` | `undefined` | Distance at which glass elements start merging |

### Availability Functions

```tsx
import { isLiquidGlassAvailable, isGlassEffectAPIAvailable, GlassView, GlassContainer } from 'expo-glass-effect';

// REQUIRED: Full check prevents crashes on iOS 26 betas
const hasGlass = Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
```

- `isLiquidGlassAvailable()` — Checks system/compiler versions and Info.plist settings
- `isGlassEffectAPIAvailable()` — Checks runtime API availability (prevents crashes on some iOS 26 betas)

### Known Issues (CRITICAL)

1. **`isInteractive` is immutable** — Can only be set once on mount. Use `key` prop to remount with different value.
2. **Never use `opacity < 1`** on GlassView or parent views — causes rendering bugs per Apple docs.
3. **Always check `isGlassEffectAPIAvailable()`** — Some iOS 26 betas lack the API, causing crashes.

### Where to Use

| ✅ Use | ❌ Never |
|--------|----------|
| Tab bars (automatic) | List cells/tables |
| Toolbars | Card backgrounds |
| Navigation bars (automatic) | Page content |
| Floating action buttons | Media content |
| Sheet headers | Text containers |

---

## expo-symbols (SF Symbols)

**Docs:** https://docs.expo.dev/versions/latest/sdk/symbols/

> This library is in beta and subject to breaking changes.

### SymbolView Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `SFSymbol` | **required** | SF Symbol name |
| `type` | `SymbolType` | `'monochrome'` | Rendering variant |
| `tintColor` | `ColorValue` | - | Icon tint |
| `size` | `number` | `24` | Symbol size |
| `weight` | `SymbolWeight` | `'unspecified'` | Symbol weight |
| `scale` | `SymbolScale` | `'unspecified'` | Symbol scale |
| `resizeMode` | `ContentMode` | `'scaleAspectFit'` | How to resize |
| `animationSpec` | `AnimationSpec` | - | Animation config |
| `colors` | `ColorValue[]` | - | For palette type |
| `fallback` | `ReactNode` | - | Fallback for Android/Web |

### SymbolType Values

| Value | Description |
|-------|-------------|
| `'monochrome'` | Single color variant |
| `'hierarchical'` | Color scheme from one color (depth) |
| `'palette'` | Multiple explicit colors via `colors` prop |
| `'multicolor'` | Built-in multicolor if available |

### SymbolWeight Values

`'unspecified'` | `'ultraLight'` | `'thin'` | `'light'` | `'regular'` | `'medium'` | `'semibold'` | `'bold'` | `'heavy'` | `'black'`

### SymbolScale Values

`'default'` | `'unspecified'` | `'small'` | `'medium'` | `'large'`

### AnimationSpec

```tsx
animationSpec={{
  effect: {
    type: 'bounce' | 'pulse' | 'scale',
    direction?: 'up' | 'down',
    wholeSymbol?: boolean, // default: false
  },
  repeating?: boolean,
  repeatCount?: number,
  speed?: number, // duration in seconds
  variableAnimationSpec?: {
    cumulative?: boolean,    // layers stay enabled
    iterative?: boolean,     // layers briefly enable
    dimInactiveLayers?: boolean,
    hideInactiveLayers?: boolean,
    reversing?: boolean,
    nonReversing?: boolean,
  }
}}
```

### Common Symbols

| Purpose | Symbol | Filled |
|---------|--------|--------|
| Home | `house` | `house.fill` |
| Search | `magnifyingglass` | - |
| Heart/Like | `heart` | `heart.fill` |
| Chat | `bubble.left` | `bubble.left.fill` |
| Profile | `person` | `person.fill` |
| Settings | `gearshape` | `gearshape.fill` |
| Camera | `camera` | `camera.fill` |
| Photo | `photo` | `photo.fill` |
| Location | `location` | `location.fill` |
| Star | `star` | `star.fill` |
| Bell | `bell` | `bell.fill` |
| Calendar | `calendar` | - |
| Clock | `clock` | `clock.fill` |
| Share | `square.and.arrow.up` | - |
| More | `ellipsis` | `ellipsis.circle.fill` |
| Close | `xmark` | `xmark.circle.fill` |
| Back/Forward | `chevron.left` / `chevron.right` | - |
| Check | `checkmark` | `checkmark.circle.fill` |
| Add | `plus` | `plus.circle.fill` |
| Edit | `pencil` | `square.and.pencil` |
| Delete | `trash` | `trash.fill` |
| Video | `video` | `video.fill` |
| Phone | `phone` | `phone.fill` |

**Browse all 6,900+ symbols:** https://developer.apple.com/sf-symbols/

---

## expo-haptics

**Docs:** https://docs.expo.dev/versions/latest/sdk/haptics/

### Methods

| Method | Description |
|--------|-------------|
| `selectionAsync()` | Selection change feedback |
| `impactAsync(style)` | Collision feedback |
| `notificationAsync(type)` | Notification feedback |

### ImpactFeedbackStyle

| Style | Use For |
|-------|---------|
| `Light` | Small UI elements, button taps |
| `Medium` | Moderate elements, card presses |
| `Heavy` | Large UI elements |
| `Rigid` | Rigid collisions, small compression |
| `Soft` | Soft collisions, large compression |

### NotificationFeedbackType

| Type | Use For |
|------|---------|
| `Success` | Task completed successfully |
| `Warning` | Warning, needs attention |
| `Error` | Task failed |

### Quick Reference

| Action | Code |
|--------|------|
| Toggle/select | `Haptics.selectionAsync()` |
| Button tap | `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` |
| Card press | `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)` |
| Success | `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)` |
| Error | `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)` |

### Notes

- iOS Taptic Engine disabled in: Low Power Mode, Camera active, Dictation active
- Web uses Vibration API (check browser compatibility)

---

## expo-blur (BlurView)

**Docs:** https://docs.expo.dev/versions/latest/sdk/blur-view/

### Props

| Prop | Type | Default | Platform |
|------|------|---------|----------|
| `intensity` | `number` (1-100) | `50` | All |
| `tint` | `BlurTint` | `'default'` | All |
| `experimentalBlurMethod` | `'none'` \| `'dimezisBlurView'` | `'none'` | Android |
| `blurReductionFactor` | `number` | `4` | Android |

### BlurTint Values

**Basic:** `'light'` | `'dark'` | `'default'` | `'extraLight'` | `'regular'` | `'prominent'`

**System Materials (iOS):**
- `'systemUltraThinMaterial'` | `'systemThinMaterial'` | `'systemMaterial'` | `'systemThickMaterial'` | `'systemChromeMaterial'`
- Light variants: `'systemUltraThinMaterialLight'` | `'systemThinMaterialLight'` | etc.
- Dark variants: `'systemUltraThinMaterialDark'` | `'systemThinMaterialDark'` | etc.

### Known Issue (CRITICAL)

BlurView must be rendered AFTER dynamic content (e.g., FlatList):

```tsx
// ✅ Correct order
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

### borderRadius

Use `overflow: 'hidden'` on BlurView for borderRadius to work on both iOS and Android.

---

## expo-router/unstable-native-tabs

**Docs:** https://docs.expo.dev/versions/latest/sdk/router-native-tabs/
**Guide:** https://docs.expo.dev/router/advanced/native-tabs/

> Native tabs is alpha (SDK 54+). API subject to change.

### Basic Usage (SDK 55+)

```tsx
import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon sf="gear" md="settings" />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
```

### NativeTabs Props

| Prop | Type | Platform | Description |
|------|------|----------|-------------|
| `backgroundColor` | `ColorValue` | All | Tab bar background |
| `tintColor` | `ColorValue` | All | Selected icon/label tint |
| `iconColor` | `ColorValue` | All | Icon color |
| `labelStyle` | `NativeTabsLabelStyle` | All | Label styling |
| `blurEffect` | `BlurEffect` | iOS | Blur effect type |
| `minimizeBehavior` | `MinimizeBehavior` | iOS 26+ | Tab bar minimize behavior |
| `disableTransparentOnScrollEdge` | `boolean` | iOS | Prevent transparency at scroll edge |
| `hidden` | `boolean` | All | Hide entire tab bar (SDK 55+) |

### minimizeBehavior (iOS 26+)

| Value | Behavior |
|-------|----------|
| `'automatic'` | System default |
| `'never'` | Tab bar never minimizes |
| `'onScrollDown'` | Minimizes on scroll down, expands on scroll up |
| `'onScrollUp'` | Minimizes on scroll up, expands on scroll down |

### NativeTabs.Trigger Props

| Prop | Type | Description |
|------|------|-------------|
| `name` | `string` | Route name (required in layout) |
| `hidden` | `boolean` | Hide this tab |
| `role` | `'search'` \| etc. | iOS system tab role |
| `disablePopToTop` | `boolean` | Don't pop stack on re-tap |
| `disableScrollToTop` | `boolean` | Don't scroll to top on re-tap |
| `disableAutomaticContentInsets` | `boolean` | Disable safe area handling |
| `disableTransparentOnScrollEdge` | `boolean` | Per-tab transparency control |

### Icon Props

```tsx
// SF Symbol + Android drawable
<NativeTabs.Trigger.Icon sf="house.fill" md="home" />

// SF Symbol with selected state
<NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />

// Custom image source
<NativeTabs.Trigger.Icon src={require('./icon.png')} />

// Custom with selected state
<NativeTabs.Trigger.Icon src={{ 
  default: require('./icon.png'), 
  selected: require('./icon-selected.png') 
}} />

// renderingMode (iOS only, SDK 55+)
<NativeTabs.Trigger.Icon src={require('./icon.png')} renderingMode="original" />
// 'template' (default) - iOS applies tint color
// 'original' - preserves original colors (good for gradients)
```

### Dynamic Colors for Liquid Glass

Liquid Glass changes colors based on background. Use `DynamicColorIOS`:

```tsx
import { DynamicColorIOS } from 'react-native';

<NativeTabs
  labelStyle={{
    color: DynamicColorIOS({ dark: 'white', light: 'black' }),
  }}
  tintColor={DynamicColorIOS({ dark: 'white', light: 'black' })}
>
```

### iOS 26 Features

**Search Tab Role:**
```tsx
<NativeTabs.Trigger name="search" role="search">
  <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
</NativeTabs.Trigger>
```

**Tab Bar Search Input:** Wrap screen in Stack with `headerSearchBarOptions`

### Known Limitations

- Maximum 5 tabs on Android (Material Tabs limitation)
- Cannot measure tab bar height (varies by device/orientation)
- No nested native tabs support
- Limited FlatList integration (scroll-to-top, minimize-on-scroll not supported)
- Dynamically adding/removing tabs remounts navigator and loses state

---

## expo-calendar

**Docs:** https://docs.expo.dev/versions/latest/sdk/calendar/

### iOS Permission Keys (Info.plist)

**iOS 17+ requires granular permission keys.** Include BOTH legacy and new keys:

| Key | Required For |
|-----|--------------|
| `NSCalendarsUsageDescription` | Legacy (iOS 6+) |
| `NSCalendarsFullAccessUsageDescription` | iOS 17+ full access |
| `NSCalendarsWriteOnlyAccessUsageDescription` | iOS 17+ write-only |
| `NSRemindersUsageDescription` | Legacy reminders |
| `NSRemindersFullAccessUsageDescription` | iOS 17+ reminders |

### System Calendar UI (No Permission Required)

```tsx
// Create event via system UI (no permission needed)
await Calendar.createEventInCalendarAsync({
  title: 'Event Title',
  startDate: new Date(),
  endDate: new Date(),
});

// Open/edit event via system UI
await Calendar.openEventInCalendarAsync({ id: eventId });
```

### Programmatic API (Permission Required)

```tsx
const { status } = await Calendar.requestCalendarPermissionsAsync();
if (status === 'granted') {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const eventId = await Calendar.createEventAsync(calendarId, eventData);
}
```

---

## System Colors (PlatformColor)

```tsx
import { PlatformColor, Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Platform.OS === 'ios' ? PlatformColor('systemBackground') : '#FFFFFF',
  },
});
```

| Color | Use |
|-------|-----|
| `systemBackground` | Primary background |
| `secondarySystemBackground` | Cards, grouped content |
| `tertiarySystemBackground` | Nested content |
| `label` | Primary text |
| `secondaryLabel` | Secondary text |
| `tertiaryLabel` | Tertiary text |
| `systemBlue` | Primary action, links |
| `systemRed` | Destructive, errors |
| `systemGreen` | Success |
| `systemOrange` | Warning |
| `systemYellow` | Caution |
| `systemPink` | Accent (dating apps) |
| `systemPurple` | Creative accent |
| `systemTeal` | Calm accent |
| `separator` | Dividers |
| `opaqueSeparator` | Opaque dividers |

---

## Spring Animation Presets

```tsx
import { withSpring } from 'react-native-reanimated';

// Usage
withSpring(targetValue, { damping: 15, stiffness: 150 });
```

| Use Case | damping | stiffness |
|----------|---------|-----------|
| Button feedback | 20 | 300 |
| Card expand | 12 | 180 |
| Page transition | 18 | 120-200 |
| Default | 15 | 150 |

---

## HIG-Compliant Sizing

| Element | Size |
|---------|------|
| Standard margin | 16pt |
| Button height | 44-50pt |
| Button radius | 12pt |
| Card radius | 16-20pt |
| Touch target min | 44x44pt |
| Tab bar icon | 24-28pt |
| Inline icon | 20-24pt |

---

## Quick Imports

```tsx
// SF Symbols
import { SymbolView } from 'expo-symbols';

// Liquid Glass
import { GlassView, GlassContainer, isLiquidGlassAvailable, isGlassEffectAPIAvailable } from 'expo-glass-effect';

// Haptics
import * as Haptics from 'expo-haptics';

// Blur
import { BlurView } from 'expo-blur';

// Native Tabs
import { NativeTabs } from 'expo-router/unstable-native-tabs';

// Calendar
import * as Calendar from 'expo-calendar';

// Platform utilities
import { Platform, PlatformColor, DynamicColorIOS, AccessibilityInfo } from 'react-native';
```

---

## Official Documentation Links

| Package | Docs |
|---------|------|
| expo-glass-effect | https://docs.expo.dev/versions/latest/sdk/glass-effect/ |
| expo-symbols | https://docs.expo.dev/versions/latest/sdk/symbols/ |
| expo-haptics | https://docs.expo.dev/versions/latest/sdk/haptics/ |
| expo-blur | https://docs.expo.dev/versions/latest/sdk/blur-view/ |
| expo-calendar | https://docs.expo.dev/versions/latest/sdk/calendar/ |
| Native Tabs | https://docs.expo.dev/versions/latest/sdk/router-native-tabs/ |
| Native Tabs Guide | https://docs.expo.dev/router/advanced/native-tabs/ |
| SF Symbols | https://developer.apple.com/sf-symbols/ |
| Apple HIG | https://developer.apple.com/design/human-interface-guidelines/ |
