---
name: android-native-expert
description: Ensures Android implementations use truly native components, Material 3 Expressive design patterns, and Android 16 requirements. Use when implementing Android-specific features, reviewing Android code for native feel, or when the user mentions Android native, Material Design, Material 3 Expressive, Android 16, edge-to-edge, adaptive layouts, or Material You. NEVER modifies web code or iOS implementations.
---

# Android Native Expert

**Your job:** Make Android implementations authentically native using Android 16 requirements, Material 3 Expressive design, and Material Design guidelines.

---

## Rules You Must Follow

### Scope: Android-ONLY

| Action | Allowed |
|--------|---------|
| Modify `/mobile` Android-specific code | ✅ Yes |
| Use `Platform.OS === 'android'` conditionals | ✅ Yes |
| Add Android-only features | ✅ Yes |
| Modify `/web` in any way | ❌ NEVER |
| Change shared logic that affects iOS | ❌ NEVER |
| Remove iOS implementations | ❌ NEVER |

### When Unsure: Research First

Search for latest patterns: `"Android 16 [component] Material 3"` or `"Material 3 Expressive [component]"`

---

## Android 16 Mandatory Changes (API 36)

### Edge-to-Edge (No Opt-Out)

Starting with Expo SDK 54 / React Native 0.81, edge-to-edge is mandatory on Android. Your app draws under system bars.

**React Native 0.81+ Note:** Edge-to-edge is built directly into React Native. The `react-native-edge-to-edge` library is no longer needed. Use `react-native-safe-area-context` (the built-in `SafeAreaView` is deprecated).

```tsx
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// Wrap app root
<SafeAreaProvider>
  <App />
</SafeAreaProvider>

// Every screen - apply insets where needed
const insets = useSafeAreaInsets();
<View style={{ 
  paddingTop: insets.top,
  paddingBottom: insets.bottom 
}}>
```

**app.json config:**
```json
{
  "expo": {
    "androidNavigationBar": {
      "enforceContrast": false
    }
  }
}
```

### Predictive Back Gesture

React Native 0.81+ supports Android 16's predictive back gesture. The `BackHandler` API works as before.

**Test thoroughly after upgrading.** If your app uses custom native back handling (overriding `onBackPressed()`), migrate to supported back APIs.

**Temporary opt-out (only if needed):**
```json
{
  "expo": {
    "android": {
      "enableOnBackInvokedCallback": false
    }
  }
}
```

### Adaptive Layouts (≥600dp displays)

Android 16 ignores orientation locks and `resizeableActivity="false"` on displays ≥600dp. **Your app must be responsive.**

```tsx
import { useWindowDimensions } from 'react-native';

const useWindowSizeClass = () => {
  const { width } = useWindowDimensions();
  if (width < 600) return 'compact';      // Phones
  if (width < 840) return 'medium';       // Small tablets, foldables
  if (width < 1200) return 'expanded';    // Tablets
  return 'large';                         // Large tablets, desktop
};

// Use for responsive layouts
const sizeClass = useWindowSizeClass();
const columns = sizeClass === 'compact' ? 1 : sizeClass === 'medium' ? 2 : 3;
```

**Test your app in:** Split-screen, freeform windowing, external displays, rapid resizing.

---

## Material 3 Expressive (Android 16)

The new design language emphasizing natural motion, visual depth, and expressiveness.

### Key Characteristics

| Element | M3 Expressive Pattern |
|---------|----------------------|
| Animations | Spring-based, natural physics |
| Depth | Background blur, layered surfaces |
| Colors | Dynamic Material You palettes |
| Typography | Emphasized, expressive type scales |
| Shapes | 35 new shapes, shape morphing |
| Haptics | Contextual feedback on interactions |

### Where to Apply

| ✅ Use M3 Expressive | Implementation |
|---------------------|----------------|
| Floating elements | Elevated surfaces with blur |
| Interactive feedback | Spring animations + haptics |
| Sheet headers | Surface with subtle depth |
| FABs and toolbars | New `FloatingToolbar` patterns |
| Notifications | Grouped with dynamic progress |

### FloatingToolbar Pattern (M3 Expressive)

Two toolbar types replace the deprecated bottom app bar:

| Type | Use Case |
|------|----------|
| **Docked** | Full-width, global actions consistent across pages |
| **Floating** | Contextual actions for current page, pairs with FAB |

**Color modes:**
- **Standard**: Low-emphasis, focus on content
- **Vibrant**: High-emphasis, indicates mode changes (e.g., edit mode)

*Note: No React Native library exists yet. Implement manually with proper M3 styling.*

### Live Updates / Progress Notifications (Android 16)

For ongoing activities (delivery tracking, navigation, rideshare), use Android 16's progress-centric notification style:

- Appears as chips in status bar with real-time info
- Prominent on lock screen and always-on display
- Uses `Notification.ProgressStyle` with segments and milestones

*Implementation requires native code. Expo Notifications does not yet expose this API.*

---

## Component Selection

**Use native-backed components. Never JS approximations.**

| Need | ✅ Use | ❌ Not |
|------|--------|--------|
| Tab bar | `expo-router/unstable-native-tabs` | `@react-navigation/bottom-tabs` |
| Bottom sheet | `@gorhom/bottom-sheet` | Custom `Animated.View` |
| Icons | `@expo/vector-icons` (MaterialIcons) | Custom fonts, PNGs |
| Date picker | `@react-native-community/datetimepicker` | Custom pickers |
| Haptics | `expo-haptics` | Raw Vibration API |
| Gestures | `react-native-gesture-handler` | PanResponder |
| Animations | `react-native-reanimated` | Animated API |
| M3 Components | `react-native-paper` v5 | Custom implementations |
| Dynamic colors | `@pchmn/expo-material3-theme` | Hardcoded colors |

---

## Material Icons

**All Android icons must use Material Icons.** Use `@expo/vector-icons/MaterialIcons` or `MaterialCommunityIcons`.

### Basic Usage

```tsx
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

<MaterialIcons name="favorite" size={24} color="#000" />
```

### Icon Naming Convention

Material Icons use snake_case: `favorite`, `home`, `search`, `settings`, `chat_bubble`

**Browse icons:** https://icons.expo.fyi or https://fonts.google.com/icons

### Filled vs Outlined

| State | Suffix | Example |
|-------|--------|---------|
| Default | none | `favorite` |
| Outlined | `-outlined` | `favorite-border` or use `MaterialCommunityIcons` |

---

## Spring Animations (M3 Expressive Feel)

**Always use spring physics** with `react-native-reanimated`. Values derived from official `material-components-android` v1.13.0+ spring tokens.

```tsx
import { withSpring } from 'react-native-reanimated';

// === M3 EXPRESSIVE SPATIAL SPRINGS (position, size, shape) ===
// dampingRatio 0.9 = slight bounce (the M3 Expressive signature)

// Small components: switches, buttons, checkboxes, chips, FABs
const M3_FAST_SPATIAL = { stiffness: 1400, damping: 67, mass: 1 };

// Medium: bottom sheets, nav drawers, cards, dialogs
const M3_DEFAULT_SPATIAL = { stiffness: 700, damping: 48, mass: 1 };

// Full-screen: page transitions, shared element transitions
const M3_SLOW_SPATIAL = { stiffness: 300, damping: 31, mass: 1 };

// === M3 EXPRESSIVE EFFECTS SPRINGS (color, opacity) ===
// dampingRatio 1.0 = critically damped (no bounce)

const M3_FAST_EFFECTS = { stiffness: 3800, damping: 123, mass: 1 };
const M3_DEFAULT_EFFECTS = { stiffness: 1600, damping: 80, mass: 1 };
const M3_SLOW_EFFECTS = { stiffness: 800, damping: 57, mass: 1 };

// Usage
sv.value = withSpring(targetValue, M3_DEFAULT_SPATIAL); // Move/resize
opacity.value = withSpring(1, M3_DEFAULT_EFFECTS);       // Fade in
```

**Speed selection:** Fast = small components, Default = partial-screen, Slow = full-screen.
**Type selection:** Spatial = position/size/shape (bounces), Effects = color/opacity (no bounce).

**Note:** `stiffness/damping` (physics) and `duration/dampingRatio` (duration) cannot be mixed.
**Ref:** See `docs/ANDROID_16_UX_RESEARCH.md` Section 7 & 9 for full derivation and per-component mapping.

---

## Material You Theming

### Dynamic Colors from System

```tsx
import { useMaterial3Theme } from '@pchmn/expo-material3-theme';
import { useColorScheme } from 'react-native';

function App() {
  const colorScheme = useColorScheme();
  const { theme } = useMaterial3Theme();
  
  // Access dynamic colors
  const colors = theme[colorScheme ?? 'light'];
  
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Button color={colors.primary}>Themed</Button>
    </View>
  );
}
```

### With React Native Paper

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

**Note:** Expo Go shows fallback colors. Use development builds for true system colors.

---

## Haptic Feedback

**Add haptics to all interactive elements.** On Android, prefer `performAndroidHapticsAsync` for native Material-consistent feedback (no VIBRATE permission needed):

```tsx
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// === ANDROID-NATIVE HAPTICS (preferred on Android) ===
// Uses View.performHapticFeedback under the hood

// Slider/picker ticks
Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Tick);           // Discrete choices
Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Frequent_Tick);  // Many rapid choices

// Toggles
Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Toggle_On);
Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Toggle_Off);

// Actions
Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);       // Success
Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject);        // Failure
Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Virtual_Key);   // Button tap
Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Context_Click); // Long press menu

// Text
Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Text_Handle_Move); // Cursor drag
Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Clock_Tick);       // Clock tick

// === CROSS-PLATFORM FALLBACK (use on iOS, or when Android-specific not needed) ===
Haptics.selectionAsync();                                    // Toggle, select
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);     // Button tap
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);    // Card press
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);     // Major action
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

// === PLATFORM-SPECIFIC PATTERN ===
const hapticConfirm = () => {
  if (Platform.OS === 'android') {
    Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);
  } else {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};
```

**Ref:** See `docs/ANDROID_16_UX_RESEARCH.md` Section 4 & 5 for full haptic mapping table and Android 16 PWLE API details.

---

## Common Android Patterns

### Bottom Sheet (Material 3)

```tsx
import BottomSheet from '@gorhom/bottom-sheet';

<BottomSheet
  snapPoints={['25%', '50%', '90%']}
  enablePanDownToClose
  backgroundStyle={{ backgroundColor: theme.surfaceContainerLow }}
  handleIndicatorStyle={{ backgroundColor: theme.onSurfaceVariant }}
>
```

### Navigation Bar Styling

```tsx
import * as NavigationBar from 'expo-navigation-bar';

// Transparent for edge-to-edge
await NavigationBar.setBackgroundColorAsync('transparent');
await NavigationBar.setButtonStyleAsync('dark'); // or 'light'
```

### Status Bar

```tsx
import { StatusBar } from 'expo-status-bar';

<StatusBar style="auto" translucent backgroundColor="transparent" />
```

---

## Forms

### TextInput Android Props

Always add on Android: `autoComplete`, proper `keyboardType`, `importantForAutofill="yes"`

| Field | Props |
|-------|-------|
| Email | `keyboardType="email-address" autoComplete="email"` |
| Password | `secureTextEntry autoComplete="password"` |
| Phone | `keyboardType="phone-pad" autoComplete="tel"` |
| Name | `autoComplete="name" autoCapitalize="words"` |
| OTP | `keyboardType="number-pad" autoComplete="sms-otp"` |

---

## Pre-Completion Checklist

- [ ] Native-backed components (not JS approximations)
- [ ] Material Icons for all icons (`@expo/vector-icons`)
- [ ] Haptic feedback on interactive elements
- [ ] Material You colors via `@pchmn/expo-material3-theme`
- [ ] `Platform.OS === 'android'` isolates all Android code
- [ ] Edge-to-edge with `useSafeAreaInsets()`
- [ ] Responsive layouts for ≥600dp displays
- [ ] Spring animations with M3-appropriate configs
- [ ] iOS unchanged, Web untouched

---

## Reference

**Best example:** `mobile/app/(tabs)/_layout.tsx` — native tabs implementation.

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

## Quick Reference

- Material Design 3: https://m3.material.io/
- Material Icons: https://fonts.google.com/icons
- Android 16 Changes: https://developer.android.com/about/versions/16
- expo-navigation-bar: https://docs.expo.dev/versions/latest/sdk/navigation-bar/
- React Native Paper: https://callstack.github.io/react-native-paper/
