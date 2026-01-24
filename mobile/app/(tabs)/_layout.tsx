import { NativeTabs, Label, Icon } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';
import { icons } from '@/constants/icons';

/**
 * Native Bottom Tab Navigation
 * 
 * Uses platform-native components:
 * - iOS: UITabBarController (supports Liquid Glass on iOS 26+)
 * - Android: BottomNavigationView (Material Design 3)
 * 
 * Following platform guidelines:
 * - iOS HIG: 3-5 tabs, always show labels, 25x25pt icons
 * - Material Design 3: 3-5 destinations, visible labels, active indicator
 * 
 * Material Design 3 Specs (Android):
 * - Icon size: 24dp (default)
 * - Active indicator: pill shape
 * - Label: Always visible
 * - Ripple color: #E91E6340 (pink with 25% opacity)
 * - Indicator color: #E91E63 (pink-600)
 * 
 * Note: Native tab components provide built-in haptic feedback on both platforms.
 * iOS UITabBarController has subtle haptic on selection (iOS 15+).
 * Android BottomNavigationView provides ripple effect feedback.
 */
export default function TabLayout() {
  return (
    <NativeTabs
      // Android Material Design 3 styling
      rippleColor="#E91E6340"
      indicatorColor="#E91E63"
      // Label always visible (Material Design 3 guideline)
      labelVisibilityMode="labeled"
    >
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