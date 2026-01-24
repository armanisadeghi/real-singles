import { NativeTabs, Label, Icon } from 'expo-router/unstable-native-tabs';
import { icons } from '@/constants/icons';

/**
 * Native Bottom Tab Navigation
 * 
 * IMPORTANT: This uses actual platform-native components, not JS approximations:
 * - iOS: UITabBarController
 * - Android: BottomNavigationView (Material Design 3)
 * 
 * DO NOT override platform defaults unless absolutely necessary.
 * Native components handle haptics, animations, accessibility, and safe areas automatically.
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
          androidSrc={icons.home}
        />
      </NativeTabs.Trigger>

      {/* Discover Tab - Route: /discover */}
      <NativeTabs.Trigger name="discover">
        <Label>Discover</Label>
        <Icon
          sf={{ default: 'magnifyingglass', selected: 'magnifyingglass' }}
          androidSrc={icons.discover}
        />
      </NativeTabs.Trigger>

      {/* Chats Tab - Route: /chats */}
      <NativeTabs.Trigger name="chats">
        <Label>Chats</Label>
        <Icon
          sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }}
          androidSrc={icons.chats}
        />
      </NativeTabs.Trigger>

      {/* Favorites Tab - Route: /favorites */}
      <NativeTabs.Trigger name="favorites">
        <Label>Favorites</Label>
        <Icon
          sf={{ default: 'heart', selected: 'heart.fill' }}
          androidSrc={icons.heart}
        />
      </NativeTabs.Trigger>

      {/* Profile Tab - Route: /profile */}
      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon
          sf={{ default: 'person', selected: 'person.fill' }}
          androidSrc={icons.profile}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}