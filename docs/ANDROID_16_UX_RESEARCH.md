# Android 16 Native UX Research: React Native / Expo Technical Stack

> **Research Date:** January 2026
> **Source:** Web research from official documentation, GitHub repos, npm packages, and verified sources
> **Purpose:** Provide accurate, verified information for Android 16 native experience in React Native/Expo

---

## Table of Contents

1. [Material You Dynamic Color](#1-material-you-dynamic-color)
2. [Dynamic Color Extraction Libraries](#2-dynamic-color-extraction-libraries)
3. [Expo-Compatible Dynamic Color Solutions](#3-expo-compatible-dynamic-color-solutions)
4. [Native Haptics for Android 16](#4-native-haptics-for-android-16)
5. [expo-haptics Capabilities vs Native Android APIs](#5-expo-haptics-capabilities-vs-native-android-apis)
6. [React Native Reanimated v3/v4 Expressive Motion](#6-react-native-reanimated-v3v4-expressive-motion)
7. [Spring Animations Matching Material 3 Expressive](#7-spring-animations-matching-material-3-expressive)
8. [Gesture Handler and Predictive Back Gestures](#8-gesture-handler-and-predictive-back-gestures)
9. [Material Motion Spring Configurations](#9-material-motion-spring-configurations)
10. [Recommended Stack Summary](#10-recommended-stack-summary)

---

## 1. Material You Dynamic Color

### How Android's Material You Works

The system takes a single **source color** (from the wallpaper or chosen by the user) and transforms it into **five tonal palettes** with **thirteen levels each** (accent 1-3, neutral 1-2), totaling **65 color attributes**. These are mapped to Material Design 3 color roles for light and dark themes with guaranteed contrast ratios.

Starting with Android 13, `theme_style` was introduced to distinguish color variants. AOSP supports: `TONAL_SPOT`, `VIBRANT`, `EXPRESSIVE`, `SPRITZ`, and static variants `RAINBOW` and `FRUIT_SALAD`.

### React Native Approach: `PlatformColor` (Built-in)

React Native's `PlatformColor` can access Android system colors directly:

```tsx
import { PlatformColor } from 'react-native';

// Access Material You system colors directly
const dynamicColor = PlatformColor('@android:color/system_accent1_500');
const neutralColor = PlatformColor('@android:color/system_neutral1_100');
```

**Android system color strings available:**
- `@android:color/system_accent1_0` through `system_accent1_1000` (13 levels)
- `@android:color/system_accent2_0` through `system_accent2_1000`
- `@android:color/system_accent3_0` through `system_accent3_1000`
- `@android:color/system_neutral1_0` through `system_neutral1_1000`
- `@android:color/system_neutral2_0` through `system_neutral2_1000`

**Limitation:** `PlatformColor` is low-level. No automatic M3 color role mapping or light/dark theme support.

### `useColorScheme` (Built-in)

```tsx
import { useColorScheme } from 'react-native';

const colorScheme = useColorScheme(); // 'light' | 'dark' | null
```

**Limitation:** Only provides light/dark mode toggle -- not full Material You palette extraction.

---

## 2. Dynamic Color Extraction Libraries

### Option A: `react-native-material-you-colors` (by alabsi91)

**GitHub:** https://github.com/alabsi91/react-native-material-you-colors
**License:** MIT
**Platforms:** Android, iOS, Web

Retrieves Material You color palettes from the Android system and generates palettes from seed colors on other platforms.

```tsx
import MaterialYou from 'react-native-material-you-colors';

// Get system Material You palette (Android 12+)
const palette = MaterialYou.getMaterialYouPalette();
// Returns:
// {
//   system_accent1: string[],   // 13 shades
//   system_accent2: string[],
//   system_accent3: string[],
//   system_neutral1: string[],
//   system_neutral2: string[],
// }

// Generate palette from seed color (any platform)
const palette = MaterialYou.generatePaletteFromColor('#6750A4', 'TONAL_SPOT');

// Full signature
MaterialYou.getMaterialYouPalette(
  fallbackSeedColor?: string,     // Fallback if Material You unavailable
  style?: GenerationStyle          // 'TONAL_SPOT' | 'VIBRANT' | 'EXPRESSIVE' etc.
): MaterialYouPalette
```

**Expo Compatibility:** Native side does NOT work in Expo Go. Works in production builds and dev builds with `npx expo prebuild`.

### Option B: `@assembless/react-native-material-you` (Older)

**npm:** https://www.npmjs.com/package/@assembless/react-native-material-you

Provides hooks for reactive palette updates:

```tsx
import { MaterialYouService, useMaterialYouPalette } from '@assembless/react-native-material-you';

// Wrap app
<MaterialYouService>
  <App />
</MaterialYouService>

// Get palette (auto-updates when system theme changes)
const palette = useMaterialYouPalette();
```

### Option C: `material-color-utilities` (by Google / Material Foundation)

**GitHub:** https://github.com/material-foundation/material-color-utilities

Google's official color algorithm library. Pure JavaScript -- generates M3 palettes from any seed color. Used internally by Android, Flutter, and web implementations.

```ts
import { themeFromSourceColor, argbFromHex } from '@material/material-color-utilities';

const theme = themeFromSourceColor(argbFromHex('#6750A4'));
// Returns full Material 3 theme with all color roles
```

### Option D: `react-native-dynamic-theme`

**Website:** https://react-native-dynamic-theme.vercel.app/

Full M3 color palette with 25+ semantic color roles, tonal palettes, cross-platform fallbacks, contrast levels, and TypeScript support. Leverages Android's dynamic theming on Android 12+.

---

## 3. Expo-Compatible Dynamic Color Solutions

### RECOMMENDED (SDK < 55): `@pchmn/expo-material3-theme`

**npm:** https://www.npmjs.com/package/@pchmn/expo-material3-theme
**GitHub:** https://github.com/pchmn/expo-material3-theme
**Version:** 1.3.2 (latest)
**License:** MIT

Already installed in this project. The best Expo-compatible solution for SDK 54.

```tsx
import { useMaterial3Theme } from '@pchmn/expo-material3-theme';
import { useColorScheme } from 'react-native';

function App() {
  const colorScheme = useColorScheme();
  const { theme } = useMaterial3Theme({ fallbackSourceColor: '#6750A4' });

  const colors = theme[colorScheme ?? 'light'];
  // colors.primary, colors.onPrimary, colors.primaryContainer,
  // colors.secondary, colors.surface, colors.background, etc.

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.onSurface }}>Themed content</Text>
    </View>
  );
}
```

**Using a specific source color (overrides system):**
```tsx
const { theme } = useMaterial3Theme({ sourceColor: '#3E8260' });
```

**Runtime theme switching:**
```tsx
const { theme, updateTheme, resetTheme } = useMaterial3Theme();
updateTheme('#FF5722');  // Generate new theme from color
resetTheme();            // Reset to system/fallback
```

**Integration with React Native Paper:**
```tsx
import { MD3LightTheme, MD3DarkTheme, PaperProvider } from 'react-native-paper';
import { useMaterial3Theme } from '@pchmn/expo-material3-theme';

const { theme } = useMaterial3Theme();
const paperTheme = {
  ...MD3LightTheme,
  colors: theme.light,
};

<PaperProvider theme={paperTheme}>
  <App />
</PaperProvider>
```

**Important caveats:**
- Expo Go shows fallback colors only. Use development builds for true system colors.
- When the system theme changes on Android 12+, the Activity is recreated (configuration change that cannot be disabled). Local state may be lost if not persisted.

### FUTURE (SDK 55+): Expo Built-in Colors API

**Expo SDK 55** (beta January 2026) introduces a **first-party Colors API** that automatically applies dynamic Material 3 styles on Android (synced to wallpaper) and adaptive system colors on iOS. No third-party library needed.

**Key SDK 55 features:**
- Built-in Material 3 dynamic color support
- Jetpack Compose API for Android (beta)
- `expo-widgets` for iOS Home Screen Widgets
- All Expo packages now use the same major version as the SDK

When upgrading to SDK 55, `@pchmn/expo-material3-theme` can likely be replaced by the built-in Colors API.

---

## 4. Native Haptics for Android 16

### Android 16 Haptics API Changes (API Level 36)

Android 16 introduces significantly improved haptic APIs:

- **Normalized PWLE (Piecewise Linear Waveform Envelope) APIs**: Apps can define amplitude and frequency curves while abstracting away device-specific differences
- **Baseline haptic primitives**: `CLICK`, `TICK`, `LOW_TICK`, `SLOW_RISE`, `QUICK_RISE`, `QUICK_FALL`, `THUD`, `SPIN`
- **Parametric effects**: Custom duration, amplitude, and frequency control
- **Automatic protection**: Prevents haptics from "overdriving" the motor
- **Multi-sensory support**: Combined haptics and sound
- **Envelope effects**: Framework requires minimum 10ms between control points and at least 16 points per envelope

### Android `HapticFeedbackConstants` (View-based)

These are the recommended Android haptic constants, organized by use case:

| Constant | Use Case |
|----------|----------|
| `CLOCK_TICK` | Hour/minute tick of a clock |
| `CONFIRM` | Successful completion of an action |
| `CONTEXT_CLICK` | Context click on an object |
| `DRAG_START` | Started a drag-and-drop gesture |
| `GESTURE_END` | End of a gesture |
| `GESTURE_THRESHOLD_ACTIVATE` | Crossing a threshold in a gesture |
| `LONG_PRESS` | Long press feedback |
| `REJECT` | Rejection or failure of an action |
| `SEGMENT_FREQUENT_TICK` | Switching between many potential choices (e.g., minutes on a clock, percentages). Very soft -- may produce no vibration on some devices. |
| `SEGMENT_TICK` | Switching between discrete choices (e.g., list items, slider stops) |
| `TEXT_HANDLE_MOVE` | Selection/insertion handle moved on text field |
| `TOGGLE_OFF` | Switch/button toggled off |
| `TOGGLE_ON` | Switch/button toggled on |
| `VIRTUAL_KEY` | Pressed a virtual on-screen key |

**Design principle:** Constants are defined by *function* (what action occurred), not by *effect type* (what vibration plays). This ensures consistent behavior across devices.

---

## 5. expo-haptics Capabilities vs Native Android APIs

### Current expo-haptics (v15.0.8)

**npm:** https://www.npmjs.com/package/expo-haptics

#### Cross-platform API (iOS + Android)

```tsx
import * as Haptics from 'expo-haptics';

// Impact feedback
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

// Selection feedback
Haptics.selectionAsync();

// Notification feedback
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
```

#### Android-Specific API: `performAndroidHapticsAsync` (NEW)

Added in early 2025 via PR #34077. Uses `View.performHapticFeedback` under the hood (not the Vibrator API). Does NOT require `VIBRATE` permission.

```tsx
import * as Haptics from 'expo-haptics';

// Android-native haptic constants
await Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Clock_Tick);
await Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);
await Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Context_Click);
await Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject);
await Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Frequent_Tick);
await Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Tick);
await Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Text_Handle_Move);
await Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Toggle_Off);
await Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Toggle_On);
await Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Virtual_Key);
```

#### Recommended Haptic Mappings for UI Components

| UI Component | Android Haptic | iOS Fallback |
|-------------|---------------|-------------|
| Slider tick (discrete) | `Segment_Tick` | `selectionAsync()` |
| Slider tick (continuous/many) | `Segment_Frequent_Tick` | `selectionAsync()` |
| Picker item change | `Segment_Tick` | `selectionAsync()` |
| Toggle switch on | `Toggle_On` | `impactAsync(Light)` |
| Toggle switch off | `Toggle_Off` | `impactAsync(Light)` |
| Button tap | `Virtual_Key` | `impactAsync(Light)` |
| Success action | `Confirm` | `notificationAsync(Success)` |
| Error/rejection | `Reject` | `notificationAsync(Error)` |
| Long press | (use cross-platform) | `impactAsync(Medium)` |
| Text cursor drag | `Text_Handle_Move` | `selectionAsync()` |
| Drag start | (use cross-platform) | `impactAsync(Light)` |

**Platform-specific pattern:**
```tsx
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const hapticToggleOn = () => {
  if (Platform.OS === 'android') {
    Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Toggle_On);
  } else {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};
```

### Alternative: `@mhpdev/react-native-haptics` (Turbo Module)

A high-performance alternative using Turbo Modules (New Architecture, RN 0.76+).

**Performance comparison:**
| Test | expo-haptics | react-native-haptics | Winner |
|------|-------------|---------------------|--------|
| iOS Impact Heavy | baseline | ~3.36x faster | react-native-haptics |
| iOS Notification Success | baseline | ~3.16x faster | react-native-haptics |
| iOS Selection | baseline | ~3.70x faster | react-native-haptics |
| Android (all) | ~1.72x faster | baseline | expo-haptics |

**Verdict:** For an Expo project, `expo-haptics` with `performAndroidHapticsAsync` is the best choice. The native Android constants provide Material-consistent haptics without the Vibrator API.

### Gap: Android 16 PWLE/Envelope APIs

Neither `expo-haptics` nor `@mhpdev/react-native-haptics` currently exposes Android 16's new PWLE (amplitude/frequency curve) or envelope APIs. These would require a custom native module or a future library update.

---

## 6. React Native Reanimated v3/v4 Expressive Motion

### Version Timeline

| Version | Status | Key Features |
|---------|--------|-------------|
| **Reanimated 3.x** | Stable (2022-2025) | Worklets, `withSpring`/`withTiming`/`withDecay`, layout animations |
| **Reanimated 4.0** | Stable (July 2025) | CSS animations API, `react-native-worklets` extracted, New Architecture only |
| **Reanimated 4.2.0** | Latest (Dec 2025) | Shared Element Transitions for New Architecture |

### Reanimated 4 Key Changes

1. **CSS-based Animations API**: Declarative, CSS-compatible animation API alongside worklets
2. **`react-native-worklets` extracted**: Worklets runtime separated into its own package for reuse by non-animation libraries
3. **New Architecture only**: Requires React Native Fabric/TurboModules
4. **Easy migration**: v2/v3 animation logic works seamlessly in 4.x with only minor styling API renames
5. **Predefined spring configs**: `GentleSpringConfig`, `SnappySpringConfig`, `WigglySpringConfig`, `Reanimated3DefaultSpringConfig`
6. **Shared Element Transitions** (4.2.0): Animate views between screens for navigation continuity

### Predefined Spring Presets (Reanimated 4.x)

| Preset | damping | mass | stiffness | overshootClamping | Feel |
|--------|---------|------|-----------|-------------------|------|
| **GentleSpringConfig** (default) | 120 | 4 | 900 | false | Smooth, no bounce |
| **SnappySpringConfig** | 110 | 4 | 900 | true | Fast, responsive, no overshoot |
| **WigglySpringConfig** | 90 | 4 | 900 | false | Bouncy, playful |
| **Reanimated3DefaultSpringConfig** | 10 | 1 | 100 | false | Legacy default (very bouncy) |

**Duration-based variants:**

| Preset | duration | dampingRatio |
|--------|----------|-------------|
| GentleSpringConfigWithDuration | 550ms | 1.0 (critically damped) |
| SnappySpringConfigWithDuration | 550ms | 0.92 |
| WigglySpringConfigWithDuration | 550ms | 0.75 |

```tsx
import {
  withSpring,
  GentleSpringConfig,
  SnappySpringConfig,
  WigglySpringConfig,
} from 'react-native-reanimated';

// Use presets
sv.value = withSpring(targetValue, GentleSpringConfig);
sv.value = withSpring(targetValue, SnappySpringConfig);
sv.value = withSpring(targetValue, WigglySpringConfig);

// Custom config
sv.value = withSpring(targetValue, {
  damping: 15,
  stiffness: 150,
  mass: 1,
});
```

### Important: Physics vs Duration Mode

`stiffness`/`damping` (physics-based) and `duration`/`dampingRatio` (duration-based) are **mutually exclusive**. When both are present, `duration`/`dampingRatio` override `stiffness`/`damping`.

```tsx
// Physics-based (recommended for M3 Expressive)
withSpring(value, { damping: 15, stiffness: 150, mass: 1 });

// Duration-based
withSpring(value, { duration: 400, dampingRatio: 0.8 });

// DO NOT MIX -- duration will override physics params
```

---

## 7. Spring Animations Matching Material 3 Expressive

### What M3 Expressive Motion Is

Material 3 Expressive (launched with Android 16, September 2025) replaces traditional duration-based animations with a **spring physics** system. This is the biggest motion update since Material Design's inception.

**Key principles:**
- **Spatial springs**: Animate position, size, orientation, shape. Allow overshoot/bounce.
- **Effects springs**: Animate color, opacity. No overshoot (critically damped).
- **Interruptible**: Springs can be retargeted mid-animation without jarring transitions.
- **Natural**: Motion follows real physics, making UI feel alive and predictable.

### Two Motion Schemes

| Scheme | Damping Style | Bounce | Best For |
|--------|-------------|--------|----------|
| **Expressive** (recommended) | Lower damping | Yes, noticeable overshoot | Hero moments, key interactions, playful UI |
| **Standard** | Higher damping | Minimal | Utilitarian apps, productivity tools |

### Official Android Spring Token Values

From `material-components-android` v1.13.0+ (Motion.md):

| Token | Damping Ratio | Stiffness | Use Case |
|-------|--------------|-----------|----------|
| `motionSpringFastSpatial` | **0.9** | **1400** | Small components: switches, buttons, checkboxes |
| `motionSpringFastEffects` | **1.0** | **3800** | Small component color/opacity transitions |
| `motionSpringDefaultSpatial` | **0.9** | **700** | Medium elements: bottom sheets, nav drawers, cards |
| `motionSpringDefaultEffects` | **1.0** | **1600** | Medium element color/opacity transitions |
| `motionSpringSlowSpatial` | **0.9** | **300** | Full-screen: page transitions, shared elements |
| `motionSpringSlowEffects` | **1.0** | **800** | Full-screen color/opacity transitions |

**Speed selection rule:**
- **Fast** -- Small component animations (switches, buttons)
- **Default** -- Partial-screen animations (bottom sheet, nav drawer)
- **Slow** -- Full-screen animations (page transitions)

**Spring type selection rule:**
- **Spatial** -- Moving/resizing/reshaping things (damping ratio 0.9, allows bounce)
- **Effects** -- Changing color/opacity (damping ratio 1.0, critically damped, no bounce)

### Translating to React Native Reanimated

Android's spring system uses `dampingRatio` (0-1) and `stiffness`, while Reanimated's physics mode uses `damping` (absolute value), `stiffness`, and `mass`. Here are the translations:

**Converting dampingRatio to Reanimated damping:**
```
damping = dampingRatio * 2 * sqrt(stiffness * mass)
```

**Recommended Reanimated configs matching M3 Expressive tokens:**

```tsx
// === SPATIAL SPRINGS (position, size, shape) ===
// Allow bounce (underdamped, dampingRatio = 0.9)

const M3_FAST_SPATIAL = {
  // For switches, buttons, small interactive elements
  stiffness: 1400,
  damping: 67,    // 0.9 * 2 * sqrt(1400 * 1) ≈ 67.3
  mass: 1,
};

const M3_DEFAULT_SPATIAL = {
  // For bottom sheets, nav drawers, cards
  stiffness: 700,
  damping: 47.6,  // 0.9 * 2 * sqrt(700 * 1) ≈ 47.6
  mass: 1,
};

const M3_SLOW_SPATIAL = {
  // For full-screen transitions
  stiffness: 300,
  damping: 31.2,  // 0.9 * 2 * sqrt(300 * 1) ≈ 31.2
  mass: 1,
};

// === EFFECTS SPRINGS (color, opacity) ===
// Critically damped (dampingRatio = 1.0, no bounce)

const M3_FAST_EFFECTS = {
  stiffness: 3800,
  damping: 123.3, // 1.0 * 2 * sqrt(3800 * 1) ≈ 123.3
  mass: 1,
};

const M3_DEFAULT_EFFECTS = {
  stiffness: 1600,
  damping: 80,    // 1.0 * 2 * sqrt(1600 * 1) = 80
  mass: 1,
};

const M3_SLOW_EFFECTS = {
  stiffness: 800,
  damping: 56.6,  // 1.0 * 2 * sqrt(800 * 1) ≈ 56.6
  mass: 1,
};
```

**Alternative using duration-based mode (simpler):**

```tsx
// Fast spatial (small components)
const M3_FAST_SPATIAL_DURATION = {
  duration: 200,
  dampingRatio: 0.9,
};

// Default spatial (sheets, drawers)
const M3_DEFAULT_SPATIAL_DURATION = {
  duration: 350,
  dampingRatio: 0.9,
};

// Slow spatial (full-screen)
const M3_SLOW_SPATIAL_DURATION = {
  duration: 500,
  dampingRatio: 0.9,
};

// Effects (all use dampingRatio 1.0 = critically damped)
const M3_FAST_EFFECTS_DURATION = {
  duration: 150,
  dampingRatio: 1.0,
};

const M3_DEFAULT_EFFECTS_DURATION = {
  duration: 300,
  dampingRatio: 1.0,
};

const M3_SLOW_EFFECTS_DURATION = {
  duration: 450,
  dampingRatio: 1.0,
};
```

### Practical Usage Patterns

```tsx
import { withSpring, withTiming, Easing } from 'react-native-reanimated';

// Button press scale (fast spatial -- small component)
const onPressIn = () => {
  scale.value = withSpring(0.95, M3_FAST_SPATIAL);
};
const onPressOut = () => {
  scale.value = withSpring(1, M3_FAST_SPATIAL);
};

// Bottom sheet open (default spatial -- partial screen)
const openSheet = () => {
  translateY.value = withSpring(0, M3_DEFAULT_SPATIAL);
};

// Page transition (slow spatial -- full screen)
const navigateForward = () => {
  translateX.value = withSpring(0, M3_SLOW_SPATIAL);
};

// Color transition (effects -- no bounce)
const highlightCard = () => {
  backgroundColor.value = withSpring(targetColor, M3_DEFAULT_EFFECTS);
};

// Opacity fade (effects -- no bounce)
const fadeIn = () => {
  opacity.value = withSpring(1, M3_FAST_EFFECTS);
};
```

### Legacy M3 Easing Curves (Duration-Based, Pre-Expressive)

For cases where spring physics is not appropriate, Material 3's legacy easing tokens remain valid:

```tsx
import { withTiming, Easing } from 'react-native-reanimated';

// M3 standard easing (acceleration + deceleration)
const M3_EMPHASIZED = Easing.bezier(0.2, 0.0, 0, 1.0);
const M3_EMPHASIZED_DECELERATE = Easing.bezier(0.05, 0.7, 0.1, 1.0);
const M3_EMPHASIZED_ACCELERATE = Easing.bezier(0.3, 0.0, 0.8, 0.15);
const M3_STANDARD = Easing.bezier(0.2, 0.0, 0, 1.0);
const M3_STANDARD_DECELERATE = Easing.bezier(0.0, 0.0, 0, 1.0);
const M3_STANDARD_ACCELERATE = Easing.bezier(0.3, 0.0, 1.0, 1.0);

// Usage with timing
sv.value = withTiming(targetValue, {
  duration: 300,
  easing: M3_EMPHASIZED,
});
```

---

## 8. Gesture Handler and Predictive Back Gestures

### React Native Gesture Handler Status

**Current version:** 2.30.0 (latest, January 2026)
**No v3 release yet.** The library signals legacy handler APIs (`PanGestureHandler`, `TapGestureHandler`, etc.) will be removed in a future version, replaced by the `Gesture.Pan()`, `Gesture.Tap()` declarative API.

```tsx
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// Modern API (use this)
const pan = Gesture.Pan()
  .onUpdate((event) => {
    translateX.value = event.translationX;
  })
  .onEnd(() => {
    translateX.value = withSpring(0, M3_DEFAULT_SPATIAL);
  });

<GestureDetector gesture={pan}>
  <Animated.View style={animatedStyle} />
</GestureDetector>
```

### Android 16 Predictive Back Gesture: Current State

**The problem:** Android 16 (API level 36) no longer calls `onBackPressed()` or dispatches `KEYCODE_BACK`. React Native depends on these legacy callbacks. When predictive back is active, React Native may not receive the back event, causing the app to close instead of navigating back.

**React Native 0.81+ (August 2025):** Predictive back is enabled by default for apps targeting Android 16. `BackHandler` API continues to work for JS-level back handling, but apps with custom native back code need migration.

**Status of key libraries:**

| Library | Predictive Back Support | Status |
|---------|------------------------|--------|
| React Native core (0.81+) | `BackHandler` works | Partial -- JS-level only |
| react-native-screens | Not yet | Actively working on it |
| React Navigation | Not yet | Blocked by react-native-screens |
| Expo Router (SDK 54) | Not yet | Known issue #39092 |

### Temporary Workaround

Disable predictive back gesture until library support matures:

**app.json (Expo):**
```json
{
  "expo": {
    "android": {
      "enableOnBackInvokedCallback": false
    }
  }
}
```

**AndroidManifest.xml (bare RN):**
```xml
<application
  android:enableOnBackInvokedCallback="false"
  ...>
```

### Swipe-to-Dismiss Pattern (Manual)

For custom swipe-back interactions that mimic Android's predictive back feel:

```tsx
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const DISMISS_THRESHOLD = 100;

const SwipeDismissView = ({ onDismiss, children }) => {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  const gesture = Gesture.Pan()
    .activeOffsetX(20) // Only activate on horizontal swipe
    .onUpdate((event) => {
      // Only allow right swipe
      translateX.value = Math.max(0, event.translationX);
      // Scale down as user swipes (predictive back feel)
      scale.value = 1 - (event.translationX / 1000);
    })
    .onEnd((event) => {
      if (event.translationX > DISMISS_THRESHOLD) {
        translateX.value = withSpring(400, M3_DEFAULT_SPATIAL);
        scale.value = withSpring(0.85, M3_DEFAULT_SPATIAL);
        runOnJS(onDismiss)();
      } else {
        translateX.value = withSpring(0, M3_FAST_SPATIAL);
        scale.value = withSpring(1, M3_FAST_SPATIAL);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};
```

---

## 9. Material Motion Spring Configurations

### Complete Reference: M3 Expressive Spring Tokens for Reanimated

```tsx
// ============================================================
// MATERIAL 3 EXPRESSIVE SPRING CONFIGS FOR REACT NATIVE REANIMATED
// Source: material-components-android Motion.md (v1.13.0+)
// ============================================================

// --- SPATIAL SPRINGS (position, size, shape, rotation) ---
// dampingRatio 0.9 = slight bounce/overshoot (the M3 Expressive signature)

export const M3Springs = {
  // Small components: switches, checkboxes, buttons, chips, FABs
  fastSpatial: {
    stiffness: 1400,
    damping: 67,
    mass: 1,
  },

  // Medium: bottom sheets, nav drawers, cards, dialogs
  defaultSpatial: {
    stiffness: 700,
    damping: 48,
    mass: 1,
  },

  // Full-screen: page transitions, shared element transitions
  slowSpatial: {
    stiffness: 300,
    damping: 31,
    mass: 1,
  },

  // --- EFFECTS SPRINGS (color, opacity, elevation) ---
  // dampingRatio 1.0 = critically damped (no bounce, smooth settle)

  // Small component color/opacity
  fastEffects: {
    stiffness: 3800,
    damping: 123,
    mass: 1,
  },

  // Medium element color/opacity
  defaultEffects: {
    stiffness: 1600,
    damping: 80,
    mass: 1,
  },

  // Full-screen color/opacity
  slowEffects: {
    stiffness: 800,
    damping: 57,
    mass: 1,
  },
} as const;
```

### Per-Component Recommended Configs

| Component | Spring Token | Reanimated Config |
|-----------|-------------|-------------------|
| Button press/release | `fastSpatial` | `{ stiffness: 1400, damping: 67, mass: 1 }` |
| Switch toggle | `fastSpatial` | `{ stiffness: 1400, damping: 67, mass: 1 }` |
| Checkbox check | `fastSpatial` | `{ stiffness: 1400, damping: 67, mass: 1 }` |
| Chip select | `fastSpatial` | `{ stiffness: 1400, damping: 67, mass: 1 }` |
| FAB press | `fastSpatial` | `{ stiffness: 1400, damping: 67, mass: 1 }` |
| Card expand/collapse | `defaultSpatial` | `{ stiffness: 700, damping: 48, mass: 1 }` |
| Bottom sheet open/close | `defaultSpatial` | `{ stiffness: 700, damping: 48, mass: 1 }` |
| Navigation drawer | `defaultSpatial` | `{ stiffness: 700, damping: 48, mass: 1 }` |
| Dialog appear | `defaultSpatial` | `{ stiffness: 700, damping: 48, mass: 1 }` |
| Page transition | `slowSpatial` | `{ stiffness: 300, damping: 31, mass: 1 }` |
| Shared element | `slowSpatial` | `{ stiffness: 300, damping: 31, mass: 1 }` |
| Button color change | `fastEffects` | `{ stiffness: 3800, damping: 123, mass: 1 }` |
| Card highlight | `defaultEffects` | `{ stiffness: 1600, damping: 80, mass: 1 }` |
| Screen fade | `slowEffects` | `{ stiffness: 800, damping: 57, mass: 1 }` |

### Shape Morphing (M3 Expressive Signature)

One of M3 Expressive's signature features -- buttons transform shape and size with springy animations:

```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

const ShapeMorphButton = ({ expanded }) => {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withSpring(expanded ? 1 : 0, M3Springs.fastSpatial);
  }, [expanded]);

  const animatedStyle = useAnimatedStyle(() => ({
    borderRadius: interpolate(progress.value, [0, 1], [28, 16]),
    width: interpolate(progress.value, [0, 1], [56, 200]),
    height: interpolate(progress.value, [0, 1], [56, 48]),
  }));

  return <Animated.View style={[styles.button, animatedStyle]} />;
};
```

---

## 10. Recommended Stack Summary

### Packages for Android 16 Native Experience

| Category | Package | Version | Purpose |
|----------|---------|---------|---------|
| **Dynamic Colors** | `@pchmn/expo-material3-theme` | 1.3.2 | M3 dynamic colors from wallpaper (SDK 54) |
| **Dynamic Colors** | Expo Colors API (built-in) | SDK 55+ | First-party M3 colors (when upgrading) |
| **M3 Components** | `react-native-paper` | v5 | Material 3 component library |
| **Animations** | `react-native-reanimated` | 4.2.x | Spring physics, shared elements, layout animations |
| **Gestures** | `react-native-gesture-handler` | 2.30.x | Native gesture recognition |
| **Haptics** | `expo-haptics` | 15.0.x | `performAndroidHapticsAsync` for native Android haptics |
| **Navigation** | `expo-router` + `react-native-screens` | latest | Navigation (predictive back still WIP) |
| **Edge-to-Edge** | `react-native-safe-area-context` | latest | Insets for Android 16 mandatory edge-to-edge |
| **Color Utilities** | `@material/material-color-utilities` | latest | Seed-to-palette generation (pure JS) |

### What Is Not Yet Available

| Feature | Status | Workaround |
|---------|--------|-----------|
| Predictive back gesture (full animation) | Not supported in react-native-screens/React Navigation | Disable via `enableOnBackInvokedCallback: false` |
| Android 16 PWLE haptic curves | Not exposed in expo-haptics | Use `performAndroidHapticsAsync` constants instead |
| M3 Expressive shape morph | No dedicated library | Implement manually with Reanimated |
| MotionScheme (Expressive/Standard) toggle | No RN equivalent | Use spring config constants from Section 9 |
| FloatingToolbar (M3 Expressive) | No RN library | Implement manually |
| Live Update notifications | No Expo API | Requires native module |

### Version Compatibility Matrix

| Requirement | Minimum Version |
|-------------|----------------|
| React Native | 0.81+ (Android 16 / targetSdk 36 support) |
| Expo SDK | 54+ (current) or 55+ (for built-in Colors API) |
| Reanimated | 4.x (New Architecture required) |
| Gesture Handler | 2.30+ |
| expo-haptics | 15.0+ (`performAndroidHapticsAsync`) |
| Android target | API 36 (Android 16) |
| Android min | API 24 (Android 7, for Expo compatibility) |

---

## Sources

### Dynamic Color
- [react-native-material-you-colors (GitHub)](https://github.com/alabsi91/react-native-material-you-colors)
- [react-native-dynamic-theme](https://react-native-dynamic-theme.vercel.app/)
- [@pchmn/expo-material3-theme (GitHub)](https://github.com/pchmn/expo-material3-theme)
- [material-color-utilities (GitHub)](https://github.com/material-foundation/material-color-utilities)
- [React Native Paper Theming](https://callstack.github.io/react-native-paper/docs/guides/theming/)
- [Expo SDK 55 Beta Changelog](https://expo.dev/changelog/sdk-55-beta)
- [Expo Color Themes Docs](https://docs.expo.dev/develop/user-interface/color-themes/)

### Haptics
- [Expo Haptics Documentation](https://docs.expo.dev/versions/latest/sdk/haptics/)
- [expo-haptics performAndroidHapticsAsync PR #34077](https://github.com/expo/expo/pull/34077)
- [Android Haptics API Reference](https://developer.android.com/develop/ui/views/haptics/haptics-apis)
- [Android HapticFeedbackConstants](https://developer.android.com/reference/android/view/HapticFeedbackConstants)
- [Android 16 Features](https://developer.android.com/about/versions/16/features)
- [react-native-haptics (Turbo Module)](https://github.com/mhpdev-com/react-native-haptics)

### Animation & Motion
- [Reanimated 4 Stable Release Blog](https://blog.swmansion.com/reanimated-4-stable-release-the-future-of-react-native-animations-ba68210c3713)
- [Reanimated 4.2.0 Shared Element Transitions](https://blog.swmansion.com/introducing-reanimated-4-2-0-71eea21ca861)
- [Reanimated withSpring API Docs](https://docs.swmansion.com/react-native-reanimated/docs/animations/withSpring/)
- [Material 3 Motion Specs](https://m3.material.io/styles/motion/overview/specs)
- [M3 Easing and Duration Tokens](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs)
- [M3 Expressive Motion Blog](https://m3.material.io/blog/m3-expressive-motion-theming)
- [material-components-android Motion.md](https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md)
- [Android Spring Animation Docs](https://developer.android.com/develop/ui/views/animations/spring-animation)
- [MotionScheme Compose API](https://composables.com/docs/androidx.compose.material3/material3/interfaces/MotionScheme)

### Gestures & Navigation
- [React Native Gesture Handler Docs](https://docs.swmansion.com/react-native-gesture-handler/docs/)
- [react-native-screens Predictive Back Discussion](https://github.com/software-mansion/react-native-screens/discussions/2540)
- [React Native 0.81 Blog (Android 16 support)](https://reactnative.dev/blog/2025/08/12/react-native-0.81)
- [Android 16 Behavior Changes](https://developer.android.com/about/versions/16/behavior-changes-16)
- [Android Predictive Back Gesture Guide](https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture)
- [RN Community Android 16 Discussion](https://github.com/react-native-community/discussions-and-proposals/discussions/921)

### General
- [Material Design 3](https://m3.material.io/)
- [Material 3 Expressive Deep Dive](https://www.androidauthority.com/google-material-3-expressive-features-changes-availability-supported-devices-3556392/)
- [Android Dynamic Color AOSP](https://source.android.com/docs/core/display/dynamic-color)
