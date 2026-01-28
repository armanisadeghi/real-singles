/**
 * HomeHeaderMenu - Native iOS pull-down menu for home screen header
 * 
 * iOS: Uses ContextMenuButton with isMenuPrimaryAction for tap-to-show behavior.
 *      This creates a native UIMenu that appears right at the button with
 *      the glass/blur effect and smooth animations.
 * Android: Keeps the existing drawer trigger pattern.
 */

import React, { useCallback } from 'react';
import { Platform, TouchableOpacity, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { PlatformIcon } from '@/components/ui/PlatformIcon';
import { SPACING, ICON_SIZES } from '@/constants/designTokens';

// Only import ContextMenuButton on iOS
let ContextMenuButton: any = null;
if (Platform.OS === 'ios') {
  try {
    const contextMenu = require('react-native-ios-context-menu');
    ContextMenuButton = contextMenu.ContextMenuButton;
  } catch (e) {
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
 * Only includes useful, non-duplicate items
 */
const menuItems = [
  {
    actionKey: 'settings',
    actionTitle: 'Settings',
    sfSymbol: 'gearshape',
    route: '/settings' as const,
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
    sfSymbol: 'person.badge.plus',
    route: '/refer' as const,
  },
];

export function HomeHeaderMenu({
  onShowMenu,
  iconColor = '#000000',
  backgroundColor = 'transparent',
}: HomeHeaderMenuProps) {
  const router = useRouter();

  // Handle menu item selection
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

  // iOS: Native ContextMenuButton (tap to show, appears at button location)
  if (Platform.OS === 'ios' && ContextMenuButton) {
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
      <ContextMenuButton
        isMenuPrimaryAction={true}
        menuConfig={menuConfig}
        onPressMenuItem={({ nativeEvent }: any) => {
          handleMenuPress(nativeEvent.actionKey);
        }}
      >
        <View
          style={[
            styles.iconButton,
            { backgroundColor },
          ]}
        >
          <PlatformIcon
            name="more-horiz"
            iosName="ellipsis.circle"
            size={ICON_SIZES.lg}
            color={iconColor}
          />
        </View>
      </ContextMenuButton>
    );
  }

  // iOS fallback (if ContextMenuButton not available)
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
          name="more-horiz"
          iosName="ellipsis.circle"
          size={ICON_SIZES.lg}
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
    padding: SPACING.xs,
  },
});

export default HomeHeaderMenu;
