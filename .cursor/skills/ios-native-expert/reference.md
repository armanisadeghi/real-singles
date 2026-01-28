# iOS Native Reference

Quick reference for iOS 26 development. All packages pre-installed.

---

## iOS System Colors (PlatformColor)

### Background Colors

| Name | Light | Dark | Use |
|------|-------|------|-----|
| `systemBackground` | #FFFFFF | #000000 | Primary background |
| `secondarySystemBackground` | #F2F2F7 | #1C1C1E | Cards, grouped content |
| `tertiarySystemBackground` | #FFFFFF | #2C2C2E | Third layer |
| `systemGroupedBackground` | #F2F2F7 | #000000 | Grouped table views |
| `secondarySystemGroupedBackground` | #FFFFFF | #1C1C1E | Cells in grouped tables |
| `tertiarySystemGroupedBackground` | #F2F2F7 | #2C2C2E | Third level grouped |

### Label Colors

| Name | Light | Dark | Use |
|------|-------|------|-----|
| `label` | #000000 | #FFFFFF | Primary text |
| `secondaryLabel` | rgba(60,60,67,0.6) | rgba(235,235,245,0.6) | Secondary text |
| `tertiaryLabel` | rgba(60,60,67,0.3) | rgba(235,235,245,0.3) | Tertiary/disabled |
| `quaternaryLabel` | rgba(60,60,67,0.18) | rgba(235,235,245,0.16) | Watermarks |
| `placeholderText` | rgba(60,60,67,0.3) | rgba(235,235,245,0.3) | Input placeholders |

### Separators

| Name | Light | Dark | Use |
|------|-------|------|-----|
| `separator` | rgba(60,60,67,0.29) | rgba(84,84,88,0.6) | Thin dividers |
| `opaqueSeparator` | #C6C6C8 | #38383A | Opaque dividers |

### System Tints

| Name | Light | Dark |
|------|-------|------|
| `systemBlue` | #007AFF | #0A84FF |
| `systemGreen` | #34C759 | #30D158 |
| `systemRed` | #FF3B30 | #FF453A |
| `systemOrange` | #FF9500 | #FF9F0A |
| `systemYellow` | #FFCC00 | #FFD60A |
| `systemPink` | #FF2D55 | #FF375F |
| `systemPurple` | #AF52DE | #BF5AF2 |
| `systemTeal` | #5AC8FA | #64D2FF |
| `systemIndigo` | #5856D6 | #5E5CE6 |

### Grays

| Name | Light | Dark |
|------|-------|------|
| `systemGray` | #8E8E93 | #8E8E93 |
| `systemGray2` | #AEAEB2 | #636366 |
| `systemGray3` | #C7C7CC | #48484A |
| `systemGray4` | #D1D1D6 | #3A3A3C |
| `systemGray5` | #E5E5EA | #2C2C2E |
| `systemGray6` | #F2F2F7 | #1C1C1E |

---

## expo-glass-effect

**Docs:** https://docs.expo.dev/versions/latest/sdk/glass-effect/

### GlassView Props

| Prop | Type | Default |
|------|------|---------|
| `glassEffectStyle` | `'regular'` \| `'clear'` | `'regular'` |
| `isInteractive` | `boolean` | `false` |
| `tintColor` | `string` | - |

### GlassContainer Props

| Prop | Type | Description |
|------|------|-------------|
| `spacing` | `number` | Distance at which glass elements start merging |

### Availability Functions

```tsx
import { isLiquidGlassAvailable, isGlassEffectAPIAvailable, GlassView } from 'expo-glass-effect';

const hasGlass = Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
```

### Critical Rules

1. `isInteractive` is immutable — use `key` prop to remount
2. Never `opacity < 1` on GlassView or parents
3. Always check `isGlassEffectAPIAvailable()` before rendering

---

## expo-symbols

**Docs:** https://docs.expo.dev/versions/latest/sdk/symbols/

### SymbolView Props

| Prop | Type | Default |
|------|------|---------|
| `name` | `SFSymbol` | **required** |
| `type` | `SymbolType` | `'monochrome'` |
| `tintColor` | `ColorValue` | - |
| `size` | `number` | `24` |
| `weight` | `SymbolWeight` | `'unspecified'` |
| `scale` | `SymbolScale` | `'unspecified'` |
| `animationSpec` | `AnimationSpec` | - |
| `fallback` | `ReactNode` | - |

### SymbolType

`'monochrome'` | `'hierarchical'` | `'palette'` | `'multicolor'`

### SymbolWeight

`'ultraLight'` | `'thin'` | `'light'` | `'regular'` | `'medium'` | `'semibold'` | `'bold'` | `'heavy'` | `'black'`

### AnimationSpec

```tsx
animationSpec={{
  effect: { type: 'bounce' | 'pulse' | 'scale', direction?: 'up' | 'down', wholeSymbol?: boolean },
  repeating?: boolean,
  repeatCount?: number,
  speed?: number,
}}
```

### Common Symbols

| Purpose | Symbol | Filled |
|---------|--------|--------|
| Home | `house` | `house.fill` |
| Search | `magnifyingglass` | - |
| Heart | `heart` | `heart.fill` |
| Chat | `bubble.left` | `bubble.left.fill` |
| Profile | `person` | `person.fill` |
| Settings | `gearshape` | `gearshape.fill` |
| Camera | `camera` | `camera.fill` |
| Star | `star` | `star.fill` |
| Bell | `bell` | `bell.fill` |
| Calendar | `calendar` | - |
| Share | `square.and.arrow.up` | - |
| More | `ellipsis` | `ellipsis.circle.fill` |
| Close | `xmark` | `xmark.circle.fill` |
| Check | `checkmark` | `checkmark.circle.fill` |
| Add | `plus` | `plus.circle.fill` |
| Delete | `trash` | `trash.fill` |

**Browse all:** https://developer.apple.com/sf-symbols/

---

## expo-haptics

**Docs:** https://docs.expo.dev/versions/latest/sdk/haptics/

### ImpactFeedbackStyle

| Style | Use For |
|-------|---------|
| `Light` | Small UI, button taps |
| `Medium` | Cards, moderate elements |
| `Heavy` | Large UI elements |
| `Rigid` | Small compression |
| `Soft` | Large compression |

### NotificationFeedbackType

| Type | Use For |
|------|---------|
| `Success` | Task completed |
| `Warning` | Needs attention |
| `Error` | Task failed |

---

## expo-blur

**Docs:** https://docs.expo.dev/versions/latest/sdk/blur-view/

### Props

| Prop | Type | Default |
|------|------|---------|
| `intensity` | `1-100` | `50` |
| `tint` | `BlurTint` | `'default'` |

### BlurTint

`'light'` | `'dark'` | `'default'` | `'extraLight'` | `'regular'` | `'prominent'`

iOS system materials: `'systemUltraThinMaterial'` | `'systemThinMaterial'` | `'systemMaterial'` | `'systemThickMaterial'`

### Critical: Render Order

BlurView must render AFTER dynamic content:

```tsx
// ✅ Correct
<View>
  <FlatList />
  <BlurView />
</View>
```

---

## Native Tabs

**Docs:** https://docs.expo.dev/router/advanced/native-tabs/

### NativeTabs Props

| Prop | Platform | Description |
|------|----------|-------------|
| `tintColor` | All | Selected icon/label tint |
| `backgroundColor` | All | Tab bar background |
| `blurEffect` | iOS | Blur effect type |
| `minimizeBehavior` | iOS 26+ | `'automatic'` \| `'never'` \| `'onScrollDown'` \| `'onScrollUp'` |
| `hidden` | All | Hide entire tab bar |

### Icon Props

```tsx
// SF Symbol with states
<NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />

// Custom image
<NativeTabs.Trigger.Icon src={require('./icon.png')} />
```

### iOS 26 Features

```tsx
// Search tab role
<NativeTabs.Trigger name="search" role="search">

// Minimize on scroll
<NativeTabs minimizeBehavior="onScrollDown">
```

---

## DynamicColorIOS

```tsx
import { DynamicColorIOS, Platform } from 'react-native';

const color = Platform.OS === 'ios' 
  ? DynamicColorIOS({
      light: '#B06D1E',
      dark: '#FFBA70',
      highContrastLight: '#8A5516',  // optional
      highContrastDark: '#FFD4A3',   // optional
    })
  : '#B06D1E';
```

---

## Spring Animation Presets

```tsx
import { withSpring } from 'react-native-reanimated';

withSpring(value, { damping: 15, stiffness: 150 });
```

| Use Case | damping | stiffness |
|----------|---------|-----------|
| Button | 20 | 300 |
| Card expand | 12 | 180 |
| Page transition | 18 | 120-200 |
| Default | 15 | 150 |

---

## HIG Sizing

| Element | Size |
|---------|------|
| Standard margin | 16pt |
| Button height | 44-50pt |
| Button radius | 12pt |
| Card radius | 16-20pt |
| Touch target min | 44x44pt |
| Tab bar icon | 24-28pt |

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

// Platform utilities
import { Platform, PlatformColor, DynamicColorIOS, AccessibilityInfo } from 'react-native';
```

---

## Documentation Links

| Package | URL |
|---------|-----|
| expo-glass-effect | https://docs.expo.dev/versions/latest/sdk/glass-effect/ |
| expo-symbols | https://docs.expo.dev/versions/latest/sdk/symbols/ |
| expo-haptics | https://docs.expo.dev/versions/latest/sdk/haptics/ |
| expo-blur | https://docs.expo.dev/versions/latest/sdk/blur-view/ |
| Native Tabs | https://docs.expo.dev/router/advanced/native-tabs/ |
| PlatformColor | https://reactnative.dev/docs/platformcolor |
| DynamicColorIOS | https://reactnative.dev/docs/dynamiccolorios |
| SF Symbols | https://developer.apple.com/sf-symbols/ |
| Apple HIG | https://developer.apple.com/design/human-interface-guidelines/ |
