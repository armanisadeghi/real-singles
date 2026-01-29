# Android 16 Native UX/UI Implementation Guidance

> **Date:** January 2026
> **Target:** Android 16 (API 36) | Expo SDK 54 | React Native 0.81
> **Scope:** Complete implementation standards for achieving a native "Material 3 Expressive" experience

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Material 3 Expressive: The "Expressive" Pattern](#2-material-3-expressive-the-expressive-pattern)
3. [Spring-Based Motion System](#3-spring-based-motion-system)
4. [Shape Morphing & Micro-Interactions](#4-shape-morphing--micro-interactions)
5. [Predictive Back Gestures](#5-predictive-back-gestures)
6. [Universal Reusable Components](#6-universal-reusable-components)
7. [Edge-to-Edge Implementation](#7-edge-to-edge-implementation)
8. [Technical Stack & Libraries](#8-technical-stack--libraries)
9. [Centralized Theme & Light/Dark Logic](#9-centralized-theme--lightdark-logic)
10. [Implementation Checklist](#10-implementation-checklist)

---

## 1. Executive Summary

Material 3 Expressive (M3E) is not a new generation of Material Design -- it is an extension of Material 3, sometimes called "Material 3.5." Announced at Google I/O May 2025 and launched with Android 16 QPR1 in September 2025, it introduces five foundational pillars:

| Pillar | What Changed |
|--------|-------------|
| **Motion** | Spring-based physics replaces duration+easing curves |
| **Shape** | 35 new morphable shapes beyond rounded rectangles |
| **Typography** | Larger sizes, heavier weights, improved hierarchy |
| **Color** | Richer dynamic palettes with clearer tonal separation |
| **Blur** | Depth-creating blur effects on system surfaces |

Key research statistics from Google (46 studies, 18,000+ participants):
- Users identified key UI elements **up to 4x faster** in expressive layouts
- Older users spotted interactive elements **as fast as younger users** across 10 tested apps
- 15 new or refreshed UI components ship with M3E

### What This Means for Our App

We must move from rigid, static layouts to fluid, physics-based interactions. Every animated transition should use spring physics. Every interactive component should provide bouncy, "alive" feedback. The entire color palette should derive from the user's wallpaper via Dynamic Color. Content must flow edge-to-edge behind transparent system bars.

---

## 2. Material 3 Expressive: The "Expressive" Pattern

### 2.1 The Five Foundational Pillars in Detail

**Motion Physics:** All animations use spring-based physics defined by stiffness and damping ratio rather than fixed durations. Springs can be re-targeted mid-animation, making them inherently responsive to gesture interruptions.

**Expanded Shapes:** The shape library expands from basic rounded rectangles to 35 morphable forms including `Cookie9Sided`, `Cookie4Sided`, `SoftBurst`, `Pentagon`, `Pill`, `Sunny`, `Oval`, `Hexagon`, `Diamond`, `Clover`, and more. Components animate fluidly between shapes.

**Enhanced Typography:** Larger type sizes and heavier weights create clearer visual hierarchy. Headlines are bolder, body text more readable.

**Richer Color:** Dynamic Color palettes gain broader hue/tone range. The `SPEC_2025` color generation algorithm differs from the original `SPEC_2021`, producing more nuanced results with five tonal palettes (13 steps each = 65 total color attributes).

**Background Blur:** System surfaces (notification shade, quick settings, app drawer, recents) use frosted-glass blur effects to focus attention while preserving spatial context. A "Reduce blur effects" accessibility toggle is available in Settings > Accessibility.

### 2.2 New & Updated Components

| Component | Type | Description |
|-----------|------|-------------|
| Button Groups | New | Horizontally grouped buttons with interactive width animation |
| Split Buttons | New | Dual-action: primary action + dropdown/toggle |
| Floating Toolbars | New | Docked and floating pill-shaped toolbar variants |
| Loading Indicator | New | Shape-morphing replacement for indeterminate circular |
| FAB Menu | New | Expandable FAB with toggle state and spring-animated items |
| Flexible Navigation Bar | Updated | Shorter height (~56dp), horizontal items on foldables |
| Navigation Rail | Updated | Refreshed shapes/colors for medium/expanded windows |
| Progress Indicators | Updated | Wavy shape option, variable track height (8dp recommended) |
| Extended FAB | Updated | New sizes, six color theme overlays |
| App Bars | Updated | Search app bar variant with M3E styling |

---

## 3. Spring-Based Motion System

This is the single most important change in M3 Expressive. All animations must migrate from duration+easing to spring physics.

### 3.1 Two Motion Schemes

| Scheme | Spatial Damping | Bounce | Best For |
|--------|----------------|--------|----------|
| **Expressive** (recommended) | 0.6-0.8 | Yes, noticeable overshoot | Hero moments, key interactions, playful UIs |
| **Standard** | 0.9 | Minimal | Utilitarian apps, calmer feel |

### 3.2 Two Spring Types

| Type | Purpose | Damping Ratio | Overshoot |
|------|---------|---------------|-----------|
| **Spatial** | Position, size, orientation, shape | 0.9 (Standard) / 0.6-0.8 (Expressive) | Yes |
| **Effects** | Color, opacity, elevation | 1.0 (both schemes) | No (critically damped) |

### 3.3 The Six Official Spring Tokens

From `material-components-android` v1.13.0+ (Standard scheme):

| Token | Damping Ratio | Stiffness | Use Case |
|-------|---------------|-----------|----------|
| `motionSpringFastSpatial` | 0.9 | 1400 | Small: switches, buttons, checkboxes |
| `motionSpringFastEffects` | 1.0 | 3800 | Small component color/opacity |
| `motionSpringDefaultSpatial` | 0.9 | 700 | Medium: bottom sheets, nav drawers, cards |
| `motionSpringDefaultEffects` | 1.0 | 1600 | Medium element color/opacity |
| `motionSpringSlowSpatial` | 0.9 | 300 | Full-screen: page transitions |
| `motionSpringSlowEffects` | 1.0 | 800 | Full-screen color/opacity |

Expressive scheme overrides for spatial springs:

| Token | Damping Ratio | Stiffness |
|-------|---------------|-----------|
| `expressiveSpatialFast` | 0.6 | 800 |
| `expressiveSpatialDefault` | 0.8 | 380 |
| `expressiveSpatialSlow` | 0.8 | 200 |

### 3.4 Speed Selection Guide

| Animation Target | Speed |
|-----------------|-------|
| Small components (switch, checkbox, icon, chip) | Fast |
| Medium components (card, button, FAB, sheet, dialog) | Default |
| Full-screen transitions, large elements | Slow |

### 3.5 React Native Reanimated Implementation

Reanimated's physics mode uses absolute `damping` (not ratio). The conversion formula:

```
reanimated_damping = dampingRatio * 2 * sqrt(stiffness * mass)
```

**Complete Spring Config Module:**

```typescript
// theme/m3eMotion.ts
import { withSpring, type WithSpringConfig } from 'react-native-reanimated';

/**
 * Material 3 Expressive Spring Tokens for React Native Reanimated.
 * Source: material-components-android v1.13.0+ Motion.md
 *
 * SPATIAL springs: position, size, shape, rotation (allow bounce)
 * EFFECTS springs: color, opacity, elevation (critically damped, no bounce)
 */
export const M3Springs = {
  // --- SPATIAL (Standard Scheme) ---
  fastSpatial: { stiffness: 1400, damping: 67, mass: 1 },
  defaultSpatial: { stiffness: 700, damping: 48, mass: 1 },
  slowSpatial: { stiffness: 300, damping: 31, mass: 1 },

  // --- EFFECTS (Both Schemes) ---
  fastEffects: { stiffness: 3800, damping: 123, mass: 1 },
  defaultEffects: { stiffness: 1600, damping: 80, mass: 1 },
  slowEffects: { stiffness: 800, damping: 57, mass: 1 },

  // --- EXPRESSIVE SPATIAL OVERRIDES ---
  expressiveFastSpatial: { stiffness: 800, damping: 34, mass: 1 },
  expressiveDefaultSpatial: { stiffness: 380, damping: 31, mass: 1 },
  expressiveSlowSpatial: { stiffness: 200, damping: 23, mass: 1 },
} as const;

/**
 * Alternative: Duration-based configs using dampingRatio directly.
 * Reanimated accepts dampingRatio in duration mode.
 * NOTE: duration + dampingRatio are mutually exclusive with stiffness + damping.
 */
export const M3SpringsDuration = {
  fastSpatial: { duration: 200, dampingRatio: 0.9 },
  defaultSpatial: { duration: 350, dampingRatio: 0.9 },
  slowSpatial: { duration: 500, dampingRatio: 0.9 },
  fastEffects: { duration: 150, dampingRatio: 1.0 },
  defaultEffects: { duration: 300, dampingRatio: 1.0 },
  slowEffects: { duration: 450, dampingRatio: 1.0 },
  expressiveFastSpatial: { duration: 250, dampingRatio: 0.6 },
  expressiveDefaultSpatial: { duration: 400, dampingRatio: 0.8 },
  expressiveSlowSpatial: { duration: 600, dampingRatio: 0.8 },
} as const;

/** Apply M3E spring animation with a default token. */
export function m3eSpring(
  value: number,
  config: WithSpringConfig = M3Springs.defaultSpatial,
) {
  return withSpring(value, config);
}

/**
 * Per-component recommended spring configs.
 */
export const ComponentSprings = {
  buttonPress: M3Springs.fastSpatial,
  switchToggle: M3Springs.fastSpatial,
  checkboxCheck: M3Springs.fastSpatial,
  chipSelect: M3Springs.fastSpatial,
  fabPress: M3Springs.fastSpatial,
  cardExpand: M3Springs.defaultSpatial,
  bottomSheetOpen: M3Springs.defaultSpatial,
  navDrawer: M3Springs.defaultSpatial,
  dialogAppear: M3Springs.defaultSpatial,
  pageTransition: M3Springs.slowSpatial,
  sharedElement: M3Springs.slowSpatial,
  buttonColorChange: M3Springs.fastEffects,
  cardHighlight: M3Springs.defaultEffects,
  screenFade: M3Springs.slowEffects,
} as const;
```

### 3.6 Legacy Easing Curves (Pre-Expressive Fallback)

For cases where spring physics is not appropriate:

```typescript
import { Easing } from 'react-native-reanimated';

export const M3Easing = {
  emphasized: Easing.bezier(0.2, 0.0, 0, 1.0),
  emphasizedDecelerate: Easing.bezier(0.05, 0.7, 0.1, 1.0),
  emphasizedAccelerate: Easing.bezier(0.3, 0.0, 0.8, 0.15),
  standard: Easing.bezier(0.2, 0.0, 0, 1.0),
  standardDecelerate: Easing.bezier(0.0, 0.0, 0, 1.0),
  standardAccelerate: Easing.bezier(0.3, 0.0, 1.0, 1.0),
};
```

---

## 4. Shape Morphing & Micro-Interactions

### 4.1 Shape Tokens for React Native

```typescript
// theme/m3eShapes.ts
export const M3Shapes = {
  // Corner radii from M3 Expressive
  none: 0,
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 28,
  full: 9999, // Pill / StadiumBorder

  // Component-specific
  fab: 16,
  fabLarge: 28,
  button: 20,
  chip: 8,
  card: 12,
  dialog: 28,
  sheet: 28,       // Bottom sheet top corners
  searchBar: 28,   // Pill shape
  navigationIndicator: 9999, // Active tab pill
  toolbar: 28,     // Floating toolbar pill
  menuItem: 12,
} as const;
```

### 4.2 Shape Morphing Pattern

Shape morphing is the M3E signature -- components transform their shape in response to interaction:

```typescript
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, interpolate,
} from 'react-native-reanimated';

function ShapeMorphButton({ expanded }: { expanded: boolean }) {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withSpring(expanded ? 1 : 0, M3Springs.fastSpatial);
  }, [expanded]);

  const style = useAnimatedStyle(() => ({
    borderRadius: interpolate(progress.value, [0, 1], [28, 16]),
    width: interpolate(progress.value, [0, 1], [56, 200]),
    height: interpolate(progress.value, [0, 1], [56, 48]),
  }));

  return <Animated.View style={[baseStyle, style]} />;
}
```

### 4.3 Key Micro-Interaction Patterns

**Notification Dismiss:**
1. User swipes -> corners morph from squared to rounded
2. Surrounding notifications shift in swipe direction
3. At ~10% swipe distance, haptic fires (detach point)
4. Notification peels away; remaining bounce back

**PIN Pad Reactive Feedback:**
- Tapped key highlights and scales up
- Adjacent keys push to the side and shrink
- Creates a reactive ripple across neighboring elements

**Quick Settings Bounce:**
- Surrounding toggles bounce when any nearby button is tapped

**Loading Indicator:**
- 7-shape morph loop replacing circular spinner for waits < 5 seconds

### 4.4 Haptic Integration

Use `expo-haptics` with Android-native constants for M3E-aligned feedback:

```typescript
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export const M3Haptics = {
  sliderTick: () => {
    if (Platform.OS === 'android') {
      Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Tick);
    } else {
      Haptics.selectionAsync();
    }
  },
  sliderFrequentTick: () => {
    if (Platform.OS === 'android') {
      Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Frequent_Tick);
    } else {
      Haptics.selectionAsync();
    }
  },
  toggleOn: () => {
    if (Platform.OS === 'android') {
      Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Toggle_On);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },
  toggleOff: () => {
    if (Platform.OS === 'android') {
      Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Toggle_Off);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },
  buttonTap: () => {
    if (Platform.OS === 'android') {
      Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Virtual_Key);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },
  success: () => {
    if (Platform.OS === 'android') {
      Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },
  error: () => {
    if (Platform.OS === 'android') {
      Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },
};
```

**Recommended mappings:**

| UI Component | Android Constant | iOS Fallback |
|-------------|-----------------|-------------|
| Slider discrete tick | `Segment_Tick` | `selectionAsync()` |
| Slider rapid tick | `Segment_Frequent_Tick` | `selectionAsync()` |
| Picker item change | `Segment_Tick` | `selectionAsync()` |
| Toggle on | `Toggle_On` | `impactAsync(Light)` |
| Toggle off | `Toggle_Off` | `impactAsync(Light)` |
| Button tap | `Virtual_Key` | `impactAsync(Light)` |
| Success | `Confirm` | `notificationAsync(Success)` |
| Error/rejection | `Reject` | `notificationAsync(Error)` |
| Text cursor drag | `Text_Handle_Move` | `selectionAsync()` |

---

## 5. Predictive Back Gestures

### 5.1 What Changed in Android 16

- Predictive Back is **enabled by default** for supported apps
- `KEYCODE_BACK` is deprecated; `onBackPressed()` is removed
- Apps must use `OnBackInvokedCallback` API
- When swiping back, the current screen scales to **90% size** (10% margin), revealing the destination
- Three-button navigation also supports predictive back (not just gesture nav)

### 5.2 Current React Native Support Status

| Library | Status | Notes |
|---------|--------|-------|
| React Native 0.81+ | Partial | `BackHandler` works for JS-level back |
| react-native-screens | Not yet | Actively developing |
| React Navigation | Blocked | Waiting on react-native-screens |
| Expo Router (SDK 54) | Not yet | Known issue #39092 |

### 5.3 Recommended Approach

**For now**, keep predictive back enabled (`enableOnBackInvokedCallback: true` in app.json) but be aware of known issues. The `BackHandler` API works for JS-level back handling. If navigation breaks, temporarily disable:

```json
{
  "expo": {
    "android": {
      "enableOnBackInvokedCallback": false
    }
  }
}
```

### 5.4 Manual Swipe-to-Dismiss Pattern (Mimics Predictive Back)

```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, runOnJS,
} from 'react-native-reanimated';

const DISMISS_THRESHOLD = 100;

function SwipeDismissView({ onDismiss, children }) {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  const gesture = Gesture.Pan()
    .activeOffsetX(20)
    .onUpdate((e) => {
      translateX.value = Math.max(0, e.translationX);
      scale.value = 1 - (e.translationX / 1000);
    })
    .onEnd((e) => {
      if (e.translationX > DISMISS_THRESHOLD) {
        translateX.value = withSpring(400, M3Springs.defaultSpatial);
        scale.value = withSpring(0.85, M3Springs.defaultSpatial);
        runOnJS(onDismiss)();
      } else {
        translateX.value = withSpring(0, M3Springs.fastSpatial);
        scale.value = withSpring(1, M3Springs.fastSpatial);
      }
    });

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={style}>{children}</Animated.View>
    </GestureDetector>
  );
}
```

---

## 6. Universal Reusable Components

### 6.1 Navigation Rails & Flexible Navigation Bar

**M3E Changes:**
- Bottom nav renamed to "Flexible Navigation Bar"
- Height reduced from 80dp to ~56dp
- Pill-shaped active indicator (StadiumBorder, ~64x32dp)
- On foldables: labels appear beside icons horizontally
- Navigation drawers deprecated in favor of expanded navigation

**Adaptive Behavior:**

| Window Size | Component |
|-------------|-----------|
| Compact (phones, 0-599dp) | Bottom Navigation Bar |
| Medium (foldables, 600-839dp) | Bottom Nav with horizontal items |
| Expanded (tablets, 840-1199dp) | Navigation Rail |
| Large+ (1200dp+) | Navigation Rail or Expanded Nav |

**React Native Implementation:** Use `BottomNavigation.Bar` from `react-native-paper` as custom `tabBar` with `@react-navigation/bottom-tabs` v7. The old `createMaterialBottomTabNavigator` is deprecated as of react-native-paper 5.14.0.

```typescript
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomNavigation, Icon } from 'react-native-paper';

const Tab = createBottomTabNavigator();

function MyTabs() {
  return (
    <Tab.Navigator
      tabBar={({ navigation, state, descriptors, insets }) => (
        <BottomNavigation.Bar
          navigationState={state}
          safeAreaInsets={insets}
          onTabPress={({ route, preventDefault }) => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          }}
          renderIcon={({ route, focused, color }) => {
            const { options } = descriptors[route.key];
            if (options.tabBarIcon) {
              return options.tabBarIcon({ focused, color, size: 24 });
            }
            return null;
          }}
          getLabelText={({ route }) => {
            const { options } = descriptors[route.key];
            return options.tabBarLabel ?? options.title ?? route.title;
          }}
        />
      )}
    >
      {/* Tab screens */}
    </Tab.Navigator>
  );
}
```

**For adaptive layout, detect screen width:**

```typescript
import { useWindowDimensions } from 'react-native';

export const M3Breakpoints = {
  compact: 0,
  medium: 600,
  expanded: 840,
  large: 1200,
  extraLarge: 1600,
} as const;

export function useWindowSizeClass() {
  const { width } = useWindowDimensions();
  if (width >= M3Breakpoints.extraLarge) return 'extraLarge';
  if (width >= M3Breakpoints.large) return 'large';
  if (width >= M3Breakpoints.expanded) return 'expanded';
  if (width >= M3Breakpoints.medium) return 'medium';
  return 'compact';
}
```

### 6.2 Split Buttons & Button Groups

**Split Button:** Dual-action button with a primary action + dropdown/toggle trailing section. Comes in Filled, Elevated, Outlined, and Tonal variants.

**Button Group:** Horizontally arranged buttons where the pressed button expands while neighbors shrink, maintaining constant group width. Supports connected shapes (rounded leading/trailing, squared interior corners).

No React Native library provides these -- custom implementation required using `react-native-paper` primitives + Reanimated.

### 6.3 Search Bars

M3E redesigns the search bar:
- **Pill-shaped field** (borderRadius: 28)
- **Thicker profile** for visual prominence
- **Hamburger and profile buttons moved outside** the search pill
- **Centered text** as default layout

**React Native Paper provides `Searchbar`** with `mode="bar"` or `mode="view"`, elevation, and right-side content. For the M3E pattern with external controls:

```typescript
import { View } from 'react-native';
import { Searchbar, IconButton, Avatar, useTheme } from 'react-native-paper';

function M3ESearchAppBar({ onMenuPress, onProfilePress, profileImage }) {
  const [query, setQuery] = useState('');
  const theme = useTheme();

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 8,
      backgroundColor: theme.colors.surface,
    }}>
      <IconButton icon="menu" size={24} onPress={onMenuPress} />
      <Searchbar
        placeholder="Search"
        onChangeText={setQuery}
        value={query}
        style={{ flex: 1, marginHorizontal: 4 }}
        elevation={0}
        mode="bar"
      />
      {profileImage ? (
        <Avatar.Image size={32} source={{ uri: profileImage }} />
      ) : (
        <IconButton icon="account-circle" size={24} onPress={onProfilePress} />
      )}
    </View>
  );
}
```

### 6.4 Floating Toolbars

A new M3E component with two variants:

| Type | Description | Use Case |
|------|-------------|----------|
| **Docked** | Attached to screen edge | Global actions across pages |
| **Floating** | Pill-shaped, hovers above content | Contextual page actions |

Also includes `VerticalFloatingToolbar` for side positioning. No RN library provides this -- build with `Surface` + `IconButton` + Reanimated.

### 6.5 FAB Patterns

**FAB Menu** (new in M3E): Toggle FAB expands into a menu with spring-animated items. The "+" icon morphs to "X" with spring physics. Small FAB is deprecated.

**Available via react-native-paper:** `FAB`, `AnimatedFAB`, `FAB.Group` (speed dial pattern).

**Six color overlays:** Primary, Secondary, Tertiary, PrimaryContainer, SecondaryContainer, TertiaryContainer.

### 6.6 Component Architecture

```
components/
  atoms/
    M3EIconButton.tsx
    M3EChip.tsx
  molecules/
    SplitButton.tsx
    ButtonGroup.tsx
    FloatingToolbar.tsx
    M3ESearchAppBar.tsx
  organisms/
    FABMenu.tsx
    AdaptiveNavigation.tsx
  theme/
    m3eMotion.ts      # Spring token constants
    m3eShapes.ts      # Shape token constants
    m3eColors.ts      # Color scheme helpers
    m3eHaptics.ts     # Platform-specific haptic helpers
    m3eLayout.ts      # Breakpoints and window size classes
```

---

## 7. Edge-to-Edge Implementation

### 7.1 What Changed

- **Android 15 (API 35):** Edge-to-edge with opt-out via `windowOptOutEdgeToEdgeEnforcement`
- **Android 16 (API 36):** Opt-out **removed entirely** -- edge-to-edge is mandatory
- Expo SDK 54 + React Native 0.81 target API 36 by default
- Edge-to-edge is always on and cannot be disabled

### 7.2 Current Project Status

Already configured in `app.json`:
```json
{
  "android": {
    "edgeToEdgeEnabled": true,
    "enableOnBackInvokedCallback": true
  }
}
```

**Needs migration:**
- `expo-status-bar` (~3.0.9) -- uses deprecated APIs
- `expo-navigation-bar` (^5.0.10) -- uses deprecated APIs
- Both should be replaced by `SystemBars` from `react-native-edge-to-edge`

**Needs installation:**
- `react-native-edge-to-edge` (v1.7.0) -- for `SystemBars` component
- `react-native-keyboard-controller` -- for proper keyboard handling with edge-to-edge

### 7.3 Library Migration

```
BEFORE (deprecated):
  expo-status-bar -> StatusBar component
  expo-navigation-bar -> NavigationBar.setBackgroundColorAsync

AFTER (recommended):
  react-native-edge-to-edge -> SystemBars component
```

**SystemBars API:**

```typescript
import { SystemBars } from 'react-native-edge-to-edge';

// Basic usage
<SystemBars style="auto" />

// Per-bar styling
<SystemBars style={{ statusBar: 'light', navigationBar: 'dark' }} />

// Hide bars
<SystemBars hidden={{ statusBar: true, navigationBar: false }} />
```

**Config plugin (app.json):**

```json
{
  "plugins": [
    ["react-native-edge-to-edge", {
      "android": {
        "parentTheme": "Material3Expressive.Dynamic",
        "enforceNavigationBarContrast": false
      }
    }]
  ]
}
```

### 7.4 Inset Handling

**Primary library:** `react-native-safe-area-context` (~5.6.2, already installed).

**Preferred approach:** `useSafeAreaInsets` hook (not `SafeAreaView` component) to avoid jumpy behavior during animations:

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';

function Screen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    }}>
      {/* Screen content */}
    </View>
  );
}
```

**Key principles:**
- Background elements (images, gradients, colors) should extend behind ALL system bars
- Only interactive/readable content needs inset padding
- Apply `paddingTop` only where status bar overlaps important content
- Apply `paddingBottom` only where nav bar overlaps
- Import `SafeAreaView` from `react-native-safe-area-context`, NEVER from `react-native` (deprecated in 0.81)

### 7.5 Keyboard Handling

Edge-to-edge **breaks** Android's standard `adjustResize` keyboard handling. Install `react-native-keyboard-controller`:

```bash
npx expo install react-native-keyboard-controller
```

```typescript
import { KeyboardProvider } from 'react-native-keyboard-controller';

// Wrap app root
<KeyboardProvider>{/* app */}</KeyboardProvider>

// Drop-in replacement for KeyboardAvoidingView
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
<KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
  {/* form */}
</KeyboardAvoidingView>

// Auto-scrolling for forms
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
<KeyboardAwareScrollView>
  <TextInput /><TextInput /><TextInput />
</KeyboardAwareScrollView>
```

**Pitfalls:**
- Never use fixed heights -- use `flex: 1`
- Never mix `KeyboardAwareScrollView` with `KeyboardAvoidingView`
- Never nest `ScrollView` inside `KeyboardAwareScrollView` (it IS a ScrollView)

### 7.6 Free-Moving Content Patterns

**Pattern 1: Full-bleed background with selective insets**

```typescript
function ImmersiveScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ImageBackground source={heroImage} style={{ flex: 1 }}>
      {/* Background extends behind ALL system bars */}
      <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <Header /><Content /><ActionButtons />
      </View>
    </ImageBackground>
  );
}
```

**Pattern 2: Scrollable content flowing behind bars**

```typescript
function FeedScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      scrollIndicatorInsets={{ top: insets.top, bottom: insets.bottom }}
    >
      {/* Feed items flow edge-to-edge */}
    </ScrollView>
  );
}
```

**Pattern 3: Modal handling**

```typescript
// Always set translucent props on native Modal
<Modal statusBarTranslucent={true} navigationBarTranslucent={true}>
  {/* modal content */}
</Modal>
// Better: use expo-router modal screens instead of built-in Modal
```

---

## 8. Technical Stack & Libraries

### 8.1 Required Library Stack

| Category | Library | Version | Status |
|----------|---------|---------|--------|
| Edge-to-edge | Built into RN 0.81 + Expo SDK 54 | -- | Configured |
| System bar styling | `react-native-edge-to-edge` | 1.7.0 | **Install** |
| Safe area insets | `react-native-safe-area-context` | ~5.6.2 | Installed |
| Keyboard handling | `react-native-keyboard-controller` | latest | **Install** |
| Dynamic colors | `@pchmn/expo-material3-theme` | ^1.3.2 | Installed |
| M3 components | `react-native-paper` | 5.14.x | Installed |
| Animations | `react-native-reanimated` | ~4.1.6 | Installed |
| Gestures | `react-native-gesture-handler` | 2.30.x | Installed |
| Haptics | `expo-haptics` | 15.0.x | Installed |
| Navigation | `expo-router` | latest | Installed |
| Root background | `expo-system-ui` | ~6.0.9 | Installed |

**Deprecated (to migrate away from):**

| Library | Status | Replacement |
|---------|--------|-------------|
| `expo-status-bar` | Uses deprecated APIs | `SystemBars` from `react-native-edge-to-edge` |
| `expo-navigation-bar` | Uses deprecated APIs | `SystemBars` from `react-native-edge-to-edge` |

### 8.2 Dynamic Color (Material You)

**Current solution:** `@pchmn/expo-material3-theme` v1.3.2 (already installed).

```typescript
import { useMaterial3Theme } from '@pchmn/expo-material3-theme';

const { theme } = useMaterial3Theme({ fallbackSourceColor: '#B06D1E' });
// theme.light.primary, theme.dark.primary, etc.
```

- **Android 12+:** Real wallpaper-derived Dynamic Color
- **Android < 12, iOS:** Generates M3 scheme from fallback seed
- **Expo Go:** Fallback only -- needs dev build for real system colors

**Future (SDK 55+):** Expo introduces first-party Colors API with built-in M3 dynamic color, replacing the need for third-party libraries.

### 8.3 Additional Color Libraries (Reference)

| Library | Purpose |
|---------|---------|
| `react-native-material-you-colors` | Raw 5-palette / 13-shade system colors |
| `react-native-dynamic-theme` | Full M3 semantic roles, newer |
| `@material/material-color-utilities` | Google's official pure JS palette generation |
| `PlatformColor()` | Native system tokens (opaque, cannot interpolate) |

### 8.4 What Is NOT Yet Available

| Feature | Status | Workaround |
|---------|--------|------------|
| Predictive back (full animation) | Not in react-native-screens/React Navigation | Use `BackHandler` for JS; disable if broken |
| Android 16 PWLE haptic curves | Not in expo-haptics | Use `performAndroidHapticsAsync` constants |
| M3 Expressive shape morph | No library | Manual Reanimated implementation |
| MotionScheme toggle | No RN equivalent | Use spring config constants |
| FloatingToolbar | No RN library | Manual implementation |
| Button Groups (interactive width) | No RN library | Manual implementation |
| Split Buttons | No RN library | Manual implementation |
| Loading Indicator (shape morph) | No RN library | Manual Reanimated implementation |

### 8.5 react-native-edge-to-edge Config Plugin Options

**Parent Theme options:** `Default`, `Material2`, `Material3`, `Material3.Dynamic`, `Material3Expressive`, `Material3Expressive.Dynamic` (plus `.Light` variants).

The `Material3Expressive.Dynamic` theme is recommended for full Android 16 M3E support with Dynamic Color.

---

## 9. Centralized Theme & Light/Dark Logic

### 9.1 Architecture

The project already has a strong Context-based `ThemeProvider` at `mobile/context/ThemeContext.tsx`. This is the correct approach -- React Context is ideal for theming (rarely-changing global state).

```
ThemeProvider (React Context)
  |
  +-- useMaterial3Theme()       // Android: system dynamic colors
  +-- useColorScheme()          // System light/dark detection
  +-- useMemo(colors)           // Compute color palette
  |
  +-- PaperProvider             // react-native-paper integration
  +-- NavigationContainer       // React Navigation theme
  +-- <App />                   // All children access via useTheme()
```

### 9.2 Complete M3 Color Role Reference

**Accent Roles (4 roles each x 3 groups + error = 16):**

| Role | Palette | Light Tone | Dark Tone |
|------|---------|------------|-----------|
| `primary` | Primary | 40 | 80 |
| `onPrimary` | Primary | 100 | 20 |
| `primaryContainer` | Primary | 90 | 30 |
| `onPrimaryContainer` | Primary | 10 | 90 |
| `secondary` | Secondary | 40 | 80 |
| `onSecondary` | Secondary | 100 | 20 |
| `secondaryContainer` | Secondary | 90 | 30 |
| `onSecondaryContainer` | Secondary | 10 | 90 |
| `tertiary` | Tertiary | 40 | 80 |
| `onTertiary` | Tertiary | 100 | 20 |
| `tertiaryContainer` | Tertiary | 90 | 30 |
| `onTertiaryContainer` | Tertiary | 10 | 90 |
| `error` | Error | 40 | 80 |
| `onError` | Error | 100 | 20 |
| `errorContainer` | Error | 90 | 30 |
| `onErrorContainer` | Error | 10 | 90 |

**Surface Hierarchy (replaces shadow-based elevation):**

| Role | Palette | Light Tone | Dark Tone |
|------|---------|------------|-----------|
| `surface` | Neutral | 98 | 6 |
| `onSurface` | Neutral | 10 | 90 |
| `surfaceDim` | Neutral | 87 | 6 |
| `surfaceBright` | Neutral | 98 | 24 |
| `surfaceContainerLowest` | Neutral | 100 | 4 |
| `surfaceContainerLow` | Neutral | 96 | 10 |
| `surfaceContainer` | Neutral | 94 | 12 |
| `surfaceContainerHigh` | Neutral | 92 | 17 |
| `surfaceContainerHighest` | Neutral | 90 | 22 |
| `onSurfaceVariant` | Neutral Variant | 30 | 80 |
| `outline` | Neutral Variant | 50 | 60 |
| `outlineVariant` | Neutral Variant | 80 | 30 |
| `inverseSurface` | Neutral | 20 | 90 |
| `inverseOnSurface` | Neutral | 95 | 20 |
| `inversePrimary` | Primary | 80 | 40 |
| `shadow` | Neutral | 0 | 0 |
| `scrim` | Neutral | 0 | 0 |

**Fixed Roles (same in light AND dark):**

| Role | Palette | Tone |
|------|---------|------|
| `primaryFixed` | Primary | 90 |
| `primaryFixedDim` | Primary | 80 |
| `onPrimaryFixed` | Primary | 10 |
| `onPrimaryFixedVariant` | Primary | 30 |
| *(same pattern for secondary and tertiary)* | | |

**Deprecated roles:** `background` (use `surface`), `onBackground` (use `onSurface`), `surfaceVariant` (use `surfaceContainerHighest`).

### 9.3 Dynamic Color Generation

Android extracts a single source color from the wallpaper using HCT (Hue-Chroma-Tone) color model, producing five tonal palettes:

- **Accent 1 (Primary):** Source hue, chroma 48
- **Accent 2 (Secondary):** Source hue, chroma 16
- **Accent 3 (Tertiary):** Hue rotated +60 degrees, chroma 32
- **Neutral 1:** Source hue, chroma 4
- **Neutral 2 (Neutral Variant):** Source hue, chroma 8

Each palette has 13 tonal steps: `0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100`.

**Palette Styles:**

| Style | Description |
|-------|-------------|
| TONAL_SPOT | Default -- balanced vibrancy |
| VIBRANT | High vibrancy, harmonious |
| EXPRESSIVE | Unexpected accent pairings |
| SPRITZ | Low vibrancy, soft pastel |
| MONOCHROMATIC | Single hue, varying tone |

### 9.4 Fallback Strategy

```
Level 1: Android 12+   -> System Dynamic Colors (wallpaper-derived)
Level 2: Android < 12  -> @material/material-color-utilities from brand seed (#B06D1E)
Level 3: iOS           -> Platform-native colors with brand alignment
Level 4: Web           -> CSS custom properties or static brand palette
```

Already implemented via `useMaterial3Theme({ fallbackSourceColor: '#B06D1E' })`.

### 9.5 useTheme Hook Enhancements

The current `ThemeContext.tsx` provides `useTheme()`, `useThemeColors()`, and `useIsDarkMode()`. Recommended additions:

**A. Add Missing Color Roles:**

```typescript
interface ThemeColors {
  // ... existing roles ...

  // Fixed roles (same in light and dark)
  primaryFixed: string;
  primaryFixedDim: string;
  onPrimaryFixed: string;
  onPrimaryFixedVariant: string;
  secondaryFixed: string;
  secondaryFixedDim: string;
  onSecondaryFixed: string;
  onSecondaryFixedVariant: string;
  tertiaryFixed: string;
  tertiaryFixedDim: string;
  onTertiaryFixed: string;
  onTertiaryFixedVariant: string;

  // Surface hierarchy
  surfaceDim: string;
  surfaceBright: string;
  shadow: string;
  scrim: string;
}
```

**B. Add App-Specific Semantic Tokens:**

M3 does NOT define success/warning/info. Define custom tokens:

```typescript
interface AppSemanticColors {
  success: string;           // Map to tertiary or custom green
  warning: string;           // Map to custom orange
  info: string;              // Map to secondary

  // Dating-app specific
  matchHighlight: string;    // Accent for match notifications
  onlineIndicator: string;   // Green dot for online status
  premiumBadge: string;      // Gold/premium styling
  chatBubbleSent: string;    // Maps to primaryContainer
  chatBubbleReceived: string;// Maps to surfaceContainerHigh
  onChatBubbleSent: string;  // Maps to onPrimaryContainer
  onChatBubbleReceived: string; // Maps to onSurface
}
```

**C. Navigation Theme Integration:**

```typescript
import { DefaultTheme, DarkTheme } from '@react-navigation/native';

const navigationTheme = {
  ...(isDark ? DarkTheme : DefaultTheme),
  colors: {
    ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
    primary: colors.primary,
    background: colors.background,
    card: colors.surfaceContainer,
    text: colors.onSurface,
    border: colors.outlineVariant,
    notification: colors.error,
  },
};
```

**D. Root Background (prevent white flash):**

```typescript
import * as SystemUI from 'expo-system-ui';

useEffect(() => {
  SystemUI.setBackgroundColorAsync(isDark ? '#000000' : '#FFFAF2');
}, [isDark]);
```

### 9.6 NativeWind/Tailwind Integration Note

The project uses NativeWind (`^4.2.1`) with `darkMode: "class"`. For M3-aware components:

1. Use NativeWind `dark:` classes for simple light/dark toggling
2. Use `useThemeColors()` style prop for Dynamic Color-aware components
3. Hybrid approach: NativeWind for layout/spacing, `useThemeColors()` for color

### 9.7 Design Principles from Google Apps

Google's own apps follow these M3 color patterns:

1. **`primary` reserved for main CTA only** (Compose button, Send, primary action)
2. **`secondary`/`tertiary` for everyday UI** (chips, tags, filters)
3. **Surface container hierarchy for depth** instead of shadows
4. **Spring-based motion** for all interactive elements
5. **Clear visual hierarchy** through tonal contrast between primary/secondary/tertiary

---

## 10. Implementation Checklist

### Phase 1: Infrastructure

- [ ] Install `react-native-edge-to-edge` (v1.7.0)
- [ ] Install `react-native-keyboard-controller`
- [ ] Configure edge-to-edge config plugin with `Material3Expressive.Dynamic` parent theme
- [ ] Migrate from `expo-status-bar` / `expo-navigation-bar` to `SystemBars`
- [ ] Add `KeyboardProvider` to root layout
- [ ] Set root background color via `expo-system-ui` on theme change
- [ ] Verify edge-to-edge rendering on physical device

### Phase 2: Theme System

- [ ] Add missing M3 color roles to `ThemeColors` interface (Fixed, surfaceDim, surfaceBright, shadow, scrim)
- [ ] Add app-specific semantic tokens (success, warning, chatBubble*, matchHighlight, etc.)
- [ ] Integrate navigation theme inside `ThemeProvider`
- [ ] Create `theme/m3eMotion.ts` with spring token constants
- [ ] Create `theme/m3eShapes.ts` with shape token constants
- [ ] Create `theme/m3eHaptics.ts` with platform-specific haptic helpers
- [ ] Create `theme/m3eLayout.ts` with breakpoints and window size classes

### Phase 3: Component Library

- [ ] Update all screen layouts to use `useSafeAreaInsets` with edge-to-edge patterns
- [ ] Replace all duration-based animations with spring physics from `m3eMotion.ts`
- [ ] Implement M3E Search App Bar component
- [ ] Implement Floating Toolbar component
- [ ] Implement Split Button component
- [ ] Implement Button Group component
- [ ] Implement Loading Indicator (shape morph) component
- [ ] Update FAB patterns to M3E style (toggle + menu)

### Phase 4: Polish

- [ ] Add haptic feedback to all interactive elements using `m3eHaptics.ts`
- [ ] Implement shape morphing on key interactive components
- [ ] Test predictive back gesture behavior
- [ ] Test Dynamic Color with various wallpapers
- [ ] Test keyboard handling on all form screens
- [ ] Verify light/dark mode transitions
- [ ] Accessibility audit (blur toggle, contrast ratios, touch targets)

---

## Sources

### Official Material Design
- [Material Design 3 Components](https://m3.material.io/components)
- [Material Design 3 Motion Specs](https://m3.material.io/styles/motion/overview/specs)
- [M3 Expressive Motion Blog](https://m3.material.io/blog/m3-expressive-motion-theming)
- [Start Building with M3 Expressive](https://m3.material.io/blog/building-with-m3-expressive)
- [M3 Color Roles](https://m3.material.io/styles/color/roles)
- [M3 Color System](https://m3.material.io/styles/color/system/how-the-system-works)

### Android Developer
- [Android 16 Features and APIs](https://developer.android.com/about/versions/16/features)
- [Android 16 Behavior Changes](https://developer.android.com/about/versions/16/behavior-changes-16)
- [Edge-to-Edge Display](https://developer.android.com/develop/ui/views/layout/edge-to-edge)
- [Predictive Back Gesture](https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture)
- [Dynamic Colors](https://developer.android.com/develop/ui/views/theming/dynamic-colors)
- [Haptics APIs](https://developer.android.com/develop/ui/views/haptics/haptics-apis)
- [material-components-android Motion.md](https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md)

### React Native / Expo
- [React Native 0.81 Blog](https://reactnative.dev/blog/2025/08/12/react-native-0.81)
- [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54)
- [Expo Edge-to-Edge](https://expo.dev/blog/edge-to-edge-display-now-streamlined-for-android)
- [Expo System Bars](https://docs.expo.dev/develop/user-interface/system-bars/)
- [Expo Safe Areas](https://docs.expo.dev/develop/user-interface/safe-areas/)
- [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/)

### Libraries
- [react-native-edge-to-edge](https://github.com/zoontek/react-native-edge-to-edge)
- [react-native-safe-area-context](https://github.com/AppAndFlow/react-native-safe-area-context)
- [react-native-keyboard-controller](https://kirillzyusko.github.io/react-native-keyboard-controller/)
- [react-native-paper](https://reactnativepaper.com/)
- [@pchmn/expo-material3-theme](https://github.com/pchmn/expo-material3-theme)
- [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/)

### Analysis & News
- [Google Blog: M3 Expressive Launch](https://blog.google/products-and-platforms/platforms/android/material-3-expressive-android-wearos-launch/)
- [Android Authority: M3 Expressive Deep Dive](https://www.androidauthority.com/google-material-3-expressive-features-changes-availability-supported-devices-3556392/)
- [9to5Google: M3 Expressive Redesign](https://9to5google.com/2025/05/13/android-16-material-3-expressive-redesign/)
- [9to5Google: Recap Expressive Android](https://9to5google.com/2025/12/27/recap-material-3-expressive/)
- [ProAndroidDev: Android 16 x Material 3 Expressive](https://proandroiddev.com/android-16-x-material-3-e-biggest-ui-change-yet-updates-for-android-jetpack-compose-and-flutter-35d6b53a5242)
