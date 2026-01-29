# iOS 26 Native UX/UI Implementation Guide

## Executive Summary

iOS 26 (WWDC 2025) introduced **Liquid Glass** -- Apple's most significant visual overhaul since iOS 7. It replaces flat/opaque UI chrome with translucent, refractive glass that bends and concentrates light in real time. Every system component -- tab bars, navigation bars, toolbars, menus, alerts, action sheets, search bars, keyboards -- adopts this material automatically.

**Your project is already well-positioned.** You're on Expo SDK 54, React Native 0.81.5, expo-router v6, and already use `NativeTabs`, `expo-blur`, `expo-glass-effect`, and `react-native-ios-context-menu`. This guide covers what to change, what to add, and the exact patterns to follow.

---

## Table of Contents

1. [What Makes iOS 26 Unique](#1-what-makes-ios-26-unique)
2. [Liquid Glass Libraries](#2-liquid-glass-libraries)
3. [Component-by-Component Implementation](#3-component-by-component-implementation)
4. [Centralized Theme & Dark Mode System](#4-centralized-theme--dark-mode-system)
5. [Reusable Glass Components](#5-reusable-glass-components)
6. [Edge-to-Edge Content Layout](#6-edge-to-edge-content-layout)
7. [Performance Guidelines](#7-performance-guidelines)
8. [Library Decision Matrix](#8-library-decision-matrix)
9. [Migration Checklist](#9-migration-checklist)

---

## 1. What Makes iOS 26 Unique

### 1.1 Liquid Glass Material

Liquid Glass is NOT standard glassmorphism blur. It uses **lensing** -- bending and concentrating light like real glass -- rather than scattering it. Apple fabricated physical glass prototypes to match interface properties to real-world behavior.

**Three internal layers:**
- **Highlight**: Specular light reflection
- **Shadow**: Depth separation from content behind
- **Illumination**: Adaptive material that responds to ambient light and content

**Three effect variants:**
| Variant | Use Case |
|---------|----------|
| `regular` | Default for most controls and containers |
| `clear` | Higher transparency for media-rich backgrounds |
| `none` / `identity` | No glass effect (opt-out) |

**Light vs. Dark mode behavior:**
- **Light mode**: Glass is glossier, more transparent, blends with lighter backgrounds
- **Dark mode**: Glass "glows" with a lighter frosted tint against dark backgrounds, more visually prominent
- **Tinted mode** (iOS 26.1+): User preference that increases opacity and contrast; apps that use native glass get this for free

### 1.2 Key Visual Properties (Community-Derived)

| Property | Value |
|----------|-------|
| Card corner radius | 28pt |
| Sheet corner radius | 34pt |
| Capsule/pill shape | `borderRadius: 999` |
| Stroke width | 1pt at 0.22-0.35 opacity |
| Shadow radius | 18pt |
| Shadow Y-offset | 8pt |
| Shadow opacity | 0.18 |
| Card padding | 16pt |
| Pill padding | 10-14pt |
| Corner concentricity | Inner radius = outer radius - padding |

### 1.3 The iOS 26 Design Paradigm

The fundamental shift: **Content fills the entire screen. Chrome (headers, tab bars, toolbars) floats above it as transparent glass.** Content scrolls freely behind these glass elements, creating a layered, immersive feel.

Key behaviors:
- Tab bars are **floating pill-shaped capsules**, not full-width bars
- Tab bars **auto-minimize** when scrolling down (show only active icon)
- Navigation bars are **transparent glass** by default
- Content has a **scroll edge effect** -- gradual blur/fade at edges where it meets bars
- Context menus and alerts **morph out of their trigger buttons** with smooth animations
- Action sheets appear **at the point of interaction**, not always at the bottom
- Search has moved to the **bottom of the screen** for ergonomic reachability

---

## 2. Liquid Glass Libraries

### 2.1 What You Already Have

| Package | Version | Purpose |
|---------|---------|---------|
| `expo-glass-effect` | 0.1.8 | Native `UIVisualEffectView` Liquid Glass |
| `expo-blur` | 15.0.8 | Standard blur effects (pre-iOS 26 fallback) |

### 2.2 Library Comparison

| Library | iOS 26 Native Glass | Merging/Container | Pre-iOS 26 Fallback | Android |
|---------|--------------------|--------------------|---------------------|---------|
| `expo-glass-effect` | `GlassView` via UIVisualEffectView | `GlassContainer` with spacing | Falls back to plain `View` | Falls back to plain `View` |
| `@callstack/liquid-glass` | `LiquidGlassView` | `LiquidGlassContainerView` with animated merging | Falls back to opaque `View` | Falls back to opaque `View` |
| `expo-blur` (BlurView) | Standard blur only (not Liquid Glass) | N/A | Full support | `dimezisBlurView` experimental |

### 2.3 Recommendation

**Primary:** Use `expo-glass-effect` (already installed) for all glass card/container elements. It uses the native iOS 26 Liquid Glass API directly.

**Consider adding:** `@callstack/liquid-glass` (v0.5.0) only if you need the animated merging effect where two glass elements morph into a connected shape when they get close together.

**Fallback:** Use `expo-blur` BlurView for non-glass blur needs (headers on pre-iOS 26, overlays, scroll-driven blur animations).

### 2.4 Critical Caveats

- `GlassView.isInteractive` cannot be toggled dynamically -- remount with a different `key` to change it
- Do NOT set `opacity < 1` on `GlassView` or any parent view -- this breaks the native glass rendering
- Do NOT animate parent opacity with Reanimated when `GlassView` is a child
- Always check `isGlassEffectAPIAvailable()` before rendering `GlassView`
- `borderRadius` does NOT work directly on `BlurView` -- wrap in a `View` with `overflow: 'hidden'`

---

## 3. Component-by-Component Implementation

### 3.1 Bottom Tab Bar (NativeTabs)

**Status:** Already implemented correctly. Enhancement available.

Your current `(tabs)/_layout.tsx` uses `NativeTabs` which renders a native `UITabBarController` on iOS. On iOS 26, this automatically gets:
- Liquid Glass floating pill tab bar
- Auto-minimize on scroll
- Content scrolling behind the translucent bar
- Native haptics, accessibility, safe areas

**Enhancement -- add to your existing layout:**

```tsx
import { NativeTabs, Label, Icon, Badge } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"  // NEW: auto-minimize tab bar on scroll
    >
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          drawable="ic_menu_home"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="discover" role="search">
        {/* NEW: role="search" makes this a separated circular button  */}
        {/* that morphs into a native search field when tapped on iOS 26 */}
        <Label>Discover</Label>
        <Icon sf="magnifyingglass" drawable="ic_menu_search" />
      </NativeTabs.Trigger>

      {/* ... remaining tabs unchanged */}
    </NativeTabs>
  );
}
```

**Key props:**
| Prop | Values | Description |
|------|--------|-------------|
| `minimizeBehavior` | `"automatic"` / `"never"` / `"onScrollDown"` / `"onScrollUp"` | When to auto-minimize |
| `role` (on Trigger) | `"search"` | Separates tab as circular search button (iOS 26) |

**Important:** On iOS 26, the tab bar background color is controlled by the system and cannot be overridden. Do not set `tabBarStyle.backgroundColor`.

**Known issues:**
- Icon tint color may invert when scrolling over light/dark content (expo/expo#39930)
- FlatList scroll-to-top and minimize-on-scroll may not work -- use `disableTransparentOnScrollEdge` if tab bar appears incorrectly transparent

### 3.2 Top Navigation Bar (Header)

**Status:** Already implemented with `headerBlurEffect`. Enhancement available.

Your current `_layout.tsx` sets `headerBlurEffect: 'systemMaterial'` on iOS. On iOS 26, the system also automatically applies a scroll edge effect (gradual blur at the top edge).

**Current configuration is correct. Key rules:**

```tsx
<Stack
  screenOptions={{
    // iOS blur effect for translucent header
    headerBlurEffect: Platform.OS === 'ios' ? 'systemMaterial' : undefined,

    // DO NOT set headerTransparent: true globally
    // It breaks content insets for screens with headerLargeTitle

    // Let iOS handle header background natively
    headerStyle: Platform.OS === 'ios'
      ? undefined  // Let system handle (Liquid Glass on iOS 26)
      : { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },

    headerShadowVisible: false,
  }}
/>
```

**For screens WITHOUT `headerLargeTitle` where you want blur:**

```tsx
<Stack.Screen
  name="some-detail"
  options={{
    title: 'Detail',
    headerTransparent: true,  // OK here since no headerLargeTitle
    headerBlurEffect: 'systemMaterial',
  }}
/>
```

**For custom blur header (JS Stack):**

```tsx
import { BlurView } from 'expo-blur';

<Stack.Screen
  options={{
    headerTransparent: true,
    headerBackground: () => (
      <BlurView
        tint="systemChromeMaterial"
        intensity={100}
        style={StyleSheet.absoluteFill}
      />
    ),
  }}
/>
```

**Available `headerBlurEffect` values:**
`'extraLight'` | `'light'` | `'dark'` | `'regular'` | `'prominent'` | `'systemUltraThinMaterial'` | `'systemThinMaterial'` | `'systemMaterial'` | `'systemThickMaterial'` | `'systemChromeMaterial'` (plus `Light` and `Dark` suffix variants of each)

### 3.3 Search Bar

iOS 26 moved search to the bottom of the screen. Three implementation approaches:

**Approach A: Native Search in Navigation Header (Top)**

```tsx
<Stack.Screen
  options={{
    headerSearchBarOptions: {
      placeholder: 'Search...',
      onChangeText: (event) => setSearch(event.nativeEvent.text),
      autoCapitalize: 'none',
      hideWhenScrolling: true,  // iOS: search hides on scroll
    },
  }}
/>
```

**Approach B: NativeTabs `role="search"` (Bottom, iOS 26 native)**

See Section 3.1 -- add `role="search"` to the Discover tab trigger. The tab becomes a separated circular search button that morphs into a native search field when tapped.

**Approach C: Custom Bottom Search with Glass**

```tsx
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';

function SearchBar({ value, onChangeText }) {
  const SearchContainer = isGlassEffectAPIAvailable() ? GlassView : BlurView;
  const containerProps = isGlassEffectAPIAvailable()
    ? { glassEffectStyle: 'clear' }
    : { tint: 'systemChromeMaterial', intensity: 80 };

  return (
    <View style={styles.searchWrapper}>
      <SearchContainer style={styles.searchBar} {...containerProps}>
        <Ionicons name="search" size={18} color={PlatformColor('secondaryLabel')} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Search"
          placeholderTextColor={PlatformColor('placeholderText')}
          style={styles.searchInput}
        />
      </SearchContainer>
    </View>
  );
}
```

### 3.4 Context Menus

**Status:** Already have `react-native-ios-context-menu` v3.2.1.

On iOS 26, native `UIMenu` context menus automatically adopt Liquid Glass styling. Since your library uses the native component, **you get iOS 26 glass menus for free** with no code changes.

**For cross-platform context menus, consider adding Zeego:**

```bash
pnpm add zeego
# zeego wraps react-native-ios-context-menu (iOS) + @react-native-menu/menu (Android)
```

```tsx
import * as ContextMenu from 'zeego/context-menu';

function ProfileContextMenu({ children }) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>{children}</ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item key="edit" onSelect={handleEdit}>
          <ContextMenu.ItemTitle>Edit</ContextMenu.ItemTitle>
          <ContextMenu.ItemIcon ios={{ name: 'pencil' }} />
        </ContextMenu.Item>
        <ContextMenu.Separator />
        <ContextMenu.Item key="delete" onSelect={handleDelete} destructive>
          <ContextMenu.ItemTitle>Delete</ContextMenu.ItemTitle>
          <ContextMenu.ItemIcon ios={{ name: 'trash' }} />
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
}
```

### 3.5 Action Sheets

**Three tiers (simplest to most customizable):**

**Tier 1: Native (automatic Liquid Glass on iOS 26)**
```tsx
import { ActionSheetIOS, Platform } from 'react-native';

if (Platform.OS === 'ios') {
  ActionSheetIOS.showActionSheetWithOptions(
    {
      options: ['Cancel', 'Edit', 'Delete'],
      destructiveButtonIndex: 2,
      cancelButtonIndex: 0,
    },
    (buttonIndex) => { /* handle */ }
  );
}
```

**Tier 2: Cross-platform (native on iOS, custom on Android)**
```bash
pnpm add @expo/react-native-action-sheet
```

**Tier 3: Fully custom glass action sheet**

Use `@gorhom/bottom-sheet` (already installed) with a glass background:

```tsx
import BottomSheet from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';

<BottomSheet
  snapPoints={['25%', '50%']}
  backgroundComponent={({ style }) => (
    <BlurView tint="systemChromeMaterial" intensity={80} style={style} />
  )}
>
  {/* Action sheet content */}
</BottomSheet>
```

### 3.6 Alerts

`Alert.alert()` gets Liquid Glass automatically on iOS 26. No changes needed.

```tsx
Alert.alert(
  'Confirm Action',
  'Are you sure you want to proceed?',
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: handleDelete },
  ]
);
```

For branded/custom alerts, combine `Modal` with `GlassView` or `BlurView`.

### 3.7 Lists (Grouped / Inset Grouped)

Liquid Glass does NOT apply to list cells. Use `SectionList` with semantic colors:

```tsx
import { PlatformColor, Platform } from 'react-native';

const listStyles = StyleSheet.create({
  container: {
    backgroundColor: Platform.OS === 'ios'
      ? PlatformColor('systemGroupedBackground')
      : isDark ? '#000000' : '#F2F2F7',
  },
  sectionCell: {
    backgroundColor: Platform.OS === 'ios'
      ? PlatformColor('secondarySystemGroupedBackground')
      : isDark ? '#1C1C1E' : '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionHeader: {
    color: Platform.OS === 'ios'
      ? PlatformColor('secondaryLabel')
      : isDark ? '#9CA3AF' : '#6B7280',
    fontSize: 13,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Platform.OS === 'ios'
      ? PlatformColor('separator')
      : isDark ? '#38383A' : '#C6C6C8',
    marginLeft: 16,
  },
});
```

### 3.8 Sheets / Bottom Sheets / Modals

**Approach A: Expo Router `formSheet` (auto Liquid Glass on iOS 26)**

```tsx
<Stack.Screen
  name="modal-screen"
  options={{
    presentation: 'formSheet',
    sheetAllowedDetents: [0.5, 1.0],  // Snap points
    sheetGrabberVisible: true,
    sheetCornerRadius: 34,
  }}
/>
```

**Approach B: @gorhom/bottom-sheet (already installed) with glass background**

```tsx
import BottomSheet from '@gorhom/bottom-sheet';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';

function GlassBottomSheet({ children }) {
  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

  return (
    <BottomSheet
      snapPoints={snapPoints}
      backgroundComponent={({ style }) =>
        isGlassEffectAPIAvailable() ? (
          <GlassView style={style} glassEffectStyle="regular" />
        ) : (
          <BlurView tint="systemThickMaterial" intensity={80} style={style} />
        )
      }
    >
      {children}
    </BottomSheet>
  );
}
```

### 3.9 Segmented Controls

**Status:** Already have `@react-native-segmented-control/segmented-control` v2.5.7.

This renders native `UISegmentedControl` which gets Liquid Glass automatically on iOS 26. No changes needed.

```tsx
import SegmentedControl from '@react-native-segmented-control/segmented-control';

<SegmentedControl
  values={['All', 'Likes', 'Matches']}
  selectedIndex={selectedTab}
  onChange={(event) => setSelectedTab(event.nativeEvent.selectedSegmentIndex)}
/>
```

### 3.10 SF Symbols

**Status:** Already have `expo-symbols` v1.0.8.

iOS 26 (SF Symbols 7) has 6,900+ symbols. Use `SymbolView` for native rendering:

```tsx
import { SymbolView } from 'expo-symbols';

<SymbolView
  name="heart.fill"
  type="hierarchical"
  tintColor={PlatformColor('systemPink')}
  style={{ width: 24, height: 24 }}
  animationSpec={{
    effect: { type: 'bounce' },
    repeating: false,
  }}
/>
```

### 3.11 Haptic Feedback

**Status:** Already have `expo-haptics` v15.0.8.

**When to use which haptic type:**

| Interaction | Haptic Call |
|-------------|-------------|
| Tab selection | `Haptics.selectionAsync()` |
| Button tap | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` |
| Card press | `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` |
| Toggle switch | `Haptics.impactAsync(ImpactFeedbackStyle.Rigid)` |
| Swipe action | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` |
| Long press trigger | `Haptics.impactAsync(ImpactFeedbackStyle.Heavy)` |
| Match / success | `Haptics.notificationAsync(NotificationFeedbackType.Success)` |
| Error | `Haptics.notificationAsync(NotificationFeedbackType.Error)` |
| Warning | `Haptics.notificationAsync(NotificationFeedbackType.Warning)` |

---

## 4. Centralized Theme & Dark Mode System

### 4.1 Current Architecture (Already Correct)

Your project has the right architecture:

```
ThemeProvider (root)              -- calls useColorScheme() ONCE
  -> ThemeContext                  -- provides AppTheme to all descendants
    -> useTheme()                 -- universal hook for components
    -> useThemeColors()           -- convenience: just colors
    -> useIsDarkMode()            -- convenience: just boolean
```

This is the recommended pattern. `useColorScheme()` is called once at the root. All components read from context, avoiding inconsistent renders.

### 4.2 iOS Semantic Colors via PlatformColor

Your `platformColors.ts` correctly uses `PlatformColor` for iOS. This is critical for iOS 26 because:

1. `PlatformColor('labelColor')` automatically adapts text for glass backgrounds
2. The system handles Clear vs. Tinted user preference automatically
3. High contrast accessibility modes are handled natively
4. Colors resolve at the native layer -- zero JS re-renders on scheme change

**Full PlatformColor reference for iOS:**

| Category | iOS Name | Description |
|----------|----------|-------------|
| **Labels** | `'label'` | Primary text |
| | `'secondaryLabel'` | Secondary text |
| | `'tertiaryLabel'` | Tertiary text |
| | `'quaternaryLabel'` | Quaternary text |
| | `'placeholderText'` | Input placeholders |
| **Backgrounds** | `'systemBackground'` | Primary background |
| | `'secondarySystemBackground'` | Secondary background |
| | `'tertiarySystemBackground'` | Tertiary background |
| **Grouped Backgrounds** | `'systemGroupedBackground'` | Primary grouped |
| | `'secondarySystemGroupedBackground'` | Secondary grouped |
| | `'tertiarySystemGroupedBackground'` | Tertiary grouped |
| **Fills** | `'systemFill'` | Primary fill |
| | `'secondarySystemFill'` | Secondary fill |
| | `'tertiarySystemFill'` | Tertiary fill |
| | `'quaternarySystemFill'` | Quaternary fill |
| **Separators** | `'separator'` | Standard separator |
| | `'opaqueSeparator'` | Opaque separator |
| **System Colors** | `'systemBlue'` | Blue (#007AFF / #0A84FF) |
| | `'systemGreen'` | Green (#34C759 / #30D158) |
| | `'systemRed'` | Red (#FF3B30 / #FF453A) |
| | `'systemOrange'` | Orange (#FF9500 / #FF9F0A) |
| | `'systemYellow'` | Yellow (#FFCC00 / #FFD60A) |
| | `'systemPink'` | Pink (#FF2D55 / #FF375F) |
| | `'systemPurple'` | Purple (#AF52DE / #BF5AF2) |
| | `'systemIndigo'` | Indigo (#5856D6 / #5E5CE6) |
| | `'systemTeal'` | Teal (#30B0C7 / #40CBE0) |
| | `'systemCyan'` | Cyan (#32ADE6 / #64D2FF) |
| | `'systemMint'` | Mint (#00C7BE / #63E6E2) |
| | `'systemBrown'` | Brown (#A2845E / #AC8E68) |
| **Grays** | `'systemGray'` through `'systemGray6'` | 6 gray levels |

### 4.3 iOS System Color Values (Light / Dark)

**Background Colors:**

| Color | Light | Dark |
|-------|-------|------|
| `systemBackground` | `#FFFFFF` | `#000000` |
| `secondarySystemBackground` | `#F2F2F7` | `#1C1C1E` |
| `tertiarySystemBackground` | `#FFFFFF` | `#2C2C2E` |
| `systemGroupedBackground` | `#F2F2F7` | `#000000` |
| `secondarySystemGroupedBackground` | `#FFFFFF` | `#1C1C1E` |
| `tertiarySystemGroupedBackground` | `#F2F2F7` | `#2C2C2E` |

**Label Colors:**

| Color | Light | Dark |
|-------|-------|------|
| `label` | `#000000` (alpha 1.0) | `#FFFFFF` (alpha 1.0) |
| `secondaryLabel` | `#3C3C43` (alpha 0.6) | `#EBEBF5` (alpha 0.6) |
| `tertiaryLabel` | `#3C3C43` (alpha 0.3) | `#EBEBF5` (alpha 0.3) |
| `quaternaryLabel` | `#3C3C43` (alpha 0.18) | `#EBEBF5` (alpha 0.16) |

**Separator Colors:**

| Color | Light | Dark |
|-------|-------|------|
| `separator` | `#3C3C43` (alpha 0.29) | `#545458` (alpha 0.6) |
| `opaqueSeparator` | `#C6C6C8` | `#38383A` |

### 4.4 Custom Brand Colors with DynamicColorIOS

For brand-specific colors that need to adapt to light/dark:

```tsx
import { DynamicColorIOS, Platform } from 'react-native';

const brandColors = {
  warmBackground: Platform.OS === 'ios'
    ? DynamicColorIOS({ light: '#FFFAF2', dark: '#1A1408' })
    : '#FFFAF2',
  brandPrimary: Platform.OS === 'ios'
    ? DynamicColorIOS({
        light: '#B06D1E',
        dark: '#FFBA70',
        highContrastLight: '#8A5515',
        highContrastDark: '#FFD4A0',
      })
    : '#B06D1E',
};
```

### 4.5 React Navigation Theme Integration

Expo Router manages the navigation container, so use `ThemeProvider` from `@react-navigation/native`:

```tsx
import { ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';

// The navigation theme should match your app theme
const navigationTheme = {
  dark: isDark,
  colors: {
    primary: colors.primary,       // Brand/tint color
    background: colors.background, // Screen backgrounds
    card: colors.surface,          // Header/tab bar background
    text: colors.onBackground,     // Text on screens
    border: colors.outline,        // Header/tab bar borders
    notification: colors.error,    // Badge color
  },
};
```

### 4.6 Rules for Consistent Theming

1. **Never call `useColorScheme()` in individual components.** Always use `useTheme()` / `useThemeColors()` / `useIsDarkMode()` from your centralized context.

2. **Never hardcode hex colors for standard UI elements.** Use `PlatformColor()` on iOS or theme colors from context.

3. **Brand colors are the exception.** Your primary brand color (`#B06D1E`) and warm background (`#FFFAF2`) are correctly defined once in `ThemeContext.tsx`.

4. **Text on glass surfaces must use `PlatformColor('label')` or `PlatformColor('labelColor')`.** This ensures automatic contrast adaptation against the glass material.

5. **Test both light and dark mode.** Glass effects look distinctly different in each mode.

---

## 5. Reusable Glass Components

### 5.1 GlassCard (General Purpose)

Use for any card-like container that should have a glass appearance.

```tsx
// components/ui/GlassCard.tsx
import React from 'react';
import { View, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';

let NativeGlassView: any = null;
let glassAvailable = false;

if (Platform.OS === 'ios') {
  try {
    const glassModule = require('expo-glass-effect');
    if (glassModule.isGlassEffectAPIAvailable?.()) {
      NativeGlassView = glassModule.GlassView;
      glassAvailable = true;
    }
  } catch {}
}

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'regular' | 'clear';
  interactive?: boolean;
  tintColor?: string;
  /** Fallback blur intensity for non-iOS-26 devices (1-100) */
  blurIntensity?: number;
  /** Show drop shadow */
  shadow?: boolean;
  /** Show border stroke */
  border?: boolean;
}

export function GlassCard({
  children,
  style,
  variant = 'regular',
  interactive = false,
  tintColor,
  blurIntensity = 60,
  shadow = true,
  border = true,
}: GlassCardProps) {
  // iOS 26: Use native Liquid Glass
  if (glassAvailable && NativeGlassView) {
    return (
      <View style={[shadow && shadowStyle, style]}>
        <NativeGlassView
          style={[styles.card]}
          glassEffectStyle={variant}
          isInteractive={interactive}
          tintColor={tintColor}
        >
          {children}
        </NativeGlassView>
      </View>
    );
  }

  // Fallback: expo-blur
  return (
    <View style={[shadow && shadowStyle, { borderRadius: 20 }, style]}>
      <BlurView
        intensity={blurIntensity}
        tint="systemThinMaterial"
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={[
          styles.card,
          border && styles.border,
          { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
        ]}
      >
        {children}
      </BlurView>
    </View>
  );
}

const shadowStyle: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 8,
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 16,
  },
  border: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
});
```

### 5.2 GlassOverlay (Full-Screen Overlay / Modal Backdrop)

```tsx
// components/ui/GlassOverlay.tsx
import React from 'react';
import { StyleSheet, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassOverlayProps {
  visible: boolean;
  onDismiss?: () => void;
  children: React.ReactNode;
  intensity?: number;
}

export function GlassOverlay({
  visible,
  onDismiss,
  children,
  intensity = 40,
}: GlassOverlayProps) {
  if (!visible) return null;

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss}>
      <BlurView
        tint="dark"
        intensity={intensity}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFill}
      />
      <Pressable onPress={(e) => e.stopPropagation()}>
        {children}
      </Pressable>
    </Pressable>
  );
}
```

### 5.3 GlassPill (Tab Bar Items, Tags, Chips)

```tsx
// components/ui/GlassPill.tsx
import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassPillProps {
  label: string;
  onPress?: () => void;
  active?: boolean;
}

export function GlassPill({ label, onPress, active = false }: GlassPillProps) {
  return (
    <Pressable onPress={onPress}>
      <View style={[styles.wrapper, active && styles.activeWrapper]}>
        <BlurView
          tint={active ? 'systemMaterial' : 'systemThinMaterial'}
          intensity={active ? 80 : 50}
          style={styles.pill}
        >
          <Text style={[styles.text, active && styles.activeText]}>
            {label}
          </Text>
        </BlurView>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  activeWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: Platform.OS === 'ios' ? undefined : '#666',
    ...(Platform.OS === 'ios' && { color: undefined }),
  },
  activeText: {
    fontWeight: '600',
  },
});
```

---

## 6. Edge-to-Edge Content Layout

### 6.1 The iOS 26 Layout Model

Content fills the full screen. Translucent chrome (header, tab bar) floats above. Content scrolls behind the glass layers.

### 6.2 With NativeTabs (Your Setup)

`NativeTabs` uses `UITabBarController` which handles safe area insets automatically. You do NOT need to add manual bottom padding for tab screens.

For screens within tabs:

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

function TabScreen() {
  return (
    // Exclude bottom edge -- the native tab bar handles it
    <SafeAreaView edges={['right', 'top', 'left']} style={{ flex: 1 }}>
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={items}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}
```

### 6.3 With Transparent Headers

For screens that use `headerTransparent: true`:

```tsx
import { useHeaderHeight } from '@react-navigation/elements';

function DetailScreen() {
  const headerHeight = useHeaderHeight();

  return (
    <ScrollView
      contentContainerStyle={{ paddingTop: headerHeight }}
      scrollIndicatorInsets={{ top: headerHeight }}
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Content */}
    </ScrollView>
  );
}
```

### 6.4 Android Edge-to-Edge

Already configured correctly in your `_layout.tsx`:

```tsx
NavigationBar.setBackgroundColorAsync('transparent');
NavigationBar.setPositionAsync('absolute');
NavigationBar.setButtonStyleAsync(colorScheme === 'dark' ? 'light' : 'dark');
```

With Expo SDK 54 / RN 0.81 targeting Android 16, edge-to-edge is enabled by default and cannot be disabled.

---

## 7. Performance Guidelines

### 7.1 Blur Performance Rules

| Rule | Detail |
|------|--------|
| Max 1-2 blur layers per screen | Each BlurView compounds GPU/CPU cost |
| Use overlays, not stacks | For modals, use one BlurView + z-indexed content |
| GPU acceleration (Android) | `renderToHardwareTextureAndroid={true}` on wrapper Views |
| No blur in FlatList items | Blur per-cell kills scroll performance; use memoized static containers |
| Moderate intensity | `intensity > 80` degrades on low-end Android devices |
| Native glass is cheaper | `expo-glass-effect` uses `UIVisualEffectView` directly -- more efficient than BlurView |
| NativeTabs blur is free | The GPU renders native tab bar blur with zero JS overhead |
| Reanimated for animations | Always use `useAnimatedProps` worklets, not JS `Animated` |

### 7.2 Animated BlurView Pattern

```tsx
import Animated, { useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

function AnimatedGlass() {
  const blurIntensity = useSharedValue(0);

  const animatedProps = useAnimatedProps(() => ({
    intensity: blurIntensity.value,
  }));

  useEffect(() => {
    blurIntensity.value = withTiming(80, { duration: 600 });
  }, []);

  return (
    <AnimatedBlurView
      animatedProps={animatedProps}
      tint="systemThinMaterial"
      style={StyleSheet.absoluteFill}
    />
  );
}
```

### 7.3 Device-Adaptive Blur

```tsx
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export function getOptimalBlurIntensity(): number {
  if (Platform.OS === 'ios') return 80;  // iOS handles blur efficiently
  const year = Device.deviceYearClass;
  if (year && year < 2020) return 20;
  if (year && year < 2022) return 40;
  return 60;
}
```

---

## 8. Library Decision Matrix

| UI Need | Best Library | Alternative | Notes |
|---------|-------------|-------------|-------|
| **Tab bar** | `NativeTabs` (expo-router) | `@react-navigation/bottom-tabs` | NativeTabs = automatic iOS 26 glass |
| **Glass cards** | `expo-glass-effect` | `@callstack/liquid-glass` | Already installed |
| **Blur effects** | `expo-blur` | `@react-native-community/blur` | Already installed |
| **Glass merging** | `@callstack/liquid-glass` | -- | Only if you need merging effect |
| **Context menus** | `react-native-ios-context-menu` | `zeego` (cross-platform) | Already installed; auto glass on iOS 26 |
| **Action sheets** | `ActionSheetIOS` | `@expo/react-native-action-sheet` | Native = auto glass |
| **Bottom sheets** | `@gorhom/bottom-sheet` | Expo Router `formSheet` | Already installed |
| **Segmented control** | `@react-native-segmented-control` | -- | Already installed; auto glass on iOS 26 |
| **SF Symbols** | `expo-symbols` | `@expo/vector-icons` | Already installed |
| **Haptics** | `expo-haptics` | -- | Already installed |
| **Alerts** | `Alert.alert()` | Custom modal + GlassView | Native = auto glass |
| **Search bar** | `headerSearchBarOptions` | Custom glass search | Native integration |
| **Navigation header** | `headerBlurEffect` | BlurView `headerBackground` | Already configured |

---

## 9. Migration Checklist

### Phase 1: Foundation (Low Risk)

- [ ] Add `minimizeBehavior="onScrollDown"` to `<NativeTabs>` in `(tabs)/_layout.tsx`
- [ ] Consider adding `role="search"` to the Discover tab trigger
- [ ] Ensure `contentInsetAdjustmentBehavior="automatic"` on all ScrollViews/FlatLists
- [ ] Update `react-native-screens` to the latest patch (check for iOS 26 fixes beyond 4.16.0)
- [ ] Verify `app.json` has `"userInterfaceStyle": "automatic"`

### Phase 2: Glass Components (Medium Effort)

- [ ] Create `GlassCard` reusable component (Section 5.1)
- [ ] Create `GlassOverlay` reusable component (Section 5.2)
- [ ] Apply `GlassCard` to card-like elements across the app
- [ ] Use `GlassView` from `expo-glass-effect` in bottom sheets via `@gorhom/bottom-sheet`
- [ ] Test glass rendering on real iOS 26 device

### Phase 3: Theme Cleanup (Medium Effort)

- [ ] Audit all components for hardcoded hex colors -- replace with `useThemeColors()` or `PlatformColor()`
- [ ] Replace any remaining `useColorScheme()` calls in individual components with `useTheme()`
- [ ] Use `PlatformColor('labelColor')` for all text rendered on glass surfaces
- [ ] Add `DynamicColorIOS` for brand colors that need light/dark adaptation
- [ ] Test full app flow in both light and dark mode

### Phase 4: Per-Screen Polish (High Effort)

- [ ] Review every screen for proper SafeAreaView edges configuration
- [ ] Add `headerTransparent: true` to detail screens (non-headerLargeTitle) for blur headers
- [ ] Apply haptic feedback to all interactive elements per the haptics table (Section 3.11)
- [ ] Convert any custom dropdown/picker menus to native context menus
- [ ] Ensure all modals use `formSheet` presentation or glass bottom sheets
- [ ] Test scroll behaviors with auto-minimizing tab bar

### Phase 5: Advanced (Optional)

- [ ] Consider `@callstack/liquid-glass` for merging glass elements
- [ ] Add scroll-driven blur animations on key screens using Reanimated
- [ ] Implement device-adaptive blur intensity for Android
- [ ] Consider `expo-progressive-blur` for scroll headers
- [ ] Add SF Symbol animations to key interactions

---

## Known Issues & Workarounds

| Issue | Description | Workaround |
|-------|-------------|------------|
| NativeTabs icon tint (expo#39930) | Icon color inverts when scrolling over light/dark content | Awaiting fix from Expo team |
| FlatList + NativeTabs | scroll-to-top and minimize-on-scroll don't work with FlatList | Use `disableTransparentOnScrollEdge` prop |
| Inverted FlatList (screens#3293) | Header blur gradient renders incorrectly with `inverted={true}` | Avoid inverted FlatList in chat screens with blur headers |
| Large title overlap (screens#3315) | Titles overlap when navigating back | Update react-native-screens to latest |
| Modal content hidden (screens#3113) | Content hidden under header on `presentation: "modal"` | Awaiting fix |
| Custom header clipping (nav#12894) | Custom headers get rounded/clipped during transitions | Use native header instead of custom |
| GlassView opacity | Setting opacity < 1 on GlassView or parents causes rendering artifacts | Never reduce opacity on glass elements |
| GlassView isInteractive | Cannot toggle dynamically | Remount with different `key` |

---

## Sources

- [Apple WWDC 2025 - iOS 26 Liquid Glass](https://developer.apple.com/wwdc25/)
- [Apple Human Interface Guidelines - iOS 26](https://developer.apple.com/design/human-interface-guidelines/)
- [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54)
- [Expo Glass Effect Documentation](https://docs.expo.dev/versions/latest/sdk/glass-effect/)
- [Expo BlurView Documentation](https://docs.expo.dev/versions/latest/sdk/blur-view/)
- [Expo Native Tabs Documentation](https://docs.expo.dev/router/advanced/native-tabs/)
- [Expo Native Tabs API Reference](https://docs.expo.dev/versions/latest/sdk/router-native-tabs/)
- [Callstack - How To Use Liquid Glass in React Native](https://www.callstack.com/blog/how-to-use-liquid-glass-in-react-native)
- [Callstack liquid-glass GitHub](https://github.com/callstack/liquid-glass)
- [React Navigation - Native Stack Navigator](https://reactnavigation.org/docs/native-stack-navigator/)
- [React Navigation - Themes](https://reactnavigation.org/docs/themes/)
- [react-native-screens GitHub](https://github.com/software-mansion/react-native-screens)
- [Expo Blog - Liquid Glass with SwiftUI](https://expo.dev/blog/liquid-glass-app-with-expo-ui-and-swiftui)
- [amillionmonkeys - Expo Liquid Glass Tab Bar](https://www.amillionmonkeys.co.uk/blog/expo-liquid-glass-tab-bar-ios)
- [amanhimself - Header Blur Effect in Expo Router](https://amanhimself.dev/blog/blur-effect-in-header-with-expo-router/)
- [Zeego Documentation](https://zeego.dev/components/context-menu)
