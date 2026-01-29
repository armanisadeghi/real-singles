# Android 16 Native UX/UI Code Update Task

**Status:** Ready for execution
**Scope:** `/mobile` directory only. Do NOT touch `/web`, iOS-only code, or shared business logic.
**Reference:** Read `docs/ANDROID_16_NATIVE_UX_GUIDANCE.md` before starting.

---

## Prerequisites

Before making any changes, install the missing required libraries:

```bash
cd mobile
npx expo install react-native-keyboard-controller
```

Verify `react-native-edge-to-edge` is not needed (RN 0.81+ has built-in edge-to-edge support). If the Expo SDK version is below 54, install it:

```bash
npx expo install react-native-edge-to-edge
```

---

## Task 1: Create M3 Expressive Theme Utility Modules

Create four new files under `mobile/constants/` that centralize all M3 Expressive tokens. Every animation, shape, and haptic call in the app will import from these files instead of defining inline values.

### 1A. Create `mobile/constants/m3eMotion.ts`

```typescript
import { withSpring, type WithSpringConfig } from 'react-native-reanimated';

/**
 * Material 3 Expressive Spring Tokens
 * Source: material-components-android v1.13.0+ Motion.md
 *
 * SPATIAL = position, size, shape (allows bounce, dampingRatio ~0.9)
 * EFFECTS = color, opacity (critically damped, dampingRatio 1.0, no bounce)
 */

// --- Standard Spatial Springs ---
export const M3_FAST_SPATIAL: WithSpringConfig = { stiffness: 1400, damping: 67, mass: 1 };
export const M3_DEFAULT_SPATIAL: WithSpringConfig = { stiffness: 700, damping: 48, mass: 1 };
export const M3_SLOW_SPATIAL: WithSpringConfig = { stiffness: 300, damping: 31, mass: 1 };

// --- Effects Springs (no bounce) ---
export const M3_FAST_EFFECTS: WithSpringConfig = { stiffness: 3800, damping: 123, mass: 1 };
export const M3_DEFAULT_EFFECTS: WithSpringConfig = { stiffness: 1600, damping: 80, mass: 1 };
export const M3_SLOW_EFFECTS: WithSpringConfig = { stiffness: 800, damping: 57, mass: 1 };

// --- Expressive Overrides (more bounce, for hero moments) ---
export const M3_EXPRESSIVE_FAST: WithSpringConfig = { stiffness: 800, damping: 34, mass: 1 };
export const M3_EXPRESSIVE_DEFAULT: WithSpringConfig = { stiffness: 380, damping: 31, mass: 1 };
export const M3_EXPRESSIVE_SLOW: WithSpringConfig = { stiffness: 200, damping: 23, mass: 1 };

// --- Reduced Motion Fallback (no animation) ---
export const M3_NO_ANIMATION: WithSpringConfig = { stiffness: 1000, damping: 500, mass: 1 };

/** Apply M3 spring. Default = Default Spatial. */
export function m3Spring(value: number, config: WithSpringConfig = M3_DEFAULT_SPATIAL) {
  return withSpring(value, config);
}
```

### 1B. Create `mobile/constants/m3eShapes.ts`

```typescript
/**
 * Material 3 Expressive Shape Tokens
 * Use these everywhere instead of arbitrary borderRadius values.
 */
export const M3Shapes = {
  none: 0,
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 28,
  full: 9999,

  // Component-specific aliases
  button: 20,
  fab: 16,
  fabLarge: 28,
  chip: 8,
  card: 12,
  dialog: 28,
  sheet: 28,
  searchBar: 28,
  navigationIndicator: 9999,
  toolbar: 28,
  menuItem: 12,
} as const;
```

### 1C. Create `mobile/constants/m3eHaptics.ts`

```typescript
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Material 3 Expressive Haptic Feedback
 * Android: uses performAndroidHapticsAsync (native, no VIBRATE permission)
 * iOS: cross-platform fallback
 */
export const M3Haptics = {
  tap: () => {
    if (Platform.OS === 'android') {
      Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Virtual_Key);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
  sliderTick: () => {
    if (Platform.OS === 'android') {
      Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Tick);
    } else {
      Haptics.selectionAsync();
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
  longPress: () => {
    if (Platform.OS === 'android') {
      Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Context_Click);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },
};
```

### 1D. Create `mobile/constants/m3eLayout.ts`

```typescript
import { useWindowDimensions } from 'react-native';

export const M3Breakpoints = {
  compact: 0,
  medium: 600,
  expanded: 840,
  large: 1200,
  extraLarge: 1600,
} as const;

export type WindowSizeClass = 'compact' | 'medium' | 'expanded' | 'large' | 'extraLarge';

export function useWindowSizeClass(): WindowSizeClass {
  const { width } = useWindowDimensions();
  if (width >= M3Breakpoints.extraLarge) return 'extraLarge';
  if (width >= M3Breakpoints.large) return 'large';
  if (width >= M3Breakpoints.expanded) return 'expanded';
  if (width >= M3Breakpoints.medium) return 'medium';
  return 'compact';
}
```

---

## Task 2: Fix All Spring Animation Violations

Every file below uses arbitrary spring values. Replace them with imports from `@/constants/m3eMotion`.

### File 1: `mobile/components/chat/ChatInput.tsx`

**Find** (around line 49):
```typescript
const springConfig = {
  damping: 18,
  stiffness: 150,
  mass: 1,
};
```
**Replace with:**
```typescript
import { M3_DEFAULT_SPATIAL } from '@/constants/m3eMotion';
```
Then replace all `springConfig` references with `M3_DEFAULT_SPATIAL`.

### File 2: `mobile/components/IncomingCall.tsx`

**Find** (around line 83):
```typescript
translationX.value = withSpring(0, { damping: 15, stiffness: 150 });
```
**Replace with:**
```typescript
import { M3_DEFAULT_SPATIAL } from '@/constants/m3eMotion';
// ...
translationX.value = withSpring(0, M3_DEFAULT_SPATIAL);
```

### File 3: `mobile/components/SidebarMenu.tsx`

**Find** (around line 95):
```typescript
{ damping: 18, stiffness: 200 }
```
**Replace with:**
```typescript
import { M3_DEFAULT_SPATIAL } from '@/constants/m3eMotion';
// ...
M3_DEFAULT_SPATIAL
```

### File 4: `mobile/components/ui/FullScreenImageViewer.tsx`

**Find** (around line 33):
```typescript
const SPRING_CONFIG = { damping: 15, stiffness: 150 };
```
**Replace with:**
```typescript
import { M3_DEFAULT_SPATIAL } from '@/constants/m3eMotion';
```
Then replace ALL 12+ references to `SPRING_CONFIG` with `M3_DEFAULT_SPATIAL`.

### File 5: `mobile/components/forms/EditProfileForm.tsx`

**Find** (around line 68):
```typescript
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 200,
};
```
**Replace with:**
```typescript
import { M3_DEFAULT_SPATIAL } from '@/constants/m3eMotion';
```
Then replace `SPRING_CONFIG` references with `M3_DEFAULT_SPATIAL`.

### File 6: `mobile/app/discover/profile/[id].tsx`

**Find** (around lines 168, 170):
```typescript
scaleRef.value = withSpring(0.8, { damping: 20, stiffness: 300 });
scaleRef.value = withSpring(1, { damping: 20, stiffness: 300 });
```
**Replace with:**
```typescript
import { M3_FAST_SPATIAL } from '@/constants/m3eMotion';
// ...
scaleRef.value = withSpring(0.8, M3_FAST_SPATIAL);
scaleRef.value = withSpring(1, M3_FAST_SPATIAL);
```
(Button press animations are "small component" = Fast Spatial.)

### File 7: `mobile/app/profiles/[id].tsx`

**Find** (around lines 191-192):
```typescript
retryScale.value = withSequence(
  withSpring(0.8, { damping: 20, stiffness: 300 }),
  withSpring(1, { damping: 20, stiffness: 300 })
);
```
**Replace with:**
```typescript
import { M3_FAST_SPATIAL } from '@/constants/m3eMotion';
// ...
retryScale.value = withSequence(
  withSpring(0.8, M3_FAST_SPATIAL),
  withSpring(1, M3_FAST_SPATIAL)
);
```

### File 8: `mobile/hooks/useReducedMotion.ts`

**Find** the default spring config fallback (around line 88):
```typescript
return {
  damping: config?.damping ?? 15,
  stiffness: config?.stiffness ?? 150,
  mass: config?.mass ?? 1,
};
```
**Replace with:**
```typescript
import { M3_DEFAULT_SPATIAL, M3_NO_ANIMATION } from '@/constants/m3eMotion';
// ...
// In the reduced motion path, return M3_NO_ANIMATION
// In the normal path, return config or M3_DEFAULT_SPATIAL as default
return config ?? M3_DEFAULT_SPATIAL;
```

---

## Task 3: Fix All Hardcoded Color Violations

Replace every hardcoded hex color with theme colors from `useTheme()` / `useThemeColors()`. Import from `@/context/ThemeContext`.

### TIER 1 — Critical (fixes affect most screens)

#### File: `mobile/app/_layout.tsx`

This file affects ALL screen headers. The `RootLayoutNav` component currently uses `useColorScheme()` to derive header colors. It should use `useTheme()`.

**Line 111** — `headerTintColor: '#E91E63'`
Replace with: `headerTintColor: colors.primary`

**Line 116** — `color: isDark ? '#FFFFFF' : '#000000'`
Replace with: `color: colors.onSurface`

**Line 127** — `backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF'`
Replace with: `backgroundColor: colors.surface`

To do this, add `const { colors, dark } = useTheme();` inside `RootLayoutNav` and use `dark` instead of the local `isDark` variable. Remove the separate `useColorScheme()` call for color determination (keep it only if needed for NavigationBar button style).

#### File: `mobile/app/(tabs)/discover.tsx`

**Lines 54-67** — Multiple `isDark` ternary color values.
Replace all with `colors.*` equivalents:
- `isDark ? '#6B7280' : '#9CA3AF'` → `colors.onSurfaceVariant`
- `isDark ? '#FF6B8A' : '#B06D1E'` → `colors.primary`
- `isDark ? '#000000' : '#FFFFFF'` → `colors.background`
- `isDark ? '#1C1C1E' : '#F2F2F7'` → `colors.surfaceVariant`
- `isDark ? '#4B5563' : '#CBD5E1'` → `colors.outline`

#### File: `mobile/app/(tabs)/profile.tsx`

**Lines 58-59, 237** — Same pattern.
- `isDark ? '#000000' : '#FFFFFF'` → `colors.background`
- `isDark ? '#1C1C1E' : '#F2F2F7'` → `colors.surfaceVariant`
- `isDark ? '#4B5563' : '#CBD5E1'` → `colors.outline`

#### File: `mobile/app/(auth)/login.tsx`

**Line 50** — `isDark ? '#9CA3AF' : '#B0B0B0'`
Replace with: `colors.onSurfaceVariant`

### TIER 2 — High Impact (reusable components)

#### File: `mobile/components/ui/EventCard.tsx`

**Lines 46-49, 216-219** — Multiple ternary color values.
Add `const colors = useThemeColors();` and replace all `isDark` ternaries.

#### File: `mobile/components/ui/FloatingActionBar.tsx`

**Lines 97, 106, 207, 214** — Background, text, and icon colors.
Replace with theme colors.

#### File: `mobile/components/ui/ProfileListItem.tsx`

**Lines 74, 78, 82, 86** — Text and background ternaries.
Replace with theme colors.

#### File: `mobile/components/ui/NativeSegmentedTabs.tsx`

**Lines 97, 99** — Tab background and text colors.
Replace with theme colors.

#### File: `mobile/components/profile/ProfileSectionRenderer.tsx`

**Lines 120, 127-134, 138** — Multiple color ternaries.
Replace with theme colors.

#### File: `mobile/components/ui/ContextMenu.tsx`

**Lines 79, 80, 82** — Menu styling.
Replace with theme colors.

#### File: `mobile/components/NotificationBell.tsx`

**Line 40** — Icon color.
Replace with theme color.

#### File: `mobile/app/call/index.tsx`

**Lines 45, 49, 51, 52, 235, 247, 259, 271** — Multiple background and text colors.
Replace all ternaries with theme colors.

#### File: `mobile/app/events/index.tsx`

**Lines 40-42, 110, 128** — Background and text ternaries.
Replace with theme colors.

#### File: `mobile/app/(tabs)/connections.tsx`

**Line 157** — `isDark ? "#3A3A3C" : "#D1D1D6"`
Replace with: `colors.outline`

### TIER 3 — Batch Fix (15 signup/form files)

All these files use `isDark ? '#9CA3AF' : '#B0B0B0'` for placeholder text color. Replace with `colors.onSurfaceVariant` in every one:

1. `mobile/components/signup/Appearance.tsx` (line 18)
2. `mobile/components/signup/PersonalDetails.tsx` (line 17)
3. `mobile/components/signup/Intro.tsx` (line 16)
4. `mobile/components/signup/Ethnicity.tsx` (line 17)
5. `mobile/components/signup/ChooseInterests.tsx` (line 22)
6. `mobile/components/signup/EducationJob.tsx` (line 21)
7. `mobile/components/signup/TakePhoto.tsx` (line 681)
8. `mobile/components/signup/TakeVideo2.tsx` (line 20)
9. `mobile/components/signup/gender.tsx` (line 37)
10. `mobile/components/signup/ReviewProfile.tsx` (line 43)
11. `mobile/components/signup/Success.tsx` (line 23)
12. `mobile/components/signup/login.tsx` (line 25)
13. `mobile/components/forms/ContactForm.tsx` (line 41)
14. `mobile/components/forms/EditProfileForm.tsx` (line 131)
15. `mobile/components/forms/ShippingInfoForm.tsx` (line 37)

**Pattern:** Each file needs `import { useThemeColors } from '@/context/ThemeContext';` and `const colors = useThemeColors();` at the top of the component, then replace the placeholder color value.

### Color Mapping Reference

When replacing hardcoded colors, use this map:

| Hardcoded Value | Theme Role |
|----------------|------------|
| `#FFFFFF` (white bg) | `colors.surface` or `colors.background` |
| `#000000` (black bg) | `colors.background` |
| `#1C1C1E` (dark surface) | `colors.surface` |
| `#2C2C2E` (dark elevated) | `colors.surfaceContainerHigh` |
| `#3A3A3C` (dark border) | `colors.surfaceContainer` |
| `#F2F2F7` (light surface) | `colors.surfaceVariant` |
| `#F5F5F5` (light bg) | `colors.surfaceContainerLow` |
| `#E5E7EB` (light border) | `colors.outline` |
| `#D1D1D6` (gray border) | `colors.outline` |
| `#CBD5E1` (light divider) | `colors.outlineVariant` |
| `#9CA3AF` (muted text) | `colors.onSurfaceVariant` |
| `#6B7280` (secondary text) | `colors.onSurfaceVariant` |
| `#B0B0B0` (placeholder) | `colors.onSurfaceVariant` |
| `#4B5563` (dark muted) | `colors.outline` |
| `#E91E63` (pink) | `colors.primary` |
| `#FF6B8A` (light pink) | `colors.primary` |
| `#B06D1E` (brand brown) | `colors.primary` |

---

## Task 4: Add Missing Theme Color Roles

Update `mobile/context/ThemeContext.tsx` to include missing M3 color roles.

### Add to the `ThemeColors` interface:

```typescript
// After the existing inversePrimary field, add:

// Surface brightness
surfaceDim: string;
surfaceBright: string;

// Fixed colors (same in light and dark)
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

// Shadow & Scrim
shadow: string;
scrim: string;
```

### Update `createAndroidColors` to populate these new fields:

Pull them from the Material 3 scheme object. If the `@pchmn/expo-material3-theme` library does not expose them, use fallback values derived from the existing palette.

### Update `createIOSColors` similarly.

### Add Root Background Color

In the `ThemeProvider` component, add `expo-system-ui` to set the root background color on theme change to prevent white flash:

```typescript
import * as SystemUI from 'expo-system-ui';

// Inside ThemeProvider, after computing appTheme:
useEffect(() => {
  SystemUI.setBackgroundColorAsync(isDark ? '#000000' : '#FFFAF2');
}, [isDark]);
```

---

## Task 5: Update Root Layout for Theme Compliance

### File: `mobile/app/_layout.tsx`

1. In `RootLayoutNav`, replace `useColorScheme()` color usage with `useTheme()`:

```typescript
function RootLayoutNav() {
  const router = useRouter();
  const { colors, dark } = useTheme();
  const colorScheme = useColorScheme(); // keep ONLY for NavigationBar button style
  // ...
```

2. Replace all hardcoded header colors in `screenOptions`:

```typescript
screenOptions={{
  headerTintColor: colors.primary,
  headerShadowVisible: false,
  headerTitleStyle: {
    fontWeight: '600',
    color: colors.onSurface,
  },
  headerBackTitle: 'Back',
  headerBlurEffect: Platform.OS === 'ios' ? 'systemMaterial' : undefined,
  headerStyle: Platform.OS === 'ios'
    ? undefined
    : { backgroundColor: colors.surface },
}}
```

3. Replace StatusBar:

```typescript
<StatusBar
  backgroundColor="transparent"
  barStyle={dark ? 'light-content' : 'dark-content'}
  translucent={Platform.OS === 'android'}
/>
```

---

## Task 6: Install and Configure `react-native-keyboard-controller`

Edge-to-edge breaks Android's standard `adjustResize` keyboard behavior. This library fixes it.

### Step 1: Install

```bash
cd mobile
npx expo install react-native-keyboard-controller
```

### Step 2: Add `KeyboardProvider` to root layout

In `mobile/app/_layout.tsx`, wrap the app content:

```typescript
import { KeyboardProvider } from 'react-native-keyboard-controller';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <AuthProvider>
              <CallProvider>
                <RootLayoutNav />
              </CallProvider>
            </AuthProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
```

### Step 3: Update form screens

In any screen that has text inputs and uses `KeyboardAvoidingView`, replace:

```typescript
// OLD
import { KeyboardAvoidingView } from 'react-native';

// NEW
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
```

This is a drop-in replacement that works correctly with edge-to-edge.

---

## Task 7: Audit and Verify Edge-to-Edge

Go through every screen and verify:

1. **No `SafeAreaView` from `react-native`** — Only use `useSafeAreaInsets()` from `react-native-safe-area-context`.

2. **Background content extends behind system bars** — Images, gradients, and background colors should be on the outermost View, which does NOT have top/bottom padding.

3. **Only interactive content has inset padding** — Apply `paddingTop: insets.top` only where text or buttons would overlap the status bar. Apply `paddingBottom: insets.bottom` only where content would overlap the nav bar.

4. **ScrollViews use contentContainerStyle** — Not wrapper padding:
   ```typescript
   // CORRECT
   <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>

   // WRONG
   <View style={{ paddingTop: insets.top }}>
     <ScrollView>
   ```

5. **Modals pass translucent props:**
   ```typescript
   <Modal statusBarTranslucent={true} navigationBarTranslucent={true}>
   ```

---

## Task 8: Add Haptic Feedback to Interactive Components

Scan all files in `mobile/components/` and `mobile/app/` for interactive elements (`Pressable`, `TouchableOpacity`, `TouchableHighlight`, `Button`, `onPress`, etc.) that do NOT have haptic feedback.

Import `M3Haptics` from `@/constants/m3eHaptics` and add the appropriate haptic call:

- **Button/Pressable `onPress`:** `M3Haptics.tap()`
- **Toggle/Switch `onValueChange`:** `M3Haptics.toggleOn()` or `M3Haptics.toggleOff()`
- **Long press:** `M3Haptics.longPress()`
- **Success action:** `M3Haptics.success()`
- **Error/failure:** `M3Haptics.error()`
- **Slider/picker change:** `M3Haptics.sliderTick()`

Not every single Pressable needs haptics (e.g., navigation links that transition screens are fine without). Focus on:
- Action buttons (like, pass, send, save, delete)
- Toggle switches
- Bottom sheet open/close
- FABs
- Form submit
- Swipe actions (dismiss, archive)

---

## Execution Order

Run these tasks in this order to avoid conflicts:

1. **Task 1** — Create utility modules (no existing code changes)
2. **Task 4** — Update ThemeContext (adds new fields, no breaking changes)
3. **Task 5** — Update root layout (uses new theme fields)
4. **Task 2** — Fix spring animations (uses new m3eMotion module)
5. **Task 3** — Fix hardcoded colors (uses updated theme)
6. **Task 6** — Install keyboard controller (infrastructure)
7. **Task 7** — Audit edge-to-edge (verification pass)
8. **Task 8** — Add haptics (enhancement pass)

After each task, build the app and verify no regressions:

```bash
cd mobile
npx expo start --clear
```

---

## Verification Checklist

After all tasks are complete, verify every item:

- [ ] `mobile/constants/m3eMotion.ts` exists with all 9 spring tokens
- [ ] `mobile/constants/m3eShapes.ts` exists with all shape tokens
- [ ] `mobile/constants/m3eHaptics.ts` exists with all haptic helpers
- [ ] `mobile/constants/m3eLayout.ts` exists with breakpoints and hook
- [ ] Zero hardcoded spring configs remain (search for `damping:` + `stiffness:` inline in components)
- [ ] Zero hardcoded hex colors in style props (search for `#[0-9A-Fa-f]{6}` in `.tsx` files, excluding ThemeContext brand constants)
- [ ] All animations use imported M3 spring tokens
- [ ] All colors come from `useTheme()` / `useThemeColors()`
- [ ] `KeyboardProvider` wraps the app root
- [ ] No `SafeAreaView` from `react-native` (only from `react-native-safe-area-context`)
- [ ] Root background color set via `expo-system-ui` on theme change
- [ ] App builds and runs without errors on Android
