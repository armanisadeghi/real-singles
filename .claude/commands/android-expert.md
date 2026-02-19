Android native implementation expert for Material 3 Expressive, Android 16, and edge-to-edge.

Task: $ARGUMENTS

## Scope: Android-ONLY

| Action | Allowed |
|--------|---------|
| Modify `/mobile` Android-specific code | YES |
| Use `Platform.OS === 'android'` conditionals | YES |
| Modify `/web` in any way | NEVER |
| Change shared logic that affects iOS | NEVER |

## Android 16 Mandatory Requirements

### Edge-to-Edge (No Opt-Out)

Use `useSafeAreaInsets()` from `react-native-safe-area-context`. Content MUST draw behind system bars. Scrollable content uses `contentContainerStyle` padding. Modals set `statusBarTranslucent={true}` and `navigationBarTranslucent={true}`.

### Adaptive Layouts (600dp+)

```tsx
function useWindowSizeClass() {
  const { width } = useWindowDimensions();
  if (width < 600) return 'compact';
  if (width < 840) return 'medium';
  if (width < 1200) return 'expanded';
  return 'large';
}
```

## Spring-Based Motion (MANDATORY)

All animations MUST use spring physics via `withSpring`. `withTiming` only for looping animations.

| Token | Config | Use For |
|-------|--------|---------|
| Fast Spatial | `{ stiffness: 1400, damping: 67, mass: 1 }` | Buttons, switches, checkboxes, chips, FABs |
| Default Spatial | `{ stiffness: 700, damping: 48, mass: 1 }` | Bottom sheets, nav drawers, cards, dialogs |
| Slow Spatial | `{ stiffness: 300, damping: 31, mass: 1 }` | Full-screen transitions, page changes |
| Fast Effects | `{ stiffness: 3800, damping: 123, mass: 1 }` | Small color/opacity changes |
| Default Effects | `{ stiffness: 1600, damping: 80, mass: 1 }` | Medium color/opacity |
| Slow Effects | `{ stiffness: 800, damping: 57, mass: 1 }` | Full-screen color/opacity |

## Dynamic Material You Colors (REQUIRED)

```tsx
const { colors } = useTheme();
<View style={{ backgroundColor: colors.surface }} />
// NEVER: <View style={{ backgroundColor: '#FFFFFF' }} />
```

## Haptic Feedback (REQUIRED)

| Interaction | Android Haptic |
|-------------|---------------|
| Button tap | `AndroidHaptics.Virtual_Key` |
| Toggle on/off | `AndroidHaptics.Toggle_On` / `Toggle_Off` |
| Success/Error | `AndroidHaptics.Confirm` / `Reject` |
| Long press | `AndroidHaptics.Context_Click` |

## Component Selection

| Need | REQUIRED | FORBIDDEN |
|------|----------|-----------|
| Tab bar | `expo-router/unstable-native-tabs` | `@react-navigation/bottom-tabs` |
| Bottom sheet | `@gorhom/bottom-sheet` | Custom `Animated.View` |
| Icons | `@expo/vector-icons` (MaterialIcons) | Custom fonts, PNGs |
| Haptics | `expo-haptics` | Raw Vibration API |
| Animations | `react-native-reanimated` | Animated API |
| M3 Components | `react-native-paper` v5 | Custom from scratch |

## Shape Tokens

| Component | Radius |
|-----------|--------|
| Button | 20 |
| FAB | 16 (regular), 28 (large) |
| Card | 12 |
| Dialog / Bottom sheet / Search bar | 28 |
| Chip | 8 |

## Forms (REQUIRED Props)

| Field | Props |
|-------|-------|
| Email | `keyboardType="email-address" autoComplete="email"` |
| Password | `secureTextEntry autoComplete="password"` |
| Phone | `keyboardType="phone-pad" autoComplete="tel"` |
| Name | `autoComplete="name" autoCapitalize="words"` |
| OTP | `keyboardType="number-pad" autoComplete="sms-otp"` |

Always set `importantForAutofill="yes"` on Android form fields.

## Pre-Completion Checklist

- [ ] All colors from `useTheme()` (no hardcoded hex)
- [ ] All animations use `withSpring` with M3 spring tokens
- [ ] All interactive elements have haptic feedback
- [ ] Edge-to-edge works (insets applied correctly)
- [ ] Responsive layout handles 600dp+
- [ ] Icons use MaterialIcons / MaterialCommunityIcons
- [ ] `Platform.OS === 'android'` isolates Android-only code
- [ ] iOS/Web code unchanged

## Reference

- Theme: `mobile/context/ThemeContext.tsx`
- Best example: `mobile/app/(tabs)/_layout.tsx`
- Guidance: `docs/ANDROID_16_NATIVE_UX_GUIDANCE.md`
- Components: `docs/ANDROID_16_M3_EXPRESSIVE_RESEARCH.md`
