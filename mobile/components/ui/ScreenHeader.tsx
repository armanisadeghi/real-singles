/**
 * ScreenHeader - Consistent header component for all screens
 * 
 * Features:
 * - Proper iOS safe area handling (notch, Dynamic Island, status bar)
 * - Proper Android status bar handling
 * - Consistent sizing and positioning across all routes
 * - Optional back button with identical styling
 * - Flexible left/center/right content slots
 * 
 * Usage:
 * <ScreenHeader title="Settings" showBackButton onBackPress={router.back} />
 * <ScreenHeader title="Chats" rightContent={<NotificationBell />} />
 */

import React, { ReactNode } from "react";
import { View, Text, TouchableOpacity, Image, Platform, StyleSheet, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { icons } from "@/constants/icons";
import { TYPOGRAPHY, SPACING, VERTICAL_SPACING, ICON_SIZES, SHADOWS, BORDER_RADIUS, Z_INDEX } from "@/constants/designTokens";

export interface ScreenHeaderProps {
  /** Screen title displayed in the center-left */
  title?: string;
  /** Show the back button (default: true for non-tab screens) */
  showBackButton?: boolean;
  /** Callback when back button is pressed */
  onBackPress?: () => void;
  /** Custom content for the left side (replaces back button + title) */
  leftContent?: ReactNode;
  /** Custom content for the center (replaces title) */
  centerContent?: ReactNode;
  /** Custom content for the right side */
  rightContent?: ReactNode;
  /** Background color (default: white) */
  backgroundColor?: string;
  /** Whether to show the bottom shadow (default: true) */
  showShadow?: boolean;
  /** Whether to show the bottom border radius (default: true) */
  showBorderRadius?: boolean;
  /** Whether header is transparent/overlay (for hero images) */
  transparent?: boolean;
  /** Additional container style */
  style?: ViewStyle;
  /** Whether to use absolute positioning (for overlay headers) */
  absolute?: boolean;
}

/**
 * Standard back button component used across all screens
 */
export const HeaderBackButton = ({ onPress }: { onPress?: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={styles.backButton}
    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
  >
    <Image
      source={icons.back}
      style={styles.backIcon}
      resizeMode="contain"
    />
  </TouchableOpacity>
);

/**
 * Standard header title component
 */
export const HeaderTitle = ({ title }: { title: string }) => (
  <Text style={styles.title} numberOfLines={1}>
    {title}
  </Text>
);

/**
 * Main ScreenHeader component
 */
export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  leftContent,
  centerContent,
  rightContent,
  backgroundColor = "#FFFFFF",
  showShadow = true,
  showBorderRadius = true,
  transparent = false,
  style,
  absolute = false,
}) => {
  const insets = useSafeAreaInsets();
  
  // Calculate consistent padding
  // iOS: Account for notch/Dynamic Island (44-59pt depending on device)
  // Android: Account for status bar (24dp standard)
  const topPadding = insets.top + VERTICAL_SPACING.sm;
  
  // Standard header height (44pt iOS, 56dp Android as per platform guidelines)
  const headerHeight = Platform.OS === "ios" ? 44 : 56;
  
  const containerStyle: ViewStyle[] = [
    styles.container,
    {
      paddingTop: topPadding,
      paddingBottom: VERTICAL_SPACING.md,
      backgroundColor: transparent ? "transparent" : backgroundColor,
      minHeight: topPadding + headerHeight,
    },
    showShadow && !transparent && SHADOWS.md,
    showBorderRadius && !transparent && styles.borderRadius,
    absolute && styles.absolute,
    style,
  ].filter(Boolean) as ViewStyle[];

  return (
    <View style={containerStyle}>
      {/* Left Section */}
      <View style={styles.leftSection}>
        {leftContent ? (
          leftContent
        ) : (
          <View style={styles.leftContainer}>
            {showBackButton && (
              <HeaderBackButton onPress={onBackPress} />
            )}
            {title && !centerContent && (
              <HeaderTitle title={title} />
            )}
          </View>
        )}
      </View>

      {/* Center Section (optional) */}
      {centerContent && (
        <View style={styles.centerSection}>
          {centerContent}
        </View>
      )}

      {/* Right Section */}
      <View style={styles.rightSection}>
        {rightContent}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.base,
    zIndex: Z_INDEX.elevated,
  },
  absolute: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  borderRadius: {
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
  },
  leftSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  centerSection: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: SPACING.xs,
  },
  backButton: {
    width: ICON_SIZES.xl,
    height: ICON_SIZES.xl,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: BORDER_RADIUS.button,
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    width: ICON_SIZES.sm * 0.8,
    height: ICON_SIZES.sm * 0.8,
  },
  title: {
    ...TYPOGRAPHY.body,
    fontWeight: "500",
    color: "#000000",
    marginLeft: SPACING.xs,
  },
});

export default ScreenHeader;
