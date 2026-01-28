---
name: ios-dark-mode-expert
description: Ensures iOS implementations use native dark mode patterns with PlatformColor, DynamicColorIOS, and system semantic colors. Use when implementing iOS-specific theming, reviewing color usage for dark mode support, fixing light/dark mode issues, or when the user mentions dark mode, light mode, theming, PlatformColor, or color adaptation on iOS. Also use when custom components need to respect system appearance.
---

# iOS Dark Mode Expert

**Your job:** Ensure all iOS code uses native dark mode patterns that automatically adapt to system appearance, accessibility settings, and Liquid Glass effects.

---

## Scope: iOS-ONLY

| Action | Allowed |
|--------|---------|
| Modify `/mobile` iOS-specific theming code | ✅ Yes |
| Use `Platform.OS === 'ios'` conditionals for colors | ✅ Yes |
| Add/update iOS dark mode implementations | ✅ Yes |
| Modify `/web` in any way | ❌ NEVER |
| Change Android color implementations | ❌ NEVER |

---

## Core Principles

1. **Never hardcode colors** — Use `PlatformColor`, `DynamicColorIOS`, or theme context
2. **System colors auto-adapt** — iOS semantic colors handle light/dark/high-contrast automatically
3. **Respect accessibility** — Support reduce transparency, high contrast, and bold text settings
4. **Liquid Glass compatibility** — iOS 26+ requires colors that work with translucent materials

---

## Project Setup Reference

This project uses:

| Package | Purpose |
|---------|---------|
| `ThemeContext` | Platform-aware theme provider (`@/context/ThemeContext`) |
| `platformColors` | iOS PlatformColor utilities (`@/utils/platformColors`) |
| `react-native-paper` | Material Design 3 components (uses theme context) |
| `NativeWind 4.2.1` | Tailwind for React Native |
| `@pchmn/expo-material3-theme` | Material You dynamic colors (Android) |
| `expo-status-bar` | Status bar styling |
| `expo-system-ui` | Root view background color |

---

## Color Implementation Hierarchy

Use this priority order when implementing colors:

### 1. PlatformColor (Preferred for System Colors)

Best for backgrounds, labels, separators, and system semantic colors:

```tsx
import { Platform, PlatformColor } from 'react-native';

// ✅ Auto-adapts to light/dark/high-contrast/Liquid Glass
backgroundColor: Platform.OS === 'ios' 
  ? PlatformColor('systemBackground') 
  : colors.background
```

**Available iOS System Colors:**

| Category | PlatformColor Names |
|----------|---------------------|
| Backgrounds | `systemBackground`, `secondarySystemBackground`, `tertiarySystemBackground`, `systemGroupedBackground` |
| Labels | `label`, `secondaryLabel`, `tertiaryLabel`, `quaternaryLabel`, `placeholderText` |
| Fills | `systemFill`, `secondarySystemFill`, `tertiarySystemFill`, `quaternarySystemFill` |
| Separators | `separator`, `opaqueSeparator` |
| System Tints | `systemBlue`, `systemGreen`, `systemRed`, `systemOrange`, `systemPink`, `systemPurple`, `systemTeal`, `systemYellow`, `systemIndigo` |
| Grays | `systemGray`, `systemGray2`, `systemGray3`, `systemGray4`, `systemGray5`, `systemGray6` |

### 2. DynamicColorIOS (For Custom Brand Colors)

When you need custom colors that still adapt to appearance:

```tsx
import { DynamicColorIOS, Platform } from 'react-native';

const brandPrimary = Platform.OS === 'ios' 
  ? DynamicColorIOS({
      light: '#B06D1E',
      dark: '#FFBA70',
      // Optional: High contrast accessibility support
      highContrastLight: '#8A5516',
      highContrastDark: '#FFD4A3',
    })
  : isDark ? '#FFBA70' : '#B06D1E';
```

**When to use DynamicColorIOS:**
- Brand colors not in the system palette
- Custom accent colors
- When you need fine control over all four appearance states

### 3. Theme Context (For Component Libraries)

Use the project's `useTheme` hook for react-native-paper and custom components:

```tsx
import { useTheme, useThemeColors } from '@/context/ThemeContext';

function MyComponent() {
  const { colors, dark } = useTheme();
  // or
  const colors = useThemeColors();
  
  return (
    <View style={{ backgroundColor: colors.surface }}>
      <Text style={{ color: colors.onSurface }}>Content</Text>
    </View>
  );
}
```

### 4. useSemanticColors Hook (For Cross-Platform Semantic Colors)

The project's utility for semantic colors with Android fallbacks:

```tsx
import { useSemanticColors } from '@/utils/platformColors';

function MyComponent() {
  const { 
    background, 
    label, 
    separator, 
    systemBlue,
    isDark 
  } = useSemanticColors();
  
  return (
    <View style={{ backgroundColor: background }}>
      <Text style={{ color: label }}>Hello</Text>
    </View>
  );
}
```

---

## Hardcoded Color Migration Guide

When reviewing code, replace hardcoded colors with semantic equivalents:

| Hardcoded | Replace With |
|-----------|--------------|
| `#FFFFFF`, `#FFF`, `white` | `PlatformColor('systemBackground')` |
| `#F2F2F7`, `#F5F5F5`, `#FAFAFA` | `PlatformColor('secondarySystemBackground')` |
| `#000000`, `#000`, `#333333`, `#1A1A1A` | `PlatformColor('label')` |
| `#666666`, `#8E8E93`, `#6B7280` | `PlatformColor('secondaryLabel')` |
| `#999999`, `#AEAEB2`, `#9CA3AF` | `PlatformColor('tertiaryLabel')` |
| `#E5E5EA`, `#E0E0E0`, `#D1D1D6` | `PlatformColor('separator')` |
| `#007AFF` | `PlatformColor('systemBlue')` |
| `#FF3B30` | `PlatformColor('systemRed')` |
| `#34C759` | `PlatformColor('systemGreen')` |
| `#FF9500` | `PlatformColor('systemOrange')` |

---

## Status Bar Configuration

Always use `expo-status-bar` with auto style for dark mode support:

```tsx
import { StatusBar } from 'expo-status-bar';

// ✅ Automatically adapts to light/dark mode
<StatusBar style="auto" />

// Or control manually when needed:
// style="light" → Light text (for dark backgrounds)
// style="dark" → Dark text (for light backgrounds)
// style="inverted" → Opposite of auto
```

**Per-screen status bar:**
```tsx
// In a screen component
<StatusBar style={hasLightHeader ? 'dark' : 'light'} />
```

---

## Accessibility Requirements

### Reduce Transparency

Fall back from blur/glass effects when users enable "Reduce Transparency":

```tsx
import { AccessibilityInfo } from 'react-native';

const [reduceTransparency, setReduceTransparency] = useState(false);

useEffect(() => {
  AccessibilityInfo.isReduceTransparencyEnabled().then(setReduceTransparency);
  
  const subscription = AccessibilityInfo.addEventListener(
    'reduceTransparencyChanged',
    setReduceTransparency
  );
  
  return () => subscription.remove();
}, []);

// Use solid colors instead of blur/glass when reduceTransparency is true
<View style={{
  backgroundColor: reduceTransparency 
    ? PlatformColor('systemBackground')
    : 'transparent'
}}>
  {!reduceTransparency && <BlurView ... />}
</View>
```

### High Contrast Support

DynamicColorIOS automatically supports high contrast when you provide the optional keys:

```tsx
DynamicColorIOS({
  light: '#B06D1E',
  dark: '#FFBA70',
  highContrastLight: '#8A5516',    // Darker for better contrast
  highContrastDark: '#FFD4A3',      // Lighter for better contrast
})
```

### Reduce Motion

Disable animations when reduce motion is enabled:

```tsx
import { AccessibilityInfo } from 'react-native';

const [reduceMotion, setReduceMotion] = useState(false);

useEffect(() => {
  AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  
  const subscription = AccessibilityInfo.addEventListener(
    'reduceMotionChanged',
    setReduceMotion
  );
  
  return () => subscription.remove();
}, []);

// Skip animations when reduceMotion is true
const animationDuration = reduceMotion ? 0 : 300;
```

---

## iOS 26 Liquid Glass Compatibility

Liquid Glass adapts appearance based on background content. Colors used with Liquid Glass must work in both light and dark contexts dynamically.

### DynamicColorIOS for Liquid Glass Tab Bars

```tsx
import { DynamicColorIOS, Platform } from 'react-native';

// For native tabs that use Liquid Glass
<NativeTabs
  tintColor={Platform.OS === 'ios' 
    ? DynamicColorIOS({ dark: 'white', light: 'black' }) 
    : colors.primary
  }
  labelStyle={{
    color: Platform.OS === 'ios'
      ? DynamicColorIOS({ dark: 'white', light: 'black' })
      : colors.onSurface
  }}
>
```

### Avoid Opacity on Glass

Never apply `opacity < 1` to GlassView or its parent views — this causes rendering bugs:

```tsx
// ❌ Bad
<GlassView style={{ opacity: 0.9 }}>

// ✅ Good
<GlassView style={{ opacity: 1 }}>
```

---

## NativeWind Dark Mode

NativeWind v4 uses system theme by default. **Do NOT set `darkMode: 'class'`** in config.

```tsx
import { useColorScheme } from 'nativewind';

function MyComponent() {
  const { colorScheme, setColorScheme } = useColorScheme();
  
  return (
    <View className="bg-white dark:bg-black">
      <Text className="text-black dark:text-white">
        Current: {colorScheme}
      </Text>
    </View>
  );
}
```

**Important:** NativeWind's `dark:` prefix automatically responds to system appearance.

---

## Custom Component Pattern

When building custom components that need to adapt:

```tsx
import { Platform, PlatformColor, useColorScheme } from 'react-native';
import { useThemeColors } from '@/context/ThemeContext';

interface CustomCardProps {
  children: React.ReactNode;
}

export function CustomCard({ children }: CustomCardProps) {
  const colors = useThemeColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <View style={{
      // iOS: Use PlatformColor for native adaptation
      // Android: Use theme context colors
      backgroundColor: Platform.OS === 'ios'
        ? PlatformColor('secondarySystemBackground')
        : colors.surfaceContainerLow,
      borderColor: Platform.OS === 'ios'
        ? PlatformColor('separator')
        : colors.outline,
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
    }}>
      {children}
    </View>
  );
}
```

---

## Testing Checklist

Before completing any iOS dark mode work:

- [ ] Tested in Light mode (Settings → Display → Light)
- [ ] Tested in Dark mode (Settings → Display → Dark)
- [ ] Tested with Reduce Transparency ON (Settings → Accessibility → Display & Text Size)
- [ ] Tested with Increase Contrast ON (Settings → Accessibility → Display & Text Size)
- [ ] No hardcoded hex colors remaining (except for true white/black opacity overlays)
- [ ] StatusBar adapts correctly to content
- [ ] Blur/Glass effects fall back gracefully
- [ ] Android colors verified via ThemeContext (not broken by iOS changes)

---

## Quick Reference: Platform.select Pattern

```tsx
import { Platform } from 'react-native';

const styles = {
  container: {
    backgroundColor: Platform.select({
      ios: PlatformColor('systemBackground'),
      android: colors.background,
      default: '#FFFFFF',
    }),
  },
  text: {
    color: Platform.select({
      ios: PlatformColor('label'),
      android: colors.onSurface,
      default: '#000000',
    }),
  },
};
```

---

## Reference Files

| File | Purpose |
|------|---------|
| `mobile/context/ThemeContext.tsx` | Theme provider with iOS/Android color schemes |
| `mobile/utils/platformColors.ts` | PlatformColor utilities and semantic color hooks |
| `mobile/app/(tabs)/_layout.tsx` | Native tabs with proper theming |
| `color-reference.md` | Full iOS system color mappings |

---

## Documentation Links

- PlatformColor: https://reactnative.dev/docs/platformcolor
- DynamicColorIOS: https://reactnative.dev/docs/dynamiccolorios
- useColorScheme: https://reactnative.dev/docs/usecolorscheme
- AccessibilityInfo: https://reactnative.dev/docs/accessibilityinfo
- expo-status-bar: https://docs.expo.dev/versions/latest/sdk/status-bar
- Apple HIG Dark Mode: https://developer.apple.com/design/human-interface-guidelines/dark-mode
