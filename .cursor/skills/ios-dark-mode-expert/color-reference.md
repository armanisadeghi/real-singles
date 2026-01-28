# iOS System Color Reference

Complete reference for iOS semantic colors and their light/dark mode values.

---

## Background Colors

| PlatformColor Name | Light Mode | Dark Mode | Use For |
|--------------------|------------|-----------|---------|
| `systemBackground` | `#FFFFFF` | `#000000` | Primary app background |
| `secondarySystemBackground` | `#F2F2F7` | `#1C1C1E` | Grouped content, cards |
| `tertiarySystemBackground` | `#FFFFFF` | `#2C2C2E` | Third-level content |
| `systemGroupedBackground` | `#F2F2F7` | `#000000` | Grouped table views |
| `secondarySystemGroupedBackground` | `#FFFFFF` | `#1C1C1E` | Cells in grouped tables |
| `tertiarySystemGroupedBackground` | `#F2F2F7` | `#2C2C2E` | Third-level grouped content |

---

## Label Colors

| PlatformColor Name | Light Mode | Dark Mode | Use For |
|--------------------|------------|-----------|---------|
| `label` | `#000000` | `#FFFFFF` | Primary text |
| `secondaryLabel` | `rgba(60,60,67,0.6)` | `rgba(235,235,245,0.6)` | Secondary text, subtitles |
| `tertiaryLabel` | `rgba(60,60,67,0.3)` | `rgba(235,235,245,0.3)` | Tertiary text, disabled |
| `quaternaryLabel` | `rgba(60,60,67,0.18)` | `rgba(235,235,245,0.16)` | Watermarks, very subtle text |
| `placeholderText` | `rgba(60,60,67,0.3)` | `rgba(235,235,245,0.3)` | Input placeholders |

---

## Separator Colors

| PlatformColor Name | Light Mode | Dark Mode | Use For |
|--------------------|------------|-----------|---------|
| `separator` | `rgba(60,60,67,0.29)` | `rgba(84,84,88,0.6)` | Thin dividers (hairline) |
| `opaqueSeparator` | `#C6C6C8` | `#38383A` | Opaque dividers |

---

## Fill Colors

| PlatformColor Name | Light Mode | Dark Mode | Use For |
|--------------------|------------|-----------|---------|
| `systemFill` | `rgba(120,120,128,0.2)` | `rgba(120,120,128,0.36)` | Large fill areas |
| `secondarySystemFill` | `rgba(120,120,128,0.16)` | `rgba(120,120,128,0.32)` | Secondary fills |
| `tertiarySystemFill` | `rgba(118,118,128,0.12)` | `rgba(118,118,128,0.24)` | Tertiary fills |
| `quaternarySystemFill` | `rgba(116,116,128,0.08)` | `rgba(118,118,128,0.18)` | Quaternary fills |

---

## System Tint Colors

These adapt slightly between light and dark mode for optimal contrast:

| PlatformColor Name | Light Mode | Dark Mode | Use For |
|--------------------|------------|-----------|---------|
| `systemBlue` | `#007AFF` | `#0A84FF` | Links, primary actions |
| `systemGreen` | `#34C759` | `#30D158` | Success, positive |
| `systemIndigo` | `#5856D6` | `#5E5CE6` | Accent, special |
| `systemOrange` | `#FF9500` | `#FF9F0A` | Warning, attention |
| `systemPink` | `#FF2D55` | `#FF375F` | Love, heart, social |
| `systemPurple` | `#AF52DE` | `#BF5AF2` | Premium, special |
| `systemRed` | `#FF3B30` | `#FF453A` | Error, destructive |
| `systemTeal` | `#5AC8FA` | `#64D2FF` | Info, secondary accent |
| `systemYellow` | `#FFCC00` | `#FFD60A` | Caution, highlight |

---

## Gray Colors

| PlatformColor Name | Light Mode | Dark Mode | Use For |
|--------------------|------------|-----------|---------|
| `systemGray` | `#8E8E93` | `#8E8E93` | Standard gray |
| `systemGray2` | `#AEAEB2` | `#636366` | Secondary gray |
| `systemGray3` | `#C7C7CC` | `#48484A` | Tertiary gray |
| `systemGray4` | `#D1D1D6` | `#3A3A3C` | Quaternary gray |
| `systemGray5` | `#E5E5EA` | `#2C2C2E` | Fifth gray |
| `systemGray6` | `#F2F2F7` | `#1C1C1E` | Lightest/darkest gray |

---

## Project Brand Colors with DynamicColorIOS

For the RealSingles brand palette:

```tsx
import { DynamicColorIOS, Platform } from 'react-native';

export const BrandColors = {
  // Primary brand color (warm brown/gold)
  primary: Platform.OS === 'ios'
    ? DynamicColorIOS({
        light: '#B06D1E',
        dark: '#FFBA70',
        highContrastLight: '#8A5516',
        highContrastDark: '#FFD4A3',
      })
    : '#B06D1E',
  
  // Primary container (muted brand)
  primaryContainer: Platform.OS === 'ios'
    ? DynamicColorIOS({
        light: '#FFE0C4',
        dark: '#4A2E0D',
      })
    : '#FFE0C4',
  
  // Brand background (warm cream)
  brandBackground: Platform.OS === 'ios'
    ? DynamicColorIOS({
        light: '#FFFAF2',
        dark: '#000000',
      })
    : '#FFFAF2',
  
  // Secondary (warm gray-brown)
  secondary: Platform.OS === 'ios'
    ? DynamicColorIOS({
        light: '#725747',
        dark: '#D3C4B4',
      })
    : '#725747',
  
  // Tertiary (olive/sage)
  tertiary: Platform.OS === 'ios'
    ? DynamicColorIOS({
        light: '#5D5F34',
        dark: '#E2E4AE',
      })
    : '#5D5F34',
};
```

---

## Common Migration Patterns

### White Backgrounds

```tsx
// ❌ Before
backgroundColor: '#FFFFFF'
backgroundColor: 'white'

// ✅ After
backgroundColor: Platform.OS === 'ios' 
  ? PlatformColor('systemBackground') 
  : colors.background
```

### Black/Dark Text

```tsx
// ❌ Before
color: '#000000'
color: '#333'
color: '#1A1A1A'

// ✅ After
color: Platform.OS === 'ios' 
  ? PlatformColor('label') 
  : colors.onSurface
```

### Gray Text (Secondary)

```tsx
// ❌ Before
color: '#666666'
color: '#8E8E93'
color: 'gray'

// ✅ After
color: Platform.OS === 'ios' 
  ? PlatformColor('secondaryLabel') 
  : colors.onSurfaceVariant
```

### Borders/Dividers

```tsx
// ❌ Before
borderColor: '#E5E5EA'
borderColor: '#EEEEEE'
borderBottomColor: '#D1D1D6'

// ✅ After
borderColor: Platform.OS === 'ios' 
  ? PlatformColor('separator') 
  : colors.outline
```

### Action Blue

```tsx
// ❌ Before
color: '#007AFF'
backgroundColor: '#0055CC'

// ✅ After
color: Platform.OS === 'ios' 
  ? PlatformColor('systemBlue') 
  : colors.primary
```

### Error/Destructive Red

```tsx
// ❌ Before
color: '#FF0000'
color: '#FF3B30'
backgroundColor: '#DC2626'

// ✅ After
color: Platform.OS === 'ios' 
  ? PlatformColor('systemRed') 
  : colors.error
```

### Success Green

```tsx
// ❌ Before
color: '#00FF00'
color: '#34C759'
color: '#22C55E'

// ✅ After
color: Platform.OS === 'ios' 
  ? PlatformColor('systemGreen') 
  : colors.primary // or a success color from theme
```

---

## Elevated Surface Patterns

For cards and elevated content:

```tsx
const cardStyle = {
  backgroundColor: Platform.OS === 'ios'
    ? PlatformColor('secondarySystemBackground')
    : colors.surfaceContainer,
  
  // iOS uses subtle shadows
  ...(Platform.OS === 'ios' && {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  }),
  
  // Android uses elevation
  ...(Platform.OS === 'android' && {
    elevation: 1,
  }),
};
```

---

## Modal/Sheet Overlays

```tsx
const overlayStyle = {
  backgroundColor: Platform.OS === 'ios'
    ? 'rgba(0,0,0,0.4)' // Standard iOS modal overlay
    : 'rgba(0,0,0,0.5)',
};

const sheetBackgroundStyle = {
  backgroundColor: Platform.OS === 'ios'
    ? PlatformColor('systemBackground')
    : colors.surface,
};
```

---

## Input Field Styling

```tsx
const inputStyle = {
  backgroundColor: Platform.OS === 'ios'
    ? PlatformColor('tertiarySystemBackground')
    : colors.surfaceContainerHigh,
  
  color: Platform.OS === 'ios'
    ? PlatformColor('label')
    : colors.onSurface,
  
  borderColor: Platform.OS === 'ios'
    ? PlatformColor('separator')
    : colors.outline,
};

const placeholderColor = Platform.OS === 'ios'
  ? PlatformColor('placeholderText')
  : colors.onSurfaceVariant;
```

---

## List/Table Row Styling

```tsx
// Standard row
const rowStyle = {
  backgroundColor: Platform.OS === 'ios'
    ? PlatformColor('secondarySystemGroupedBackground')
    : colors.surface,
};

// Row separator
const separatorStyle = {
  backgroundColor: Platform.OS === 'ios'
    ? PlatformColor('separator')
    : colors.outlineVariant,
  height: StyleSheet.hairlineWidth,
};

// Pressed/selected state
const pressedRowStyle = {
  backgroundColor: Platform.OS === 'ios'
    ? PlatformColor('systemGray5')
    : colors.surfaceContainerHighest,
};
```

---

## Skeleton Loading States

```tsx
const skeletonStyle = {
  backgroundColor: Platform.OS === 'ios'
    ? PlatformColor('systemGray5')
    : colors.surfaceContainerHigh,
};

// Animated skeleton shimmer color
const shimmerHighlight = Platform.OS === 'ios'
  ? PlatformColor('systemGray4')
  : colors.surfaceContainerHighest;
```

---

## Badge/Chip Colors

```tsx
// Standard badge
const badgeStyle = {
  backgroundColor: Platform.OS === 'ios'
    ? PlatformColor('systemGray5')
    : colors.surfaceContainerHigh,
  
  color: Platform.OS === 'ios'
    ? PlatformColor('label')
    : colors.onSurfaceVariant,
};

// Accent badge (e.g., "New", "Premium")
const accentBadgeStyle = {
  backgroundColor: Platform.OS === 'ios'
    ? PlatformColor('systemBlue')
    : colors.primary,
  
  color: '#FFFFFF', // White text on accent is OK
};
```

---

## iOS 17+ Color Additions

iOS 17 introduced additional semantic colors. Use with fallbacks:

```tsx
const linkColor = Platform.OS === 'ios'
  ? PlatformColor('link') // iOS 17+, falls back to blue
  : colors.primary;

// Note: Not all iOS 17 colors are available via PlatformColor in React Native.
// Use DynamicColorIOS for custom implementations when needed.
```

---

## Testing Dark Mode

### Simulator

1. Open Settings → Developer
2. Toggle "Dark Appearance" or use Cmd+Shift+A

### Physical Device

1. Settings → Display & Brightness → Dark
2. Or: Control Center → Long press brightness → Dark Mode

### Accessibility Settings

Test all combinations:
- Settings → Accessibility → Display & Text Size → Reduce Transparency
- Settings → Accessibility → Display & Text Size → Increase Contrast
- Settings → Accessibility → Display & Text Size → Bold Text
- Settings → Accessibility → Motion → Reduce Motion

---

## Debugging Colors

If colors aren't adapting:

1. **Verify Platform check:**
   ```tsx
   console.log('Platform:', Platform.OS);
   ```

2. **Verify PlatformColor is being used on iOS:**
   ```tsx
   const bgColor = Platform.OS === 'ios' 
     ? PlatformColor('systemBackground')
     : '#FFFFFF';
   console.log('bgColor:', bgColor); // Should be an object on iOS
   ```

3. **Check useColorScheme is reactive:**
   ```tsx
   const colorScheme = useColorScheme();
   console.log('colorScheme:', colorScheme); // 'light' | 'dark' | null
   ```

4. **Ensure component re-renders on theme change:**
   - useColorScheme triggers re-render automatically
   - PlatformColor handles it natively
   - Custom theme context must use useColorScheme internally
