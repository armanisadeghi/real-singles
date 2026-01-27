import { NativeTabs, Label, Icon } from 'expo-router/unstable-native-tabs';

/**
 * Native Bottom Tab Navigation
 * 
 * IMPORTANT: This uses actual platform-native components, not JS approximations:
 * - iOS: UITabBarController with SF Symbols
 * - Android: BottomNavigationView (Material Design 3) with Material Icons
 * 
 * DO NOT override platform defaults unless absolutely necessary.
 * Native components handle haptics, animations, accessibility, and safe areas automatically.
 * 
 * Icons:
 * - iOS: SF Symbols names (e.g., 'house', 'house.fill')
 * - Android: Material Icons names (e.g., 'home', 'search')
 * 
 * @see /docs/NATIVE_FEEL_GUIDELINES.md
 */
export default function TabLayout() {
  return (
    <NativeTabs>
      {/* Home Tab - Route: /home */}
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          android={{ default: 'home', selected: 'home' }}
        />
      </NativeTabs.Trigger>

      {/* Discover Tab - Route: /discover */}
      <NativeTabs.Trigger name="discover">
        <Label>Discover</Label>
        <Icon
          sf={{ default: 'magnifyingglass', selected: 'magnifyingglass' }}
          android={{ default: 'search', selected: 'search' }}
        />
      </NativeTabs.Trigger>

      {/* Chats Tab - Route: /chats */}
      <NativeTabs.Trigger name="chats">
        <Label>Chats</Label>
        <Icon
          sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }}
          android={{ default: 'chat', selected: 'chat' }}
        />
      </NativeTabs.Trigger>

      {/* Favorites Tab - Route: /favorites */}
      <NativeTabs.Trigger name="favorites">
        <Label>Favorites</Label>
        <Icon
          sf={{ default: 'heart', selected: 'heart.fill' }}
          android={{ default: 'favorite', selected: 'favorite' }}
        />
      </NativeTabs.Trigger>

      {/* Profile Tab - Route: /profile */}
      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon
          sf={{ default: 'person', selected: 'person.fill' }}
          android={{ default: 'person', selected: 'person' }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}