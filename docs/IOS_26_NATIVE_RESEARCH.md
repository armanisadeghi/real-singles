# iOS 26 Native UI/UX & Light/Dark Mode Research

> **Research Date:** January 2026  
> **Source:** Web research from official documentation and verified sources  
> **Purpose:** Provide accurate, verified information for iOS 26 native implementation in React Native/Expo

---

## Table of Contents

1. [Tech Stack Versions](#tech-stack-versions)
2. [iOS 26 Liquid Glass Design](#ios-26-liquid-glass-design)
3. [Native Colors & Dark Mode](#native-colors--dark-mode)
4. [Expo Libraries for iOS 26](#expo-libraries-for-ios-26)
5. [SF Symbols 7](#sf-symbols-7)
6. [Accessibility Considerations](#accessibility-considerations)
7. [Common Mistakes to Avoid](#common-mistakes-to-avoid)
8. [Correct Implementation Patterns](#correct-implementation-patterns)
9. [iOS 26 Common UI Patterns & Components](#ios-26-common-ui-patterns--components)
   1. [Bottom Tab Bar (Floating / Pill-Shaped)](#1-bottom-tab-bar-floating--pill-shaped)
   2. [Top Navigation Bar (Header with Large Title)](#2-top-navigation-bar-header-with-large-title)
   3. [Search Bar](#3-search-bar)
   4. [Context Menus (Long-Press Menus)](#4-context-menus-long-press-menus)
   5. [Action Sheets](#5-action-sheets)
   6. [Alerts](#6-alerts)
   7. [Lists / TableViews](#7-lists--tableviews-grouped--inset-grouped)
   8. [Pull-to-Refresh](#8-pull-to-refresh)
   9. [Haptic Feedback](#9-haptic-feedback)
   10. [SF Symbols](#10-sf-symbols)
   11. [Sheets / Modals](#11-sheets--modals-bottom-sheets--modal-presentations)
   12. [Segmented Controls](#12-segmented-controls)
10. [Liquid Glass Libraries Summary](#liquid-glass-libraries-summary)
11. [Component Library Decision Matrix](#component-library-decision-matrix)

---

## Tech Stack Versions

**Current project versions (from `mobile/package.json`):**

| Package | Version |
|---------|---------|
| Expo SDK | 54.0.32 |
| React Native | 0.81.5 |
| React | 19.1.0 |
| expo-glass-effect | ~0.1.8 |
| expo-symbols | ~1.0.8 |
| expo-blur | ~15.0.8 |
| react-native-reanimated | ~4.1.6 |

**Key Requirements:**
- **Xcode 26** is required to compile apps with iOS 26 Liquid Glass support
- **iOS 26+** is required for `GlassView` (falls back to regular `View` on older iOS)
- **React Native 0.81** deprecates built-in `<SafeAreaView>` in favor of `react-native-safe-area-context`

---

## iOS 26 Liquid Glass Design

### What is Liquid Glass?

Liquid Glass is Apple's major design overhaul for iOS 26—the first significant iOS design update since iOS 7 (2013). It uses translucency, blur, and fluid motion to create interfaces inspired by real glass.

**Key characteristics:**
- Translucent, glassmorphic design elements that reflect and refract surroundings
- Dynamic response to movement with reflective highlights using real-time rendering
- App icons designed as layered glass with subtle depth
- Navigation bars, tab bars, and toolbars now float on glass surfaces
- Content can expand underneath UI elements with blurry overlay effects

### Automatic Adoption

Apps using native SwiftUI/UIKit controls get Liquid Glass **automatically** when recompiled with Xcode 26:
- Tab bars
- Navigation bars
- Toolbars
- Sheets
- Alerts

### Expo Implementation

**`expo-glass-effect`** provides native iOS liquid glass effects:

```tsx
import { GlassView, GlassContainer, isLiquidGlassAvailable } from 'expo-glass-effect';

// Check availability before using
if (isLiquidGlassAvailable()) {
  // Use GlassView
}

// Basic usage
<GlassView 
  style={styles.glass}
  glassEffectStyle="regular" // or "clear"
  tintColor="#FF5733" // optional
/>

// Combined glass effects
<GlassContainer spacing={10}>
  <GlassView style={styles.glass1} isInteractive />
  <GlassView style={styles.glass2} />
</GlassContainer>
```

**Important `GlassView` limitations:**
1. Only available on iOS 26+ (falls back to regular `View` on older versions)
2. `isInteractive` prop can only be set once on mount—cannot change dynamically
3. **NEVER set `opacity` < 1 on `GlassView` or parent views** — causes rendering issues
4. Use `isGlassEffectAPIAvailable()` to check runtime availability (some iOS 26 betas lack the API)

### BlurView vs GlassView

| Feature | `expo-blur` (BlurView) | `expo-glass-effect` (GlassView) |
|---------|------------------------|----------------------------------|
| Platform | iOS, Android, tvOS, Web | iOS 26+, tvOS only |
| Effect | Standard blur | iOS 26 Liquid Glass |
| Props | `intensity`, `tint` | `glassEffectStyle`, `tintColor` |
| Use case | Cross-platform blur | iOS 26 premium glass aesthetic |
| Fallback | Works everywhere | Falls back to plain `View` |

**Recommendation:** Use `BlurView` for cross-platform, `GlassView` only when specifically targeting iOS 26+ premium look.

---

## Native Colors & Dark Mode

### The Golden Rule

**NEVER hardcode hex colors.** Use platform-native colors that automatically adapt to light/dark mode.

### React Native Color APIs

#### 1. `PlatformColor` (Cross-platform)

Accesses native platform semantic colors by name:

```tsx
import { PlatformColor, Platform } from 'react-native';

const styles = StyleSheet.create({
  text: {
    color: PlatformColor('label'), // iOS semantic color
  },
  background: {
    backgroundColor: PlatformColor('systemBackground'),
  },
  error: {
    color: Platform.select({
      ios: PlatformColor('systemRed'),
      android: PlatformColor('@android:color/holo_red_dark'),
    }),
  },
});
```

**Important:** `PlatformColor` only works for the current system theme. You cannot access dark mode colors while the system is in light mode.

#### 2. `DynamicColorIOS` (iOS only)

Define custom colors with light/dark variants:

```tsx
import { DynamicColorIOS, Platform } from 'react-native';

const dynamicColor = Platform.OS === 'ios' ? DynamicColorIOS({
  light: '#000000',
  dark: '#FFFFFF',
  highContrastLight: '#000000', // optional
  highContrastDark: '#FFFFFF',  // optional
}) : '#000000';
```

**When to use each:**
- `PlatformColor`: When you want to use Apple's built-in semantic colors (recommended)
- `DynamicColorIOS`: When you need custom brand colors that still adapt to light/dark mode

### Complete iOS Semantic Color Reference

#### Background Colors

| Color Name | Light Mode | Dark Mode | Use Case |
|------------|------------|-----------|----------|
| `systemBackground` | #FFFFFF | #000000 | Main view background |
| `secondarySystemBackground` | #F2F2F7 | #1C1C1E | Grouped content within main view |
| `tertiarySystemBackground` | #FFFFFF | #2C2C2E | Third layer grouping |
| `systemGroupedBackground` | #F2F2F7 | #000000 | Grouped table view background |
| `secondarySystemGroupedBackground` | #FFFFFF | #1C1C1E | Cells within grouped tables |
| `tertiarySystemGroupedBackground` | #F2F2F7 | #2C2C2E | Secondary content in grouped tables |

#### Label/Text Colors

| Color Name | Light Mode | Dark Mode | Use Case |
|------------|------------|-----------|----------|
| `label` | #000000 | #FFFFFF | Primary text |
| `secondaryLabel` | #3C3C43 (60%) | #EBEBF5 (60%) | Secondary text |
| `tertiaryLabel` | #3C3C43 (30%) | #EBEBF5 (30%) | Tertiary text |
| `quaternaryLabel` | #3C3C43 (18%) | #EBEBF5 (18%) | Quaternary text |
| `placeholderText` | #3C3C43 (30%) | #EBEBF5 (30%) | Placeholder in inputs |

#### Fill Colors

| Color Name | Use Case |
|------------|----------|
| `systemFill` | Thin/small shapes (slider tracks) |
| `secondarySystemFill` | Medium shapes (switch backgrounds) |
| `tertiarySystemFill` | Large shapes (input fields, buttons) |
| `quaternarySystemFill` | Large complex areas |

#### Other UI Colors

| Color Name | Use Case |
|------------|----------|
| `separator` | Translucent separators |
| `opaqueSeparator` | Opaque separators (blocks content beneath) |
| `link` | Hyperlinks |
| `systemGray` - `systemGray6` | Six levels of gray |

#### Tint Colors (Adaptable)

These colors automatically adjust for vibrancy in both light and dark modes:

| Color Name |
|------------|
| `systemRed` |
| `systemOrange` |
| `systemYellow` |
| `systemGreen` |
| `systemMint` |
| `systemTeal` |
| `systemCyan` |
| `systemBlue` |
| `systemIndigo` |
| `systemPurple` |
| `systemPink` |
| `systemBrown` |

### Detecting Color Scheme

#### `useColorScheme` Hook

```tsx
import { useColorScheme } from 'react-native';

function MyComponent() {
  const colorScheme = useColorScheme(); // 'light' | 'dark' | null
  
  return (
    <View style={{
      backgroundColor: colorScheme === 'dark' ? '#000' : '#FFF'
    }}>
      {/* ... */}
    </View>
  );
}
```

**Known Issue:** On iOS, `useColorScheme` can incorrectly change values when the app is backgrounded, causing screen flickers. The hook may report wrong values briefly when returning from background.

#### `Appearance` API

```tsx
import { Appearance } from 'react-native';

// Get current color scheme
const scheme = Appearance.getColorScheme(); // 'light' | 'dark' | null

// Listen for changes
const subscription = Appearance.addChangeListener(({ colorScheme }) => {
  console.log('Color scheme changed to:', colorScheme);
});

// Force a specific scheme (overrides system)
Appearance.setColorScheme('dark'); // or 'light' or null (follow system)

// Clean up listener
subscription.remove();
```

### Expo Configuration

In `app.json`:

```json
{
  "expo": {
    "userInterfaceStyle": "automatic",
    "ios": {
      "userInterfaceStyle": "automatic"
    },
    "android": {
      "userInterfaceStyle": "automatic"
    }
  }
}
```

Options:
- `"automatic"` - Follow system preference (recommended)
- `"light"` - Force light mode
- `"dark"` - Force dark mode

---

## Expo Libraries for iOS 26

### expo-symbols (SF Symbols)

```tsx
import { SymbolView } from 'expo-symbols';

<SymbolView
  name="heart.fill"           // SF Symbol name
  type="hierarchical"         // monochrome | hierarchical | palette | multicolor
  size={24}                   // Default: 24
  tintColor={PlatformColor('systemRed')}  // Use semantic colors!
  weight="medium"             // ultraLight to black
  scale="medium"              // small | medium | large
  animationSpec={{
    effect: { type: 'bounce', direction: 'up' },
    repeating: false,
  }}
  fallback={<MaterialIcon name="favorite" />}  // For Android/Web
/>
```

**Symbol Types:**
- `monochrome`: Single color (uses `tintColor`)
- `hierarchical`: Color scheme from one source color with varying opacity
- `palette`: Multiple explicit colors (use `colors` prop)
- `multicolor`: Symbol's built-in multicolor variant

### expo-router/unstable-native-tabs

Native tab bars with iOS 26 Liquid Glass support:

```tsx
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon sf="house.fill" />  {/* SF Symbol for iOS */}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon sf="person.fill" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
```

**Requirements:**
- Expo SDK 54+
- Expo Router v6+
- React Native Screens 4.16.0+
- Must compile with Xcode 26 for Liquid Glass effect

---

## SF Symbols 7

SF Symbols 7 (iOS 26) includes:

### New Features

1. **Draw Animations**: Draw On/Draw Off animation presets inspired by handwriting
   - Whole Symbol (all layers together)
   - By Layer (offset timing)
   - Individually (one layer at a time)

2. **Variable Draw**: Extends Variable Color for conveying progress/strength

3. **Gradients**: Automatic linear gradients from a single source color

4. **Enhanced Magic Replace**: Greater continuity between related symbols during transitions

### Symbol Count

Over **6,900 symbols** available, with hundreds of new icons in SF Symbols 7.

### Usage in expo-symbols

```tsx
// Animated symbol
<SymbolView
  name="wifi"
  animationSpec={{
    effect: { 
      type: 'pulse',
      wholeSymbol: false  // Animate individual layers
    },
    repeating: true,
    speed: 1.0,
  }}
/>

// Variable color (progress indicator)
<SymbolView
  name="speaker.wave.3.fill"
  type="hierarchical"
  variableValue={0.7}  // 0.0 to 1.0
/>
```

---

## Accessibility Considerations

### Reduce Transparency

Users can enable "Reduce Transparency" in iOS settings, which should disable or minimize glass effects:

```tsx
import { AccessibilityInfo } from 'react-native';

// Check setting
const isReduceTransparencyEnabled = await AccessibilityInfo.isReduceTransparencyEnabled();

// Listen for changes
AccessibilityInfo.addEventListener('reduceTransparencyChanged', (isEnabled) => {
  // Fall back from glass effects to solid backgrounds
});
```

### Reduce Motion

Disable/minimize animations when enabled:

```tsx
const isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();

AccessibilityInfo.addEventListener('reduceMotionChanged', (isEnabled) => {
  // Disable symbol animations, transitions, etc.
});
```

### Other Accessibility APIs

```tsx
// Bold text preference
AccessibilityInfo.isBoldTextEnabled()

// Grayscale mode
AccessibilityInfo.isGrayscaleEnabled()

// Inverted colors
AccessibilityInfo.isInvertColorsEnabled()
```

---

## Common Mistakes to Avoid

### 1. Hardcoding Hex Colors

```tsx
// ❌ WRONG - Breaks dark mode
<Text style={{ color: '#000000' }}>Hello</Text>
<View style={{ backgroundColor: '#FFFFFF' }} />

// ✅ CORRECT - Automatically adapts
<Text style={{ color: PlatformColor('label') }}>Hello</Text>
<View style={{ backgroundColor: PlatformColor('systemBackground') }} />
```

### 2. Using DynamicColorIOS When PlatformColor Works

```tsx
// ❌ UNNECESSARY - Reinventing semantic colors
const textColor = DynamicColorIOS({
  light: '#000000',
  dark: '#FFFFFF',
});

// ✅ BETTER - Use built-in semantic colors
const textColor = PlatformColor('label');
```

### 3. Caching Color Scheme Values

```tsx
// ❌ WRONG - Won't update when scheme changes
const scheme = useColorScheme();
const cachedScheme = useRef(scheme).current; // Stale!

// ✅ CORRECT - Always use fresh value
function MyComponent() {
  const scheme = useColorScheme();
  // Use scheme directly in render
}
```

### 4. Setting Opacity on GlassView

```tsx
// ❌ WRONG - Causes rendering issues
<GlassView style={{ opacity: 0.8 }} />
<View style={{ opacity: 0.5 }}>
  <GlassView />
</View>

// ✅ CORRECT - No opacity manipulation
<GlassView style={{ flex: 1 }} />
```

### 5. Not Checking Glass Availability

```tsx
// ❌ WRONG - May crash on some iOS 26 betas
<GlassView style={styles.glass} />

// ✅ CORRECT - Check availability first
import { isGlassEffectAPIAvailable, GlassView } from 'expo-glass-effect';

{isGlassEffectAPIAvailable() ? (
  <GlassView style={styles.glass} />
) : (
  <BlurView style={styles.glass} intensity={80} />
)}
```

### 6. Mixing Background Stacks

```tsx
// ❌ WRONG - Mixing grouped and non-grouped backgrounds
<View style={{ backgroundColor: PlatformColor('systemBackground') }}>
  <View style={{ backgroundColor: PlatformColor('secondarySystemGroupedBackground') }}>
    {/* Inconsistent! */}
  </View>
</View>

// ✅ CORRECT - Use consistent stack
<View style={{ backgroundColor: PlatformColor('systemGroupedBackground') }}>
  <View style={{ backgroundColor: PlatformColor('secondarySystemGroupedBackground') }}>
    {/* Consistent grouped stack */}
  </View>
</View>
```

### 7. Fighting Native Tab Bar Behavior

```tsx
// ❌ WRONG - Overriding native behavior
<Tab.Navigator
  tabBarStyle={{
    backgroundColor: '#FFFFFF',  // Hardcoded, fights Liquid Glass
    borderTopColor: '#E0E0E0',   // Manual border
  }}
/>

// ✅ CORRECT - Let native handle it
// Use expo-router/unstable-native-tabs and let iOS handle the Liquid Glass appearance
```

---

## Correct Implementation Patterns

### Pattern 1: Theme-Aware Component

```tsx
import { View, Text, PlatformColor, Platform, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';

function Card({ title, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <SymbolView 
          name="star.fill" 
          tintColor={PlatformColor('systemYellow')}
          size={20}
        />
        <Text style={styles.title}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PlatformColor('secondarySystemGroupedBackground'),
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: PlatformColor('label'),
    fontSize: 17,
    fontWeight: '600',
  },
});
```

### Pattern 2: Custom Brand Colors with Dark Mode

```tsx
import { DynamicColorIOS, Platform, StyleSheet } from 'react-native';

// Define brand colors with light/dark variants
const brandColors = {
  primary: Platform.OS === 'ios' 
    ? DynamicColorIOS({ light: '#E91E63', dark: '#F48FB1' })
    : '#E91E63',
  
  primaryText: Platform.OS === 'ios'
    ? DynamicColorIOS({ light: '#FFFFFF', dark: '#000000' })
    : '#FFFFFF',
};

function BrandButton({ title, onPress }) {
  return (
    <Pressable 
      style={styles.button}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: brandColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: brandColors.primaryText,
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### Pattern 3: Conditional Glass Effect

```tsx
import { View, StyleSheet } from 'react-native';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';

function GlassCard({ children }) {
  const Container = isGlassEffectAPIAvailable() ? GlassView : BlurView;
  const containerProps = isGlassEffectAPIAvailable() 
    ? { glassEffectStyle: 'regular' }
    : { intensity: 80, tint: 'light' };

  return (
    <Container style={styles.card} {...containerProps}>
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
  },
});
```

### Pattern 4: Accessibility-Aware Theming

```tsx
import { useEffect, useState } from 'react';
import { AccessibilityInfo, View, PlatformColor, StyleSheet } from 'react-native';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';

function AccessibleCard({ children }) {
  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceTransparencyEnabled().then(setReduceTransparency);
    
    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduceTransparency
    );
    
    return () => subscription.remove();
  }, []);

  // Use solid background when transparency is reduced or Glass API unavailable
  if (reduceTransparency || !isGlassEffectAPIAvailable()) {
    return (
      <View style={styles.solidCard}>
        {children}
      </View>
    );
  }

  return (
    <GlassView style={styles.glassCard}>
      {children}
    </GlassView>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    borderRadius: 16,
    padding: 20,
  },
  solidCard: {
    backgroundColor: PlatformColor('secondarySystemBackground'),
    borderRadius: 16,
    padding: 20,
  },
});
```

---

## Quick Reference

### Essential PlatformColor Values for iOS

```tsx
// Backgrounds
PlatformColor('systemBackground')
PlatformColor('secondarySystemBackground')
PlatformColor('systemGroupedBackground')

// Text
PlatformColor('label')
PlatformColor('secondaryLabel')
PlatformColor('placeholderText')

// UI Elements
PlatformColor('separator')
PlatformColor('link')

// Semantic Colors
PlatformColor('systemRed')
PlatformColor('systemBlue')
PlatformColor('systemGreen')
// ... etc
```

### When to Use What

| Scenario | Solution |
|----------|----------|
| Standard text | `PlatformColor('label')` |
| Secondary text | `PlatformColor('secondaryLabel')` |
| Main backgrounds | `PlatformColor('systemBackground')` |
| Card backgrounds | `PlatformColor('secondarySystemBackground')` |
| Custom brand colors | `DynamicColorIOS({ light: '...', dark: '...' })` |
| System action colors | `PlatformColor('systemBlue')`, etc. |
| Error/destructive | `PlatformColor('systemRed')` |
| Success | `PlatformColor('systemGreen')` |

---

## iOS 26 Common UI Patterns & Components

> **Research Date:** January 29, 2026
> **Focus:** The 12 most common UI patterns in iOS 26 apps and how to implement each in React Native/Expo

---

### 1. Bottom Tab Bar (Floating / Pill-Shaped)

#### What Changed in iOS 26

The tab bar is one of the most dramatic visual changes in iOS 26. It is no longer edge-to-edge and pinned to the bottom. Instead, it is a **floating capsule/pill shape** inset from screen edges, using Liquid Glass translucency. Key behavior changes:

- **Capsule shape**: A small rounded pill at the bottom of the screen
- **Fewer tabs work better**: Even 2-tab apps look good because the capsule adapts to content
- **Minimize on scroll**: The tab bar shrinks when scrolling down and reappears on scroll up
- **Search tab separation**: A search tab can be visually separated from the main tabs as a detached circular button
- **Floating Action Button (FAB) pattern**: iOS 26 separates one primary action (Search, New Message, etc.) from the rest of the navigation; it sits slightly detached to the right of the tab bar
- **Glass refraction**: Active tab bars refract the content behind them in real time
- **Bottom accessories**: Apple introduced `tabViewBottomAccessory` for persistent controls (like media players) below the tab bar

#### React Native Implementation

**Recommended: `expo-router/unstable-native-tabs` (NativeTabs)**

This is the only approach that gives you the true native iOS 26 floating pill tab bar. It uses the system `UITabBarController` under the hood, so Liquid Glass, minimize behavior, and all native animations come for free.

```tsx
import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs
      minimizeBehavior="onScrollDown" // iOS 26: auto-hide on scroll
    >
      {/* Regular tabs */}
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="discover">
        <NativeTabs.Trigger.Icon sf={{ default: 'sparkles', selected: 'sparkles' }} md="explore" />
        <NativeTabs.Trigger.Label>Discover</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="messages">
        <NativeTabs.Trigger.Icon sf={{ default: 'bubble.left', selected: 'bubble.left.fill' }} md="chat" />
        <NativeTabs.Trigger.Label>Messages</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Badge>3</NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      {/* Separated search tab (iOS 26 circular button) */}
      <NativeTabs.Trigger name="search" role="search">
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
```

**NativeTabs Props:**

| Prop | Platform | Values | Description |
|------|----------|--------|-------------|
| `minimizeBehavior` | iOS 26+ | `'automatic'` \| `'never'` \| `'onScrollDown'` \| `'onScrollUp'` | Controls auto-hide |
| `tintColor` | All | Color | Selected icon/label tint |
| `backgroundColor` | All | Color | Tab bar background |
| `blurEffect` | iOS | BlurTint | Blur type |
| `hidden` | All | boolean | Hide tab bar entirely |

**Per-trigger tab bar styling:**

```tsx
<NativeTabs.Trigger name="index">
  <NativeTabs.Trigger.TabBar backgroundColor="transparent" />
  {/* ... */}
</NativeTabs.Trigger>
```

**Nesting a Stack inside tabs (for headers/push navigation):**

NativeTabs do NOT include a mock JavaScript header like `<Tabs />`. You must nest a native `<Stack />` inside each tab to get headers and push screen support.

**Known issues:**
- NativeTabs display as standard tabs on iOS 18 (no pill shape)
- Custom headers can displace the tab bar downward
- Badge cropping when `role="search"` is set
- Max 5 tabs on Android (Material Tabs limitation)

**Alternative: Custom floating tab bar (JS)**

For full visual control or Android parity, use `expo-router/ui` custom tabs or `react-native-floating-tab`:

```tsx
// expo-router custom tabs approach
import { TabList, TabTrigger, TabSlot, Tabs } from 'expo-router/ui';

export default function CustomTabs() {
  return (
    <Tabs>
      <TabSlot />
      <TabList style={styles.floatingBar}>
        <TabTrigger name="home" style={styles.tab}>
          <SymbolView name="house.fill" size={22} />
        </TabTrigger>
        {/* more tabs */}
      </TabList>
    </Tabs>
  );
}
```

**Sources:**
- [Expo Native Tabs Docs](https://docs.expo.dev/router/advanced/native-tabs/)
- [Expo Native Tabs API](https://docs.expo.dev/versions/latest/sdk/router-native-tabs/)
- [Ryan Ashcraft - iOS 26 Tab Bar Analysis](https://ryanashcraft.com/ios-26-tab-bar-beef/)
- [Donny Wals - Tab bars on iOS 26](https://www.donnywals.com/exploring-tab-bars-on-ios-26-with-liquid-glass/)
- [Apple HIG - Tab Bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)

---

### 2. Top Navigation Bar (Header with Large Title)

#### What Changed in iOS 26

Navigation bars now use Liquid Glass translucency. The large title pattern (introduced in iOS 11) remains but with updated visuals:
- **Automatic blur**: iOS 26 automatically applies blur behind the header when content scrolls underneath -- no need to set `headerBlurEffect` manually
- **`scrollEdgeEffects`**: New iOS 26-only prop for configuring edge effects (`automatic`, `hard`, `soft`, `hidden`)
- **Floating appearance**: Headers no longer feel pinned; they float like glass over content
- **System handles corner radii**: iOS 26 enforces specific corner radii on containers that cannot be overridden

#### React Native Implementation

**Using `@react-navigation/native-stack` or `expo-router` Stack:**

```tsx
import { Stack } from 'expo-router';
import { Platform } from 'react-native';

// Helper to detect iOS 26+
const isIOS26 = Platform.OS === 'ios' && parseInt(Platform.Version as string, 10) >= 26;

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        // Large title (collapses on scroll)
        headerLargeTitle: true,
        headerLargeTitleShadowVisible: false,

        // Translucent header
        headerTransparent: true,

        // iOS 26 handles blur automatically; older iOS needs explicit blur
        headerBlurEffect: isIOS26 ? undefined : 'regular',

        // iOS 26 scroll edge effects
        ...(isIOS26 && {
          scrollEdgeEffects: { top: 'automatic' },
        }),
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Messages' }} />
    </Stack>
  );
}
```

**Critical: `contentInsetAdjustmentBehavior`**

For large titles to collapse properly, your scrollable content MUST set:

```tsx
<FlatList
  contentInsetAdjustmentBehavior="automatic"
  // ... other props
/>

// or
<ScrollView contentInsetAdjustmentBehavior="automatic">
  {/* content */}
</ScrollView>
```

This tells the ScrollView to automatically adjust content insets to account for the navigation bar height.

**Animated header height (for custom layouts):**

```tsx
import { useAnimatedHeaderHeight } from '@react-navigation/native-stack';

function MyScreen() {
  const headerHeight = useAnimatedHeaderHeight();
  // Use headerHeight for animated content offset
}
```

**Known issues on iOS 26:**
- `headerLargeTitle` disappeared in early Xcode 26 betas (fixed in later versions)
- Back navigation can break after using `headerSearchBarOptions`
- Custom header components get clipped during the new iOS 26 navigation transition
- Header buttons may not vertically center correctly
- Large transparent header titles can overlap when navigating back

**Sources:**
- [React Navigation Native Stack Docs](https://reactnavigation.org/docs/native-stack-navigator/)
- [Aman Mittal - Large Header Title in Expo Router](https://amanhimself.dev/blog/large-header-title-in-expo-router/)
- [Aman Mittal - Blur Effect in Header](https://amanhimself.dev/blog/blur-effect-in-header-with-expo-router/)

---

### 3. Search Bar

#### What Changed in iOS 26

One of the biggest shifts is the **relocation of search to the bottom** of the screen. In iOS 26:
- Search is positioned at the bottom across most apps (following Samsung's One UI philosophy -- thumbs don't reach the top of tall screens)
- The search tab in the tab bar morphs from a circular icon to a full search field with a smooth animation
- Pull-down search from the navigation bar still exists but is supplemented by bottom search

#### React Native Implementation

**Option A: Native Stack Search Bar (top, integrated in navigation)**

```tsx
<Stack.Screen
  options={{
    headerSearchBarOptions: {
      placeholder: 'Search people...',
      onChangeText: (event) => {
        setSearchQuery(event.nativeEvent.text);
      },
      onCancelButtonPress: () => setSearchQuery(''),
      hideWhenScrolling: true, // Hide on scroll (default)
      autoCapitalize: 'none',
    },
  }}
/>
```

The `headerSearchBarOptions` integrates the search bar into the navigation header. On scroll, it hides by default (set `hideWhenScrolling: false` to keep it visible).

**Option B: NativeTabs Search Role (bottom, iOS 26 style)**

```tsx
<NativeTabs.Trigger name="search" role="search">
  <NativeTabs.Trigger.Icon sf="magnifyingglass" />
  <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
</NativeTabs.Trigger>
```

When the search tab is tapped, it morphs from the circular icon to a search field at the bottom. This is the native iOS 26 pattern.

**Option C: Custom bottom search bar**

For a custom implementation matching the iOS 26 bottom-search pattern:

```tsx
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { SymbolView } from 'expo-symbols';

function BottomSearchBar({ onPress }) {
  const Container = isGlassEffectAPIAvailable() ? GlassView : View;
  return (
    <Pressable onPress={onPress}>
      <Container style={styles.searchBar} glassEffectStyle="regular" isInteractive>
        <SymbolView name="magnifyingglass" size={18} tintColor={PlatformColor('secondaryLabel')} />
        <Text style={{ color: PlatformColor('placeholderText') }}>Search</Text>
      </Container>
    </Pressable>
  );
}
```

**Known issue:** On iOS 26, back navigation can break after using `headerSearchBarOptions`. This is a tracked issue in react-native-screens (Issue #3270).

**Sources:**
- [React Navigation headerSearchBarOptions](https://reactnavigation.org/docs/native-stack-navigator/#headersearchbaroptions)
- [Expo Native Tabs Search Role](https://docs.expo.dev/router/advanced/native-tabs/)
- [react-native-screens Issue #3270](https://github.com/software-mansion/react-native-screens/issues/3270)

---

### 4. Context Menus (Long-Press Menus)

#### What Changed in iOS 26

Context menus gain the Liquid Glass backdrop treatment. The native `UIMenu` context menu system remains the same API-wise, but visuals update automatically with the glass blur.

#### React Native Implementation

**Recommended: Zeego (`zeego`)**

Zeego is the leading cross-platform solution for native context menus. On iOS it wraps `react-native-ios-context-menu` for true native `UIMenu`. On Android it uses `@react-native-menu/menu`. On web it uses Radix UI.

```bash
# Install
yarn add zeego
yarn add @react-native-menu/menu@1.2.2 react-native-ios-context-menu@3.1.0 react-native-ios-utilities@5.1.2
```

**Important:** Exact dependency versions matter. Zeego will NOT work in Expo Go -- you need a development build.

```tsx
import * as ContextMenu from 'zeego/context-menu';

function ProfileCard({ user }) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <ProfileCardView user={user} />
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        {/* iOS preview (peek) */}
        <ContextMenu.Preview>
          {() => <ProfilePreview user={user} />}
        </ContextMenu.Preview>

        <ContextMenu.Item key="like" onSelect={() => handleLike(user.id)}>
          <ContextMenu.ItemTitle>Like Profile</ContextMenu.ItemTitle>
          <ContextMenu.ItemImage
            ios={{ name: 'heart.fill', pointSize: 18 }}
          />
        </ContextMenu.Item>

        <ContextMenu.Item key="message" onSelect={() => handleMessage(user.id)}>
          <ContextMenu.ItemTitle>Send Message</ContextMenu.ItemTitle>
          <ContextMenu.ItemImage
            ios={{ name: 'bubble.left.fill', pointSize: 18 }}
          />
        </ContextMenu.Item>

        <ContextMenu.Group>
          <ContextMenu.Item key="block" destructive onSelect={() => handleBlock(user.id)}>
            <ContextMenu.ItemTitle>Block User</ContextMenu.ItemTitle>
            <ContextMenu.ItemImage
              ios={{ name: 'hand.raised.fill', pointSize: 18 }}
            />
          </ContextMenu.Item>
        </ContextMenu.Group>
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
}
```

**Zeego also provides Dropdown Menus** (tap instead of long-press):

```tsx
import * as DropdownMenu from 'zeego/dropdown-menu';

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    <Button title="Options" />
  </DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Item key="edit">
      <DropdownMenu.ItemTitle>Edit</DropdownMenu.ItemTitle>
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
```

**Key Zeego features:**
- Submenus with configurable reading direction
- Checkable items (single or multiple) with indeterminate state
- Item groups with dividers (horizontal layout option)
- iOS-only Preview component for "peek" behavior
- Full keyboard navigation and typeahead on web

**Alternatives:**

| Library | Platform | Notes |
|---------|----------|-------|
| `react-native-ios-context-menu` | iOS only | What Zeego wraps under the hood. Direct access if you only need iOS. |
| `react-native-context-menu-view` | iOS + Android | Simpler API. v1.21.0 (Jan 2026). |
| `@react-native-menu/menu` | iOS + Android | What Zeego wraps for Android. |

**Sources:**
- [Zeego Documentation](https://zeego.dev/components/context-menu)
- [Zeego GitHub](https://github.com/nandorojo/zeego)
- [react-native-ios-context-menu](https://github.com/dominicstop/react-native-ios-context-menu)

---

### 5. Action Sheets

#### What Changed in iOS 26

Action sheets gain the Liquid Glass visual treatment automatically when using native components.

#### React Native Implementation

**Option A: Built-in `ActionSheetIOS` (simplest, iOS only)**

```tsx
import { ActionSheetIOS } from 'react-native';

function showOptions() {
  ActionSheetIOS.showActionSheetWithOptions(
    {
      options: ['Cancel', 'Report User', 'Block User', 'Share Profile'],
      destructiveButtonIndex: [1, 2],
      cancelButtonIndex: 0,
      title: 'Profile Options',
      message: 'Choose an action',
    },
    (buttonIndex) => {
      if (buttonIndex === 1) handleReport();
      if (buttonIndex === 2) handleBlock();
      if (buttonIndex === 3) handleShare();
    }
  );
}
```

On iOS 26, this renders with full Liquid Glass styling automatically.

**Option B: `@expo/react-native-action-sheet` (cross-platform)**

```bash
npm i @expo/react-native-action-sheet
```

```tsx
import { useActionSheet } from '@expo/react-native-action-sheet';

function MyComponent() {
  const { showActionSheetWithOptions } = useActionSheet();

  const onPress = () => {
    showActionSheetWithOptions(
      {
        options: ['Cancel', 'Report', 'Block'],
        destructiveButtonIndex: [1, 2],
        cancelButtonIndex: 0,
        // iOS-specific:
        userInterfaceStyle: 'dark', // or 'light'
      },
      (selectedIndex) => {
        // handle selection
      }
    );
  };
}
```

On iOS this delegates to `ActionSheetIOS` (native Liquid Glass). On Android it renders a JS-based modal.

**Option C: `react-native-actions-sheet` (fully custom sheets)**

For sheets that go beyond simple option lists (forms, complex content, routing):

```bash
npm i react-native-actions-sheet
```

```tsx
import ActionSheet, { SheetManager } from 'react-native-actions-sheet';

// Register sheet
function FilterSheet() {
  return (
    <ActionSheet
      id="filter-sheet"
      snapPoints={[30, 60, 100]}
      gestureEnabled
      containerStyle={{
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }}
    >
      {/* Custom filter content */}
    </ActionSheet>
  );
}

// Open from anywhere
SheetManager.show('filter-sheet');
```

Key v10 features:
- `react-native-reanimated` for 60fps animations
- Built-in router for multi-step flows inside a single sheet
- `snapPoints` for iOS-style detent behavior
- `SheetManager.update()` for live data updates
- TypeScript-first with `SheetDefinition` for typed payloads

**Recommendation:** Use `ActionSheetIOS` or `@expo/react-native-action-sheet` for simple option menus. Use `react-native-actions-sheet` for complex custom sheets with content.

**Sources:**
- [ActionSheetIOS Docs](https://reactnative.dev/docs/actionsheetios)
- [Expo react-native-action-sheet](https://github.com/expo/react-native-action-sheet)
- [react-native-actions-sheet Docs](https://rnas.vercel.app/)

---

### 6. Alerts

#### What Changed in iOS 26

Native `UIAlertController` alerts automatically adopt Liquid Glass styling when compiled with Xcode 26. The glass backdrop replaces the previous frosted effect.

#### React Native Implementation

**Option A: Built-in `Alert.alert()` (native, recommended)**

```tsx
import { Alert } from 'react-native';

// Simple alert
Alert.alert('Match!', 'You and Sarah both liked each other!', [
  { text: 'Send Message', onPress: () => navigateToChat() },
  { text: 'Keep Browsing', style: 'cancel' },
]);

// Destructive action
Alert.alert(
  'Block User',
  'Are you sure? This action cannot be undone.',
  [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Block',
      style: 'destructive',
      onPress: () => handleBlock(),
    },
  ],
  { cancelable: true }
);

// Alert with text input (iOS only)
Alert.prompt(
  'Report Reason',
  'Please describe the issue:',
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Submit', onPress: (text) => submitReport(text) },
  ],
  'plain-text',
  '', // default value
  'default' // keyboard type
);
```

On iOS 26, `Alert.alert()` renders with full Liquid Glass automatically. This is the recommended approach because it requires zero custom styling and always matches the system look.

**Option B: Custom glass alert (for branded alerts)**

If you need a custom-styled alert that still matches iOS 26 aesthetics:

```tsx
import { Modal, View, Text, Pressable, PlatformColor } from 'react-native';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';

function GlassAlert({ visible, title, message, buttons, onDismiss }) {
  const Background = isGlassEffectAPIAvailable() ? GlassView : BlurView;
  const bgProps = isGlassEffectAPIAvailable()
    ? { glassEffectStyle: 'regular' }
    : { intensity: 80, tint: 'regular' };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <Background style={styles.alertContainer} {...bgProps}>
          <Text style={styles.alertTitle}>{title}</Text>
          <Text style={styles.alertMessage}>{message}</Text>
          <View style={styles.buttonRow}>
            {buttons.map((btn, i) => (
              <Pressable key={i} onPress={btn.onPress} style={styles.alertButton}>
                <Text style={[
                  styles.alertButtonText,
                  btn.style === 'destructive' && { color: PlatformColor('systemRed') },
                  btn.style === 'cancel' && { fontWeight: '400' },
                ]}>
                  {btn.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </Background>
      </View>
    </Modal>
  );
}
```

**Recommendation:** Always prefer `Alert.alert()` for standard alerts. It is native, automatically adopts Liquid Glass, and matches the system perfectly.

---

### 7. Lists / TableViews (Grouped & Inset Grouped)

#### What Changed in iOS 26

Grouped and inset grouped list styles remain the standard pattern for settings-like screens. Liquid Glass does NOT apply to list cells -- it is reserved for floating UI elements (tab bars, toolbars, navigation bars). List cells continue using semantic system colors.

#### React Native Implementation

**Option A: Built-in `SectionList` with manual styling (most flexible)**

```tsx
import { SectionList, View, Text, PlatformColor, StyleSheet, Platform } from 'react-native';

function SettingsScreen() {
  const sections = [
    {
      title: 'Account',
      data: [
        { label: 'Edit Profile', icon: 'person.fill', hasDisclosure: true },
        { label: 'Preferences', icon: 'slider.horizontal.3', hasDisclosure: true },
      ],
    },
    {
      title: 'Privacy',
      data: [
        { label: 'Block List', icon: 'hand.raised.fill', hasDisclosure: true },
        { label: 'Hidden Profiles', icon: 'eye.slash.fill', hasDisclosure: true },
      ],
    },
  ];

  return (
    <SectionList
      sections={sections}
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: PlatformColor('systemGroupedBackground') }}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader}>{section.title.toUpperCase()}</Text>
      )}
      renderItem={({ item, index, section }) => (
        <View style={[
          styles.row,
          index === 0 && styles.firstRow,
          index === section.data.length - 1 && styles.lastRow,
        ]}>
          <SymbolView name={item.icon} size={22} tintColor={PlatformColor('systemBlue')} />
          <Text style={styles.rowLabel}>{item.label}</Text>
          {item.hasDisclosure && (
            <SymbolView name="chevron.right" size={14} tintColor={PlatformColor('tertiaryLabel')} />
          )}
        </View>
      )}
      renderSectionFooter={() => <View style={{ height: 20 }} />}
    />
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    color: PlatformColor('secondaryLabel'),
    fontSize: 13,
    fontWeight: '400',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  row: {
    backgroundColor: PlatformColor('secondarySystemGroupedBackground'),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    marginHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PlatformColor('separator'),
  },
  firstRow: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  lastRow: {
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderBottomWidth: 0,
  },
  rowLabel: {
    flex: 1,
    color: PlatformColor('label'),
    fontSize: 17,
  },
});
```

**Option B: `react-native-tableview-simple` (cross-platform, pure CSS)**

```bash
npm i react-native-tableview-simple
```

```tsx
import { TableView, Section, Cell } from 'react-native-tableview-simple';

<TableView appearance="auto"> {/* auto follows system dark/light */}
  <Section header="ACCOUNT" roundedCorners sectionPaddingTop={20}>
    <Cell
      title="Edit Profile"
      accessory="DisclosureIndicator"
      onPress={() => router.push('/settings/profile')}
    />
    <Cell
      title="Preferences"
      accessory="DisclosureIndicator"
      onPress={() => router.push('/settings/preferences')}
    />
  </Section>
</TableView>
```

**Option C: `react-native-ios-list` (JS, iOS HIG-accurate)**

```bash
npm i react-native-ios-list
```

```tsx
import { List, Row } from 'react-native-ios-list';

<List inset header="Account"> {/* inset = rounded corners, inset from edges */}
  <Row
    title="Edit Profile"
    leading={<SymbolView name="person.fill" size={22} />}
    trailing="disclosure"
    onPress={() => router.push('/settings/profile')}
  />
</List>
```

**Key styling rules for iOS lists:**
- Background: `PlatformColor('systemGroupedBackground')`
- Cell background: `PlatformColor('secondarySystemGroupedBackground')`
- Primary text: `PlatformColor('label')`, 17pt
- Secondary text: `PlatformColor('secondaryLabel')`, 15pt
- Section header: `PlatformColor('secondaryLabel')`, 13pt, uppercase
- Separator: `PlatformColor('separator')`, `StyleSheet.hairlineWidth`
- Inset grouped radius: 10pt
- Row padding: 16pt horizontal, 12pt vertical
- Left icon to text gap: 12pt

**Sources:**
- [react-native-tableview-simple](https://github.com/Purii/react-native-tableview-simple)
- [react-native-ios-list](https://github.com/andrew-levy/react-native-ios-list)

---

### 8. Pull-to-Refresh

#### What Changed in iOS 26

Pull-to-refresh is unchanged in iOS 26. The native `UIRefreshControl` spinner continues to work identically.

#### React Native Implementation

**Built-in `RefreshControl` (recommended)**

This wraps the native `UIRefreshControl` on iOS, giving you the authentic iOS spinner and bounce behavior.

```tsx
import { FlatList, RefreshControl, PlatformColor } from 'react-native';

function MessagesList() {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLatestMessages();
    setRefreshing(false);
  }, []);

  return (
    <FlatList
      data={messages}
      renderItem={renderMessage}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={PlatformColor('systemBlue')} // iOS spinner color
          // iOS-only:
          title="Refreshing..."
          titleColor={PlatformColor('secondaryLabel')}
        />
      }
    />
  );
}
```

**iOS-specific `RefreshControl` props:**

| Prop | Type | Description |
|------|------|-------------|
| `tintColor` | color | Color of the refresh spinner |
| `title` | string | Text shown below spinner |
| `titleColor` | color | Color of the title text |

**For custom animated pull-to-refresh**, combine `react-native-reanimated` with `lottie-react-native`:

```bash
npm i react-native-reanimated lottie-react-native
```

This allows fully custom pull-down animations while maintaining native-feeling gesture handling.

**Recommendation:** Use the built-in `RefreshControl` for the most native feel. Only use custom Lottie animations if your design specifically calls for branded refresh animations.

**Sources:**
- [RefreshControl Docs](https://reactnative.dev/docs/refreshcontrol)

---

### 9. Haptic Feedback

#### When to Use Haptics in iOS 26

iOS uses haptics extensively. Every interactive element should provide tactile feedback:

| Interaction | Haptic Type | Code |
|-------------|-------------|------|
| Tab selection | Selection | `Haptics.selectionAsync()` |
| Button tap | Impact Light | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` |
| Card tap / press | Impact Medium | `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` |
| Toggle switch | Selection | `Haptics.selectionAsync()` |
| Swipe action | Impact Medium | `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` |
| Pull-to-refresh trigger | Impact Light | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` |
| Long press menu open | Impact Heavy | `Haptics.impactAsync(ImpactFeedbackStyle.Heavy)` |
| Match / success | Notification Success | `Haptics.notificationAsync(NotificationFeedbackType.Success)` |
| Error / failed action | Notification Error | `Haptics.notificationAsync(NotificationFeedbackType.Error)` |
| Warning / attention | Notification Warning | `Haptics.notificationAsync(NotificationFeedbackType.Warning)` |
| Slider tick | Selection | `Haptics.selectionAsync()` |
| Delete confirmation | Notification Warning | `Haptics.notificationAsync(NotificationFeedbackType.Warning)` |

#### Implementation

```tsx
import * as Haptics from 'expo-haptics';

// Impact feedback (3 levels)
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);   // Small UI
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);  // Cards, moderate
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);   // Large UI
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);   // Small compression
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);    // Large compression

// Selection feedback (for toggles, pickers)
await Haptics.selectionAsync();

// Notification feedback
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
```

**Custom haptic patterns** (via `react-native-custom-haptics`):

```tsx
const SUCCESS_PATTERN = ['light', 300, 'light', 300, 'heavy'];
// Even indices = impact type, odd indices = pause in ms
```

**iOS-specific considerations:**
- Haptics will NOT fire when Low Power Mode is enabled
- Haptics will NOT fire when the user has disabled them in settings
- Haptics will NOT fire when the camera is active
- Haptics will NOT fire during dictation

**Alternative: `react-native-haptics` (by mhpdev)** -- claims to be faster than expo-haptics through Turbo Modules, with O(1) constant-time dispatch.

**Sources:**
- [Expo Haptics Docs](https://docs.expo.dev/versions/latest/sdk/haptics/)
- [react-native-haptics](https://github.com/mhpdev-com/react-native-haptics)
- [react-native-custom-haptics](https://github.com/fgrgic/react-native-custom-haptics)

---

### 10. SF Symbols

#### Overview

SF Symbols are Apple's icon system with 6,900+ symbols in SF Symbols 7 (iOS 26). They are the ONLY appropriate icon system for native iOS apps.

#### Implementation with `expo-symbols`

```bash
npx expo install expo-symbols
```

```tsx
import { SymbolView } from 'expo-symbols';
import { PlatformColor, Platform } from 'react-native';

// Basic usage
<SymbolView
  name="heart.fill"
  style={{ width: 24, height: 24 }}
  tintColor={PlatformColor('systemPink')}
  type="monochrome"
  weight="medium"
  fallback={<MaterialCommunityIcons name="heart" size={24} color="pink" />}
/>

// Hierarchical rendering (depth with one color)
<SymbolView name="wifi" type="hierarchical" tintColor={PlatformColor('systemBlue')} />

// Palette rendering (multiple explicit colors)
<SymbolView
  name="cloud.sun.rain.fill"
  type="palette"
  colors={[PlatformColor('systemBlue'), PlatformColor('systemYellow'), PlatformColor('systemCyan')]}
/>

// Animated symbol
<SymbolView
  name="heart.fill"
  animationSpec={{
    effect: { type: 'bounce', direction: 'up', wholeSymbol: true },
    repeating: false,
  }}
/>

// Variable value (progress/strength)
<SymbolView
  name="speaker.wave.3.fill"
  type="hierarchical"
  variableValue={0.7}
/>
```

**SymbolView Props Reference:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `SFSymbol` | required | SF Symbol name |
| `type` | `SymbolType` | `'monochrome'` | Rendering mode |
| `tintColor` | `ColorValue` | system | Icon color |
| `size` | `number` | `24` | Icon size |
| `weight` | `SymbolWeight` | `'unspecified'` | Line weight |
| `scale` | `SymbolScale` | `'unspecified'` | Small/medium/large |
| `animationSpec` | `AnimationSpec` | - | Animation configuration |
| `colors` | `ColorValue[]` | - | For palette mode |
| `fallback` | `ReactNode` | - | Android/Web fallback |
| `resizeMode` | string | - | How to fit container |

**Animation types:** `'bounce'` | `'pulse'` | `'scale'`

**Using SF Symbols in NativeTabs:**

```tsx
<NativeTabs.Trigger.Icon
  sf={{ default: 'house', selected: 'house.fill' }}
  md="home" // Android Material Design icon
/>
```

**Alternative: `sweet-sfsymbols`** -- uses SwiftUI's Image view, supports all rendering modes, color values (hex, hsl, rgb, platform colors), and all weight options. Deprecated `react-native-sfsymbol` was migrated here.

**Browsing symbols:** Install the [SF Symbols macOS app](https://developer.apple.com/sf-symbols/) to browse and search all 6,900+ symbols.

**Sources:**
- [Expo Symbols Docs](https://docs.expo.dev/versions/latest/sdk/symbols/)
- [sweet-sfsymbols](https://github.com/andrew-levy/sweet-sfsymbols)
- [expo-ios-morph-symbol](https://github.com/rit3zh/expo-ios-morph-symbol)

---

### 11. Sheets / Modals (Bottom Sheets & Modal Presentations)

#### What Changed in iOS 26

Sheets are one of the most visually transformed components:
- Partial height sheets appear to **float above the interface** with rounded corners
- Sheets use the **Liquid Glass background by default**
- When a sheet grows to full screen, the system automatically transitions from glass to opaque
- Corner radii are enforced by the system and can no longer be freely overridden
- Detent-based presentations (multiple snap heights) are the standard pattern

#### React Native Implementation

**Option A: Expo Router `formSheet` presentation (built-in)**

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="filters"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.4, 0.8], // 40% and 80% height
          sheetCornerRadius: 32,
          sheetGrabberVisible: true,
          sheetInitialDetentIndex: 0, // start at 40%
          gestureDirection: 'vertical',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
```

On iOS 26, formSheet automatically gets Liquid Glass. Available `formSheet` options:

| Option | Type | Description |
|--------|------|-------------|
| `sheetAllowedDetents` | `number[]` | Snap heights as fractions (0-1) |
| `sheetCornerRadius` | `number` | Corner radius |
| `sheetGrabberVisible` | `boolean` | Show drag indicator |
| `sheetInitialDetentIndex` | `number` | Starting detent |
| `sheetExpandsWhenScrolledToEdge` | `boolean` | Expand on scroll to edge |
| `sheetLargestUndimmedDetentIndex` | `number` | Detent above which background dims |

**Option B: `@gorhom/react-native-bottom-sheet` (most popular library)**

```bash
npm i @gorhom/bottom-sheet
```

```tsx
import BottomSheet, { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';

function FiltersSheet() {
  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

  return (
    <BottomSheetModalProvider>
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose
        backgroundComponent={({ style }) =>
          isGlassEffectAPIAvailable() ? (
            <GlassView style={[style, { borderRadius: 24 }]} glassEffectStyle="regular" />
          ) : (
            <View style={[style, { backgroundColor: PlatformColor('secondarySystemBackground'), borderRadius: 24 }]} />
          )
        }
      >
        {/* Sheet content */}
      </BottomSheetModal>
    </BottomSheetModalProvider>
  );
}
```

Features: Smooth gesture interactions, snapping animations, seamless keyboard handling, pull-to-refresh inside scrollables. v5 built on Reanimated v3 + Gesture Handler v2.

**Option C: `react-native-true-sheet` (TrueSheet) -- native iOS sheet**

```bash
npm i @lodev09/react-native-true-sheet
```

TrueSheet uses the native `UISheetPresentationController` so you get genuine iOS sheet behavior including automatic Liquid Glass on iOS 26.

```tsx
import { TrueSheet } from '@lodev09/react-native-true-sheet';

function FilterSheet() {
  const sheetRef = useRef<TrueSheet>(null);

  return (
    <TrueSheet
      ref={sheetRef}
      sizes={['auto', 'medium', 'large']} // or fractional: [0.3, 0.6, 1]
      cornerRadius={24}
      grabber={true}
    >
      {/* Content */}
    </TrueSheet>
  );
}

// Open: sheetRef.current?.present();
// Close: sheetRef.current?.dismiss();
```

**Liquid Glass behavior in TrueSheet:**
- Enabled by default on iOS 26+ when no `backgroundColor` or `backgroundBlur` is set
- Setting either prop disables Liquid Glass for that sheet
- Set `UIDesignRequiresCompatibility: true` in `Info.plist` to disable Liquid Glass app-wide
- Requires Xcode 26.1+, React Native 0.80+, Expo SDK 54+

**Three approaches to iOS 26 Liquid Glass sheets (per Expo blog):**
1. `expo-swift-ui` BottomSheet (SwiftUI native)
2. Expo Router `formSheet` presentation
3. TrueSheet

**Sources:**
- [Expo Modals Docs](https://docs.expo.dev/router/advanced/modals/)
- [gorhom bottom-sheet](https://github.com/gorhom/react-native-bottom-sheet)
- [TrueSheet](https://sheet.lodev09.com/)
- [TrueSheet Liquid Glass Guide](https://sheet.lodev09.com/guides/liquid-glass)
- [Expo Blog - Liquid Glass Sheets](https://expo.dev/blog/how-to-create-apple-maps-style-liquid-glass-sheets)

---

### 12. Segmented Controls

#### What Changed in iOS 26

Segmented controls adopt Liquid Glass styling automatically when using UIKit.

#### React Native Implementation

**Option A: `@react-native-segmented-control/segmented-control` (native UISegmentedControl)**

```bash
npx expo install @react-native-segmented-control/segmented-control
```

```tsx
import SegmentedControl from '@react-native-segmented-control/segmented-control';

function FilterTabs() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <SegmentedControl
      values={['All', 'Matches', 'Likes']}
      selectedIndex={selectedIndex}
      onChange={(event) => {
        setSelectedIndex(event.nativeEvent.selectedSegmentIndex);
      }}
      // iOS styling props
      tintColor={PlatformColor('systemBlue')}
      fontStyle={{ fontSize: 14, fontWeight: '500' }}
      activeFontStyle={{ fontSize: 14, fontWeight: '600' }}
      appearance="dark" // or "light"
    />
  );
}
```

This renders the actual native `UISegmentedControl` on iOS, which automatically gets iOS 26 Liquid Glass treatment when compiled with Xcode 26.

**Important:** Does NOT work in Expo Go. Requires a development build.

**Option B: `rn-segmented-control` (pure JS, cross-platform)**

```bash
npm i rn-segmented-control
```

Pure JavaScript implementation with smooth animations. Works in Expo Go. Mimics iOS segmented control appearance on all platforms.

**Option C: `react-native-segmented-control-2` (pure JS, actively maintained)**

```bash
npm i react-native-segmented-control-2
```

Highly customizable, allows embedding any React component in tabs.

**Recommendation:** Use option A (`@react-native-segmented-control/segmented-control`) for native iOS feel with Liquid Glass. Use option B or C for cross-platform or Expo Go compatibility.

**Sources:**
- [Expo Segmented Control Docs](https://docs.expo.dev/versions/latest/sdk/segmented-control/)
- [GitHub - segmented-control](https://github.com/react-native-segmented-control/segmented-control)

---

## Liquid Glass Libraries Summary

Three libraries bring Liquid Glass to React Native for custom use cases:

### 1. `expo-glass-effect` (Official Expo)

| | |
|---|---|
| **Install** | `npx expo install expo-glass-effect` |
| **Components** | `GlassView`, `GlassContainer` |
| **Props** | `glassEffectStyle` (`'regular'` \| `'clear'`), `isInteractive`, `tintColor` |
| **Checks** | `isLiquidGlassAvailable()`, `isGlassEffectAPIAvailable()` |
| **Fallback** | Falls back to regular `View` on unsupported platforms |
| **Engine** | `UIVisualEffectView` |

### 2. `@callstack/liquid-glass` (Callstack)

| | |
|---|---|
| **Install** | `npm i @callstack/liquid-glass` |
| **Components** | `LiquidGlassView`, `LiquidGlassContainerView` |
| **Props** | `effect` (`'clear'` \| `'regular'` \| `'none'`), `interactive`, `tintColor`, `colorScheme` |
| **Checks** | `isLiquidGlassSupported` (boolean constant) |
| **Special** | Glass elements visually merge when close together in a `LiquidGlassContainerView` |
| **Version** | 0.4.3, requires Xcode 26+, React Native 0.80+ |

### 3. `react-native-glass-effect-view` (Community)

| | |
|---|---|
| **Install** | `npm i react-native-glass-effect-view` |
| **iOS 26+** | Uses native glass effect |
| **Fallback** | CSS-style shadows and blur on older iOS/Android |

**Recommendation:** Use `expo-glass-effect` for Expo projects. Use `@callstack/liquid-glass` for vanilla React Native or when you need the glass merging effect.

---

## Component Library Decision Matrix

| Component Need | Best Library | Alternative | Notes |
|----------------|-------------|-------------|-------|
| **Tab Bar** | `expo-router/unstable-native-tabs` | Custom with `expo-router/ui` | NativeTabs = true iOS 26 pill |
| **Navigation Header** | `@react-navigation/native-stack` | Expo Router `<Stack>` | Large title + blur built-in |
| **Search Bar** | `headerSearchBarOptions` + NativeTabs search role | Custom bottom search | Use both for best iOS 26 feel |
| **Context Menu** | `zeego` | `react-native-ios-context-menu` | Zeego = cross-platform |
| **Action Sheet** | `ActionSheetIOS` / `@expo/react-native-action-sheet` | `react-native-actions-sheet` | Native = auto glass |
| **Alerts** | `Alert.alert()` | Custom `GlassView` modal | Native = auto glass |
| **Lists** | `SectionList` + manual styling | `react-native-tableview-simple` | Manual = most control |
| **Pull-to-Refresh** | Built-in `RefreshControl` | Lottie custom animation | Native = most authentic |
| **Haptics** | `expo-haptics` | `react-native-haptics` | Expo = simplest API |
| **SF Symbols** | `expo-symbols` | `sweet-sfsymbols` | Expo = official support |
| **Bottom Sheet** | `@gorhom/bottom-sheet` or `TrueSheet` | Expo Router `formSheet` | TrueSheet = native iOS sheet |
| **Segmented Control** | `@react-native-segmented-control/segmented-control` | `rn-segmented-control` | Native = auto glass |
| **Liquid Glass** | `expo-glass-effect` | `@callstack/liquid-glass` | Expo = official |

---

## Sources

- [Expo Glass Effect Documentation](https://docs.expo.dev/versions/latest/sdk/glass-effect/)
- [Expo Symbols Documentation](https://docs.expo.dev/versions/latest/sdk/symbols)
- [Expo Native Tabs](https://docs.expo.dev/router/advanced/native-tabs/)
- [Expo Router Modals](https://docs.expo.dev/router/advanced/modals/)
- [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/)
- [React Native PlatformColor](https://reactnative.dev/docs/platformcolor)
- [React Native DynamicColorIOS](https://reactnative.dev/docs/dynamiccolorios)
- [React Native useColorScheme](https://reactnative.dev/docs/usecolorscheme)
- [React Native Appearance API](https://reactnative.dev/docs/appearance)
- [React Navigation Native Stack](https://reactnavigation.org/docs/native-stack-navigator/)
- [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54)
- [SF Symbols 7 Release Notes](https://developer.apple.com/sf-symbols/release-notes/)
- [Apple Liquid Glass Design System](https://liquidglass.info/)
- [Apple HIG - Tab Bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- [MacRumors iOS 26 Guide](https://www.macrumors.com/guide/ios-26-liquid-glass/)
- [Orizon - iOS 26 Key Design Changes](https://www.orizon.co/blog/ios-26-key-design-changes-and-what-they-mean-for-your-app)
- [UX Planet - iOS 26 Beyond Liquid Glass](https://uxplanet.org/ios-26-beyond-liquid-glass-f1e41306a57b)
- [NN/g - Liquid Glass Usability](https://www.nngroup.com/articles/liquid-glass/)
- [Callstack - Liquid Glass in React Native](https://www.callstack.com/blog/how-to-use-liquid-glass-in-react-native)
- [Donny Wals - Tab bars on iOS 26](https://www.donnywals.com/exploring-tab-bars-on-ios-26-with-liquid-glass/)
- [Ryan Ashcraft - iOS 26 Tab Bar](https://ryanashcraft.com/ios-26-tab-bar-beef/)
- [Aman Mittal - Large Header Title](https://amanhimself.dev/blog/large-header-title-in-expo-router/)
- [Aman Mittal - Header Blur Effect](https://amanhimself.dev/blog/blur-effect-in-header-with-expo-router/)
- [Zeego Documentation](https://zeego.dev/components/context-menu)
- [Zeego GitHub](https://github.com/nandorojo/zeego)
- [gorhom/react-native-bottom-sheet](https://github.com/gorhom/react-native-bottom-sheet)
- [TrueSheet](https://sheet.lodev09.com/)
- [TrueSheet Liquid Glass](https://sheet.lodev09.com/guides/liquid-glass)
- [Expo Blog - Liquid Glass Sheets](https://expo.dev/blog/how-to-create-apple-maps-style-liquid-glass-sheets)
- [react-native-actions-sheet](https://rnas.vercel.app/)
- [react-native-tableview-simple](https://github.com/Purii/react-native-tableview-simple)
- [react-native-ios-list](https://github.com/andrew-levy/react-native-ios-list)
- [sweet-sfsymbols](https://github.com/andrew-levy/sweet-sfsymbols)
- [Expo Segmented Control](https://docs.expo.dev/versions/latest/sdk/segmented-control/)
- [Figma iOS 26 Design Kit](https://www.figma.com/community/file/1527721578857867021/ios-and-ipados-26)
