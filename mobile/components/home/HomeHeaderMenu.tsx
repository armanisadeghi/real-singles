/**
 * HomeHeaderMenu - Platform-aware menu component for home screen header
 * 
 * iOS: Native context menu with SF Symbols (tap to reveal)
 * Android: Keeps the existing drawer trigger pattern
 * 
 * This follows iOS Human Interface Guidelines by using native context menus
 * instead of side drawers, which are not a native iOS pattern.
 */

import React, { useCallback } from 'react';
import { Platform, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { PlatformIcon } from '@/components/ui/PlatformIcon';
import { SPACING, ICON_SIZES } from '@/constants/designTokens';

// Only import ContextMenuView on iOS
let ContextMenuView: any = null;
if (Platform.OS === 'ios') {
  try {
    const contextMenu = require('react-native-ios-context-menu');
    ContextMenuView = contextMenu.ContextMenuView;
  } catch (e) {
    // Package not available, will use fallback
    console.warn('react-native-ios-context-menu not available');
  }
}

export interface HomeHeaderMenuProps {
  /** Callback to show the side menu (Android only) */
  onShowMenu?: () => void;
  /** Icon color */
  iconColor?: string;
  /** Background color for the button */
  backgroundColor?: string;
}

/**
 * Menu items configuration
 * These match the items in the existing SideMenu component
 */
const menuItems = [
  {
    actionKey: 'profile',
    actionTitle: 'Profile',
    sfSymbol: 'person',
    route: '/(tabs)/profile' as const,
  },
  {
    actionKey: 'notifications',
    actionTitle: 'Notifications',
    sfSymbol: 'bell',
    route: '/notification' as const,
  },
  {
    actionKey: 'contact',
    actionTitle: 'Contact Us',
    sfSymbol: 'envelope',
    route: '/contact' as const,
  },
  {
    actionKey: 'refer',
    actionTitle: 'Refer a Friend',
    sfSymbol: 'person.2',
    route: '/refer' as const,
  },
];

export function HomeHeaderMenu({
  onShowMenu,
  iconColor = '#ffffff',
  backgroundColor = 'rgba(255, 255, 255, 0.15)',
}: HomeHeaderMenuProps) {
  const router = useRouter();

  // Handle menu item selection (iOS)
  const handleMenuPress = useCallback((actionKey: string) => {
    Haptics.selectionAsync();
    const item = menuItems.find((m) => m.actionKey === actionKey);
    if (item) {
      router.push(item.route);
    }
  }, [router]);

  // Handle button press (Android - opens drawer)
  const handleButtonPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onShowMenu?.();
  }, [onShowMenu]);

  // iOS: Native context menu
  if (Platform.OS === 'ios' && ContextMenuView) {
    const menuConfig = {
      menuTitle: '',
      menuItems: menuItems.map((item) => ({
        actionKey: item.actionKey,
        actionTitle: item.actionTitle,
        icon: {
          type: 'IMAGE_SYSTEM',
          imageValue: {
            systemName: item.sfSymbol,
          },
        },
      })),
    };

    return (
      <ContextMenuView
        menuConfig={menuConfig}
        onPressMenuItem={({ nativeEvent }: any) => {
          handleMenuPress(nativeEvent.actionKey);
        }}
        onPressMenuPreview={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
      >
        <View
          style={[
            styles.iconButton,
            { backgroundColor },
          ]}
        >
          <PlatformIcon
            name="more-vert"
            iosName="ellipsis"
            size={ICON_SIZES.md}
            color={iconColor}
          />
        </View>
      </ContextMenuView>
    );
  }

  // iOS fallback (if context menu package not available) - use ActionSheet
  if (Platform.OS === 'ios') {
    const { ActionSheetIOS } = require('react-native');
    
    const showActionSheet = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const options = ['Cancel', ...menuItems.map((item) => item.actionTitle)];
      
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
        },
        (buttonIndex: number) => {
          if (buttonIndex > 0) {
            Haptics.selectionAsync();
            const item = menuItems[buttonIndex - 1];
            if (item) {
              router.push(item.route);
            }
          }
        }
      );
    };

    return (
      <TouchableOpacity
        onPress={showActionSheet}
        style={[styles.iconButton, { backgroundColor }]}
        activeOpacity={0.7}
      >
        <PlatformIcon
          name="more-vert"
          iosName="ellipsis"
          size={ICON_SIZES.md}
          color={iconColor}
        />
      </TouchableOpacity>
    );
  }

  // Android: Keep existing drawer trigger with hamburger menu icon
  return (
    <TouchableOpacity
      onPress={handleButtonPress}
      style={[styles.iconButton, { backgroundColor }]}
      activeOpacity={0.7}
    >
      <PlatformIcon
        name="menu"
        size={ICON_SIZES.md}
        color={iconColor}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    borderRadius: 9999, // Full rounded
    padding: SPACING.sm,
  },
});

export default HomeHeaderMenu;
