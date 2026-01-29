---
name: ios-native-expert
description: "MANDATORY: Enforces iOS 26 native design compliance including Liquid Glass, PlatformColor for all system colors, centralized theming via useTheme()/useThemeColors(), SF Symbols, haptic feedback, contentInsetAdjustmentBehavior on all scroll views, and native navigation headers. Use this skill whenever touching any file in /mobile. Every iOS component MUST comply -- violations MUST be reported and fixed immediately. NEVER modifies web code or Android-only implementations. Reference docs: docs/IOS_26_IMPLEMENTATION_GUIDE.md"
---

# iOS Native Expert -- MANDATORY COMPLIANCE

**Your job:** Enforce total iOS 26 native design compliance across the entire mobile app. These rules are NOT optional. They are REQUIRED for every component, every screen, every PR.

**If you identify ANY component or page that violates these rules, you are RESPONSIBLE for reporting it and fixing it.**

---

## REFERENCE DOCUMENTATION

Before making changes, search and read these files for detailed patterns and API references:

| Document | Path | Contains |
|----------|------|----------|
| **Implementation Guide** | `docs/IOS_26_IMPLEMENTATION_GUIDE.md` | Complete component-by-component patterns, library decisions, migration checklist, known issues |
| **API Reference** | `.cursor/skills/ios-native-expert/reference.md` | Quick-reference for PlatformColor names, expo-glass-effect API, expo-symbols API, haptics API, spring presets, HIG sizing |
| **Design Research** | `docs/IOS_26_DESIGN_RESEARCH.md` | Liquid Glass design properties, visual tokens, community-derived values |
| **Native Research** | `docs/IOS_26_NATIVE_RESEARCH.md` | UI patterns research, library comparisons, common patterns |

**When in doubt, search these docs first.** Run: `Search for "GlassView" in docs/IOS_26_IMPLEMENTATION_GUIDE.md`

---

## MANDATORY RULES -- ZERO EXCEPTIONS

### Rule 1: NO Hardcoded Hex Colors for System UI

Every background, text color, separator, and fill that corresponds to a system semantic color MUST use `PlatformColor()` on iOS or `useThemeColors()` from context.

```tsx
// VIOLATION -- hardcoded colors don't adapt to light/dark/glass/high-contrast
backgroundColor: '#FFFFFF'
color: '#000000'
borderColor: '#E5E5EA'
backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF'

// CORRECT -- use PlatformColor on iOS, theme colors on Android
backgroundColor: Platform.OS === 'ios'
  ? PlatformColor('systemBackground')
  : colors.background
color: Platform.OS === 'ios'
  ? PlatformColor('label')
  : colors.onSurface
borderColor: Platform.OS === 'ios'
  ? PlatformColor('separator')
  : colors.outline
```

**The ONLY exceptions** are brand colors (`#B06D1E`, `#FFBA70`, `#E91E63`, `#FFFAF2`) which should use `DynamicColorIOS` for light/dark adaptation.

**Color mapping reference:**

| Hardcoded | Replace With |
|-----------|--------------|
| `#FFFFFF`, `white` | `PlatformColor('systemBackground')` |
| `#F2F2F7`, `#F5F5F5`, `#FAFAFA` | `PlatformColor('secondarySystemBackground')` |
| `#000000`, `#333333`, `#1A1A1A` | `PlatformColor('label')` |
| `#666666`, `#8E8E93`, `#6B7280` | `PlatformColor('secondaryLabel')` |
| `#9CA3AF`, `#AEAEB2` | `PlatformColor('tertiaryLabel')` |
| `#E5E5EA`, `#D1D1D6`, `#E0E0E0` | `PlatformColor('separator')` |
| `#C6C6C8`, `#38383A` | `PlatformColor('opaqueSeparator')` |
| `#1C1C1E`, `#2C2C2E` | `PlatformColor('secondarySystemBackground')` or `PlatformColor('tertiarySystemBackground')` |
| `#3A3A3C` | `PlatformColor('systemGray4')` |
| `#007AFF` | `PlatformColor('systemBlue')` |
| `#FF3B30` | `PlatformColor('systemRed')` |
| `#34C759` | `PlatformColor('systemGreen')` |
| `#FF9500` | `PlatformColor('systemOrange')` |
| `#FF2D55` | `PlatformColor('systemPink')` |

### Rule 2: NO `useColorScheme()` in Individual Components

`useColorScheme()` is called ONCE at the root in `ThemeProvider`. Every other component MUST use:
- `useTheme()` -- full theme object
- `useThemeColors()` -- just colors
- `useIsDarkMode()` -- just boolean

```tsx
// VIOLATION
import { useColorScheme } from 'react-native';
const colorScheme = useColorScheme();
const isDark = colorScheme === 'dark';

// CORRECT
import { useThemeColors, useIsDarkMode } from '@/context/ThemeContext';
const colors = useThemeColors();
const isDark = useIsDarkMode();
```

**Allowed exceptions:** `_layout.tsx` (root), `ThemeContext.tsx`, `platformColors.ts`.

### Rule 3: Liquid Glass on ALL Floating Elements

Every floating/overlay element on iOS 26 MUST use Liquid Glass. Use the existing `LiquidGlassView` wrapper component or `GlassView` directly.

**Where Liquid Glass is REQUIRED:**
- Tab bars (automatic via NativeTabs)
- Navigation headers (automatic via headerBlurEffect)
- Floating action bars / buttons
- Bottom sheets / sheet headers
- Context menus (automatic via native context menu)
- Alerts (automatic via Alert.alert)
- Action sheets (automatic via ActionSheetIOS)
- Custom floating overlays, toolbars, and pill controls
- Segmented controls (automatic via native component)

**Where Liquid Glass is NOT used:**
- List cells / table rows
- Card content backgrounds
- Full-page content areas
- Text containers
- Media content

**Implementation pattern:**

```tsx
import { LiquidGlassView } from '@/components/ui/LiquidGlass';

<LiquidGlassView
  style={styles.floatingBar}
  fallbackColor={colors.surface}
  isInteractive={true}
  glassEffectStyle="regular"
>
  {/* floating content */}
</LiquidGlassView>
```

**Never use `BlurView` alone for floating elements.** Always use `LiquidGlassView` (which falls back to solid background) or check `isGlassEffectAPIAvailable()` and use `GlassView` directly.

### Rule 4: `contentInsetAdjustmentBehavior="automatic"` on ALL Scroll Views

Every `ScrollView`, `FlatList`, and `SectionList` MUST set this prop. It ensures content insets adjust for translucent headers and tab bars on iOS.

```tsx
// VIOLATION
<ScrollView>

// CORRECT
<ScrollView contentInsetAdjustmentBehavior="automatic">
<FlatList contentInsetAdjustmentBehavior="automatic" />
<SectionList contentInsetAdjustmentBehavior="automatic" />
```

### Rule 5: Haptic Feedback on ALL Interactive Elements

Every `Pressable`, `TouchableOpacity`, and button-like element MUST include haptic feedback on iOS.

```tsx
import * as Haptics from 'expo-haptics';

<Pressable onPress={() => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  handleAction();
}}>
```

| Action | Haptic |
|--------|--------|
| Tab selection | `selectionAsync()` |
| Button tap | `impactAsync(ImpactFeedbackStyle.Light)` |
| Card press | `impactAsync(ImpactFeedbackStyle.Medium)` |
| Toggle switch | `impactAsync(ImpactFeedbackStyle.Rigid)` |
| Long press trigger | `impactAsync(ImpactFeedbackStyle.Heavy)` |
| Match / success | `notificationAsync(NotificationFeedbackType.Success)` |
| Error | `notificationAsync(NotificationFeedbackType.Error)` |

### Rule 6: Native Navigation Headers -- No Custom Headers

Use the native `Stack.Screen` header with `headerBlurEffect` and `headerLargeTitle`. Do NOT build custom View-based headers unless the screen requires a complex custom header (e.g., image header, media overlay).

```tsx
// VIOLATION -- custom View-based header for a standard list screen
<View style={styles.header}>
  <TouchableOpacity onPress={goBack}><Text>Back</Text></TouchableOpacity>
  <Text style={styles.title}>Settings</Text>
</View>

// CORRECT -- native header
<Stack.Screen options={{
  title: 'Settings',
  headerLargeTitle: Platform.OS === 'ios',
  headerBlurEffect: Platform.OS === 'ios' ? 'systemMaterial' : undefined,
}} />
```

### Rule 7: SF Symbols for ALL iOS Icons

All icons on iOS MUST use `expo-symbols` `SymbolView` or the `PlatformIcon` abstraction. Never use Ionicons, MaterialIcons, or FontAwesome on iOS.

```tsx
import { SymbolView } from 'expo-symbols';

<SymbolView
  name="heart.fill"
  tintColor={PlatformColor('systemPink')}
  style={{ width: 24, height: 24 }}
  type="hierarchical"
/>
```

### Rule 8: NativeTabs with iOS 26 Features

The tab bar MUST use `NativeTabs` (already implemented). Ensure these iOS 26 features are enabled:
- `minimizeBehavior="onScrollDown"` -- auto-minimize on scroll
- SF Symbol icons with default/selected states via `sf` prop

### Rule 9: Native Sheets and Modals

Prefer `expo-router` `formSheet` presentation or `@gorhom/bottom-sheet` for bottom sheets. When using `@gorhom/bottom-sheet`, add a glass background:

```tsx
import { LiquidGlassView } from '@/components/ui/LiquidGlass';

<BottomSheet
  backgroundComponent={({ style }) => (
    <LiquidGlassView style={style} glassEffectStyle="regular" />
  )}
/>
```

### Rule 10: DynamicColorIOS for Brand Colors

Custom brand colors that need light/dark adaptation MUST use `DynamicColorIOS`:

```tsx
import { DynamicColorIOS, Platform } from 'react-native';

const brandPrimary = Platform.OS === 'ios'
  ? DynamicColorIOS({ light: '#B06D1E', dark: '#FFBA70' })
  : isDark ? '#FFBA70' : '#B06D1E';
```

---

## SCOPE: iOS-ONLY

| Action | Allowed |
|--------|---------|
| Modify `/mobile` iOS-specific code | YES |
| Use `Platform.OS === 'ios'` conditionals | YES |
| Add iOS-only features | YES |
| Modify `/web` in any way | NEVER |
| Break Android functionality | NEVER |
| Remove Android code paths | NEVER |

When adding iOS-specific behavior, always provide Android fallbacks:

```tsx
// Pattern: iOS-specific with Android fallback
backgroundColor: Platform.OS === 'ios'
  ? PlatformColor('systemBackground')
  : colors.background,
```

---

## EXISTING COMPONENTS TO USE

| Component | Location | Use For |
|-----------|----------|---------|
| `LiquidGlassView` | `components/ui/LiquidGlass.tsx` | Glass cards, floating elements |
| `LiquidGlassHeader` | `components/ui/LiquidGlass.tsx` | Custom header backgrounds |
| `LiquidGlassFAB` | `components/ui/LiquidGlass.tsx` | Floating action buttons |
| `useLiquidGlass()` | `components/ui/LiquidGlass.tsx` | Check glass availability |
| `PlatformIcon` | `components/ui/PlatformIcon.tsx` | Cross-platform icons (SF Symbols on iOS) |
| `ScreenHeader` | `components/ui/ScreenHeader.tsx` | Custom screen headers (has `liquidGlass` prop) |
| `useTheme()` | `context/ThemeContext.tsx` | Full theme with dark mode |
| `useThemeColors()` | `context/ThemeContext.tsx` | Just color values |
| `useIsDarkMode()` | `context/ThemeContext.tsx` | Just boolean |
| `useSemanticColors()` | `utils/platformColors.ts` | PlatformColor-based semantic colors |

---

## PRE-COMPLETION CHECKLIST

Before submitting ANY change to a mobile component:

- [ ] **No hardcoded hex colors** for system UI elements (backgrounds, text, borders, separators)
- [ ] **PlatformColor** used for all iOS system colors
- [ ] **`useTheme()`/`useThemeColors()`** used instead of `useColorScheme()` for theme access
- [ ] **`contentInsetAdjustmentBehavior="automatic"`** on all ScrollView/FlatList/SectionList
- [ ] **Haptic feedback** on all interactive elements (Pressable, TouchableOpacity, buttons)
- [ ] **SF Symbols** via `SymbolView` or `PlatformIcon` for all iOS icons
- [ ] **Liquid Glass** on floating elements (`LiquidGlassView`, `GlassView`, or native component)
- [ ] **Native navigation** used instead of custom View-based headers (where possible)
- [ ] **`Platform.OS === 'ios'`** isolates all iOS-specific code
- [ ] **Android unchanged** -- all iOS changes use Platform checks
- [ ] **Web untouched** -- no changes to `/web` directory

---

## DOCUMENTATION LINKS

- Implementation Guide: `docs/IOS_26_IMPLEMENTATION_GUIDE.md`
- expo-glass-effect: https://docs.expo.dev/versions/latest/sdk/glass-effect/
- expo-symbols: https://docs.expo.dev/versions/latest/sdk/symbols/
- PlatformColor: https://reactnative.dev/docs/platformcolor
- DynamicColorIOS: https://reactnative.dev/docs/dynamiccolorios
- expo-haptics: https://docs.expo.dev/versions/latest/sdk/haptics/
- expo-blur: https://docs.expo.dev/versions/latest/sdk/blur-view/
- Native Tabs: https://docs.expo.dev/router/advanced/native-tabs/
- Apple HIG: https://developer.apple.com/design/human-interface-guidelines/
