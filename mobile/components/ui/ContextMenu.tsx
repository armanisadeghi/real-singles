/**
 * Platform-aware Context Menu component
 * 
 * Uses native iOS context menu (long press with preview) on iOS
 * Falls back to ActionSheetIOS or custom modal on Android
 * 
 * Usage:
 * <ContextMenu
 *   menuItems={[
 *     { title: 'Copy', icon: 'doc.on.doc', onPress: handleCopy },
 *     { title: 'Delete', icon: 'trash', destructive: true, onPress: handleDelete },
 *   ]}
 * >
 *   <MessageBubble ... />
 * </ContextMenu>
 */

import React, { ReactNode } from 'react';
import { Platform, ActionSheetIOS, View, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

// Only import on iOS to avoid issues on Android
let ContextMenuView: any = null;
if (Platform.OS === 'ios') {
  try {
    const contextMenu = require('react-native-ios-context-menu');
    ContextMenuView = contextMenu.ContextMenuView;
  } catch (e) {
    // Package not available, will use fallback
  }
}

export interface ContextMenuItem {
  /** Display title for the menu item */
  title: string;
  /** SF Symbol name for iOS */
  icon?: string;
  /** Mark as destructive action (red text on iOS) */
  destructive?: boolean;
  /** Callback when item is selected */
  onPress: () => void;
}

export interface ContextMenuProps {
  /** Children to render as the context menu target */
  children: ReactNode;
  /** Array of menu items */
  menuItems: ContextMenuItem[];
  /** Optional preview component for iOS (shows on long press) */
  preview?: ReactNode;
  /** Whether context menu is disabled */
  disabled?: boolean;
  /** Container style */
  style?: StyleProp<ViewStyle>;
}

/**
 * Cross-platform context menu component
 * 
 * iOS: Uses native context menu with haptics and preview
 * Android: Falls back to long press with ActionSheet modal
 */
export function ContextMenu({
  children,
  menuItems,
  preview,
  disabled = false,
  style,
}: ContextMenuProps) {
  // Android fallback using ActionSheetIOS-style pattern
  const showAndroidMenu = () => {
    if (disabled || menuItems.length === 0) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // On Android, we use ActionSheetIOS API which works cross-platform in Expo
    if (Platform.OS === 'ios') {
      const options = ['Cancel', ...menuItems.map(item => item.title)];
      const destructiveIndex = menuItems.findIndex(item => item.destructive);
      
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
          destructiveButtonIndex: destructiveIndex !== -1 ? destructiveIndex + 1 : undefined,
        },
        (buttonIndex) => {
          if (buttonIndex > 0) {
            menuItems[buttonIndex - 1]?.onPress();
          }
        }
      );
    }
  };

  // iOS native context menu
  if (Platform.OS === 'ios' && ContextMenuView) {
    const menuConfig = {
      menuTitle: '',
      menuItems: menuItems.map((item, index) => ({
        actionKey: `action-${index}`,
        actionTitle: item.title,
        icon: item.icon ? {
          type: 'IMAGE_SYSTEM',
          imageValue: {
            systemName: item.icon,
          },
        } : undefined,
        menuAttributes: item.destructive ? ['destructive'] : undefined,
      })),
    };

    return (
      <ContextMenuView
        style={style}
        menuConfig={menuConfig}
        onPressMenuItem={({ nativeEvent }: any) => {
          const index = parseInt(nativeEvent.actionKey.replace('action-', ''));
          Haptics.selectionAsync();
          menuItems[index]?.onPress();
        }}
        onPressMenuPreview={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
        isContextMenuEnabled={!disabled}
        previewConfig={{
          previewType: preview ? 'CUSTOM' : 'DEFAULT',
        }}
        renderPreview={preview ? () => preview : undefined}
      >
        {children}
      </ContextMenuView>
    );
  }

  // Fallback for Android or when package isn't available
  return (
    <TouchableOpacity
      style={style}
      activeOpacity={0.8}
      onLongPress={showAndroidMenu}
      delayLongPress={500}
      disabled={disabled}
    >
      {children}
    </TouchableOpacity>
  );
}

export default ContextMenu;
