import { NativeTabs, Label, Icon } from 'expo-router/unstable-native-tabs';

/**
 * Native Bottom Tab Navigation
 * 
 * IMPORTANT: This uses actual platform-native components, not JS approximations:
 * - iOS: UITabBarController with SF Symbols
 * - Android: BottomNavigationView (Material Design 3) with drawable resources
 * 
 * DO NOT override platform defaults unless absolutely necessary.
 * Native components handle haptics, animations, accessibility, and safe areas automatically.
 * 
 * Icons:
 * - iOS: SF Symbols via 'sf' prop with default/selected states
 * - Android: Drawable resources via 'drawable' prop (uses system icons)
 * 
 * @see https://docs.expo.dev/router/advanced/native-tabs
 */
export default function TabLayout() {
  return (
    <NativeTabs>
      {/* Home Tab - Route: /home */}
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon 
          sf={{ default: 'house', selected: 'house.fill' }}
          drawable="ic_menu_home"
        />
      </NativeTabs.Trigger>

      {/* Discover Tab - Route: /discover */}
      <NativeTabs.Trigger name="discover">
        <Label>Discover</Label>
        <Icon 
          sf="magnifyingglass"
          drawable="ic_menu_search"
        />
      </NativeTabs.Trigger>

      {/* Chats Tab - Route: /chats */}
      <NativeTabs.Trigger name="chats">
        <Label>Chats</Label>
        <Icon 
          sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }}
          drawable="ic_menu_send"
        />
      </NativeTabs.Trigger>

      {/* Matches Tab - Route: /matches */}
      <NativeTabs.Trigger name="matches">
        <Label>Matches</Label>
        <Icon 
          sf={{ default: 'heart', selected: 'heart.fill' }}
          drawable="ic_menu_star"
        />
      </NativeTabs.Trigger>

      {/* Profile Tab - Route: /profile */}
      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon 
          sf={{ default: 'person', selected: 'person.fill' }}
          drawable="ic_menu_myplaces"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}