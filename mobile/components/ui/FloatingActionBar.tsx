/**
 * FloatingActionBar
 * 
 * A reusable floating action bar component with:
 * - BlurView glass effect on iOS (with reduce transparency fallback)
 * - Solid background on Android
 * - Safe area handling via useSafeAreaInsets
 * - Consistent styling matching iOS HIG
 * 
 * @example
 * <FloatingActionBar>
 *   <FloatingActionBar.Button
 *     icon="share"
 *     iosIcon="square.and.arrow.up"
 *     label="Share"
 *     onPress={handleShare}
 *   />
 *   <FloatingActionBar.PrimaryButton
 *     icon="check-circle"
 *     iosIcon="checkmark.circle.fill"
 *     label="Confirm"
 *     onPress={handleConfirm}
 *   />
 * </FloatingActionBar>
 */

import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Platform,
  PlatformColor,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PlatformIcon } from "./PlatformIcon";

// Context for sharing theme colors
const ActionBarContext = createContext<{
  isDark: boolean;
  iconColor: string;
  labelColor: string;
}>({
  isDark: false,
  iconColor: "#007AFF",
  labelColor: "#666666",
});

interface FloatingActionBarProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface ActionButtonProps {
  icon: string;
  iosIcon?: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

interface PrimaryButtonProps {
  icon: string;
  iosIcon?: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "destructive";
}

// Main FloatingActionBar component
function FloatingActionBar({ children, style }: FloatingActionBarProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [reduceTransparency, setReduceTransparency] = useState(false);

  // Check accessibility preferences for reduced transparency
  useEffect(() => {
    if (Platform.OS === "ios") {
      AccessibilityInfo.isReduceTransparencyEnabled().then(setReduceTransparency);
    }
  }, []);

  // Theme colors
  const colors = {
    secondaryBackground: Platform.OS === "ios"
      ? PlatformColor("secondarySystemBackground") as unknown as string
      : isDark ? "#1C1C1E" : "#F5F5F5",
  };

  const iconColor = Platform.OS === "ios"
    ? (PlatformColor("systemBlue") as unknown as string)
    : "#007AFF";

  const labelColor = Platform.OS === "ios"
    ? (PlatformColor("secondaryLabel") as unknown as string)
    : isDark ? "#8E8E93" : "#666666";

  const contextValue = { isDark, iconColor, labelColor };

  const containerStyle: ViewStyle = {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Math.max(insets.bottom + 8, 20),
  };

  const ActionBarContent = (
    <ActionBarContext.Provider value={contextValue}>
      <View style={styles.actionBarInner}>
        {children}
      </View>
    </ActionBarContext.Provider>
  );

  return (
    <View style={[containerStyle, style]}>
      {Platform.OS === "ios" && !reduceTransparency ? (
        <BlurView
          intensity={100}
          tint={isDark ? "systemChromeMaterialDark" : "systemChromeMaterial"}
          style={styles.actionBar}
        >
          {ActionBarContent}
        </BlurView>
      ) : (
        <View style={[styles.actionBar, styles.actionBarSolid, { backgroundColor: colors.secondaryBackground }]}>
          {ActionBarContent}
        </View>
      )}
    </View>
  );
}

// Action Button (secondary actions like Share, Calendar, Directions)
function ActionButton({ icon, iosIcon, label, onPress, disabled }: ActionButtonProps) {
  const { iconColor, labelColor } = useContext(ActionBarContext);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionButton,
        pressed && styles.actionButtonPressed,
        disabled && styles.actionButtonDisabled,
      ]}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <PlatformIcon
        name={icon}
        iosName={iosIcon}
        size={24}
        color={disabled ? `${iconColor}80` : iconColor}
      />
      <Text style={[styles.actionLabel, { color: labelColor }, disabled && styles.labelDisabled]}>
        {label}
      </Text>
    </Pressable>
  );
}

// Primary Button (main action like RSVP, Message, Confirm)
function PrimaryButton({
  icon,
  iosIcon,
  label,
  onPress,
  disabled,
  loading,
  variant = "primary",
}: PrimaryButtonProps) {
  const { isDark, labelColor } = useContext(ActionBarContext);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const getBackgroundColor = () => {
    if (variant === "primary") return "#B06D1E";
    if (variant === "destructive") {
      return Platform.OS === "ios"
        ? (PlatformColor("systemRed") as unknown as string)
        : "#FF3B30";
    }
    // secondary
    return Platform.OS === "ios"
      ? (PlatformColor("systemGray4") as unknown as string)
      : isDark ? "#3A3A3C" : "#D1D1D6";
  };

  const getTextColor = () => {
    if (variant === "secondary") {
      return Platform.OS === "ios"
        ? (PlatformColor("label") as unknown as string)
        : isDark ? "#FFFFFF" : "#333333";
    }
    return "#FFFFFF";
  };

  const backgroundColor = getBackgroundColor();
  const textColor = getTextColor();

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.primaryButton,
        { backgroundColor },
        pressed && styles.primaryButtonPressed,
        (disabled || loading) && styles.primaryButtonDisabled,
      ]}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          <PlatformIcon
            name={icon}
            iosName={iosIcon}
            size={20}
            color={textColor}
          />
          <Text style={[styles.primaryButtonText, { color: textColor }]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

// Spacer component for flexible spacing
function Spacer() {
  return <View style={styles.spacer} />;
}

// Attach subcomponents
FloatingActionBar.Button = ActionButton;
FloatingActionBar.PrimaryButton = PrimaryButton;
FloatingActionBar.Spacer = Spacer;

export { FloatingActionBar };

const styles = StyleSheet.create({
  actionBar: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  actionBarSolid: {
    // Background color is set dynamically
  },
  actionBarInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 60,
  },
  actionButtonPressed: {
    backgroundColor: Platform.OS === "ios"
      ? "rgba(0,0,0,0.05)"
      : "rgba(0,0,0,0.05)",
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 4,
  },
  labelDisabled: {
    opacity: 0.7,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    minWidth: 100,
    gap: 6,
  },
  primaryButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  spacer: {
    flex: 1,
  },
});
