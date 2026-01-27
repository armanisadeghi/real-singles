/**
 * iOS Context Menu Utility
 * 
 * Provides native iOS context menu configurations following Apple's Human Interface Guidelines.
 * Context menus appear on long-press and provide quick actions with SF Symbol icons.
 * 
 * @see https://developer.apple.com/design/human-interface-guidelines/context-menus
 */

import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

// ============================================
// TYPES
// ============================================

export interface ContextMenuAction {
  actionKey: string;
  actionTitle: string;
  icon?: {
    type: "SYSTEM";
    iconValue: string; // SF Symbol name
  };
  menuAttributes?: ("destructive" | "disabled" | "hidden")[];
}

export interface ContextMenuConfig {
  menuTitle?: string;
  menuItems: ContextMenuAction[];
}

// ============================================
// PRE-BUILT MENU CONFIGURATIONS
// ============================================

/**
 * Context menu for chat messages
 */
export const chatMessageMenu: ContextMenuConfig = {
  menuTitle: "",
  menuItems: [
    {
      actionKey: "copy",
      actionTitle: "Copy",
      icon: { type: "SYSTEM", iconValue: "doc.on.doc" },
    },
    {
      actionKey: "reply",
      actionTitle: "Reply",
      icon: { type: "SYSTEM", iconValue: "arrowshape.turn.up.left" },
    },
    {
      actionKey: "forward",
      actionTitle: "Forward",
      icon: { type: "SYSTEM", iconValue: "arrowshape.turn.up.forward" },
    },
    {
      actionKey: "delete",
      actionTitle: "Delete",
      icon: { type: "SYSTEM", iconValue: "trash" },
      menuAttributes: ["destructive"],
    },
  ],
};

/**
 * Context menu for profile photos
 */
export const profilePhotoMenu: ContextMenuConfig = {
  menuTitle: "",
  menuItems: [
    {
      actionKey: "save",
      actionTitle: "Save Photo",
      icon: { type: "SYSTEM", iconValue: "square.and.arrow.down" },
    },
    {
      actionKey: "share",
      actionTitle: "Share",
      icon: { type: "SYSTEM", iconValue: "square.and.arrow.up" },
    },
    {
      actionKey: "report",
      actionTitle: "Report Photo",
      icon: { type: "SYSTEM", iconValue: "exclamationmark.triangle" },
      menuAttributes: ["destructive"],
    },
  ],
};

/**
 * Context menu for chat list items
 */
export const chatListMenu: ContextMenuConfig = {
  menuTitle: "",
  menuItems: [
    {
      actionKey: "pin",
      actionTitle: "Pin Conversation",
      icon: { type: "SYSTEM", iconValue: "pin" },
    },
    {
      actionKey: "mute",
      actionTitle: "Mute",
      icon: { type: "SYSTEM", iconValue: "bell.slash" },
    },
    {
      actionKey: "archive",
      actionTitle: "Archive",
      icon: { type: "SYSTEM", iconValue: "archivebox" },
    },
    {
      actionKey: "delete",
      actionTitle: "Delete",
      icon: { type: "SYSTEM", iconValue: "trash" },
      menuAttributes: ["destructive"],
    },
  ],
};

/**
 * Context menu for profile cards in discover/favorites
 */
export const profileCardMenu: ContextMenuConfig = {
  menuTitle: "",
  menuItems: [
    {
      actionKey: "view",
      actionTitle: "View Profile",
      icon: { type: "SYSTEM", iconValue: "person.circle" },
    },
    {
      actionKey: "message",
      actionTitle: "Send Message",
      icon: { type: "SYSTEM", iconValue: "bubble.left" },
    },
    {
      actionKey: "superlike",
      actionTitle: "Super Like",
      icon: { type: "SYSTEM", iconValue: "star.fill" },
    },
    {
      actionKey: "hide",
      actionTitle: "Hide Profile",
      icon: { type: "SYSTEM", iconValue: "eye.slash" },
    },
    {
      actionKey: "report",
      actionTitle: "Report",
      icon: { type: "SYSTEM", iconValue: "exclamationmark.triangle" },
      menuAttributes: ["destructive"],
    },
  ],
};

// ============================================
// HANDLERS
// ============================================

/**
 * Handle context menu press with haptic feedback
 */
export function handleContextMenuPress(actionKey: string, callback: (key: string) => void): void {
  // Provide haptic feedback based on action type
  if (actionKey === "delete" || actionKey === "report") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } else {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  
  callback(actionKey);
}

/**
 * Check if context menu should be shown (iOS only for native feel)
 */
export function shouldShowContextMenu(): boolean {
  return Platform.OS === "ios";
}

// ============================================
// HELPER TO CREATE CUSTOM MENUS
// ============================================

/**
 * Create a custom context menu configuration
 */
export function createContextMenu(
  items: Array<{
    key: string;
    title: string;
    sfSymbol?: string;
    destructive?: boolean;
    disabled?: boolean;
  }>
): ContextMenuConfig {
  return {
    menuTitle: "",
    menuItems: items.map((item) => ({
      actionKey: item.key,
      actionTitle: item.title,
      icon: item.sfSymbol
        ? { type: "SYSTEM" as const, iconValue: item.sfSymbol }
        : undefined,
      menuAttributes: [
        ...(item.destructive ? ["destructive" as const] : []),
        ...(item.disabled ? ["disabled" as const] : []),
      ].length > 0
        ? [
            ...(item.destructive ? ["destructive" as const] : []),
            ...(item.disabled ? ["disabled" as const] : []),
          ]
        : undefined,
    })),
  };
}
