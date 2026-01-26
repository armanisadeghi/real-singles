# iOS Native Components Quick Reference

Quick lookup for native iOS component implementations in React Native/Expo.

---

## SF Symbols Cheat Sheet

Common symbols used in dating/social apps:

| Purpose | Symbol Name | Filled Variant |
|---------|-------------|----------------|
| Home | `house` | `house.fill` |
| Search | `magnifyingglass` | - |
| Heart/Like | `heart` | `heart.fill` |
| Chat | `bubble.left` | `bubble.left.fill` |
| Chat (dual) | `bubble.left.and.bubble.right` | `bubble.left.and.bubble.right.fill` |
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
| Back | `chevron.left` | - |
| Forward | `chevron.right` | - |
| Check | `checkmark` | `checkmark.circle.fill` |
| Add | `plus` | `plus.circle.fill` |
| Edit | `pencil` | `square.and.pencil` |
| Delete | `trash` | `trash.fill` |
| Filter | `line.3.horizontal.decrease` | `line.3.horizontal.decrease.circle.fill` |
| Video | `video` | `video.fill` |
| Phone | `phone` | `phone.fill` |
| Block | `hand.raised` | `hand.raised.fill` |
| Report | `exclamationmark.triangle` | `exclamationmark.triangle.fill` |

---

## System Colors (PlatformColor)

| Color Name | Use Case |
|------------|----------|
| `systemBackground` | Primary background |
| `secondarySystemBackground` | Cards, grouped content |
| `tertiarySystemBackground` | Nested groups |
| `label` | Primary text |
| `secondaryLabel` | Secondary text |
| `tertiaryLabel` | Placeholder text |
| `systemBlue` | Primary action, links |
| `systemRed` | Destructive, errors |
| `systemGreen` | Success, online |
| `systemOrange` | Warnings |
| `systemPink` | Dating app accent |
| `systemGray` | Disabled states |
| `separator` | Divider lines |

---

## Haptic Patterns

| User Action | Haptic Type | Code |
|-------------|-------------|------|
| Toggle switch | Selection | `Haptics.selectionAsync()` |
| Button tap | Light Impact | `Haptics.impactAsync(Light)` |
| Card press | Medium Impact | `Haptics.impactAsync(Medium)` |
| Drag threshold | Heavy Impact | `Haptics.impactAsync(Heavy)` |
| Success | Success Notification | `Haptics.notificationAsync(Success)` |
| Error | Error Notification | `Haptics.notificationAsync(Error)` |
| Warning | Warning Notification | `Haptics.notificationAsync(Warning)` |

---

## Library Matrix

| Feature | Native Library | Fallback | Notes |
|---------|---------------|----------|-------|
| Tab Bar | `expo-router/unstable-native-tabs` | - | Actual UITabBarController |
| Bottom Sheet | `@gorhom/bottom-sheet` | - | Native gesture driver |
| Icons | `expo-symbols` | PNG per icon | SF Symbols |
| Date Picker | `@react-native-community/datetimepicker` | - | Native UIDatePicker |
| Slider | `@react-native-community/slider` | - | Native UISlider |
| Switch | React Native `Switch` | - | Native UISwitch |
| Blur | `expo-blur` | - | Native UIVisualEffectView |
| Haptics | `expo-haptics` | - | Native UIFeedbackGenerator |
| Segmented | `@react-native-segmented-control/segmented-control` | Custom | Native UISegmentedControl |
| Action Sheet | `ActionSheetIOS` (RN core) | Custom modal | Native UIAlertController |
| Context Menu | `react-native-ios-context-menu` | Long press menu | Native UIContextMenuInteraction |
| Share | `react-native-share` or `expo-sharing` | - | Native UIActivityViewController |

---

## Spring Animation Presets

```tsx
// Snappy (button feedback)
{ damping: 20, stiffness: 300 }

// Bouncy (card expand)
{ damping: 12, stiffness: 180 }

// Gentle (page transitions)
{ damping: 18, stiffness: 120 }

// iOS default-like
{ damping: 15, stiffness: 150 }
```

---

## iOS Form Field Patterns

| Field Type | iOS Pattern |
|------------|------------|
| Email | `keyboardType="email-address"` + `textContentType="emailAddress"` |
| Password | `secureTextEntry` + `textContentType="password"` |
| New Password | `secureTextEntry` + `textContentType="newPassword"` |
| Phone | `keyboardType="phone-pad"` + `textContentType="telephoneNumber"` |
| Name | `textContentType="name"` + `autoCapitalize="words"` |
| Address | `textContentType="fullStreetAddress"` |
| One-time Code | `keyboardType="number-pad"` + `textContentType="oneTimeCode"` |

---

## Spacing & Sizing (iOS 18)

| Element | Size |
|---------|------|
| Standard margin | 16pt |
| Card padding | 16pt |
| Button height (large) | 50pt |
| Button height (regular) | 44pt |
| Button corner radius | 12pt |
| Card corner radius | 16-20pt |
| Touch target minimum | 44x44pt |
| Icon size (tab bar) | 24-28pt |
| Icon size (inline) | 20-24pt |
| List row height (standard) | 44pt |
| List row height (subtitle) | 60pt |
