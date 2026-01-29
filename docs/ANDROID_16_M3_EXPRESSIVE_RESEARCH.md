# Android 16 Material 3 Expressive - UX Research for React Native / Expo

**Date:** January 2026
**Status:** Deep Research Complete
**Scope:** Material 3 Expressive component patterns, React Native/Expo implementation strategies

---

## Table of Contents

1. [Material 3 Expressive Overview](#1-material-3-expressive-overview)
2. [Navigation Rails and Bottom Navigation Bars](#2-navigation-rails-and-bottom-navigation-bars)
3. [Floating Toolbars](#3-floating-toolbars)
4. [Split Buttons and Button Groups](#4-split-buttons-and-button-groups)
5. [Material You Search Bars](#5-material-you-search-bars)
6. [FAB Patterns](#6-fab-patterns-in-material-3-expressive)
7. [Progress Indicators with Spring Physics](#7-progress-indicators-with-spring-physics)
8. [Spring Motion System and Tokens](#8-spring-motion-system-and-tokens)
9. [React Native Library Landscape](#9-react-native-library-landscape)
10. [Implementation Strategy for React Native / Expo](#10-implementation-strategy-for-react-native--expo)
11. [Sources](#11-sources)

---

## 1. Material 3 Expressive Overview

Material 3 Expressive (M3E) is the latest evolution of Google's Material Design system, announced at Google I/O in May 2025 and launched with Android 16 QPR1 in September 2025. It is an **extension** of Material You (Material 3), not a replacement or new generation like "Material 4."

### Key Facts

- **15 new or refreshed UI components** including button groups, split buttons, toolbars, loading indicators, and FAB menu
- **35 new shape tokens** with shape morphing support
- **New spring-based motion system** replacing easing/duration curves
- **Backed by 46 user studies** with 18,000+ participants across all age groups
- Users identified key UI elements **up to 4x faster** in expressive layouts
- Debuted on Pixel 6+ devices with Android 16 QPR1 (September 2025)
- Google app rollouts largely complete by December 2025

### New Components

| Component | Status | Description |
|-----------|--------|-------------|
| Button Groups | New | Horizontally grouped buttons with interactive width animation |
| Split Buttons | New | Dual-action buttons with primary action + dropdown |
| Floating Toolbars | New | Docked and floating toolbar variants |
| Loading Indicator | New | Shape-morphing replacement for indeterminate circular indicators |
| FAB Menu | New | Expandable FAB with toggle state and menu items |
| Flexible Navigation Bar | Updated | Shorter height, horizontal items on medium windows |
| Navigation Rail | Updated | Refreshed for medium/expanded/large windows |
| Progress Indicators | Updated | Wavy shape option, variable track height |
| Extended FAB | Updated | New sizes, color theme overlays |
| App Bars | Updated | Search app bar variant, new layout patterns |

---

## 2. Navigation Rails and Bottom Navigation Bars

### M3 Expressive Navigation Bar (Bottom)

The bottom navigation bar has been significantly updated in M3 Expressive:

**Key Changes:**
- **Renamed** from "Navigation Bar" to "Flexible Navigation Bar"
- **Shorter height** - reverting from M3's taller 80dp to a shorter ~56dp (closer to the old M2 height)
- **Pill-shaped active indicator** - filled icon inside a contrasting pill/stadium-shaped container
- **Horizontal items** on medium-sized windows (foldables/tablets): label appears to the right of the icon
- **No navigation drawers** - Google recommends replacing drawers with the "expanded navigation" pattern
- Active indicator uses `StadiumBorder` shape (fully rounded pill)
- Active indicator default: ~64dp wide x 32dp tall, border radius fully rounded
- Narrower pill indicator in M3E compared to original M3

**Adaptive Behavior:**
| Window Size | Component |
|-------------|-----------|
| Compact (phones) | Bottom Navigation Bar (flexible) |
| Medium (foldables) | Bottom Navigation Bar with horizontal items |
| Expanded (tablets) | Navigation Rail |
| Large/Extra-Large | Navigation Rail or Expanded Navigation |

### Navigation Rail

For medium, expanded, large, or extra-large window sizes (foldables, tablets, desktop). Updated in M3E with new shapes and colors.

### React Native Implementation

**Primary approach: `BottomNavigation.Bar` from `react-native-paper` + `@react-navigation/bottom-tabs` v7**

The `createMaterialBottomTabNavigator` is **deprecated** as of react-native-paper@5.14.0. Use instead:

```tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomNavigation, Icon } from 'react-native-paper';
import { CommonActions } from '@react-navigation/native';

const Tab = createBottomTabNavigator();

function MyTabs() {
  return (
    <Tab.Navigator
      tabBar={({ navigation, state, descriptors, insets }) => (
        <BottomNavigation.Bar
          navigationState={state}
          safeAreaInsets={insets}
          onTabPress={({ route, preventDefault }) => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          }}
          renderIcon={({ route, focused, color }) => {
            const { options } = descriptors[route.key];
            if (options.tabBarIcon) {
              return options.tabBarIcon({ focused, color, size: 24 });
            }
            return null;
          }}
          getLabelText={({ route }) => {
            const { options } = descriptors[route.key];
            return options.tabBarLabel ?? options.title ?? route.title;
          }}
        />
      )}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Icon source="home" color={color} size={size} />
          ),
        }}
      />
      {/* ... more screens */}
    </Tab.Navigator>
  );
}
```

**Key `BottomNavigation.Bar` Props:**
- `navigationState` - required, receives React Navigation state
- `onTabPress` - required, handles navigation dispatch
- `renderIcon` - renders tab icons
- `getLabelText` - extracts labels from route options
- `activeColor` / `inactiveColor` - color customization
- `activeIndicatorStyle` - style the pill indicator
- `safeAreaInsets` - safe area handling
- `barStyle` - style the bar container
- `shifting` - whether inactive tabs hide labels (default: false in MD3)

**For adaptive Navigation Rail**, a custom implementation is needed since react-native-paper does not provide a NavigationRail component. Use `useWindowDimensions()` to detect screen width and conditionally render a side navigation:

```tsx
import { useWindowDimensions } from 'react-native';

function AdaptiveNavigation({ children }) {
  const { width } = useWindowDimensions();
  const isExpanded = width >= 840; // Material breakpoint for expanded

  if (isExpanded) {
    return <NavigationRailCustom>{children}</NavigationRailCustom>;
  }
  return <BottomNavigationBar>{children}</BottomNavigationBar>;
}
```

**NOTE:** Our project already uses `expo-router/unstable-native-tabs` for truly native tab bars. The above patterns apply when building custom Material-styled navigation in JS.

---

## 3. Floating Toolbars

Floating Toolbars are a **new M3 Expressive component** replacing the deprecated bottom app bar.

### Two Types

| Type | Description | Use Case |
|------|-------------|----------|
| **Docked Toolbar** | Attached to screen edge | Global actions consistent across pages |
| **Floating Toolbar** | Floats above body content in a pill shape | Contextual actions for current page/content |

### Design Characteristics
- **Pill-shaped container** that does not stretch across the screen
- **Larger, more prominent buttons** for intuitive guidance
- Can integrate with FAB as part of a Scaffold's `floatingActionButton`
- Supports expand/collapse based on scroll or user interaction
- **Vertical variant** (`VerticalFloatingToolbar`) for side positioning

### Real-World Examples
- **Google Chat**: Floating toolbar with pill highlighting for current tab
- **Google Photos**: Album actions in floating toolbar
- **Google Docs/Sheets**: Formatting actions in floating toolbar

### React Native Implementation

No existing React Native library provides a floating toolbar component. Custom implementation required:

```tsx
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Surface, IconButton, useTheme } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  interpolate,
} from 'react-native-reanimated';

interface FloatingToolbarProps {
  actions: Array<{
    icon: string;
    onPress: () => void;
    label?: string;
  }>;
  visible?: boolean;
  position?: 'bottom' | 'right';
}

export function FloatingToolbar({
  actions,
  visible = true,
  position = 'bottom',
}: FloatingToolbarProps) {
  const theme = useTheme();
  const translateY = useSharedValue(visible ? 0 : 100);

  React.useEffect(() => {
    // M3 Expressive spatial spring: damping 0.8, stiffness 380
    translateY.value = withSpring(visible ? 0 : 100, {
      damping: 16, // maps from 0.8 damping ratio
      stiffness: 380,
      mass: 1,
    });
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: interpolate(translateY.value, [0, 100], [1, 0]),
  }));

  const isVertical = position === 'right';

  return (
    <Animated.View
      style={[
        styles.container,
        isVertical ? styles.verticalContainer : styles.horizontalContainer,
        animatedStyle,
      ]}
    >
      <Surface
        style={[
          styles.surface,
          isVertical ? styles.verticalSurface : styles.horizontalSurface,
          { backgroundColor: theme.colors.surfaceContainerHigh },
        ]}
        elevation={2}
      >
        {actions.map((action, index) => (
          <IconButton
            key={index}
            icon={action.icon}
            size={24}
            onPress={action.onPress}
            iconColor={theme.colors.onSurface}
          />
        ))}
      </Surface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 10,
  },
  horizontalContainer: {
    bottom: 16,
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  verticalContainer: {
    right: 16,
    top: '30%',
  },
  surface: {
    borderRadius: 28, // M3 pill shape
    padding: 4,
  },
  horizontalSurface: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verticalSurface: {
    flexDirection: 'column',
    alignItems: 'center',
  },
});
```

---

## 4. Split Buttons and Button Groups

### Split Buttons

A **new M3 Expressive component** providing dual-action buttons:
- **Leading button**: Primary action (e.g., "Save")
- **Trailing button**: Secondary/toggle action (e.g., dropdown arrow)

**Variants:**
- Filled Split Button
- Elevated Split Button
- Outlined Split Button
- Tonal Split Button

In Jetpack Compose:
```kotlin
// Reference: Jetpack Compose API
SplitButtonLayout(
    leadingButton = {
        SplitButtonDefaults.LeadingButton(onClick = { /* primary action */ }) {
            Text("Save")
        }
    },
    trailingButton = {
        SplitButtonDefaults.TrailingButton(
            checked = expanded,
            onCheckedChange = { expanded = it }
        ) {
            Icon(Icons.Default.ArrowDropDown)
        }
    }
)
```

### Button Groups

A layout that places children horizontally with **interactive width animation** - pressed buttons expand while neighbors shrink to maintain constant group width.

**Variants:**
- Standard Button Group (independent buttons)
- Connected Button Group (leading/trailing asymmetric shapes for selection)

In Jetpack Compose:
```kotlin
// Reference: Jetpack Compose API (@ExperimentalMaterial3ExpressiveApi)
ButtonGroup(
    expandedRatio = ButtonGroupDefaults.ExpandedRatio,
    modifier = modifier,
) {
    // Child buttons with Modifier.animateWidth
}
```

### React Native Implementation

```tsx
import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Button, Menu, useTheme, Text, Icon } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';

// --- Split Button ---

interface SplitButtonProps {
  label: string;
  onPress: () => void;
  menuItems: Array<{ label: string; onPress: () => void }>;
}

export function SplitButton({ label, onPress, menuItems }: SplitButtonProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const theme = useTheme();

  return (
    <View style={styles.splitButtonContainer}>
      {/* Leading button */}
      <Pressable
        onPress={onPress}
        style={[
          styles.splitLeading,
          { backgroundColor: theme.colors.primary },
        ]}
      >
        <Text style={[styles.splitLabel, { color: theme.colors.onPrimary }]}>
          {label}
        </Text>
      </Pressable>

      {/* Divider */}
      <View
        style={[
          styles.splitDivider,
          { backgroundColor: theme.colors.onPrimary },
        ]}
      />

      {/* Trailing button */}
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <Pressable
            onPress={() => setMenuVisible(true)}
            style={[
              styles.splitTrailing,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Icon
              source="chevron-down"
              size={20}
              color={theme.colors.onPrimary}
            />
          </Pressable>
        }
      >
        {menuItems.map((item, i) => (
          <Menu.Item
            key={i}
            onPress={() => {
              item.onPress();
              setMenuVisible(false);
            }}
            title={item.label}
          />
        ))}
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  splitButtonContainer: {
    flexDirection: 'row',
    borderRadius: 20, // M3 full rounding
    overflow: 'hidden',
    elevation: 1,
  },
  splitLeading: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splitDivider: {
    width: 1,
    opacity: 0.3,
  },
  splitTrailing: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splitLabel: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});

// --- Button Group ---

interface ButtonGroupProps {
  buttons: Array<{
    label: string;
    icon?: string;
    onPress: () => void;
  }>;
  selectedIndex?: number;
}

export function ButtonGroup({ buttons, selectedIndex }: ButtonGroupProps) {
  const theme = useTheme();

  return (
    <View style={buttonGroupStyles.container}>
      {buttons.map((button, index) => {
        const isSelected = index === selectedIndex;
        const isFirst = index === 0;
        const isLast = index === buttons.length - 1;

        return (
          <Pressable
            key={index}
            onPress={button.onPress}
            style={[
              buttonGroupStyles.button,
              {
                backgroundColor: isSelected
                  ? theme.colors.secondaryContainer
                  : theme.colors.surface,
                borderTopLeftRadius: isFirst ? 20 : 4,
                borderBottomLeftRadius: isFirst ? 20 : 4,
                borderTopRightRadius: isLast ? 20 : 4,
                borderBottomRightRadius: isLast ? 20 : 4,
              },
            ]}
          >
            {button.icon && (
              <Icon
                source={button.icon}
                size={18}
                color={
                  isSelected
                    ? theme.colors.onSecondaryContainer
                    : theme.colors.onSurface
                }
              />
            )}
            <Text
              style={{
                color: isSelected
                  ? theme.colors.onSecondaryContainer
                  : theme.colors.onSurface,
                fontWeight: isSelected ? '600' : '400',
                marginLeft: button.icon ? 8 : 0,
              }}
            >
              {button.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const buttonGroupStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 2, // Small gap between connected buttons
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
```

---

## 5. Material You Search Bars

### M3 Expressive Search Bar Updates

The search bar has been redesigned in M3 Expressive:

- **Pill-shaped field** - fully rounded container
- **Thicker profile** - more prominent visual presence
- **Hamburger button and profile moved OUTSIDE** the search pill
- **Centered text** configuration as default style
- **AppBar integration** - `AppBarLayout` with `ThemeOverlay.Material3Expressive.AppBarWithSearch`
- Search bars do NOT support custom backgrounds (consistency enforcement)

### Real-World Examples
- **Google Keep**: Search app bar with hamburger/profile outside the pill
- **Pixel Launcher**: Redesigned search bar with gradient 'G' logo + AI Mode circle
- **Google Photos, Gmail**: Updated search bar with M3E styling

### React Native Paper Searchbar

```tsx
import React, { useState } from 'react';
import { Searchbar } from 'react-native-paper';

function SearchScreen() {
  const [query, setQuery] = useState('');

  return (
    <Searchbar
      placeholder="Search"
      onChangeText={setQuery}
      value={query}
      mode="bar"          // "bar" (default) or "view"
      elevation={1}       // 0-5, MD3 shadow
      // icon="magnify"   // left icon (default)
      // loading={false}  // show activity indicator instead of clear
      // right={() => <Avatar.Image ... />}  // right side content
    />
  );
}
```

**Searchbar Props:**
- `mode` - `"bar"` (standard) or `"view"` (expanded, shows divider)
- `elevation` - 0-5 shadow levels (MD3)
- `icon` - left icon name
- `onIconPress` - left icon tap handler
- `right` - render right-side content (bar mode only)
- `clearIcon` - custom clear icon
- `onClearIconPress` - custom clear handler
- `showDivider` - divider in view mode (default: true)
- `loading` - replace clear button with activity indicator
- `rippleColor` - ripple effect color

### Custom M3E Search App Bar Pattern

To match the M3 Expressive pattern where hamburger/profile sit outside the search field:

```tsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Searchbar, IconButton, Avatar, useTheme } from 'react-native-paper';

export function M3ESearchAppBar({
  onMenuPress,
  onProfilePress,
  profileImage,
}: {
  onMenuPress: () => void;
  onProfilePress: () => void;
  profileImage?: string;
}) {
  const [query, setQuery] = useState('');
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface },
      ]}
    >
      <IconButton
        icon="menu"
        size={24}
        onPress={onMenuPress}
      />
      <Searchbar
        placeholder="Search"
        onChangeText={setQuery}
        value={query}
        style={styles.searchbar}
        elevation={0}
        mode="bar"
      />
      {profileImage ? (
        <Avatar.Image
          size={32}
          source={{ uri: profileImage }}
          style={styles.avatar}
          onTouchEnd={onProfilePress}
        />
      ) : (
        <IconButton
          icon="account-circle"
          size={24}
          onPress={onProfilePress}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  searchbar: {
    flex: 1,
    marginHorizontal: 4,
  },
  avatar: {
    marginLeft: 4,
  },
});
```

---

## 6. FAB Patterns in Material 3 Expressive

### New FAB Components

**FAB Menu** (`FloatingActionButtonMenu`):
- Transforms a single FAB into an expandable menu
- `ToggleFloatingActionButton` for main FAB with on/off state
- `FloatingActionButtonMenuItem` for each menu option
- Icon morphs from "+" to "X" with spring animation
- Replaces the old speed dial / stacked small FABs pattern

**Updated FAB Sizes:**
- Small FAB is **deprecated**
- Regular, Medium, Large variants match Extended FAB sizing
- New color theme overlays: Primary, Secondary, Tertiary, PrimaryContainer, SecondaryContainer, TertiaryContainer

**Shape Morphing:**
- Buttons "shapeshift" between states (e.g., star bookmarks morph to rounded-square)
- 35 new shape tokens in the Material Shapes Library

### Real-World Examples
- **Google Calendar**: FAB Menu for Event, Task, Out of office, Birthday creation
- **Google Phone**: FAB menu with button groups
- **Google Docs/Sheets/Slides**: Large FAB with Dynamic Color

### React Native Paper FAB Components

**Standard FAB:**
```tsx
import { FAB } from 'react-native-paper';

<FAB
  icon="plus"
  onPress={() => console.log('Pressed')}
  variant="primary"     // 'primary' | 'secondary' | 'tertiary' | 'surface'
  mode="flat"           // 'flat' | 'elevated'
  size="medium"         // 'small' | 'medium' | 'large'
  customSize={64}       // overrides size prop
  label="Create"        // optional label (makes it Extended FAB)
  // color={...}        // custom icon+label color
  // rippleColor={...}  // custom ripple color
/>
```

**AnimatedFAB (Extended with animation):**
```tsx
import { AnimatedFAB } from 'react-native-paper';

<AnimatedFAB
  icon="plus"
  label="Create new"
  extended={isExtended}   // required: triggers extend/collapse animation
  onPress={() => {}}
  visible={true}
  animateFrom="right"     // 'left' | 'right'
  iconMode="dynamic"      // 'dynamic' | 'static'
  variant="primary"
  // uppercase={true}     // uppercase label text
/>
```

**FAB.Group (Speed Dial pattern):**
```tsx
import { FAB, Portal } from 'react-native-paper';

<Portal>
  <FAB.Group
    open={open}
    visible={true}
    icon={open ? 'close' : 'plus'}
    actions={[
      { icon: 'calendar', label: 'Event', onPress: () => {} },
      { icon: 'checkbox-marked', label: 'Task', onPress: () => {} },
      { icon: 'airplane', label: 'Out of office', onPress: () => {} },
    ]}
    onStateChange={({ open }) => setOpen(open)}
    // onPress - called on main FAB press when open
  />
</Portal>
```

### Custom M3E FAB Menu with Shape Morphing

```tsx
import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Surface, Text, Icon, useTheme } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  interpolate,
  SharedTransition,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// M3 Expressive spring config
const M3E_SPATIAL_DEFAULT = { damping: 16, stiffness: 380, mass: 1 };
const M3E_SPATIAL_FAST = { damping: 12, stiffness: 800, mass: 1 };

interface FABMenuItem {
  icon: string;
  label: string;
  onPress: () => void;
}

export function M3ExpressiveFABMenu({ items }: { items: FABMenuItem[] }) {
  const theme = useTheme();
  const expanded = useSharedValue(0);
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    expanded.value = withSpring(newState ? 1 : 0, M3E_SPATIAL_DEFAULT);
  };

  // Main FAB icon rotation (+ -> X)
  const fabStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(expanded.value, [0, 1], [0, 135])}deg` },
    ],
  }));

  // FAB shape morph: circle -> rounded square
  const fabContainerStyle = useAnimatedStyle(() => ({
    borderRadius: interpolate(expanded.value, [0, 1], [28, 16]),
  }));

  return (
    <View style={styles.fabMenuContainer}>
      {/* Menu items */}
      {items.map((item, index) => {
        const itemStyle = useAnimatedStyle(() => {
          const offset = (items.length - index) * 60;
          return {
            opacity: expanded.value,
            transform: [
              {
                translateY: interpolate(
                  expanded.value,
                  [0, 1],
                  [offset, 0]
                ),
              },
              {
                scale: interpolate(expanded.value, [0, 0.5, 1], [0.3, 0.8, 1]),
              },
            ],
          };
        });

        return (
          <Animated.View key={index} style={[styles.menuItem, itemStyle]}>
            <Surface style={styles.menuItemSurface} elevation={2}>
              <Text
                variant="labelLarge"
                style={{ color: theme.colors.onSurface }}
              >
                {item.label}
              </Text>
            </Surface>
            <Pressable
              onPress={() => {
                item.onPress();
                toggleMenu();
              }}
              style={[
                styles.menuItemIcon,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <Icon
                source={item.icon}
                size={24}
                color={theme.colors.onPrimaryContainer}
              />
            </Pressable>
          </Animated.View>
        );
      })}

      {/* Main FAB */}
      <AnimatedPressable
        onPress={toggleMenu}
        style={[
          styles.mainFab,
          fabContainerStyle,
          { backgroundColor: theme.colors.primary },
        ]}
      >
        <Animated.View style={fabStyle}>
          <Icon source="plus" size={24} color={theme.colors.onPrimary} />
        </Animated.View>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fabMenuContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    alignItems: 'flex-end',
  },
  mainFab: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  menuItemSurface: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  menuItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

---

## 7. Progress Indicators with Spring Physics

### New Loading Indicator

The Loading Indicator is a **brand new M3E component** for wait times under 5 seconds:
- **Looping shape morph sequence** composed of 7 unique Material 3 shapes
- Replaces indeterminate circular progress indicators
- Has a circular container with lighter background for pull-to-refresh
- Visible during Android 16 boot sequence (after PIN entry)
- Uses `@ExperimentalMaterial3ExpressiveApi` in Compose

### Updated Progress Indicators (Wavy)

Progress indicators now support:
- **Wavy shape** (vs. flat) - makes longer processes feel less static
- **Variable track height** - thicker indicators with rounded styling
- **Recommended track thickness**: 8dp
- **Track corner radius**: 4dp (for fully rounded)
- Both determinate and indeterminate variants
- Customizable wave parameters

### Spring Physics in Progress

The Compose `LoadingIndicator` uses spring-based animation:
```kotlin
// Jetpack Compose reference
val animatedProgress by animateFloatAsState(
    targetValue = progress,
    animationSpec = spring(
        dampingRatio = Spring.DampingRatioNoBouncy,  // 1.0
        stiffness = Spring.StiffnessVeryLow           // 200
    )
)
```

### React Native Implementation

**Using react-native-paper's ProgressBar:**
```tsx
import { ProgressBar } from 'react-native-paper';

// Determinate
<ProgressBar progress={0.5} color={theme.colors.primary} />

// Indeterminate
<ProgressBar indeterminate color={theme.colors.primary} />
```

**Custom M3E Wavy Progress Indicator:**
```tsx
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// M3 Expressive effects spring (no bounce, fast)
const M3E_EFFECTS_FAST = { damping: 20, stiffness: 3800, mass: 1 };

interface WavyProgressProps {
  progress: number; // 0 to 1
  indeterminate?: boolean;
  trackThickness?: number;
  color?: string;
}

export function WavyProgressIndicator({
  progress,
  indeterminate = false,
  trackThickness = 8,
  color,
}: WavyProgressProps) {
  const theme = useTheme();
  const progressColor = color ?? theme.colors.primary;
  const trackColor = theme.colors.surfaceContainerHighest;

  const animatedProgress = useSharedValue(0);
  const wavePhase = useSharedValue(0);

  useEffect(() => {
    if (indeterminate) {
      wavePhase.value = withRepeat(
        withTiming(Math.PI * 2, { duration: 1500, easing: Easing.linear }),
        -1, // infinite
        false
      );
    } else {
      // Use M3 effects spring for progress changes
      animatedProgress.value = withSpring(progress, M3E_EFFECTS_FAST);
    }
  }, [progress, indeterminate]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${(indeterminate ? 0.4 : animatedProgress.value) * 100}%`,
  }));

  return (
    <View style={[styles.track, { height: trackThickness, backgroundColor: trackColor }]}>
      <Animated.View
        style={[
          styles.indicator,
          {
            height: trackThickness,
            backgroundColor: progressColor,
            borderRadius: trackThickness / 2, // M3E: fully rounded
          },
          progressStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
```

**Custom M3E Loading Indicator (Shape Morphing):**
```tsx
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

// 7 M3 shapes for the loading sequence
const SHAPES = [
  { borderRadius: 24 },              // Circle
  { borderRadius: 8 },               // Rounded square
  { borderRadius: [24, 8, 24, 8] },  // Organic shape 1
  { borderRadius: 16 },              // Squircle
  { borderRadius: [8, 24, 8, 24] },  // Organic shape 2
  { borderRadius: 4 },               // Near-square
  { borderRadius: 20 },              // Rounded
];

export function M3ELoadingIndicator({ size = 48 }: { size?: number }) {
  const theme = useTheme();
  const shapeIndex = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Cycle through shapes
    shapeIndex.value = withRepeat(
      withSequence(
        ...SHAPES.map((_, i) =>
          withTiming(i, { duration: 300 })
        )
      ),
      -1,
      false
    );
    // Subtle pulse
    scale.value = withRepeat(
      withSequence(
        withSpring(1.1, { damping: 12, stiffness: 800, mass: 1 }),
        withSpring(1.0, { damping: 12, stiffness: 800, mass: 1 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const idx = Math.floor(shapeIndex.value);
    const nextIdx = Math.min(idx + 1, SHAPES.length - 1);
    const fraction = shapeIndex.value - idx;

    const currentRadius = typeof SHAPES[idx].borderRadius === 'number'
      ? SHAPES[idx].borderRadius
      : 16;
    const nextRadius = typeof SHAPES[nextIdx].borderRadius === 'number'
      ? SHAPES[nextIdx].borderRadius
      : 16;

    return {
      borderRadius: interpolate(fraction, [0, 1], [currentRadius as number, nextRadius as number]),
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <View style={styles.loadingContainer}>
      <View
        style={[
          styles.loadingBackground,
          {
            width: size + 16,
            height: size + 16,
            borderRadius: (size + 16) / 2,
            backgroundColor: theme.colors.surfaceContainerHigh,
          },
        ]}
      >
        <Animated.View
          style={[
            {
              width: size,
              height: size,
              backgroundColor: theme.colors.primary,
            },
            animatedStyle,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBackground: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

---

## 8. Spring Motion System and Tokens

### Overview

M3 Expressive replaces the previous easing-and-duration system with **physics-based springs**. This is the single most important animation change in the design system.

### Two Motion Schemes

| Scheme | Description | Damping | Use Case |
|--------|-------------|---------|----------|
| **Expressive** (recommended) | Lower damping, noticeable overshoot/bounce | 0.6-0.8 | Hero moments, key interactions, playful feel |
| **Standard** | Higher damping, minimal bounce | 0.9-1.0 | Utilitarian apps, calmer feel |

### Two Token Types

| Token Type | Purpose | Overshoot |
|------------|---------|-----------|
| **Spatial** | Position, size, orientation, shape changes | Yes (bounce) |
| **Effects** | Color, opacity transitions | No (critically damped) |

### Concrete Spring Token Values

#### Expressive Scheme (Recommended Default)

| Token | Damping Ratio | Stiffness | Use Case |
|-------|--------------|-----------|----------|
| `expressiveSpatialFast` | 0.6 | 800 | Small components (switches, checkboxes) |
| `expressiveSpatialDefault` | 0.8 | 380 | Medium components (cards, buttons, FABs) |
| `expressiveSpatialSlow` | 0.8 | 200 | Full-screen transitions, large elements |
| `expressiveEffectsFast` | 1.0 | 3800+ | Color/opacity (fast, no bounce) |
| `expressiveEffectsDefault` | 1.0 | ~1800 | Color/opacity (default, no bounce) |
| `expressiveEffectsSlow` | 1.0 | ~800 | Color/opacity (slow, no bounce) |

#### Standard Scheme

| Token | Damping Ratio | Stiffness | Use Case |
|-------|--------------|-----------|----------|
| `standardSpatialFast` | 0.9 | 1400 | Small components |
| `standardSpatialDefault` | 0.9 | 700 | Medium components |
| `standardSpatialSlow` | 0.9 | 300 | Full-screen transitions |

### Speed Selection Guidelines

| Animation Target | Speed |
|-----------------|-------|
| Small components (switch, checkbox, icon) | Fast |
| Medium components (card, button, FAB, sheet) | Default |
| Full-screen transitions, large elements | Slow |

### Mapping to React Native Reanimated `withSpring`

React Native Reanimated's `withSpring` supports two configuration modes:

**1. Physics-based (recommended for M3E mapping):**
```tsx
import { withSpring } from 'react-native-reanimated';

// M3E Expressive Spatial Default
withSpring(targetValue, {
  damping: 16,      // Higher value = more damping (not same as ratio!)
  stiffness: 380,   // Direct mapping from M3 token
  mass: 1,
});
```

**2. Duration-based:**
```tsx
withSpring(targetValue, {
  duration: 500,       // ms
  dampingRatio: 0.8,   // Direct from M3 token
});
```

**IMPORTANT**: Reanimated's `damping` prop is NOT the same as the M3 damping _ratio_. The damping ratio (0-1) from M3 tokens needs to be converted. The formula is:

```
reanimated_damping = dampingRatio * 2 * sqrt(stiffness * mass)
```

For convenience, use Reanimated's **duration-based mode** which accepts `dampingRatio` directly.

### Complete M3E Spring Utilities for React Native

```tsx
import { withSpring, WithSpringConfig } from 'react-native-reanimated';

// M3 Expressive Motion Tokens for React Native Reanimated
export const M3EMotion = {
  // Expressive Spatial Springs (position, size, shape)
  expressiveSpatial: {
    fast: {
      dampingRatio: 0.6,
      stiffness: 800,
    } as WithSpringConfig,
    default: {
      dampingRatio: 0.8,
      stiffness: 380,
    } as WithSpringConfig,
    slow: {
      dampingRatio: 0.8,
      stiffness: 200,
    } as WithSpringConfig,
  },

  // Standard Spatial Springs
  standardSpatial: {
    fast: {
      dampingRatio: 0.9,
      stiffness: 1400,
    } as WithSpringConfig,
    default: {
      dampingRatio: 0.9,
      stiffness: 700,
    } as WithSpringConfig,
    slow: {
      dampingRatio: 0.9,
      stiffness: 300,
    } as WithSpringConfig,
  },

  // Effects Springs (color, opacity - no bounce)
  expressiveEffects: {
    fast: {
      dampingRatio: 1.0,
      stiffness: 3800,
    } as WithSpringConfig,
  },
} as const;

// Helper to apply M3E spring animation
export function m3eSpring(
  value: number,
  token: WithSpringConfig = M3EMotion.expressiveSpatial.default
) {
  return withSpring(value, {
    ...token,
    mass: 1,
  });
}

// Usage:
// translateY.value = m3eSpring(0); // default expressive spatial
// translateY.value = m3eSpring(0, M3EMotion.expressiveSpatial.fast); // fast
// opacity.value = m3eSpring(1, M3EMotion.expressiveEffects.fast); // color/opacity
```

---

## 9. React Native Library Landscape

### Primary Recommendation: React Native Paper v5

| Property | Value |
|----------|-------|
| **Package** | `react-native-paper` |
| **Latest Version** | 5.14.5 (May 2025) |
| **Material Design** | Material 3 (Material You) fully supported |
| **Expo Support** | Full compatibility, tested with Expo SDK 52 |
| **Architecture** | Supports both old and new React Native architecture |
| **Maintainer** | Callstack |
| **Theme Versions** | MD2 and MD3 (via `version` in theme) |
| **Key Components** | BottomNavigation, FAB, AnimatedFAB, Searchbar, ProgressBar, Surface, Button, IconButton, Menu, etc. |

**Installation:**
```bash
npx expo install react-native-paper react-native-safe-area-context
```

**Setup:**
```tsx
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export default function App() {
  return (
    <PaperProvider theme={MD3LightTheme}>
      {/* app content */}
    </PaperProvider>
  );
}
```

### Dynamic Material You Theming: `@pchmn/expo-material3-theme`

Retrieves the device's Material You dynamic color from Android 12+ wallpaper.

```bash
npx expo install @pchmn/expo-material3-theme
```

```tsx
import { useMaterial3Theme } from '@pchmn/expo-material3-theme';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import { useColorScheme } from 'react-native';

export default function App() {
  const colorScheme = useColorScheme();
  const { theme } = useMaterial3Theme();

  const paperTheme =
    colorScheme === 'dark'
      ? { ...MD3DarkTheme, colors: theme.dark }
      : { ...MD3LightTheme, colors: theme.light };

  return (
    <PaperProvider theme={paperTheme}>
      {/* app content */}
    </PaperProvider>
  );
}
```

**Limitations:**
- Expo Go returns fallback theme (no native module access)
- Requires development build for real dynamic colors
- Fallback source color: `#6750A4` (Material default purple)
- `updateTheme()` / `resetTheme()` for programmatic changes (not system-level)

### Alternative: `react-native-material-you-colors`

```bash
npm install react-native-material-you-colors
```

- Generates full Material You palettes from a seed color
- Works across Android, iOS, and web
- Does NOT work in Expo Go (requires native modules)

### Other Libraries Considered

| Library | Status | Material Version | Notes |
|---------|--------|-----------------|-------|
| `@react-native-material/core` | Unmaintained (last update ~4 years ago) | Material 2 only | Do NOT use |
| `md3-ui` | Active | Material 3 | React Native Web focus, smaller community |
| `react-native-material-you` | Small | Material 3 | Uses Material Theme Builder, minimal components |
| `gluestack-ui` v3 | Active | Custom (not M3) | Strong Expo 54 support, modular |
| `RNUIlib` (Wix) | Active | Custom | Well-maintained, 20+ components |
| React Native Reusables | Active | Custom (shadcn-style) | Light/dark, accessibility-first |

### Animation Library: React Native Reanimated

| Property | Value |
|----------|-------|
| **Package** | `react-native-reanimated` |
| **Latest Version** | v4.x (2025-2026) |
| **Key Feature** | `withSpring` physics-based animations |
| **Modes** | Physics-based (`stiffness`, `damping`, `mass`) or Duration-based (`duration`, `dampingRatio`) |
| **Architecture** | Requires React Native New Architecture (Fabric), RN 0.76+ |
| **CSS Animations** | New in v4: CSS animation syntax support |

---

## 10. Implementation Strategy for React Native / Expo

### Recommended Stack

```
react-native-paper (v5.14.5)     - MD3 components
@pchmn/expo-material3-theme       - Dynamic Material You colors
react-native-reanimated (v4)      - Spring physics animations
@react-navigation/bottom-tabs (v7) - Navigation integration
react-native-safe-area-context    - Safe area handling
```

### What React Native Paper Provides (M3 ready)

These components from react-native-paper already follow Material 3 patterns:

- `BottomNavigation` / `BottomNavigation.Bar` - with pill indicator, shifting mode
- `FAB` / `AnimatedFAB` / `FAB.Group` - with variant colors, sizes
- `Searchbar` - pill-shaped, modes, elevation
- `Button` - filled, outlined, elevated, tonal, text variants
- `IconButton` - standard, filled, tonal, outlined
- `ProgressBar` - determinate/indeterminate
- `ActivityIndicator` - circular spinner
- `Surface` - elevation levels
- `Appbar` - top app bar with actions

### What Requires Custom Implementation

These M3 Expressive components are NOT in any React Native library yet:

| Component | Approach |
|-----------|----------|
| **Floating Toolbar** (docked/floating) | Custom with `Surface` + `IconButton` + `Animated.View` |
| **Split Button** | Custom with `Button` + `Menu` + divider |
| **Button Group** (interactive width) | Custom with `Animated.View` + `Pressable` + Reanimated |
| **Loading Indicator** (shape morph) | Custom with Reanimated shape interpolation |
| **Wavy Progress Indicator** | Custom with SVG + Reanimated |
| **FAB Menu** (M3E toggle style) | Custom with `FAB.Group` as base or full custom |
| **Navigation Rail** | Custom sidebar layout |
| **Flexible Navigation Bar** (horizontal items) | Custom variant of `BottomNavigation.Bar` |

### Architecture Pattern

Follow **Atomic Design** for component organization:

```
components/
  atoms/
    M3EIconButton.tsx       # Themed icon button
    M3EChip.tsx             # Shape-morphing chip
  molecules/
    SplitButton.tsx         # Split button with dropdown
    ButtonGroup.tsx         # Interactive button group
    FloatingToolbar.tsx     # Pill-shaped floating toolbar
    M3ESearchAppBar.tsx     # Search bar with external controls
  organisms/
    FABMenu.tsx             # Expandable FAB with menu items
    AdaptiveNavigation.tsx  # Bottom nav + rail switching
  theme/
    m3eMotion.ts            # Spring token constants
    m3eShapes.ts            # Shape token constants
    m3eColors.ts            # Color scheme helpers
```

### Shape Tokens for React Native

```tsx
// m3eShapes.ts
export const M3EShapes = {
  // Corner radiuses from M3 Expressive
  none: 0,
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 28,
  full: 9999, // StadiumBorder / pill

  // Component-specific shapes
  fab: 16,           // Regular FAB
  fabLarge: 28,      // Large FAB
  button: 20,        // Filled button
  chip: 8,           // Filter chip
  card: 12,          // Card
  dialog: 28,        // Dialog
  sheet: 28,         // Bottom sheet top corners
  searchBar: 28,     // Search bar (pill)
  navigationIndicator: 9999, // Active tab indicator (pill)
  toolbar: 28,       // Floating toolbar (pill)
  menuItem: 12,      // Menu item
} as const;
```

### Adaptive Layout Breakpoints

Following Material 3 window size classes:

```tsx
// m3eLayout.ts
import { useWindowDimensions } from 'react-native';

export const M3EBreakpoints = {
  compact: 0,      // 0-599dp (phones)
  medium: 600,     // 600-839dp (foldables, small tablets)
  expanded: 840,   // 840-1199dp (tablets)
  large: 1200,     // 1200-1599dp (large tablets, desktop)
  extraLarge: 1600, // 1600dp+ (ultra-wide)
} as const;

export type WindowSizeClass = 'compact' | 'medium' | 'expanded' | 'large' | 'extraLarge';

export function useWindowSizeClass(): WindowSizeClass {
  const { width } = useWindowDimensions();
  if (width >= M3EBreakpoints.extraLarge) return 'extraLarge';
  if (width >= M3EBreakpoints.large) return 'large';
  if (width >= M3EBreakpoints.expanded) return 'expanded';
  if (width >= M3EBreakpoints.medium) return 'medium';
  return 'compact';
}

// Navigation adaptation
export function useNavigationType(): 'bottomBar' | 'rail' | 'drawer' {
  const sizeClass = useWindowSizeClass();
  switch (sizeClass) {
    case 'compact':
      return 'bottomBar';
    case 'medium':
      return 'bottomBar'; // with horizontal items
    default:
      return 'rail';
  }
}
```

### Performance Considerations

1. **Use `react-native-reanimated` worklets** for all spring animations (runs on UI thread)
2. **Memoize components** with `React.memo` for lists of buttons/chips
3. **Use `useCallback`** for all onPress handlers passed to animated components
4. **Leverage Layout Animations** from Reanimated for enter/exit transitions
5. **Avoid JS-thread animations** - all M3E springs should use `withSpring` on shared values

---

## 11. Sources

### Official Material Design
- [Material Design 3 - Components](https://m3.material.io/components)
- [Material Design 3 - Navigation Bar Specs](https://m3.material.io/components/navigation-bar/specs)
- [Material Design 3 - Navigation Rail Specs](https://m3.material.io/components/navigation-rail/specs)
- [Material Design 3 - Button Groups](https://m3.material.io/components/button-groups/overview)
- [Material Design 3 - Split Button Specs](https://m3.material.io/components/split-button/specs)
- [Material Design 3 - Toolbar Specs](https://m3.material.io/components/toolbars/specs)
- [Material Design 3 - Extended FAB](https://m3.material.io/components/extended-fab/overview)
- [Material Design 3 - Progress Indicators](https://m3.material.io/components/progress-indicators/overview)
- [Material Design 3 - Loading Indicator](https://m3.material.io/components/loading-indicator)
- [Material Design 3 - Motion Overview/Specs](https://m3.material.io/styles/motion/overview/specs)
- [Material Design 3 - Easing and Duration Tokens](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs)
- [M3 Expressive: New Motion System (Blog)](https://m3.material.io/blog/m3-expressive-motion-theming)
- [Start Building with M3 Expressive (Blog)](https://m3.material.io/blog/building-with-m3-expressive)

### Android Developer
- [Material Design 3 in Compose](https://developer.android.com/develop/ui/compose/designsystems/material3)
- [SearchBar - Android Developers](https://developer.android.com/reference/com/google/android/material/search/SearchBar)
- [Search Bar Compose](https://developer.android.com/develop/ui/compose/components/search-bar)
- [Spring Animation in Android](https://developer.android.com/develop/ui/views/animations/spring-animation)
- [Material Components Android - Motion.md](https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md)
- [Material Components Android - NavigationRail.md](https://github.com/material-components/material-components-android/blob/master/docs/components/NavigationRail.md)

### React Native Paper
- [React Native Paper - Home](https://reactnativepaper.com/)
- [BottomNavigation Component](http://oss.callstack.com/react-native-paper/docs/components/BottomNavigation/)
- [BottomNavigation.Bar Component](https://callstack.github.io/react-native-paper/docs/components/BottomNavigation/BottomNavigationBar/)
- [Using BottomNavigation with React Navigation](http://oss.callstack.com/react-native-paper/docs/guides/bottom-navigation/)
- [FAB Component](http://oss.callstack.com/react-native-paper/docs/components/FAB/)
- [AnimatedFAB Component](http://oss.callstack.com/react-native-paper/docs/components/FAB/AnimatedFAB/)
- [Searchbar Component](http://oss.callstack.com/react-native-paper/docs/components/Searchbar/)
- [Theming Guide](https://callstack.github.io/react-native-paper/docs/guides/theming/)
- [Migration Guide to v5](http://oss.callstack.com/react-native-paper/docs/guides/migration-guide-to-5.0/)
- [GitHub - react-native-paper](https://github.com/callstack/react-native-paper)
- [npm - react-native-paper](https://www.npmjs.com/package/react-native-paper)
- [API Reference - jsDocs.io](https://www.jsdocs.io/package/react-native-paper)

### Dynamic Theming
- [expo-material3-theme GitHub](https://github.com/pchmn/expo-material3-theme)
- [npm - @pchmn/expo-material3-theme](https://www.npmjs.com/package/@pchmn/expo-material3-theme)
- [react-native-material-you-colors GitHub](https://github.com/alabsi91/react-native-material-you-colors)

### React Native Reanimated
- [withSpring Documentation](https://docs.swmansion.com/react-native-reanimated/docs/animations/withSpring/)
- [Customizing Animations](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/customizing-animation/)
- [React Native Reanimated v4 Guide](https://www.freecodecamp.org/news/how-to-create-fluid-animations-with-react-native-reanimated-v4/)

### Compose API References
- [ButtonGroup - Material 3 Compose](https://composables.com/material3/buttongroup)
- [LoadingIndicator - Material 3 Compose](https://composables.com/docs/androidx.compose.material3/material3/components/LoadingIndicator)
- [MotionScheme - Material 3 Compose](https://composables.com/docs/androidx.compose.material3/material3/interfaces/MotionScheme)
- [SearchBar - Material 3 Compose](https://composables.com/docs/androidx.compose.material3/material3/components/SearchBar)

### Flutter
- [motor package (M3 spring tokens)](https://pub.dev/packages/motor)

### News and Analysis
- [Google Announces Material 3 Expressive - 9to5Google](https://9to5google.com/2025/05/13/android-16-material-3-expressive-redesign/)
- [M3 Expressive Navigation - 9to5Google](https://9to5google.com/2025/05/14/material-3-expressive-navigation/)
- [M3 Expressive Floating Toolbars - 9to5Google](https://9to5google.com/2025/05/18/material-3-expressive-toolbars/)
- [M3 Expressive Loading Indicator - 9to5Google](https://9to5google.com/2025/05/16/material-3-expressive-loading-indicator/)
- [M3 Expressive Redesigns Rolling Out - 9to5Google](https://9to5google.com/2025/11/17/google-material-3-expressive-redesign/)
- [Recap: Expressive Android - 9to5Google](https://9to5google.com/2025/12/27/recap-material-3-expressive/)
- [M3 Expressive Deep Dive - Android Authority](https://www.androidauthority.com/google-material-3-expressive-features-changes-availability-supported-devices-3556392/)
- [Google Blog - M3E Launch](https://blog.google/products-and-platforms/platforms/android/material-3-expressive-android-wearos-launch/)
- [M3 Expressive Designers Guide - Supercharge](https://supercharge.design/blog/material-3-expressive)
- [M3E Design Part 2 - ProAndroidDev](https://proandroiddev.com/material-3-expressive-design-a-new-era-part-2-6a93483c98b0)
- [Best React Native UI Libraries 2026 - LogRocket](https://blog.logrocket.com/best-react-native-ui-component-libraries/)
- [Phone by Google M3E Bottom Bar - 9to5Google](https://9to5google.com/2025/12/05/google-phone-bottom-bar/)

### Other Libraries & Resources
- [expo-react-native-paper starter](https://github.com/youzarsiph/expo-react-native-paper)
- [expo-material-3-starter](https://github.com/Prateik-Lohani-07/expo-material-3-starter)
- [material-3-expressive-catalog (Compose)](https://github.com/meticha/material-3-expressive-catalog)
- [M3 Expressive Buttons repo (Compose)](https://github.com/Shoaibkhalid65/Buttons)
- [Applying M3 Expressive in React - Medium](https://medium.com/@roman_fedyskyi/applying-material-3-expressive-design-in-react-c5fb2e341544)
- [React Navigation - Bottom Tab Navigator](https://reactnavigation.org/docs/bottom-tab-navigator/)
- [React Navigation - Customizing Tab Bar](https://reactnavigation.org/docs/customizing-tabbar/)
