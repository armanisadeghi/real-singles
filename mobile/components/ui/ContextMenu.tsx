/**
 * Platform-aware Context Menu component
 * 
 * Uses native iOS context menu (long press with preview) on iOS
 * Falls back to bottom sheet modal on Android
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

import React, { ReactNode, useState, useCallback } from 'react';
import { Platform, ActionSheetIOS, View, TouchableOpacity, StyleProp, ViewStyle, Modal, Text, Pressable, StyleSheet } from 'react-native';
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
 * Android: Falls back to bottom sheet modal for Material Design
 */
export function ContextMenu({
  children,
  menuItems,
  preview,
  disabled = false,
  style,
}: ContextMenuProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  
  // Show menu on long press (Android)
  const showMenu = useCallback(() => {
    if (disabled || menuItems.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMenuVisible(true);
  }, [disabled, menuItems.length]);
  
  // Close menu
  const closeMenu = useCallback(() => {
    setMenuVisible(false);
  }, []);
  
  // Handle menu item press
  const handleItemPress = useCallback((item: ContextMenuItem) => {
    Haptics.selectionAsync();
    closeMenu();
    // Delay action to allow modal to close smoothly
    setTimeout(() => {
      item.onPress();
    }, 100);
  }, [closeMenu]);

  // iOS: Uses ActionSheetIOS or native context menu
  const showIOSMenu = useCallback(() => {
    if (disabled || menuItems.length === 0) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
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
          Haptics.selectionAsync();
          menuItems[buttonIndex - 1]?.onPress();
        }
      }
    );
  }, [disabled, menuItems]);

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

  // iOS fallback (when context menu package not available)
  if (Platform.OS === 'ios') {
    return (
      <TouchableOpacity
        style={style}
        activeOpacity={0.8}
        onLongPress={showIOSMenu}
        delayLongPress={500}
        disabled={disabled}
      >
        {children}
      </TouchableOpacity>
    );
  }

  // Android: Material Design bottom sheet
  return (
    <>
      <TouchableOpacity
        style={style}
        activeOpacity={0.8}
        onLongPress={showMenu}
        delayLongPress={500}
        disabled={disabled}
      >
        {children}
      </TouchableOpacity>
      
      {/* Android Bottom Sheet Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        onRequestClose={closeMenu}
        statusBarTranslucent
      >
        <Pressable style={menuStyles.overlay} onPress={closeMenu}>
          <View style={menuStyles.sheet}>
            <View style={menuStyles.handle} />
            {menuItems.map((item, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  menuStyles.menuItem,
                  pressed && menuStyles.menuItemPressed,
                ]}
                onPress={() => handleItemPress(item)}
              >
                <Text style={[
                  menuStyles.menuItemText,
                  item.destructive && menuStyles.destructiveText,
                ]}>
                  {item.title}
                </Text>
              </Pressable>
            ))}
            <View style={menuStyles.divider} />
            <Pressable
              style={({ pressed }) => [
                menuStyles.menuItem,
                pressed && menuStyles.menuItemPressed,
              ]}
              onPress={closeMenu}
            >
              <Text style={menuStyles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const menuStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 34,
    paddingHorizontal: 16,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  menuItemPressed: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  menuItemText: {
    fontSize: 16,
    color: '#000',
  },
  destructiveText: {
    color: '#F44336',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default ContextMenu;
