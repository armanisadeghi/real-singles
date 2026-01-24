# Native Feel Guidelines

**Target audience:** Senior developers who know React Native and platform conventions.

---

## Core Principle

Use actual native components. Not JS approximations that mimic native appearance.

---

## Rules

1. **Don't override platform defaults.** If iOS or Android handles something automatically, don't customize it. This includes colors, spacing, animations, and haptics.

2. **Use platform-native icons.**
   - iOS: SF Symbols (`expo-symbols`)
   - Android: Material Icons or properly-sized PNGs (24dp)

3. **Prefer native-backed libraries.**
   - ✅ `expo-router/unstable-native-tabs` (actual `UITabBarController`/`BottomNavigationView`)
   - ❌ `@react-navigation/bottom-tabs` (JS-drawn views)
   - ✅ `@gorhom/bottom-sheet` with native driver
   - ❌ Custom `Animated.View` bottom sheets
   - ✅ `react-native-gesture-handler` + `react-native-reanimated` (native thread)
   - ❌ JS-based touch handlers and animations

4. **Trust safe area handling.** Native components handle safe areas. Don't add manual padding that fights the system.

5. **Less code = more native.** If you're writing extensive styling to "fix" how something looks, you're probably overriding native behavior.

---

## Headers / Navigation

### Stack Screens (non-tab)
Use native headers via `expo-router` Stack options:

```typescript
<Stack
  screenOptions={{
    headerTintColor: '#E91E63',
    headerShadowVisible: false,
    headerStyle: { backgroundColor: '#FFFFFF' },
  }}
>
  <Stack.Screen 
    name="settings/index" 
    options={{ 
      title: 'Settings',
      headerRight: () => <NotificationBell />,
    }} 
  />
</Stack>
```

**Do NOT use `headerShown: false`** unless the screen:
- Is a splash/auth screen
- Has complex custom header (chat with user info)
- Is full-screen media (video call, camera)

### Tab Screens
Tab screens don't have stack navigation. Use a simple inline header:

```typescript
const insets = useSafeAreaInsets();
const headerHeight = Platform.OS === 'ios' ? 44 : 56;

<View style={{ paddingTop: insets.top, backgroundColor: '#FFF' }}>
  <View style={{ height: headerHeight, flexDirection: 'row', ... }}>
    <View style={{ width: 40 }} />
    <Text>Title</Text>
    <NotificationBell />
  </View>
</View>
```

---

## Form Controls

### Sliders
Use `@react-native-community/slider` (native component):

```typescript
<Slider
  minimumValue={18}
  maximumValue={70}
  step={1}
  value={value}
  onValueChange={setValue}
  minimumTrackTintColor="#E91E63"
  // Let platform handle other colors
/>
```

For ranges, use **two native sliders** (min/max) instead of custom dual-thumb.

### Toggles
Use React Native `Switch` (renders native `UISwitch`/Material Switch):

```typescript
<Switch
  value={enabled}
  onValueChange={setEnabled}
  trackColor={{ true: '#E91E63' }}
/>
```

### Pickers
Use `react-native-picker-select` with native Android styling:

```typescript
<RNPickerSelect
  useNativeAndroidPickerStyle={true}
  // iOS: Custom styles OK
  // Android: Let native spinner handle it
/>
```

---

## Reference Implementations

| Component | File | Notes |
|-----------|------|-------|
| Bottom Navigation | `mobile/app/(tabs)/_layout.tsx` | Native tabs, no overrides |
| Stack Headers | `mobile/app/_layout.tsx` | Native Stack headers |
| Filter Controls | `mobile/components/FilterOptions.tsx` | Native sliders, switch, pickers |

---

## Quick Test

Ask yourself: "Would this component look identical if I built it in Swift/Kotlin?"

If no, you're probably overriding platform behavior.
