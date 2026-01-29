---
name: android-native-expert
description: Ensures Android implementations use truly native components, Material 3 Expressive design patterns, and Android 16 requirements. Use when implementing Android-specific features, reviewing Android code for native feel, or when the user mentions Android native, Material Design, Material 3 Expressive, Android 16, edge-to-edge, adaptive layouts, or Material You. NEVER modifies web code or iOS implementations.
---

# Android Native Expert

**Your job:** Make Android implementations authentically native using Android 16 requirements, Material 3 Expressive design, and Material Design guidelines.

---

## MANDATORY COMPLIANCE NOTICE

Everything in this document is **REQUIRED**, not optional. Every component, screen, and interaction on Android **MUST** conform to the standards below. There are no exceptions.

**If you encounter ANY component or screen that violates these rules:**

1. **STOP** and report the violation before proceeding with your current task.
2. **FIX** the violation as part of your current work if scope permits.
3. **LOG** the violation in your response so the team is aware.

Non-compliance degrades the user experience and makes the app feel non-native. The standards here are derived from Google's official Material 3 Expressive specification, Android 16 API 36 enforcement requirements, and extensive research documented in `docs/ANDROID_16_NATIVE_UX_GUIDANCE.md`.

---

## Scope: Android-ONLY

| Action | Allowed |
|--------|---------|
| Modify `/mobile` Android-specific code | YES |
| Use `Platform.OS === 'android'` conditionals | YES |
| Add Android-only features | YES |
| Modify `/web` in any way | NEVER |
| Change shared logic that affects iOS | NEVER |
| Remove iOS implementations | NEVER |

**When unsure:** Search `"Android 16 [component] Material 3 Expressive"` and consult `docs/ANDROID_16_NATIVE_UX_GUIDANCE.md`.

---

## Research Resources

The following documents contain detailed implementation guidance, code examples, and source references. **You MUST search these before implementing any Android-specific feature:**

| Document | Path | Contents |
|----------|------|----------|
| **Primary Guidance** | `docs/ANDROID_16_NATIVE_UX_GUIDANCE.md` | Complete implementation standards: spring tokens, edge-to-edge, theme system, component patterns, haptics, checklist |
| **M3E Component Research** | `docs/ANDROID_16_M3_EXPRESSIVE_RESEARCH.md` | Detailed component APIs, React Native Paper patterns, FAB/toolbar/search/progress code examples, library landscape |
| **Quick Reference** | `.cursor/skills/android-native-expert/android-components-reference.md` | Lookup tables for icons, colors, haptics, springs, sizing, forms |

**How to use these resources:**
- Before implementing a new component, search the M3E Component Research doc for existing patterns.
- Before choosing animation configs, look up the exact spring token in the Quick Reference.
- Before making architectural decisions about theming or edge-to-edge, read the Primary Guidance doc sections 7 and 9.

---

## Android 16 Mandatory Requirements (API 36)

These are NOT suggestions. Android 16 enforces them at the OS level.

### 1. Edge-to-Edge (No Opt-Out)

Android 16 removed the `windowOptOutEdgeToEdgeEnforcement` attribute. Content MUST draw behind system bars.

**REQUIRED implementation:**
- Use `useSafeAreaInsets()` from `react-native-safe-area-context` (NOT the deprecated `SafeAreaView` from `react-native`)
- Background content (images, colors, gradients) extends behind ALL system bars
- Only interactive/readable content gets inset padding
- Scrollable content uses `contentContainerStyle` padding, not wrapper padding
- Modals set `statusBarTranslucent={true}` and `navigationBarTranslucent={true}`

```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function Screen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {/* content */}
    </View>
  );
}
```

**Keyboard handling:** Edge-to-edge breaks Android's standard `adjustResize`. Use `react-native-keyboard-controller` for forms. See Primary Guidance doc section 7.5.

### 2. Predictive Back Gesture

Enabled in `app.json` with `enableOnBackInvokedCallback: true`. The `BackHandler` API works for JS-level back handling. Full predictive back animation (showing destination before swipe completes) is not yet supported in react-native-screens/React Navigation/Expo Router.

### 3. Adaptive Layouts (600dp+ displays)

Android 16 ignores orientation locks and `resizeableActivity="false"` on displays 600dp or wider. Layouts MUST be responsive.

```tsx
import { useWindowDimensions } from 'react-native';

function useWindowSizeClass() {
  const { width } = useWindowDimensions();
  if (width < 600) return 'compact';
  if (width < 840) return 'medium';
  if (width < 1200) return 'expanded';
  return 'large';
}
```

Test in: split-screen, freeform windowing, external displays, rapid resizing.

---

## Material 3 Expressive Design (REQUIRED)

M3 Expressive is the design language for Android 16. Every component MUST follow these patterns.

### Spring-Based Motion (MANDATORY)

**All animations MUST use spring physics.** Duration-based `withTiming` is only acceptable for looping/repeating animations. Every interactive transition uses `withSpring`.

**Official spring tokens from `material-components-android` v1.13.0+:**

| Token | Config | Use For |
|-------|--------|---------|
| Fast Spatial | `{ stiffness: 1400, damping: 67, mass: 1 }` | Buttons, switches, checkboxes, chips, FABs |
| Default Spatial | `{ stiffness: 700, damping: 48, mass: 1 }` | Bottom sheets, nav drawers, cards, dialogs |
| Slow Spatial | `{ stiffness: 300, damping: 31, mass: 1 }` | Full-screen transitions, page changes |
| Fast Effects | `{ stiffness: 3800, damping: 123, mass: 1 }` | Small component color/opacity changes |
| Default Effects | `{ stiffness: 1600, damping: 80, mass: 1 }` | Medium element color/opacity |
| Slow Effects | `{ stiffness: 800, damping: 57, mass: 1 }` | Full-screen color/opacity |

**Spatial** = position, size, shape (dampingRatio 0.9, slight bounce).
**Effects** = color, opacity (dampingRatio 1.0, no bounce).
**Speed selection:** Fast = small components, Default = partial-screen, Slow = full-screen.

```tsx
import { withSpring } from 'react-native-reanimated';

// CORRECT
sv.value = withSpring(targetValue, { stiffness: 700, damping: 48, mass: 1 });

// WRONG - arbitrary values without M3 basis
sv.value = withSpring(targetValue, { damping: 15, stiffness: 150 });

// WRONG - using withTiming for interactive transitions
sv.value = withTiming(targetValue, { duration: 300 });
```

**Note:** `stiffness/damping` (physics mode) and `duration/dampingRatio` (duration mode) CANNOT be mixed. Use one or the other. See Primary Guidance doc section 3 for complete derivation.

### Dynamic Material You Colors (REQUIRED)

Every color in the app MUST come from the centralized theme system. Hardcoded colors are forbidden except for brand constants defined in `ThemeContext.tsx`.

```tsx
// CORRECT
const { colors } = useTheme();
<View style={{ backgroundColor: colors.surface }} />

// WRONG
<View style={{ backgroundColor: '#FFFFFF' }} />
<View style={{ backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }} />
```

### Haptic Feedback (REQUIRED on all interactive elements)

Every tappable, toggleable, or draggable element MUST provide haptic feedback. On Android, use `performAndroidHapticsAsync` for native Material-consistent feedback:

| Interaction | Android Haptic |
|-------------|---------------|
| Button tap | `AndroidHaptics.Virtual_Key` |
| Toggle on | `AndroidHaptics.Toggle_On` |
| Toggle off | `AndroidHaptics.Toggle_Off` |
| Slider tick | `AndroidHaptics.Segment_Tick` |
| Success | `AndroidHaptics.Confirm` |
| Error | `AndroidHaptics.Reject` |
| Long press | `AndroidHaptics.Context_Click` |

```tsx
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const hapticTap = () => {
  if (Platform.OS === 'android') {
    Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Virtual_Key);
  } else {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};
```

### Shape Tokens (REQUIRED)

Use M3 Expressive corner radii consistently:

| Component | Radius |
|-----------|--------|
| Button | 20 |
| FAB | 16 (regular), 28 (large) |
| Card | 12 |
| Dialog | 28 |
| Bottom sheet | 28 (top corners) |
| Search bar | 28 (pill) |
| Chip | 8 |
| Floating toolbar | 28 (pill) |
| Navigation indicator | 9999 (full pill) |

---

## Component Selection (REQUIRED)

Use native-backed components. JS approximations are forbidden.

| Need | REQUIRED Library | FORBIDDEN Alternative |
|------|-----------------|----------------------|
| Tab bar | `expo-router/unstable-native-tabs` | `@react-navigation/bottom-tabs` |
| Bottom sheet | `@gorhom/bottom-sheet` | Custom `Animated.View` |
| Icons | `@expo/vector-icons` (MaterialIcons) | Custom fonts, PNGs |
| Date picker | `@react-native-community/datetimepicker` | Custom pickers |
| Haptics | `expo-haptics` | Raw Vibration API |
| Gestures | `react-native-gesture-handler` | PanResponder |
| Animations | `react-native-reanimated` | Animated API |
| M3 Components | `react-native-paper` v5 | Custom from scratch |
| Dynamic colors | `@pchmn/expo-material3-theme` | Hardcoded color values |

---

## Material Icons (REQUIRED)

All Android icons MUST use Material Icons via `@expo/vector-icons/MaterialIcons` or `MaterialCommunityIcons`. See the Quick Reference doc for the full icon table.

```tsx
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
<MaterialIcons name="favorite" size={24} color={colors.primary} />
```

---

## M3 Expressive Components

### Components Available via react-native-paper

These are M3-ready and should be used directly:
- `BottomNavigation` / `BottomNavigation.Bar` -- pill indicator, shifting mode
- `FAB` / `AnimatedFAB` / `FAB.Group` -- variant colors, sizes
- `Searchbar` -- pill-shaped, modes, elevation
- `Button` -- filled, outlined, elevated, tonal, text
- `IconButton` -- standard, filled, tonal, outlined
- `ProgressBar` -- determinate/indeterminate
- `Surface` -- elevation levels
- `Appbar` -- top app bar with actions

### Components Requiring Custom Implementation

These M3E components have NO React Native library support. Build them manually following patterns in `docs/ANDROID_16_M3_EXPRESSIVE_RESEARCH.md`:

| Component | Reference Section |
|-----------|------------------|
| Floating Toolbar (docked/floating) | Section 3 |
| Split Button | Section 4 |
| Button Group (interactive width) | Section 4 |
| Loading Indicator (shape morph) | Section 7 |
| Wavy Progress Indicator | Section 7 |
| FAB Menu (M3E toggle style) | Section 6 |
| Navigation Rail | Section 2 |

---

## Theming Architecture

The centralized theme lives in `mobile/context/ThemeContext.tsx`. It provides:

- `useTheme()` -- full theme object with `colors`, `dark`, `paperTheme`
- `useThemeColors()` -- just the color palette
- `useIsDarkMode()` -- boolean dark mode check

**REQUIRED usage pattern:**

```tsx
// CORRECT - use the centralized theme
const { colors, dark } = useTheme();

// WRONG - reading colorScheme directly in a component
const colorScheme = useColorScheme();
const bg = colorScheme === 'dark' ? '#000' : '#FFF';
```

**Color role usage:**
- `primary` -- reserved for main CTA only (Send, Compose, primary FAB)
- `secondary` / `tertiary` -- everyday UI (chips, tags, filters)
- `surfaceContainer*` -- depth hierarchy (replaces shadow-based elevation)
- `outline` / `outlineVariant` -- borders and dividers

---

## Forms (REQUIRED Props)

| Field | REQUIRED Props |
|-------|---------------|
| Email | `keyboardType="email-address" autoComplete="email"` |
| Password | `secureTextEntry autoComplete="password"` |
| Phone | `keyboardType="phone-pad" autoComplete="tel"` |
| Name | `autoComplete="name" autoCapitalize="words"` |
| OTP | `keyboardType="number-pad" autoComplete="sms-otp"` |

Always set `importantForAutofill="yes"` on Android form fields.

---

## Pre-Completion Checklist

Before marking ANY Android task complete, verify:

- [ ] All colors come from `useTheme()` / `useThemeColors()` (no hardcoded hex)
- [ ] All animations use `withSpring` with M3 spring tokens (no `withTiming` for interactive transitions)
- [ ] All interactive elements have haptic feedback
- [ ] Edge-to-edge works (content behind system bars, insets applied correctly)
- [ ] Responsive layout handles 600dp+ displays
- [ ] Icons use MaterialIcons / MaterialCommunityIcons
- [ ] Native-backed components used (not JS approximations)
- [ ] `Platform.OS === 'android'` isolates all Android-only code
- [ ] iOS code is unchanged, Web code is untouched
- [ ] Accessibility: reduced motion respected, touch targets minimum 48x48dp

---

## Installed Packages

| Package | Purpose |
|---------|---------|
| `react-native-safe-area-context` | Edge-to-edge insets |
| `@expo/vector-icons` | Material Icons |
| `expo-haptics` | Haptic feedback |
| `expo-navigation-bar` | Navigation bar styling |
| `@gorhom/bottom-sheet` | Native bottom sheets |
| `react-native-paper` v5 | M3 components |
| `@pchmn/expo-material3-theme` | Dynamic Material You colors |
| `react-native-reanimated` | Spring animations |
| `react-native-gesture-handler` | Native gestures |

---

## Reference

- **Best code example:** `mobile/app/(tabs)/_layout.tsx`
- **Primary guidance:** `docs/ANDROID_16_NATIVE_UX_GUIDANCE.md`
- **Component patterns:** `docs/ANDROID_16_M3_EXPRESSIVE_RESEARCH.md`
- **Quick lookup:** `.cursor/skills/android-native-expert/android-components-reference.md`
- Material Design 3: https://m3.material.io/
- Material Icons: https://fonts.google.com/icons
- Android 16 Changes: https://developer.android.com/about/versions/16
- React Native Paper: https://callstack.github.io/react-native-paper/
