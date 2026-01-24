import { NativeTabs, Label, Icon } from 'expo-router/unstable-native-tabs';
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
 * Note: Native tab components provide built-in haptic feedback on both platforms.
 * iOS UITabBarController has subtle haptic on selection (iOS 15+).
 * Android BottomNavigationView provides ripple effect feedback.
 */
export default function TabLayout() {
  return (
    <NativeTabs
      // Android-specific styling
      rippleColor="#E91E6340"
      indicatorColor="#E91E63"
      // Label always visible (Material Design 3 guideline)
      labelVisibilityMode="labeled"
    >
      {/* Home / Discover Tab */}
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          androidSrc={icons.home}
        />
      </NativeTabs.Trigger>

      {/* Chats / Messages Tab */}
      <NativeTabs.Trigger name="chats">
        <Label>Chats</Label>
        <Icon
          sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }}
          androidSrc={icons.chats}
        />
      </NativeTabs.Trigger>

      {/* Favorites / Likes Tab */}
      <NativeTabs.Trigger name="git s">
        <Label>Favorites</Label>
        <Icon
          sf={{ default: 'heart', selected: 'heart.fill' }}
          androidSrc={icons.heart}
        />
      </NativeTabs.Trigger>

      {/* Profile Tab */}
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