---
name: ios-native-expert
description: Ensures iOS implementations use truly native components, latest iOS 26 design patterns (Liquid Glass), and Human Interface Guidelines. Use when implementing iOS-specific features, reviewing iOS code for native feel, or when the user mentions iOS native, UIKit, SwiftUI patterns, SF Symbols, iOS 26, Liquid Glass, or native iOS components. NEVER modifies web code or Android implementations.
---

# iOS Native Expert

Ensures iOS implementations are authentically native using the latest iOS 26 design patterns, Liquid Glass, and Human Interface Guidelines.

## Scope Restrictions

**CRITICAL: This skill is iOS-ONLY.**

| Action | Allowed |
|--------|---------|
| Modify `/mobile` iOS-specific code | ✅ Yes |
| Use `Platform.OS === 'ios'` conditionals | ✅ Yes |
| Add iOS-only libraries/features | ✅ Yes |
| Modify `/web` in any way | ❌ NEVER |
| Change shared logic that affects Android | ❌ NEVER |
| Remove Android implementations | ❌ NEVER |

When making iOS improvements, use platform conditionals to isolate changes:

```tsx
import { Platform } from 'react-native';

// iOS-specific implementation
{Platform.OS === 'ios' && <IOSOnlyComponent />}

// Platform-specific props
style={Platform.select({
  ios: { /* iOS styles */ },
  android: { /* keep Android unchanged */ },
})}
```

---

## Research First

Before implementing any iOS component, **research the latest iOS patterns**:

1. **Check current iOS version** (iOS 26 as of 2025-2026)
2. **Search for latest HIG updates**: "iOS 26 Human Interface Guidelines [component]"
3. **Look up native equivalents**: "SwiftUI [component] iOS 26" or "UIKit [component]"
4. **Verify Expo/RN support**: Check if native-backed libraries exist (Expo SDK 54+)

### Key Research Queries

| Component Type | Search For |
|----------------|-----------|
| Navigation | "iOS 26 tab bar Liquid Glass", "UITabBarController iOS 26" |
| Controls | "iOS 26 Liquid Glass controls", "glassEffect SwiftUI" |
| Lists | "iOS 26 list styles", "UICollectionView compositional layout" |
| Forms | "iOS form patterns 2026", "SwiftUI Form" |
| Sheets | "iOS 26 sheet Liquid Glass", "UISheetPresentationController" |
| Buttons | "iOS 26 glass buttons", "bordered prominent button" |
| Pickers | "iOS wheel picker vs menu picker", "UIDatePicker styles" |

---

## iOS 26 Design Language: Liquid Glass

**Liquid Glass** is Apple's most significant design evolution since iOS 7, introduced at WWDC 2025.

### Core Characteristics

| Property | Description |
|----------|-------------|
| **Lensing** | Real-time light bending that concentrates light (not blur) |
| **Materialization** | Elements appear by gradually modulating light bending |
| **Fluidity** | Gel-like flexibility with instant touch responsiveness |
| **Morphing** | Dynamic transformation between control states |
| **Adaptivity** | Multi-layer composition adjusting to content and lighting |

### Where Liquid Glass Applies

**✅ NAVIGATION LAYER ONLY:**
- Tab bars
- Toolbars
- Navigation bars
- Floating action buttons
- Sheets and alerts
- System controls (toggles, segmented pickers, sliders)

**❌ NEVER ON CONTENT:**
- Lists and tables
- Media content
- Card backgrounds
- Page content areas

### Visual Characteristics

| Element | iOS 26 Pattern |
|---------|---------------|
| Corners | Large radius (continuous corners, ~16-20pt for cards) |
| Materials | Liquid Glass for navigation, traditional blur for content overlays |
| Typography | SF Pro with Dynamic Type support |
| Colors | System colors that adapt to appearance and Liquid Glass |
| Depth | Specular highlights, adaptive shadows responding to device motion |
| Motion | Spring animations with iOS-native feel |

### Expo Liquid Glass Support (SDK 54+)

```tsx
import { GlassView, GlassContainer, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Platform } from 'react-native';

// Check availability before using
const hasLiquidGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();

// Basic GlassView
{hasLiquidGlass && (
  <GlassView 
    style={styles.floatingButton}
    glassEffectStyle="regular" // 'regular' | 'clear'
    isInteractive={true}
  >
    <SymbolView name="plus" tintColor="label" />
  </GlassView>
)}

// GlassContainer for grouped glass elements
{hasLiquidGlass && (
  <GlassContainer spacing={10} style={styles.toolbar}>
    <GlassView style={styles.toolbarButton} isInteractive />
    <GlassView style={styles.toolbarButton} isInteractive />
    <GlassView style={styles.toolbarButton} isInteractive />
  </GlassContainer>
)}
```

**Important Limitations:**
- `isInteractive` can only be set once on mount (use `key` prop to remount)
- Avoid `opacity < 1` on GlassView or parent views (causes rendering issues)
- Falls back to regular `View` on iOS < 26 and other platforms

### System Colors (Always Use)

```tsx
// In React Native, use PlatformColor for iOS system colors
import { PlatformColor, Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Platform.OS === 'ios' 
      ? PlatformColor('systemBackground')
      : '#FFFFFF',
  },
  text: {
    color: Platform.OS === 'ios'
      ? PlatformColor('label')
      : '#000000',
  },
  accent: {
    color: Platform.OS === 'ios'
      ? PlatformColor('systemBlue')
      : '#007AFF',
  },
});
```

---

## Native Component Mapping

### Use These (Native-Backed)

| Need | Use | NOT |
|------|-----|-----|
| Tab bar | `expo-router/unstable-native-tabs` | `@react-navigation/bottom-tabs` |
| Liquid Glass | `expo-glass-effect` | Custom blur overlays |
| Bottom sheet | `@gorhom/bottom-sheet` | Custom `Animated.View` |
| Icons | `expo-symbols` (SF Symbols 7) | Icon fonts, PNGs |
| Date picker | `@react-native-community/datetimepicker` | Custom date pickers |
| Haptics | `expo-haptics` | Vibration API |
| Blur | `expo-blur` | Custom opacity overlays |
| Gestures | `react-native-gesture-handler` | PanResponder |
| Animations | `react-native-reanimated` | Animated API |

### SF Symbols 7 (expo-symbols)

SF Symbols 7 includes **6,900+ symbols** with new animation capabilities:

- **Draw/Draw Off**: Calligraphic handwriting-inspired animations
- **Variable Draw**: Progress indicators using symbol layers
- **Gradients**: Automatic linear gradients from source colors
- **Enhanced Magic Replace**: Smoother transitions between related symbols

```tsx
import { Icon } from 'expo-router/unstable-native-tabs';

// Tab icons - use fill variants for selected
<Icon
  sf={{ default: 'heart', selected: 'heart.fill' }}
  androidSrc={icons.heart} // Keep Android separate
/>

// Standalone SF Symbols with animations
import { SymbolView } from 'expo-symbols';

{Platform.OS === 'ios' && (
  <SymbolView
    name="heart.fill"
    style={{ width: 24, height: 24 }}
    tintColor="systemRed"
    type="hierarchical" // 'monochrome' | 'hierarchical' | 'palette' | 'multicolor'
    animationSpec={{
      effect: { type: 'bounce', wholeSymbol: true },
      repeating: false,
    }}
  />
)}

// Variable animation (for progress indicators)
<SymbolView
  name="speaker.wave.3"
  animationSpec={{
    effect: { type: 'pulse' },
    variableAnimationSpec: {
      cumulative: true,
      dimInactiveLayers: true,
    },
    repeating: true,
  }}
/>
```

**Animation Types:** `'bounce'` | `'pulse'` | `'scale'`

**Finding symbols**: SF Symbols 7 app or https://developer.apple.com/sf-symbols/

---

## iOS-Specific Patterns

### Action Sheets (iOS Style)

Use native `ActionSheetIOS` for iOS:

```tsx
import { ActionSheetIOS, Platform } from 'react-native';

const showOptions = () => {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', 'Delete', 'Save'],
        destructiveButtonIndex: 1,
        cancelButtonIndex: 0,
        title: 'Choose an action',
      },
      (buttonIndex) => {
        // Handle selection
      }
    );
  } else {
    // Android: Use bottom sheet or modal
  }
};
```

### Haptic Feedback

iOS users expect haptic feedback for interactions:

```tsx
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Selection feedback (light tap)
const onSelect = () => {
  if (Platform.OS === 'ios') {
    Haptics.selectionAsync();
  }
  // ... rest of handler
};

// Impact feedback (button press)
const onPress = () => {
  if (Platform.OS === 'ios') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
  // ... rest of handler
};

// Notification feedback (success/error/warning)
const onSuccess = () => {
  if (Platform.OS === 'ios') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};
```

### Context Menus (Long Press)

iOS 13+ context menus for long-press actions:

```tsx
import { ContextMenuView } from 'react-native-ios-context-menu';
// Only render on iOS, fallback for Android

{Platform.OS === 'ios' ? (
  <ContextMenuView
    menuConfig={{
      menuTitle: '',
      menuItems: [
        { actionKey: 'share', actionTitle: 'Share', icon: { iconType: 'SYSTEM', iconValue: 'square.and.arrow.up' }},
        { actionKey: 'delete', actionTitle: 'Delete', icon: { iconType: 'SYSTEM', iconValue: 'trash' }, menuAttributes: ['destructive'] },
      ],
    }}
    onPressMenuItem={({ nativeEvent }) => handleAction(nativeEvent.actionKey)}
  >
    <YourComponent />
  </ContextMenuView>
) : (
  <YourComponent onLongPress={showAndroidMenu} />
)}
```

### Pull to Refresh

Use native refresh control:

```tsx
import { RefreshControl, Platform } from 'react-native';

<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={Platform.OS === 'ios' ? '#E91E63' : undefined}
      // iOS automatically uses system styling
    />
  }
>
```

---

## Form Components

### Pickers

iOS has specific picker UX expectations:

```tsx
import { Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

// Date picker - iOS uses inline/wheel, Android uses modal
<DateTimePicker
  value={date}
  mode="date"
  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
  onChange={onChange}
/>
```

For selection pickers, iOS prefers:
- **Wheel picker** for short lists (3-10 items)
- **Menu/dropdown** for longer lists
- **Segmented control** for 2-5 mutually exclusive options

### Segmented Control

Use native segmented control for iOS:

```tsx
import SegmentedControl from '@react-native-segmented-control/segmented-control';

{Platform.OS === 'ios' ? (
  <SegmentedControl
    values={['Day', 'Week', 'Month']}
    selectedIndex={selectedIndex}
    onChange={(event) => setSelectedIndex(event.nativeEvent.selectedSegmentIndex)}
  />
) : (
  <AndroidTabSelector {...props} />
)}
```

### Text Input

iOS-specific input considerations:

```tsx
<TextInput
  // iOS-specific props
  clearButtonMode={Platform.OS === 'ios' ? 'while-editing' : undefined}
  enablesReturnKeyAutomatically={Platform.OS === 'ios'}
  keyboardAppearance={Platform.OS === 'ios' ? 'light' : undefined}
  // Shared props
  placeholder="Email"
  autoCapitalize="none"
  autoCorrect={false}
/>
```

---

## Navigation Patterns

### Large Titles

iOS navigation bars support large titles:

```tsx
// In expo-router, configure in layout
<Stack.Screen
  options={{
    headerLargeTitle: Platform.OS === 'ios',
    headerLargeTitleShadowVisible: false,
    headerBlurEffect: Platform.OS === 'ios' ? 'regular' : undefined,
  }}
/>
```

### Search Bar

Native search bar integration:

```tsx
<Stack.Screen
  options={{
    headerSearchBarOptions: Platform.OS === 'ios' ? {
      placeholder: 'Search',
      hideWhenScrolling: true,
      onChangeText: (event) => setSearch(event.nativeEvent.text),
    } : undefined,
  }}
/>
```

---

## Animation Guidelines

iOS animations should feel natural with spring physics:

```tsx
import Animated, { 
  withSpring, 
  withTiming,
  Easing 
} from 'react-native-reanimated';

// iOS-style spring (bouncy, natural)
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{
    scale: withSpring(pressed.value ? 0.95 : 1, {
      damping: 15,
      stiffness: 150,
    }),
  }],
}));

// iOS timing curve
const fadeIn = withTiming(1, {
  duration: 250,
  easing: Easing.out(Easing.cubic),
});
```

---

## Checklist

Before completing any iOS implementation:

- [ ] Uses native-backed components (not JS approximations)
- [ ] SF Symbols used for all icons (not icon fonts)
- [ ] Haptic feedback on interactions where appropriate
- [ ] System colors via `PlatformColor` where applicable
- [ ] Platform conditionals isolate iOS code (`Platform.OS === 'ios'`)
- [ ] Android implementation unchanged
- [ ] Web code untouched
- [ ] Follows iOS 18 Human Interface Guidelines
- [ ] Tested on actual iOS device (simulator acceptable for layout)

---

## Reference Implementation

See `mobile/app/(tabs)/_layout.tsx` for the gold standard of native iOS implementation in this codebase—minimal code, fully native.

---

## Additional Resources

For deep dives on specific patterns, research:
- Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/
- SF Symbols: https://developer.apple.com/sf-symbols/
- iOS 18 design updates: Search "iOS 18 design changes WWDC"
