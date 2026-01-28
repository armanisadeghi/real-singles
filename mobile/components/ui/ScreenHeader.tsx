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

import React, { ReactNode, useCallback } from "react";
import { View, Text, TouchableOpacity, Platform, StyleSheet, ViewStyle, PlatformColor, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { PlatformIcon } from "./PlatformIcon";
import { TYPOGRAPHY, SPACING, VERTICAL_SPACING, ICON_SIZES, SHADOWS, BORDER_RADIUS, Z_INDEX } from "@/constants/designTokens";
import { LiquidGlassHeader } from "./LiquidGlass";
import { useThemeColors } from "@/context/ThemeContext";

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
  /** Use Liquid Glass effect on iOS (default: false) */
  liquidGlass?: boolean;
}

/**
 * Standard back button component used across all screens
 */
export const HeaderBackButton = ({ onPress }: { onPress?: () => void }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useThemeColors();
  
  const handlePress = useCallback(() => {
    // Haptic feedback for navigation - light impact feels native
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }, [onPress]);

  // Theme-aware colors
  const iconColor = Platform.OS === 'ios' 
    ? (PlatformColor('label') as unknown as string)
    : colors.onSurface;
  const borderColor = Platform.OS === 'ios'
    ? (PlatformColor('separator') as unknown as string)
    : colors.outline;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[styles.backButton, { borderColor }]}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <PlatformIcon 
        name="chevron-left" 
        size={ICON_SIZES.sm * 0.9} 
        color={iconColor} 
      />
    </TouchableOpacity>
  );
};

/**
 * Standard header title component
 */
export const HeaderTitle = ({ title }: { title: string }) => {
  const colors = useThemeColors();
  const textColor = Platform.OS === 'ios'
    ? (PlatformColor('label') as unknown as string)
    : colors.onSurface;
    
  return (
    <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
      {title}
    </Text>
  );
};

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
  backgroundColor,
  showShadow = true,
  showBorderRadius = true,
  transparent = false,
  style,
  absolute = false,
  liquidGlass = false,
}) => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useThemeColors();
  
  // Theme-aware default background color
  const defaultBgColor = Platform.OS === 'ios'
    ? (PlatformColor('systemBackground') as unknown as string)
    : colors.background;
  const bgColor = backgroundColor ?? defaultBgColor;
  
  // Calculate consistent padding
  // iOS: Account for notch/Dynamic Island (44-59pt depending on device)
  // Android: Account for status bar (24dp standard)
  const topPadding = insets.top + VERTICAL_SPACING.sm;
  
  // Standard header height (44pt iOS, 56dp Android as per platform guidelines)
  const headerHeight = Platform.OS === "ios" ? 44 : 56;
  
  // Determine if we should use Liquid Glass
  const useGlass = liquidGlass && Platform.OS === 'ios';
  
  const containerStyle: ViewStyle[] = [
    styles.container,
    {
      paddingTop: topPadding,
      paddingBottom: VERTICAL_SPACING.md,
      backgroundColor: useGlass || transparent ? "transparent" : bgColor,
      minHeight: topPadding + headerHeight,
    },
    showShadow && !transparent && !useGlass && SHADOWS.md,
    showBorderRadius && !transparent && !useGlass && styles.borderRadius,
    absolute && styles.absolute,
    style,
  ].filter(Boolean) as ViewStyle[];

  const headerContent = (
    <>
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
    </>
  );

  // Use Liquid Glass wrapper on iOS when enabled
  if (useGlass) {
    return (
      <LiquidGlassHeader style={containerStyle} transparent>
        {headerContent}
      </LiquidGlassHeader>
    );
  }

  return (
    <View style={containerStyle}>
      {headerContent}
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
    // borderColor is now set dynamically in component
    borderRadius: BORDER_RADIUS.button,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    ...TYPOGRAPHY.body,
    fontWeight: "500",
    // color is now set dynamically in component
    marginLeft: SPACING.xs,
  },
});

export default ScreenHeader;
