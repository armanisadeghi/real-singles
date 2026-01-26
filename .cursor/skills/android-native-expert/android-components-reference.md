# Android Native Components Quick Reference

**Quick lookups for Android 16 / Material 3 Expressive development.** All packages pre-installed.

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

---

## Icon Usage

```tsx
// Primary set
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
<MaterialIcons name="favorite" size={24} color={theme.primary} />

// Extended set (more outlined variants)
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
<MaterialCommunityIcons name="heart-outline" size={24} color={theme.primary} />
```

**Browse:** https://icons.expo.fyi

---

## Material You Colors

| Color | Use |
|-------|-----|
| `primary` | Primary actions, FABs |
| `onPrimary` | Text on primary |
| `primaryContainer` | Filled buttons, chips |
| `secondary` | Secondary actions |
| `tertiary` | Accent elements |
| `surface` | Cards, sheets |
| `surfaceContainerLow` | Elevated surfaces |
| `surfaceContainerHigh` | Modal backgrounds |
| `background` | Page background |
| `onSurface` | Primary text |
| `onSurfaceVariant` | Secondary text |
| `outline` | Borders |
| `outlineVariant` | Subtle borders |
| `error` | Error states |

---

## Haptics (expo-haptics)

| Action | Code |
|--------|------|
| Toggle | `selectionAsync()` |
| Button tap | `impactAsync(ImpactFeedbackStyle.Light)` |
| Card press | `impactAsync(ImpactFeedbackStyle.Medium)` |
| Major action | `impactAsync(ImpactFeedbackStyle.Heavy)` |
| Success | `notificationAsync(NotificationFeedbackType.Success)` |
| Error | `notificationAsync(NotificationFeedbackType.Error)` |
| Warning | `notificationAsync(NotificationFeedbackType.Warning)` |

---

## Native Library Selection

| Need | Use |
|------|-----|
| Tab Bar | `expo-router/unstable-native-tabs` |
| Bottom Sheet | `@gorhom/bottom-sheet` |
| Icons | `@expo/vector-icons` (MaterialIcons/MaterialCommunityIcons) |
| Date Picker | `@react-native-community/datetimepicker` |
| Haptics | `expo-haptics` |
| M3 Components | `react-native-paper` v5 |
| Dynamic Colors | `@pchmn/expo-material3-theme` |
| Navigation Bar | `expo-navigation-bar` |
| Status Bar | `expo-status-bar` |

---

## Spring Presets (react-native-reanimated)

| Use | Config |
|-----|--------|
| Button feedback | `{ damping: 20, stiffness: 300 }` |
| Card expand | `{ damping: 12, stiffness: 180 }` |
| Sheet animation | `{ damping: 18, stiffness: 200 }` |
| Dismissal | `{ damping: 20, stiffness: 200, mass: 0.8 }` |
| Default M3 | `{ damping: 15, stiffness: 150, mass: 1 }` |

---

## Form Field Props (Android)

| Field | Props |
|-------|-------|
| Email | `keyboardType="email-address" autoComplete="email"` |
| Password | `secureTextEntry autoComplete="password"` |
| Phone | `keyboardType="phone-pad" autoComplete="tel"` |
| Name | `autoComplete="name" autoCapitalize="words"` |
| OTP | `keyboardType="number-pad" autoComplete="sms-otp"` |

---

## Window Size Classes

| Class | Width | Typical Device |
|-------|-------|----------------|
| Compact | < 600dp | Phones |
| Medium | 600-840dp | Small tablets, foldables |
| Expanded | 840-1200dp | Tablets |
| Large | 1200-1600dp | Large tablets |
| Extra-Large | ≥1600dp | Desktop, external displays |

```tsx
const useWindowSizeClass = () => {
  const { width } = useWindowDimensions();
  if (width < 600) return 'compact';
  if (width < 840) return 'medium';
  if (width < 1200) return 'expanded';
  if (width < 1600) return 'large';
  return 'extraLarge';
};
```

---

## Sizing (Material Design)

| Element | Size |
|---------|------|
| Standard margin | 16dp |
| Button height | 40-56dp |
| Button radius | 20dp (full) or 12dp |
| Card radius | 12-16dp |
| FAB size | 56dp (regular), 40dp (small), 96dp (large) |
| Touch target min | 48x48dp |
| Bottom nav icon | 24dp |
| Inline icon | 20-24dp |
| Extended FAB height | 56dp |

---

## Edge-to-Edge Setup

```tsx
// App root
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

<SafeAreaProvider>
  <App />
</SafeAreaProvider>

// In screens
const insets = useSafeAreaInsets();
<View style={{ 
  paddingTop: insets.top, 
  paddingBottom: insets.bottom 
}}>
```

**app.json:**
```json
{
  "expo": {
    "androidNavigationBar": { "enforceContrast": false }
  }
}
```

**Important:** React Native's built-in `SafeAreaView` is deprecated as of RN 0.81. Always use `react-native-safe-area-context` instead.

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

## Navigation Bar (expo-navigation-bar)

```tsx
import * as NavigationBar from 'expo-navigation-bar';

// Transparent for edge-to-edge
NavigationBar.setBackgroundColorAsync('transparent');
NavigationBar.setButtonStyleAsync('dark'); // or 'light'
NavigationBar.setPositionAsync('absolute'); // draws under content
```

---

## Imports

```tsx
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { useMaterial3Theme } from '@pchmn/expo-material3-theme';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, useWindowDimensions, useColorScheme } from 'react-native';
import { withSpring } from 'react-native-reanimated';
```

---

## Links

- Material Design 3: https://m3.material.io/
- Material Icons: https://fonts.google.com/icons
- Expo Vector Icons Browser: https://icons.expo.fyi
- Android 16 Changes: https://developer.android.com/about/versions/16
- React Native Paper: https://callstack.github.io/react-native-paper/
- expo-material3-theme: https://github.com/pchmn/expo-material3-theme
