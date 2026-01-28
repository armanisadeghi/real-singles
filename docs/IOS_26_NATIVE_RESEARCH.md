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

## Sources

- [Expo Glass Effect Documentation](https://docs.expo.dev/versions/latest/sdk/glass-effect/)
- [Expo Symbols Documentation](https://docs.expo.dev/versions/latest/sdk/symbols)
- [React Native PlatformColor](https://reactnative.dev/docs/platformcolor)
- [React Native DynamicColorIOS](https://reactnative.dev/docs/dynamiccolorios)
- [React Native useColorScheme](https://reactnative.dev/docs/usecolorscheme)
- [React Native Appearance API](https://reactnative.dev/docs/appearance)
- [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54)
- [SF Symbols 7 Release Notes](https://developer.apple.com/sf-symbols/release-notes/)
- [Apple Liquid Glass Design System](https://liquidglass.info/)
- [MacRumors iOS 26 Guide](https://www.macrumors.com/guide/ios-26-liquid-glass/)
