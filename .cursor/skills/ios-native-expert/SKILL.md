---
name: ios-native-expert
description: Ensures iOS implementations use truly native components, iOS 26 Liquid Glass design, SF Symbols, and proper light/dark mode support with PlatformColor. Use when implementing iOS-specific features, reviewing iOS code for native feel, fixing light/dark mode issues, theming, or when the user mentions iOS native, Liquid Glass, SF Symbols, dark mode, PlatformColor, DynamicColorIOS, or color adaptation. NEVER modifies web code or Android implementations.
---

# iOS Native Expert

**Your job:** Make iOS implementations authentically native using iOS 26 design patterns, Liquid Glass, SF Symbols, and proper light/dark mode support with `PlatformColor`.

---

## CRITICAL: Pattern Violations to Fix

**Before implementing anything, check for these violations and FIX THEM:**

### 1. Hardcoded Hex Colors (WRONG)

```tsx
// ❌ VIOLATION - hardcoded colors don't adapt
backgroundColor: '#FFFFFF'
color: isDark ? '#FFFFFF' : '#000000'
background: isDark ? '#000000' : BRAND_BACKGROUND

// ✅ CORRECT - use PlatformColor
backgroundColor: Platform.OS === 'ios' ? PlatformColor('systemBackground') : colors.background
color: Platform.OS === 'ios' ? PlatformColor('label') : colors.onSurface
```

### 2. ThemeContext iOS Colors (KNOWN VIOLATION)

**`mobile/context/ThemeContext.tsx`** has hardcoded iOS colors. The `createIOSColors()` function returns hex strings instead of `PlatformColor`. When working with iOS theming:

- Do NOT follow the `ThemeContext` pattern for system colors
- Use `PlatformColor` directly for backgrounds, labels, separators
- Use `DynamicColorIOS` only for custom brand colors

### 3. Old BlurView Instead of GlassView

```tsx
// ❌ OUTDATED for floating elements
<BlurView intensity={80} tint="light" />

// ✅ MODERN (iOS 26+)
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
{isGlassEffectAPIAvailable() ? <GlassView /> : <BlurView ... />}
```

---

## Scope: iOS-ONLY

| Action | Allowed |
|--------|---------|
| Modify `/mobile` iOS-specific code | ✅ Yes |
| Use `Platform.OS === 'ios'` conditionals | ✅ Yes |
| Add iOS-only features | ✅ Yes |
| Modify `/web` in any way | ❌ NEVER |
| Change shared logic that affects Android | ❌ NEVER |

---

## Color Implementation (MANDATORY)

### Priority 1: PlatformColor for System Colors

**ALWAYS use PlatformColor for iOS system colors.** They automatically adapt to light/dark mode, high contrast, and Liquid Glass.

```tsx
import { Platform, PlatformColor } from 'react-native';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Platform.OS === 'ios' 
      ? PlatformColor('systemBackground') 
      : colors.background,
  },
  text: {
    color: Platform.OS === 'ios' 
      ? PlatformColor('label') 
      : colors.onSurface,
  },
});
```

**Essential PlatformColor names:**

| Category | Names |
|----------|-------|
| Backgrounds | `systemBackground`, `secondarySystemBackground`, `tertiarySystemBackground`, `systemGroupedBackground` |
| Labels | `label`, `secondaryLabel`, `tertiaryLabel`, `quaternaryLabel`, `placeholderText` |
| Separators | `separator`, `opaqueSeparator` |
| System Tints | `systemBlue`, `systemRed`, `systemGreen`, `systemOrange`, `systemPink`, `systemPurple`, `systemYellow` |
| Grays | `systemGray` through `systemGray6` |

### Priority 2: DynamicColorIOS for Brand Colors

**Only use DynamicColorIOS for custom brand colors** not in the system palette:

```tsx
import { DynamicColorIOS, Platform } from 'react-native';

const brandPrimary = Platform.OS === 'ios' 
  ? DynamicColorIOS({
      light: '#B06D1E',
      dark: '#FFBA70',
      highContrastLight: '#8A5516',  // Optional
      highContrastDark: '#FFD4A3',   // Optional
    })
  : isDark ? '#FFBA70' : '#B06D1E';
```

### Hardcoded Color Migration

| Hardcoded | Replace With |
|-----------|--------------|
| `#FFFFFF`, `white` | `PlatformColor('systemBackground')` |
| `#F2F2F7`, `#F5F5F5` | `PlatformColor('secondarySystemBackground')` |
| `#000000`, `#333333` | `PlatformColor('label')` |
| `#666666`, `#8E8E93` | `PlatformColor('secondaryLabel')` |
| `#E5E5EA`, `#D1D1D6` | `PlatformColor('separator')` |
| `#007AFF` | `PlatformColor('systemBlue')` |
| `#FF3B30` | `PlatformColor('systemRed')` |
| `#34C759` | `PlatformColor('systemGreen')` |

---

## Liquid Glass (iOS 26) - PROACTIVELY MODERNIZE

**iOS 26 apps SHOULD use Liquid Glass for floating UI elements.** When working on iOS UI, proactively upgrade to Liquid Glass where appropriate.

### Where to Apply Liquid Glass

| ✅ Use | ❌ Never |
|--------|----------|
| Tab bars (automatic) | List cells/tables |
| Toolbars | Card backgrounds |
| Navigation bars (automatic) | Page content |
| Floating action buttons | Media content |
| Sheet headers | Text containers |

### Implementation

```tsx
import { GlassView, GlassContainer, isLiquidGlassAvailable, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { AccessibilityInfo, Platform } from 'react-native';

// REQUIRED: Full availability check
const hasLiquidGlass = Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

// Respect accessibility
const [reduceTransparency, setReduceTransparency] = useState(false);
useEffect(() => {
  AccessibilityInfo.isReduceTransparencyEnabled().then(setReduceTransparency);
  const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduceTransparency);
  return () => sub.remove();
}, []);

const showGlass = hasLiquidGlass && !reduceTransparency;

// Usage
{showGlass ? (
  <GlassView style={styles.floating} glassEffectStyle="regular" />
) : (
  <View style={[styles.floating, { backgroundColor: PlatformColor('secondarySystemBackground') }]} />
)}
```

### GlassView Critical Rules

1. **`isInteractive` is immutable** — set once on mount, use `key` to remount
2. **NEVER `opacity < 1`** on GlassView or parent views (causes rendering bugs)
3. **ALWAYS check `isGlassEffectAPIAvailable()`** — prevents crashes on some iOS 26 betas

---

## SF Symbols (expo-symbols)

**All iOS icons MUST use SF Symbols.** Never use icon fonts or PNGs on iOS.

```tsx
import { SymbolView } from 'expo-symbols';

<SymbolView
  name="heart.fill"
  style={{ width: 24, height: 24 }}
  tintColor={PlatformColor('systemPink')}  // Use PlatformColor!
  type="hierarchical"
  fallback={<MaterialIcon name="favorite" />}
/>
```

### Symbol Types

| Type | Use For |
|------|---------|
| `monochrome` | Single color icons |
| `hierarchical` | Depth with one color |
| `palette` | Multiple explicit colors |
| `multicolor` | Built-in multicolor |

### Symbol Animations

```tsx
<SymbolView
  name="heart.fill"
  animationSpec={{ 
    effect: { type: 'bounce', wholeSymbol: true }, 
    repeating: false 
  }}
/>
```

---

## Native Tabs (expo-router/unstable-native-tabs)

Native tabs automatically get Liquid Glass on iOS 26. Use `DynamicColorIOS` for tab colors:

```tsx
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { DynamicColorIOS } from 'react-native';

<NativeTabs
  tintColor={DynamicColorIOS({ dark: 'white', light: 'black' })}
  labelStyle={{ color: DynamicColorIOS({ dark: 'white', light: 'black' }) }}
>
  <NativeTabs.Trigger name="index">
    <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
    <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
  </NativeTabs.Trigger>
</NativeTabs>
```

---

## Haptic Feedback (expo-haptics)

**Add haptics to all interactive elements:**

| Action | Code |
|--------|------|
| Toggle/select | `Haptics.selectionAsync()` |
| Button tap | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` |
| Card press | `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` |
| Success | `Haptics.notificationAsync(NotificationFeedbackType.Success)` |
| Error | `Haptics.notificationAsync(NotificationFeedbackType.Error)` |

---

## Accessibility Requirements

### Reduce Transparency

Fall back from blur/glass effects:

```tsx
const [reduceTransparency, setReduceTransparency] = useState(false);

useEffect(() => {
  AccessibilityInfo.isReduceTransparencyEnabled().then(setReduceTransparency);
  const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduceTransparency);
  return () => sub.remove();
}, []);

// Use solid background when reduceTransparency is true
```

### Reduce Motion

Disable animations:

```tsx
const [reduceMotion, setReduceMotion] = useState(false);

useEffect(() => {
  AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
  return () => sub.remove();
}, []);

const animationDuration = reduceMotion ? 0 : 300;
```

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
| Animations | `react-native-reanimated` | Animated API |

---

## Navigation

### Large Titles + Liquid Glass

```tsx
<Stack.Screen options={{
  headerLargeTitle: Platform.OS === 'ios',
  headerLargeTitleShadowVisible: false,
  headerBlurEffect: Platform.OS === 'ios' ? 'regular' : undefined,
  headerTransparent: Platform.OS === 'ios',
}} />
```

---

## Spring Animations

**Always use spring physics** with `react-native-reanimated`:

| Use Case | Config |
|----------|--------|
| Button feedback | `{ damping: 20, stiffness: 300 }` |
| Card expand | `{ damping: 12, stiffness: 180 }` |
| Page transitions | `{ damping: 18, stiffness: 120 }` |
| Default | `{ damping: 15, stiffness: 150 }` |

---

## Status Bar

```tsx
import { StatusBar } from 'expo-status-bar';

<StatusBar style="auto" />  // Adapts to light/dark
```

---

## iOS Permissions

**Missing Info.plist entries cause crashes.** Location: `mobile/ios/RealSingles/Info.plist`

iOS 17+ requires BOTH legacy and new permission keys:

| Feature | Keys Required |
|---------|---------------|
| Calendar | `NSCalendarsUsageDescription`, `NSCalendarsFullAccessUsageDescription`, `NSCalendarsWriteOnlyAccessUsageDescription` |
| Camera | `NSCameraUsageDescription` |
| Photo Library | `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription` |
| Location | `NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription` |

---

## Pre-Completion Checklist

- [ ] **PlatformColor** used for all system colors (backgrounds, labels, separators)
- [ ] **No hardcoded hex colors** for system UI (except brand colors via DynamicColorIOS)
- [ ] **SF Symbols** for all iOS icons (via expo-symbols with fallback)
- [ ] **Haptic feedback** on interactive elements
- [ ] **GlassView** for floating elements where appropriate (with availability check)
- [ ] **Accessibility**: respect reduce transparency and reduce motion
- [ ] **Platform.OS === 'ios'** isolates all iOS code
- [ ] **Android unchanged**, Web untouched

---

## Reference Files

| File | Purpose |
|------|---------|
| `reference.md` | Detailed API reference for iOS packages |
| `mobile/app/(tabs)/_layout.tsx` | Native tabs example |
| `mobile/utils/platformColors.ts` | PlatformColor utilities |

---

## Documentation Links

- expo-glass-effect: https://docs.expo.dev/versions/latest/sdk/glass-effect/
- expo-symbols: https://docs.expo.dev/versions/latest/sdk/symbols/
- PlatformColor: https://reactnative.dev/docs/platformcolor
- DynamicColorIOS: https://reactnative.dev/docs/dynamiccolorios
- Apple HIG: https://developer.apple.com/design/human-interface-guidelines/
- Liquid Glass Gallery: https://developer.apple.com/design/new-design-gallery/
