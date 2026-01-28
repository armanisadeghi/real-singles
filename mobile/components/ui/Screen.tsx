/**
 * Screen - Consistent screen container for all app screens
 * 
 * Features:
 * - Proper safe area handling for iOS and Android
 * - Optional integrated header
 * - Consistent background color
 * - Tab bar spacing support
 * - Keyboard avoiding behavior
 * 
 * Usage:
 * <Screen>
 *   <YourContent />
 * </Screen>
 * 
 * <Screen 
 *   headerTitle="Settings" 
 *   showBackButton 
 *   onBackPress={router.back}
 *   rightHeaderContent={<NotificationBell />}
 * >
 *   <YourContent />
 * </Screen>
 */

import React, { ReactNode } from "react";
import { Platform, PlatformColor, View, StyleSheet, ViewStyle, StatusBar, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenHeader, ScreenHeaderProps } from "./ScreenHeader";
import { useBottomSpacing } from "@/hooks/useResponsive";
import { useThemeColors } from "@/context/ThemeContext";

export interface ScreenProps extends Omit<ScreenHeaderProps, "title"> {
  children: ReactNode;
  /** Whether this screen has a tab bar (affects bottom padding) */
  hasTabBar?: boolean;
  /** Custom background color */
  backgroundColor?: string;
  /** Screen title for the header */
  headerTitle?: string;
  /** Whether to show the header (default: true) */
  showHeader?: boolean;
  /** Right content for the header */
  rightHeaderContent?: ReactNode;
  /** Left content for the header (overrides back button + title) */
  leftHeaderContent?: ReactNode;
  /** Custom container style */
  containerStyle?: ViewStyle;
  /** Custom content style */
  contentStyle?: ViewStyle;
  /** Whether content should extend under the header (for hero images) */
  contentUnderHeader?: boolean;
  /** Status bar style */
  statusBarStyle?: "light-content" | "dark-content";
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  hasTabBar = false,
  backgroundColor,
  headerTitle,
  showHeader = false,
  showBackButton = false,
  onBackPress,
  rightHeaderContent,
  leftHeaderContent,
  containerStyle,
  contentStyle,
  contentUnderHeader = false,
  statusBarStyle = "dark-content",
  transparent,
  ...headerProps
}) => {
  const insets = useSafeAreaInsets();
  const { contentPadding: tabBarPadding } = useBottomSpacing(hasTabBar);
  const colors = useThemeColors();
  
  // Use PlatformColor on iOS for proper system color adaptation
  const defaultBackground = Platform.OS === "ios"
    ? (PlatformColor("systemBackground") as unknown as string)
    : colors.background;
  
  const bgColor = backgroundColor || defaultBackground;

  // For screens without header, we need to handle safe area in content
  const needsTopSafeArea = !showHeader && !contentUnderHeader;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }, containerStyle]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor="transparent" translucent />
      
      {showHeader && (
        <ScreenHeader
          title={headerTitle}
          showBackButton={showBackButton}
          onBackPress={onBackPress}
          rightContent={rightHeaderContent}
          leftContent={leftHeaderContent}
          transparent={transparent}
          absolute={contentUnderHeader}
          {...headerProps}
        />
      )}
      
      <View 
        style={[
          styles.content,
          needsTopSafeArea && { paddingTop: insets.top },
          hasTabBar && { paddingBottom: tabBarPadding },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default Screen;
