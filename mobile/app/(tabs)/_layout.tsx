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
 * Tab Structure (matches web):
 * - Home: Dashboard with top matches, events, etc.
 * - Discover: Browse potential matches
 * - Connections: Likes You + Matches (hub for managing relationships)
 * - Messages: Active conversations
 * - Profile: User's own profile
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

      {/* Connections Tab - Route: /connections (Likes + Matches hub) */}
      <NativeTabs.Trigger name="connections">
        <Label>Connections</Label>
        <Icon 
          sf={{ default: 'person.2', selected: 'person.2.fill' }}
          drawable="ic_menu_friendslist"
        />
      </NativeTabs.Trigger>

      {/* Messages Tab - Route: /chats */}
      <NativeTabs.Trigger name="chats">
        <Label>Messages</Label>
        <Icon 
          sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }}
          drawable="ic_menu_send"
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