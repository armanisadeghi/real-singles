# iOS 26 Native Overhaul -- Agent Task Instructions

## What This Is

This document contains direct instructions for updating the mobile app to full iOS 26 native compliance. Every task is specific, with exact file paths, exact patterns to find, and exact replacements. Do not skip steps. Do not partially implement.

## Before You Start

**Read these reference docs first:**
- `docs/IOS_26_IMPLEMENTATION_GUIDE.md` -- Full component patterns, library decisions, known issues
- `.cursor/skills/ios-native-expert/SKILL.md` -- Mandatory rules and checklist
- `.cursor/skills/ios-native-expert/reference.md` -- Quick API reference

**Understand the violation counts (from audit):**

| Violation | Files Affected |
|-----------|---------------|
| Hardcoded hex colors | 85 files |
| `isDark ? '#...' : '#...'` ternary patterns | 45 files |
| `useColorScheme()` in individual components | 67 files |
| Missing `contentInsetAdjustmentBehavior` | 44 files |
| Missing haptic feedback | 21 files |
| Custom headers bypassing native nav | 7 files |
| BlurView instead of GlassView | 3 files |
| Custom modals instead of native sheets | 14 files |
| Tab bar / Icon compliance | 0 (already compliant) |

---

## Task 1: Enable NativeTabs iOS 26 Features

**File:** `mobile/app/(tabs)/_layout.tsx`

**Current:** `<NativeTabs>` with no iOS 26-specific props.

**Change:** Add `minimizeBehavior` and optionally `role="search"` on the Discover tab.

**Find:**
```tsx
<NativeTabs>
```

**Replace with:**
```tsx
<NativeTabs minimizeBehavior="onScrollDown">
```

**Optionally, also change the Discover tab trigger to enable the iOS 26 bottom search pattern:**

**Find:**
```tsx
<NativeTabs.Trigger name="discover">
```

**Replace with:**
```tsx
<NativeTabs.Trigger name="discover" role="search">
```

This makes the Discover tab a separated circular search button on iOS 26 that morphs into a native search field when tapped. Test this on device first -- it changes navigation behavior. If it causes issues, revert `role="search"` but keep `minimizeBehavior`.

---

## Task 2: Replace ALL `useColorScheme()` With Centralized Theme Hooks

**Goal:** Every component must use `useTheme()`, `useThemeColors()`, or `useIsDarkMode()` from `@/context/ThemeContext` instead of calling `useColorScheme()` directly.

**67 files are affected.** Here is the exact transformation:

### Step 2a: For files that use `useColorScheme()` to get `isDark` boolean

**Find pattern (in each file):**
```tsx
import { ..., useColorScheme, ... } from 'react-native';
// ...
const colorScheme = useColorScheme();
const isDark = colorScheme === 'dark';
```

**Replace with:**
```tsx
// Remove useColorScheme from the react-native import
// Add this import:
import { useIsDarkMode, useThemeColors } from '@/context/ThemeContext';
// ...
const isDark = useIsDarkMode();
const colors = useThemeColors();
```

### Step 2b: For files that use `useColorScheme()` and also need colors

Most files that call `useColorScheme()` also construct `isDark ? '#light' : '#dark'` ternaries for colors. When replacing `useColorScheme()`, also replace the color ternaries with `colors.xxx` from `useThemeColors()`.

**File list (ALL must be updated):**

**App screens (28 files):**
- `mobile/app/(auth)/index.tsx`
- `mobile/app/(auth)/login.tsx`
- `mobile/app/(auth)/signup.tsx`
- `mobile/app/(tabs)/chats.tsx`
- `mobile/app/(tabs)/connections.tsx`
- `mobile/app/(tabs)/discover.tsx`
- `mobile/app/(tabs)/favorites.tsx`
- `mobile/app/(tabs)/index.tsx`
- `mobile/app/(tabs)/matches.tsx`
- `mobile/app/(tabs)/profile.tsx`
- `mobile/app/call/index.tsx`
- `mobile/app/chat/[userid].tsx`
- `mobile/app/discover/profile/[id].tsx`
- `mobile/app/events/create/index.tsx`
- `mobile/app/events/event/[id].tsx`
- `mobile/app/events/index.tsx`
- `mobile/app/group/[groupid].tsx`
- `mobile/app/index.tsx`
- `mobile/app/join/index.tsx`
- `mobile/app/nearbyprofile/index.tsx`
- `mobile/app/profiles/[id].tsx`
- `mobile/app/profiles/focus/[id].tsx`
- `mobile/app/redeem/product/[productId].tsx`
- `mobile/app/refer/index.tsx`
- `mobile/app/settings/index.tsx`
- `mobile/app/speed-dating/[id].tsx`
- `mobile/app/speed-dating/index.tsx`
- `mobile/app/virtualdate/[id].tsx`

**Component files (39 files):**
- `mobile/components/chat/ChatInput.tsx`
- `mobile/components/chat/Conversation.tsx`
- `mobile/components/chat/GroupConversation.tsx`
- `mobile/components/EventDetails.tsx`
- `mobile/components/FilterOptions.tsx`
- `mobile/components/forms/ContactForm.tsx`
- `mobile/components/forms/EditProfileForm.tsx`
- `mobile/components/forms/ShippingInfoForm.tsx`
- `mobile/components/MediaItem.tsx`
- `mobile/components/NotificationBell.tsx`
- `mobile/components/profile/ProfileSectionRenderer.tsx`
- `mobile/components/ProfileDetails.tsx`
- `mobile/components/signup/Appearance.tsx`
- `mobile/components/signup/ChooseInterests.tsx`
- `mobile/components/signup/EducationJob.tsx`
- `mobile/components/signup/Ethnicity.tsx`
- `mobile/components/signup/gender.tsx`
- `mobile/components/signup/Intro.tsx`
- `mobile/components/signup/login.tsx`
- `mobile/components/signup/PersonalDetails.tsx`
- `mobile/components/signup/ReviewProfile.tsx`
- `mobile/components/signup/Success.tsx`
- `mobile/components/signup/TakePhoto.tsx`
- `mobile/components/signup/TakeVideo2.tsx`
- `mobile/components/ui/Avatar.tsx`
- `mobile/components/ui/ContextMenu.tsx`
- `mobile/components/ui/CurrentEventCard.tsx`
- `mobile/components/ui/EventCard.tsx`
- `mobile/components/ui/FloatingActionBar.tsx`
- `mobile/components/ui/GlassChip.tsx`
- `mobile/components/ui/LiquidGlass.tsx`
- `mobile/components/ui/NativeSegmentedTabs.tsx`
- `mobile/components/ui/NotificationCard.tsx`
- `mobile/components/ui/PastEventCard.tsx`
- `mobile/components/ui/PhotoCarousel.tsx`
- `mobile/components/ui/PlatformIcon.tsx`
- `mobile/components/ui/ProductCard.tsx`
- `mobile/components/ui/ProfileListItem.tsx`
- `mobile/components/ui/ScreenHeader.tsx`

### Step 2c: Special case -- `LiquidGlass.tsx`

This file uses `useColorScheme()` in `LiquidGlassHeader` and `LiquidGlassFAB`. Replace with `useIsDarkMode()` from ThemeContext. It already imports `useThemeColors`.

---

## Task 3: Replace Hardcoded Hex Colors With PlatformColor / Theme Colors

**Goal:** Every `isDark ? '#darkHex' : '#lightHex'` pattern and every standalone hardcoded hex that represents a system color must be replaced.

### Step 3a: The Pattern

For every file, when you see:

```tsx
backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF'
```

Replace with:

```tsx
backgroundColor: Platform.OS === 'ios'
  ? PlatformColor('systemBackground')
  : colors.background
```

**You MUST add the import:**
```tsx
import { Platform, PlatformColor } from 'react-native';
```

### Step 3b: Common Replacements

Apply these replacements throughout all 85 affected files:

**Backgrounds:**
```tsx
// Page backgrounds
isDark ? '#000000' : '#FFFFFF'           -> PlatformColor('systemBackground') / colors.background
isDark ? '#1C1C1E' : '#F2F2F7'          -> PlatformColor('secondarySystemBackground') / colors.surfaceContainerLow
isDark ? '#2C2C2E' : '#FFFFFF'          -> PlatformColor('tertiarySystemBackground') / colors.surface
isDark ? '#000000' : '#F2F2F7'          -> PlatformColor('systemGroupedBackground') / colors.background
isDark ? '#1C1C1E' : '#FFFFFF'          -> PlatformColor('secondarySystemGroupedBackground') / colors.surface

// Surface / card backgrounds
isDark ? '#1C1C1E' : '#F5F5F5'          -> PlatformColor('secondarySystemBackground') / colors.surfaceContainerLow
isDark ? '#2C2C2E' : '#F5F5F5'          -> PlatformColor('tertiarySystemBackground') / colors.surfaceContainer
```

**Text colors:**
```tsx
isDark ? '#FFFFFF' : '#000000'          -> PlatformColor('label') / colors.onSurface
isDark ? '#FFFFFF' : '#333333'          -> PlatformColor('label') / colors.onSurface
isDark ? '#9CA3AF' : '#666666'          -> PlatformColor('secondaryLabel') / colors.onSurfaceVariant
isDark ? '#9CA3AF' : '#6B7280'          -> PlatformColor('secondaryLabel') / colors.onSurfaceVariant
isDark ? '#6B7280' : '#9CA3AF'          -> PlatformColor('tertiaryLabel') / colors.onSurfaceVariant
```

**Borders/separators:**
```tsx
isDark ? '#3A3A3C' : '#E5E7EB'          -> PlatformColor('separator') / colors.outline
isDark ? '#3A3A3C' : '#E5E5EA'          -> PlatformColor('separator') / colors.outline
isDark ? '#3A3A3C' : '#D1D1D6'          -> PlatformColor('opaqueSeparator') / colors.outlineVariant
isDark ? '#38383A' : '#E0E0E0'          -> PlatformColor('separator') / colors.outline
```

**System tints (standalone hex, not ternaries):**
```tsx
'#007AFF'                               -> PlatformColor('systemBlue') / colors.primary
'#FF3B30'                               -> PlatformColor('systemRed') / colors.error
'#34C759'                               -> PlatformColor('systemGreen')
'#FF9500'                               -> PlatformColor('systemOrange')
'#FF2D55'                               -> PlatformColor('systemPink')
```

### Step 3c: Platform.OS Wrapper

Every `PlatformColor()` call MUST be wrapped in a `Platform.OS === 'ios'` check because PlatformColor crashes on Android/web:

```tsx
// For StyleSheet.create (computed at module load):
const styles = StyleSheet.create({
  container: {
    backgroundColor: Platform.OS === 'ios'
      ? (PlatformColor('systemBackground') as unknown as string)
      : undefined,  // Set dynamically in component using colors.xxx
  },
});

// For inline styles (preferred -- cleaner):
<View style={{
  backgroundColor: Platform.OS === 'ios'
    ? PlatformColor('systemBackground')
    : colors.background,
}}>
```

### Step 3d: Files With The Most Violations (Start Here)

Process these high-violation files first:

1. `mobile/components/forms/EditProfileForm.tsx` -- 15+ hardcoded grays
2. `mobile/components/signup/TakePhoto.tsx` -- 8+ hardcoded colors
3. `mobile/components/ui/FloatingActionBar.tsx` -- 7+ hardcoded colors
4. `mobile/components/ui/EventCard.tsx` -- 6+ hardcoded colors
5. `mobile/components/ui/NativeSegmentedTabs.tsx` -- 6+ hardcoded colors
6. `mobile/components/ui/ContextMenu.tsx` -- 6+ hardcoded colors
7. `mobile/app/(tabs)/connections.tsx` -- 6+ hardcoded colors
8. `mobile/app/(tabs)/discover.tsx` -- 6+ hardcoded colors
9. `mobile/app/events/event/[id].tsx` -- 7+ hardcoded colors
10. `mobile/app/speed-dating/[id].tsx` -- extensive ternaries

Then proceed through all remaining files in the audit.

---

## Task 4: Add `contentInsetAdjustmentBehavior="automatic"` to ALL Scroll Views

**44 files are missing this prop.**

### Step 4a: The Change

For every `<ScrollView>`, `<FlatList>`, and `<SectionList>` in the mobile app, add `contentInsetAdjustmentBehavior="automatic"` if not already present.

**Find patterns:**
```tsx
<ScrollView
<ScrollView style=
<FlatList
<FlatList data=
<SectionList
```

**Add prop:**
```tsx
<ScrollView contentInsetAdjustmentBehavior="automatic"
<FlatList contentInsetAdjustmentBehavior="automatic"
<SectionList contentInsetAdjustmentBehavior="automatic"
```

### Step 4b: File List (ALL Must Be Updated)

**App screens:**
- `mobile/app/(auth)/index.tsx`
- `mobile/app/(auth)/signup.tsx`
- `mobile/app/(tabs)/chats.tsx`
- `mobile/app/(tabs)/discover.tsx`
- `mobile/app/(tabs)/index.tsx`
- `mobile/app/(tabs)/profile.tsx`
- `mobile/app/appGallery/index.tsx`
- `mobile/app/call/index.tsx`
- `mobile/app/discover/profile/[id].tsx`
- `mobile/app/editProfile/index.tsx`
- `mobile/app/events/create/index.tsx`
- `mobile/app/group/[groupid].tsx`
- `mobile/app/group/addmember/index.tsx`
- `mobile/app/index.tsx`
- `mobile/app/notification/index.tsx`
- `mobile/app/profiles/focus/[id].tsx`
- `mobile/app/redeem/index.tsx`
- `mobile/app/redeem/product/[productId].tsx`
- `mobile/app/settings/index.tsx`
- `mobile/app/shipping/index.tsx`
- `mobile/app/topMatches/index.tsx`
- `mobile/app/virtualdate/[id].tsx`

**Components:**
- `mobile/components/ProfileDetails.tsx`
- `mobile/components/chat/Conversation.tsx`
- `mobile/components/chat/GroupConversation.tsx`
- `mobile/components/signup/Appearance.tsx`
- `mobile/components/signup/ChooseInterests.tsx`
- `mobile/components/signup/EducationJob.tsx`
- `mobile/components/signup/Ethnicity.tsx`
- `mobile/components/signup/HabitInterests.tsx`
- `mobile/components/signup/HaveChildren.tsx`
- `mobile/components/signup/Intro.tsx`
- `mobile/components/signup/Languages.tsx`
- `mobile/components/signup/MaritalStatus.tsx`
- `mobile/components/signup/PersonalDetails.tsx`
- `mobile/components/signup/PoliticalViews.tsx`
- `mobile/components/signup/Qualification.tsx`
- `mobile/components/signup/Religion.tsx`
- `mobile/components/signup/ReviewProfile.tsx`
- `mobile/components/signup/TakePhoto.tsx`
- `mobile/components/signup/WantChildren.tsx`
- `mobile/components/signup/gender.tsx`
- `mobile/components/signup/login.tsx`
- `mobile/components/ui/PhotoCarousel.tsx`
- `mobile/components/ui/ProfileListItem.tsx`

### Step 4c: Exception

Do NOT add this to `<ScrollView>` components used inside `@gorhom/bottom-sheet` (they use `BottomSheetScrollView` which handles insets separately).

---

## Task 5: Add Haptic Feedback to Missing Interactive Components

**21 files have interactive elements without haptic feedback.**

### Step 5a: The Pattern

For each file, add the import and wrap the `onPress` handlers:

**Add import:**
```tsx
import * as Haptics from 'expo-haptics';
```

**Wrap onPress:**
```tsx
// Before
<Pressable onPress={handlePress}>

// After
<Pressable onPress={() => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  handlePress();
}}>
```

**For selection/toggle actions:**
```tsx
Haptics.selectionAsync();
```

**For destructive actions (delete, remove):**
```tsx
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
```

### Step 5b: File List

- `mobile/app/(auth)/index.tsx`
- `mobile/app/editProfile/index.tsx`
- `mobile/components/MediaItem.tsx`
- `mobile/components/ProductDetails.tsx`
- `mobile/components/forms/ContactForm.tsx`
- `mobile/components/signup/Appearance.tsx`
- `mobile/components/signup/EducationJob.tsx`
- `mobile/components/signup/Ethnicity.tsx`
- `mobile/components/signup/HabitInterests.tsx`
- `mobile/components/signup/HaveChildren.tsx`
- `mobile/components/signup/Languages.tsx`
- `mobile/components/signup/MaritalStatus.tsx`
- `mobile/components/signup/PoliticalViews.tsx`
- `mobile/components/signup/Qualification.tsx`
- `mobile/components/signup/Religion.tsx`
- `mobile/components/signup/ReviewProfile.tsx`
- `mobile/components/signup/TakeVideo2.tsx`
- `mobile/components/signup/WantChildren.tsx`
- `mobile/components/signup/gender.tsx`
- `mobile/components/signup/login.tsx`
- `mobile/components/ui/ProductCard.tsx`

### Step 5c: Platform Guard (Optional but Recommended)

Wrap haptic calls in a platform check to avoid no-ops on Android:

```tsx
import { Platform } from 'react-native';

const triggerHaptic = () => {
  if (Platform.OS === 'ios') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};
```

---

## Task 6: Replace BlurView With LiquidGlassView on Floating Elements

**3 files use `BlurView` where `LiquidGlassView` should be used.**

### File 1: `mobile/components/ui/FloatingActionBar.tsx`

**Find:** The `BlurView` usage for the floating bar container.
**Replace:** Import and use `LiquidGlassView` from `@/components/ui/LiquidGlass`:

```tsx
import { LiquidGlassView } from '@/components/ui/LiquidGlass';

// Replace BlurView container with:
<LiquidGlassView
  style={styles.container}
  fallbackColor={Platform.OS === 'ios' ? undefined : colors.surface}
  isInteractive={true}
  glassEffectStyle="regular"
>
  {/* existing content */}
</LiquidGlassView>
```

### File 2: `mobile/components/ui/GlassChip.tsx`

**Find:** The `BlurView` chip container.
**Replace:** Use `LiquidGlassView` with `glassEffectStyle="clear"` (since chips are small).

### File 3: `mobile/app/events/event/[id].tsx`

**Find:** The `BlurView` overlay.
**Replace:** Use `LiquidGlassView`.

---

## Task 7: Add Glass Backgrounds to Bottom Sheets

**4 files use `@gorhom/bottom-sheet` without glass backgrounds.**

### The Pattern

For each BottomSheet instance, add a `backgroundComponent` prop:

```tsx
import { LiquidGlassView } from '@/components/ui/LiquidGlass';

<BottomSheet
  // ... existing props
  backgroundComponent={({ style }) => (
    <LiquidGlassView
      style={style}
      glassEffectStyle="regular"
      fallbackColor={Platform.OS === 'ios'
        ? (PlatformColor('secondarySystemBackground') as unknown as string)
        : colors.surface}
    />
  )}
>
```

### File List

- `mobile/app/(tabs)/profile.tsx`
- `mobile/app/(tabs)/discover.tsx`
- `mobile/app/redeem/product/[productId].tsx`
- `mobile/app/profiles/[id].tsx`

---

## Task 8: Update ScreenHeader to Default to Glass

**File:** `mobile/components/ui/ScreenHeader.tsx`

This component has a `liquidGlass` prop but defaults to a plain `View`. For screens that use `ScreenHeader` instead of native navigation, ensure the glass effect is active by default on iOS 26.

**Change:** Default `liquidGlass` prop to `true` on iOS (or use `useLiquidGlass()` to determine automatically).

---

## Task 9: Update Root Layout Header Config

**File:** `mobile/app/_layout.tsx`

### Step 9a: Replace hardcoded header colors

**Find:**
```tsx
headerTitleStyle: {
  fontWeight: '600',
  color: isDark ? '#FFFFFF' : '#000000'
},
```

**Replace with:**
```tsx
headerTitleStyle: {
  fontWeight: '600',
  color: Platform.OS === 'ios'
    ? PlatformColor('label') as unknown as string
    : isDark ? '#FFFFFF' : '#000000',
},
```

**Find:**
```tsx
headerStyle: Platform.OS === 'ios'
  ? undefined
  : { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
```

This is correct for iOS (let system handle). The Android fallback could use theme colors but is acceptable as-is.

### Step 9b: Replace `useColorScheme()` call

The root `_layout.tsx` is one of the allowed exceptions since it's above ThemeProvider, BUT the `RootLayoutNav` function is rendered inside ThemeProvider. So it CAN and SHOULD use `useIsDarkMode()` instead of `useColorScheme()`.

**Find:**
```tsx
const colorScheme = useColorScheme();
// ...
const isDark = colorScheme === 'dark';
```

**Replace with:**
```tsx
import { useIsDarkMode } from '@/context/ThemeContext';
// ...
const isDark = useIsDarkMode();
```

And remove `useColorScheme` from the react-native import.

---

## Task 10: Verify and Test

After completing all tasks:

1. **Type check:** Run `pnpm type-check` and fix any TypeScript errors (PlatformColor type casting may be needed in some StyleSheet contexts)
2. **Build:** Run `pnpm ios:quick` and verify it compiles
3. **Visual test on device:** Check these screens in both light and dark mode:
   - Home tab
   - Discover tab
   - Connections tab
   - Messages tab
   - Profile tab
   - Settings screen
   - Any chat screen
   - Any event detail
4. **Verify:** Tab bar auto-minimizes on scroll
5. **Verify:** Headers are translucent with blur/glass
6. **Verify:** All text is readable in both light and dark mode
7. **Verify:** Glass effects render on floating elements (iOS 26 only)

---

## Execution Order

Execute tasks in this order (dependencies flow downward):

```
Task 1: NativeTabs iOS 26 features (standalone, quick win)
Task 2: Replace useColorScheme() everywhere (foundation for Task 3)
Task 3: Replace hardcoded hex colors (depends on Task 2 for colors object)
Task 4: Add contentInsetAdjustmentBehavior (standalone, can parallel with 2-3)
Task 5: Add haptic feedback (standalone, can parallel with 2-3)
Task 6: BlurView -> LiquidGlassView (standalone)
Task 7: Glass backgrounds on bottom sheets (standalone)
Task 8: ScreenHeader glass default (standalone)
Task 9: Root layout cleanup (standalone)
Task 10: Verify and test (after all others)
```

Tasks 4, 5, 6, 7, 8 are independent and can be done in any order or in parallel.

---

## PlatformColor Type Casting

`PlatformColor()` returns an opaque type. In some contexts (StyleSheet.create, inline styles expecting `string`), you may need to cast:

```tsx
// In StyleSheet.create:
backgroundColor: Platform.OS === 'ios'
  ? (PlatformColor('systemBackground') as unknown as string)
  : '#FFFFFF',

// In inline styles (usually works without cast):
<View style={{ backgroundColor: Platform.OS === 'ios' ? PlatformColor('systemBackground') : colors.background }}>
```

## Do NOT:

- Remove any Android-specific code
- Touch any file in `/web`
- Add new dependencies (all needed packages are already installed)
- Change the ThemeContext architecture
- Modify the NativeTabs tab structure (just add props)
- Remove Platform.OS checks
- Use PlatformColor without a Platform.OS === 'ios' guard
