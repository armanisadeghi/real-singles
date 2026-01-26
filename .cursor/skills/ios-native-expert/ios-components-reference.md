# iOS Native Components Quick Reference

**Quick lookups for iOS 26 development.** All packages pre-installed.

---

## SF Symbols 7 (6,900+ symbols)

| Purpose | Symbol | Filled |
|---------|--------|--------|
| Home | `house` | `house.fill` |
| Search | `magnifyingglass` | - |
| Heart/Like | `heart` | `heart.fill` |
| Chat | `bubble.left` | `bubble.left.fill` |
| Profile | `person` | `person.fill` |
| Settings | `gearshape` | `gearshape.fill` |
| Camera | `camera` | `camera.fill` |
| Photo | `photo` | `photo.fill` |
| Location | `location` | `location.fill` |
| Star | `star` | `star.fill` |
| Bell | `bell` | `bell.fill` |
| Calendar | `calendar` | - |
| Clock | `clock` | `clock.fill` |
| Share | `square.and.arrow.up` | - |
| More | `ellipsis` | `ellipsis.circle.fill` |
| Close | `xmark` | `xmark.circle.fill` |
| Back/Forward | `chevron.left` / `chevron.right` | - |
| Check | `checkmark` | `checkmark.circle.fill` |
| Add | `plus` | `plus.circle.fill` |
| Edit | `pencil` | `square.and.pencil` |
| Delete | `trash` | `trash.fill` |
| Filter | `line.3.horizontal.decrease` | `line.3.horizontal.decrease.circle.fill` |
| Video | `video` | `video.fill` |
| Phone | `phone` | `phone.fill` |
| Block | `hand.raised` | `hand.raised.fill` |
| Report | `exclamationmark.triangle` | `exclamationmark.triangle.fill` |
| AI/Sparkle | `sparkles` | - |
| Premium | `crown` | `crown.fill` |

---

## Symbol Animations (expo-symbols)

| Type | Use For | Example |
|------|---------|---------|
| `bounce` | Attention, feedback | Like tap |
| `pulse` | Loading, progress | Audio levels |
| `scale` | Emphasis | Selection |

**Basic:** `animationSpec={{ effect: { type: 'bounce', wholeSymbol: true }, repeating: false }}`

**Variable (progress):** Add `variableAnimationSpec: { cumulative: true, dimInactiveLayers: true }`

### SF Symbols 7 Features (iOS 26)

| Feature | Status in expo-symbols |
|---------|------------------------|
| Bounce/Pulse/Scale | ✅ Supported |
| Draw animations | ❌ Not yet (native SwiftUI only) |
| Gradients | ❌ Not yet |
| Magic Replace | ❌ Not yet |

---

## System Colors (PlatformColor)

| Color | Use |
|-------|-----|
| `systemBackground` | Primary background |
| `secondarySystemBackground` | Cards |
| `label` | Primary text |
| `secondaryLabel` | Secondary text |
| `systemBlue` | Primary action |
| `systemRed` | Destructive |
| `systemGreen` | Success |
| `systemPink` | Dating accent |
| `separator` | Dividers |

---

## Haptics (expo-haptics)

| Action | Code |
|--------|------|
| Toggle | `selectionAsync()` |
| Button tap | `impactAsync(ImpactFeedbackStyle.Light)` |
| Card press | `impactAsync(ImpactFeedbackStyle.Medium)` |
| Success | `notificationAsync(NotificationFeedbackType.Success)` |
| Error | `notificationAsync(NotificationFeedbackType.Error)` |

---

## Native Library Selection

| Need | Use |
|------|-----|
| Tab Bar | `expo-router/unstable-native-tabs` |
| Liquid Glass | `expo-glass-effect` |
| Bottom Sheet | `@gorhom/bottom-sheet` |
| Icons | `expo-symbols` |
| Date Picker | `@react-native-community/datetimepicker` |
| Blur | `expo-blur` |
| Haptics | `expo-haptics` |
| Segmented Control | `@react-native-segmented-control/segmented-control` |
| Action Sheet | `ActionSheetIOS` (built-in) |
| Context Menu | `react-native-ios-context-menu` |

---

## Liquid Glass (expo-glass-effect)

### Props

| Prop | Type | Default |
|------|------|---------|
| `glassEffectStyle` | `'regular'` \| `'clear'` | `'regular'` |
| `isInteractive` | `boolean` | `false` |
| `tintColor` | `string` | - |
| `spacing` (GlassContainer) | `number` | - |

### Availability Check (REQUIRED)

```tsx
import { isLiquidGlassAvailable, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { AccessibilityInfo } from 'react-native';

// Full check (prevents crashes on iOS 26 betas)
const hasGlass = Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

// Respect accessibility (optional but recommended)
const [reduceTransparency, setReduceTransparency] = useState(false);
AccessibilityInfo.isReduceTransparencyEnabled().then(setReduceTransparency);
const showGlass = hasGlass && !reduceTransparency;
```

### Rules

- `isInteractive` immutable on mount (use `key` prop to remount)
- Never `opacity < 1` on GlassView or parents
- ONLY for navigation/floating elements

---

## Spring Presets (react-native-reanimated)

| Use | Config |
|-----|--------|
| Button feedback | `{ damping: 20, stiffness: 300 }` |
| Card expand | `{ damping: 12, stiffness: 180 }` |
| Page transition | `{ damping: 18, stiffness: 120 }` |
| Default | `{ damping: 15, stiffness: 150 }` |

---

## Form Field Props (iOS)

| Field | Props |
|-------|-------|
| Email | `keyboardType="email-address" textContentType="emailAddress"` |
| Password | `secureTextEntry textContentType="password"` |
| Phone | `keyboardType="phone-pad" textContentType="telephoneNumber"` |
| Name | `textContentType="name" autoCapitalize="words"` |
| OTP | `keyboardType="number-pad" textContentType="oneTimeCode"` |

Always add: `clearButtonMode="while-editing"` `enablesReturnKeyAutomatically`

---

## Sizing (HIG-compliant)

| Element | Size |
|---------|------|
| Standard margin | 16pt |
| Button height | 44-50pt |
| Button radius | 12pt |
| Card radius | 16-20pt |
| Liquid Glass radius | 20-24pt |
| Touch target min | 44x44pt |
| Tab bar icon | 24-28pt |
| Inline icon | 20-24pt |
| Liquid Glass FAB | 56x56pt |

---

## Liquid Glass: Where to Use

| ✅ Use | ❌ Never |
|--------|----------|
| Tab bars (automatic) | List cells |
| Toolbars | Card backgrounds |
| Navigation bars (automatic) | Page content |
| Floating action buttons | Media |
| Sheet headers | Text containers |

---

## Imports

```tsx
import { SymbolView } from 'expo-symbols';
import { GlassView, GlassContainer, isLiquidGlassAvailable, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { Platform, PlatformColor, AccessibilityInfo } from 'react-native';
```

---

## Links

- SF Symbols 7: https://developer.apple.com/sf-symbols/
- expo-glass-effect: https://docs.expo.dev/versions/latest/sdk/glass-effect/
- expo-symbols: https://docs.expo.dev/versions/latest/sdk/symbols/
- Apple HIG: https://developer.apple.com/design/human-interface-guidelines/
- WWDC 2025 Design: https://developer.apple.com/videos/play/wwdc2025/356
