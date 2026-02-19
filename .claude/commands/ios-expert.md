iOS native implementation expert for iOS 26, Liquid Glass, SF Symbols, and PlatformColor.

Task: $ARGUMENTS

## Scope: iOS-ONLY

| Action | Allowed |
|--------|---------|
| Modify `/mobile` iOS-specific code | YES |
| Use `Platform.OS === 'ios'` conditionals | YES |
| Modify `/web` in any way | NEVER |
| Break Android functionality | NEVER |

## MANDATORY RULES

### Rule 1: NO Hardcoded Hex Colors for System UI

Use `PlatformColor()` on iOS, `useThemeColors()` for Android fallback.

| Hardcoded | Replace With |
|-----------|--------------|
| `#FFFFFF`, `white` | `PlatformColor('systemBackground')` |
| `#F2F2F7` | `PlatformColor('secondarySystemBackground')` |
| `#000000` | `PlatformColor('label')` |
| `#8E8E93` | `PlatformColor('secondaryLabel')` |
| `#E5E5EA` | `PlatformColor('separator')` |
| `#007AFF` | `PlatformColor('systemBlue')` |
| `#FF3B30` | `PlatformColor('systemRed')` |
| `#34C759` | `PlatformColor('systemGreen')` |

Brand colors use `DynamicColorIOS({ light: '#B06D1E', dark: '#FFBA70' })`.

### Rule 2: NO `useColorScheme()` in Components

Use `useTheme()`, `useThemeColors()`, or `useIsDarkMode()` from `@/context/ThemeContext`.

### Rule 3: Liquid Glass on ALL Floating Elements

Use `LiquidGlassView` from `@/components/ui/LiquidGlass` or `GlassView` from `expo-glass-effect`.

**Required on:** Tab bars, navigation headers, floating buttons, bottom sheets, custom overlays.
**Not used on:** List cells, card content, full-page areas, text containers.

### Rule 4: `contentInsetAdjustmentBehavior="automatic"` on ALL Scroll Views

Every `ScrollView`, `FlatList`, `SectionList` MUST set this prop.

### Rule 5: Haptic Feedback on ALL Interactive Elements

| Action | Haptic |
|--------|--------|
| Tab selection | `selectionAsync()` |
| Button tap | `impactAsync(Light)` |
| Card press | `impactAsync(Medium)` |
| Toggle | `impactAsync(Rigid)` |
| Match/success | `notificationAsync(Success)` |
| Error | `notificationAsync(Error)` |

### Rule 6: Native Navigation Headers

Use `Stack.Screen` with `headerBlurEffect` and `headerLargeTitle`. No custom View-based headers.

### Rule 7: SF Symbols for ALL iOS Icons

```tsx
import { SymbolView } from 'expo-symbols';
<SymbolView name="heart.fill" tintColor={PlatformColor('systemPink')} style={{ width: 24, height: 24 }} />
```

Common symbols: `house`/`house.fill`, `magnifyingglass`, `heart`/`heart.fill`, `bubble.left`/`bubble.left.fill`, `person`/`person.fill`, `gearshape`/`gearshape.fill`.

### Rule 8: NativeTabs with `minimizeBehavior="onScrollDown"`

### Rule 9: Native Sheets with glass background

### Rule 10: DynamicColorIOS for Brand Colors

## Existing Components

| Component | Location |
|-----------|----------|
| `LiquidGlassView` | `components/ui/LiquidGlass.tsx` |
| `PlatformIcon` | `components/ui/PlatformIcon.tsx` |
| `ScreenHeader` | `components/ui/ScreenHeader.tsx` |
| `useTheme()` | `context/ThemeContext.tsx` |
| `useSemanticColors()` | `utils/platformColors.ts` |

## Pre-Completion Checklist

- [ ] No hardcoded hex for system UI (PlatformColor used)
- [ ] `useTheme()`/`useThemeColors()` instead of `useColorScheme()`
- [ ] `contentInsetAdjustmentBehavior="automatic"` on scrollables
- [ ] Haptic feedback on all interactive elements
- [ ] SF Symbols via `SymbolView` or `PlatformIcon`
- [ ] Liquid Glass on floating elements
- [ ] `Platform.OS === 'ios'` isolates iOS code
- [ ] Android unchanged, Web untouched
