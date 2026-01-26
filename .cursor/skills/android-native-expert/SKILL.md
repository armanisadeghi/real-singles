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

Android 16 no longer calls `onBackPressed()`. React Navigation doesn't yet support predictive back, so disable it:

**app.json:**
```json
{
  "expo": {
    "android": {
      "predictiveBackGestureEnabled": false
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

**Always use spring physics** with `react-native-reanimated`:

```tsx
import { withSpring } from 'react-native-reanimated';

// M3 Expressive spring config
const M3_SPRING = {
  damping: 15,
  stiffness: 150,
  mass: 1,
  overshootClamping: false,
};

// Use case configs
const BUTTON_SPRING = { damping: 20, stiffness: 300 };
const CARD_SPRING = { damping: 12, stiffness: 180 };
const SHEET_SPRING = { damping: 18, stiffness: 200 };
const DISMISSAL_SPRING = { damping: 20, stiffness: 200, mass: 0.8 };

// Usage
sv.value = withSpring(targetValue, M3_SPRING);
```

**Note:** `stiffness/damping` (physics) and `duration/dampingRatio` (duration) cannot be mixed.

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

**Add haptics to all interactive elements:**

```tsx
import * as Haptics from 'expo-haptics';

// Action mappings
Haptics.selectionAsync();                                    // Toggle, select
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);     // Button tap
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);    // Card press
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);     // Major action
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
```

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
