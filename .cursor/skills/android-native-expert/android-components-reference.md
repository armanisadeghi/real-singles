# Android Native Components Quick Reference

**Quick lookups for Android 16 / Material 3 Expressive development.** All packages pre-installed.

For detailed implementation patterns and code examples, see `docs/ANDROID_16_M3_EXPRESSIVE_RESEARCH.md`.
For architectural decisions and rationale, see `docs/ANDROID_16_NATIVE_UX_GUIDANCE.md`.

---

## Material Icons (2,500+ icons)

| Purpose | Icon | Outlined |
|---------|------|----------|
| Home | `home` | `home-outline` (MCI) |
| Search | `search` | - |
| Heart/Like | `favorite` | `favorite-border` |
| Chat | `chat-bubble` | `chat-bubble-outline` |
| Profile | `person` | `person-outline` |
| Settings | `settings` | `settings-outline` (MCI) |
| Camera | `camera-alt` | `camera-alt-outline` (MCI) |
| Photo | `photo` | `photo-outlined` (MCI) |
| Location | `location-on` | `location-on-outlined` (MCI) |
| Star | `star` | `star-border` |
| Bell | `notifications` | `notifications-none` |
| Calendar | `event` | `event-outlined` (MCI) |
| Clock | `access-time` | - |
| Share | `share` | - |
| More | `more-vert` | `more-horiz` |
| Close | `close` | - |
| Back/Forward | `arrow-back` / `arrow-forward` | - |
| Check | `check` | `check-circle` / `check-circle-outline` |
| Add | `add` | `add-circle` / `add-circle-outline` |
| Edit | `edit` | `mode-edit` |
| Delete | `delete` | `delete-outline` |
| Filter | `filter-list` | `filter-alt` |
| Video | `videocam` | `videocam-outlined` (MCI) |
| Phone | `phone` | `phone-outlined` (MCI) |
| Block | `block` | - |
| Report | `report` | `report-outlined` (MCI) |
| AI/Sparkle | `auto-awesome` | - |
| Premium | `workspace-premium` | - |

**MCI** = Use `MaterialCommunityIcons` for these.

```tsx
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
<MaterialIcons name="favorite" size={24} color={colors.primary} />

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
<MaterialCommunityIcons name="heart-outline" size={24} color={colors.primary} />
```

**Browse:** https://icons.expo.fyi

---

## Material You Color Roles

| Role | Use |
|------|-----|
| `primary` | Main CTA only: Send, Compose, primary FAB |
| `onPrimary` | Text/icon on primary |
| `primaryContainer` | Filled chips, selected states |
| `onPrimaryContainer` | Text on primaryContainer |
| `secondary` | Secondary actions, filters, tags |
| `onSecondary` | Text on secondary |
| `secondaryContainer` | Toggle backgrounds, selected tabs |
| `tertiary` | Accent elements, complementary actions |
| `tertiaryContainer` | Accent backgrounds |
| `surface` | Default background for cards, sheets |
| `onSurface` | Primary text color |
| `onSurfaceVariant` | Secondary text, icons |
| `surfaceContainerLowest` | Lowest elevation background |
| `surfaceContainerLow` | Low elevation (bottom sheet bg) |
| `surfaceContainer` | Medium elevation |
| `surfaceContainerHigh` | High elevation (modal bg) |
| `surfaceContainerHighest` | Highest elevation |
| `outline` | Borders, dividers |
| `outlineVariant` | Subtle borders |
| `error` | Error states |
| `inverseSurface` | Snackbar background |
| `inversePrimary` | CTA on inverse surface |

**Deprecated roles:** `background` (use `surface`), `surfaceVariant` (use `surfaceContainerHighest`).

**Access via:**
```tsx
const { colors } = useTheme(); // from mobile/context/ThemeContext
// colors.primary, colors.surface, colors.onSurface, etc.
```

---

## Haptics (expo-haptics)

### Android-Native (REQUIRED on Android)

Uses `performAndroidHapticsAsync` — no VIBRATE permission needed.

| Action | Code |
|--------|------|
| Button tap | `performAndroidHapticsAsync(AndroidHaptics.Virtual_Key)` |
| Toggle on | `performAndroidHapticsAsync(AndroidHaptics.Toggle_On)` |
| Toggle off | `performAndroidHapticsAsync(AndroidHaptics.Toggle_Off)` |
| Success | `performAndroidHapticsAsync(AndroidHaptics.Confirm)` |
| Error/Reject | `performAndroidHapticsAsync(AndroidHaptics.Reject)` |
| Slider tick | `performAndroidHapticsAsync(AndroidHaptics.Segment_Tick)` |
| Rapid slider | `performAndroidHapticsAsync(AndroidHaptics.Segment_Frequent_Tick)` |
| Long press | `performAndroidHapticsAsync(AndroidHaptics.Context_Click)` |
| Text cursor | `performAndroidHapticsAsync(AndroidHaptics.Text_Handle_Move)` |
| Clock tick | `performAndroidHapticsAsync(AndroidHaptics.Clock_Tick)` |

### Cross-Platform Fallback (for iOS)

| Action | Code |
|--------|------|
| Toggle | `selectionAsync()` |
| Button tap | `impactAsync(ImpactFeedbackStyle.Light)` |
| Card press | `impactAsync(ImpactFeedbackStyle.Medium)` |
| Major action | `impactAsync(ImpactFeedbackStyle.Heavy)` |
| Success | `notificationAsync(NotificationFeedbackType.Success)` |
| Error | `notificationAsync(NotificationFeedbackType.Error)` |

### Platform Pattern

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

---

## Spring Tokens (react-native-reanimated)

### M3 Expressive Spring Configs (REQUIRED)

Source: `material-components-android` v1.13.0+ Motion.md

| Token | Config | Use Case |
|-------|--------|----------|
| Fast Spatial | `{ stiffness: 1400, damping: 67, mass: 1 }` | Switches, buttons, chips, FABs, checkboxes |
| Default Spatial | `{ stiffness: 700, damping: 48, mass: 1 }` | Bottom sheets, drawers, cards, dialogs |
| Slow Spatial | `{ stiffness: 300, damping: 31, mass: 1 }` | Full-screen, page transitions |
| Fast Effects | `{ stiffness: 3800, damping: 123, mass: 1 }` | Small color/opacity |
| Default Effects | `{ stiffness: 1600, damping: 80, mass: 1 }` | Medium color/opacity |
| Slow Effects | `{ stiffness: 800, damping: 57, mass: 1 }` | Full-screen color/opacity |

**Spatial** = position/size/shape (bounces). **Effects** = color/opacity (no bounce).
**Fast** = small. **Default** = medium. **Slow** = full-screen.

### Per-Component Mapping

| Component | Spring Token |
|-----------|-------------|
| Button press scale | Fast Spatial |
| Switch toggle | Fast Spatial |
| Checkbox check | Fast Spatial |
| Chip select | Fast Spatial |
| FAB press | Fast Spatial |
| Card expand | Default Spatial |
| Bottom sheet open/close | Default Spatial |
| Nav drawer open/close | Default Spatial |
| Dialog appear/dismiss | Default Spatial |
| Sidebar menu slide | Default Spatial |
| Page transition | Slow Spatial |
| Shared element transition | Slow Spatial |
| Button color change | Fast Effects |
| Card highlight | Default Effects |
| Screen fade | Slow Effects |

### Expressive Overrides (More Bounce)

For hero moments or playful interactions:

| Token | Config | Damping Ratio |
|-------|--------|--------------|
| Expressive Fast | `{ stiffness: 800, damping: 34, mass: 1 }` | 0.6 |
| Expressive Default | `{ stiffness: 380, damping: 31, mass: 1 }` | 0.8 |
| Expressive Slow | `{ stiffness: 200, damping: 23, mass: 1 }` | 0.8 |

### Usage

```tsx
import { withSpring } from 'react-native-reanimated';

// Move/resize a medium component
sv.value = withSpring(targetValue, { stiffness: 700, damping: 48, mass: 1 });

// Fade in (color/opacity)
opacity.value = withSpring(1, { stiffness: 1600, damping: 80, mass: 1 });
```

**NEVER mix** `stiffness/damping` (physics) with `duration/dampingRatio` (duration mode).

---

## Shape Tokens (M3 Expressive)

| Shape | Radius | Components |
|-------|--------|-----------|
| None | 0 | - |
| Extra Small | 4 | Small badges |
| Small | 8 | Chips |
| Medium | 12 | Cards, menu items |
| Large | 16 | FAB (regular) |
| Extra Large | 28 | FAB (large), dialog, sheet, toolbar, search bar |
| Full | 9999 | Navigation indicator, pills |

---

## Sizing (Material Design)

| Element | Size |
|---------|------|
| Standard margin | 16dp |
| Button height | 40-56dp |
| Button radius | 20dp (full) or 12dp |
| Card radius | 12-16dp |
| FAB size | 56dp (regular), 96dp (large) |
| Touch target min | 48x48dp |
| Bottom nav icon | 24dp |
| Inline icon | 20-24dp |
| Extended FAB height | 56dp |
| Bottom nav height | ~56dp (M3E reduced from 80dp) |
| Floating toolbar radius | 28dp (pill) |

---

## Window Size Classes

| Class | Width | Device | Navigation |
|-------|-------|--------|-----------|
| Compact | < 600dp | Phones | Bottom Nav Bar |
| Medium | 600-840dp | Foldables | Bottom Nav (horizontal items) |
| Expanded | 840-1200dp | Tablets | Navigation Rail |
| Large | 1200-1600dp | Large tablets | Navigation Rail |
| Extra-Large | >= 1600dp | Desktop | Navigation Rail |

```tsx
import { useWindowDimensions } from 'react-native';

function useWindowSizeClass() {
  const { width } = useWindowDimensions();
  if (width < 600) return 'compact';
  if (width < 840) return 'medium';
  if (width < 1200) return 'expanded';
  if (width < 1600) return 'large';
  return 'extraLarge';
}
```

---

## Native Library Selection

| Need | Use | NOT |
|------|-----|-----|
| Tab Bar | `expo-router/unstable-native-tabs` | `@react-navigation/bottom-tabs` |
| Bottom Sheet | `@gorhom/bottom-sheet` | Custom Animated.View |
| Icons | `@expo/vector-icons` (MaterialIcons) | Custom fonts, PNGs |
| Date Picker | `@react-native-community/datetimepicker` | Custom pickers |
| Haptics | `expo-haptics` | Raw Vibration API |
| M3 Components | `react-native-paper` v5 | Custom from scratch |
| Dynamic Colors | `@pchmn/expo-material3-theme` | Hardcoded values |
| Gestures | `react-native-gesture-handler` | PanResponder |
| Animations | `react-native-reanimated` | Animated API |

---

## Form Field Props (Android)

| Field | Props |
|-------|-------|
| Email | `keyboardType="email-address" autoComplete="email"` |
| Password | `secureTextEntry autoComplete="password"` |
| Phone | `keyboardType="phone-pad" autoComplete="tel"` |
| Name | `autoComplete="name" autoCapitalize="words"` |
| OTP | `keyboardType="number-pad" autoComplete="sms-otp"` |

Always set `importantForAutofill="yes"` on Android.

---

## Edge-to-Edge Setup

```tsx
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// Root
<SafeAreaProvider><App /></SafeAreaProvider>

// Screens
const insets = useSafeAreaInsets();
<View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
```

**NEVER** use `SafeAreaView` from `react-native` (deprecated in RN 0.81).

---

## Bottom Sheet Config

```tsx
import BottomSheet from '@gorhom/bottom-sheet';

<BottomSheet
  snapPoints={['25%', '50%', '90%']}
  index={-1}
  enablePanDownToClose
  enableDynamicSizing={false}
  backgroundStyle={{ backgroundColor: colors.surfaceContainerLow }}
  handleIndicatorStyle={{
    backgroundColor: colors.onSurfaceVariant,
    width: 32,
    height: 4
  }}
>
```

---

## Imports Cheat Sheet

```tsx
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import * as NavigationBar from 'expo-navigation-bar';
import { useMaterial3Theme } from '@pchmn/expo-material3-theme';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, useWindowDimensions, useColorScheme } from 'react-native';
import { withSpring } from 'react-native-reanimated';
import { useTheme, useThemeColors, useIsDarkMode } from '@/context/ThemeContext';
```

---

## Links

- Material Design 3: https://m3.material.io/
- Material Icons: https://fonts.google.com/icons
- Expo Vector Icons: https://icons.expo.fyi
- Android 16 Changes: https://developer.android.com/about/versions/16
- React Native Paper: https://callstack.github.io/react-native-paper/
- expo-material3-theme: https://github.com/pchmn/expo-material3-theme
- Reanimated withSpring: https://docs.swmansion.com/react-native-reanimated/docs/animations/withSpring/
