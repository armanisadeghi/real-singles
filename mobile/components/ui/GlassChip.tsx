/**
 * GlassChip Component
 * 
 * A native iOS-style chip with Liquid Glass / BlurView effect that adapts to:
 * - Light/Dark mode automatically via PlatformColor
 * - Accessibility settings (reduce transparency)
 * - Platform differences (iOS glass, Android solid)
 * 
 * Uses the same pattern as the bottom tab bar's glass effect for consistency.
 * 
 * @example
 * <GlassChip
 *   label="Discover"
 *   onPress={() => router.push("/discover")}
 * />
 */

import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState, useMemo } from "react";
import {
  AccessibilityInfo,
  Platform,
  PlatformColor,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useThemeColors } from "@/context/ThemeContext";
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from "@/constants/designTokens";
import { PlatformIcon } from "./PlatformIcon";

interface GlassChipProps {
  /** The label text displayed in the chip */
  label: string;
  /** Called when the chip is pressed */
  onPress?: () => void;
  /** Optional SF Symbol icon name (iOS) */
  iosIcon?: string;
  /** Optional Material icon name (Android) */
  androidIcon?: string;
  /** Whether the chip is selected/active */
  selected?: boolean;
  /** Chip size variant */
  size?: "sm" | "md" | "lg";
  /** Additional styles for the container */
  style?: ViewStyle;
  /** Whether the chip is disabled */
  disabled?: boolean;
}

export function GlassChip({
  label,
  onPress,
  iosIcon,
  androidIcon,
  selected = false,
  size = "md",
  style,
  disabled = false,
}: GlassChipProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useThemeColors();
  const [reduceTransparency, setReduceTransparency] = useState(false);

  // Check accessibility preferences for reduced transparency (iOS only)
  useEffect(() => {
    if (Platform.OS === "ios") {
      AccessibilityInfo.isReduceTransparencyEnabled().then(setReduceTransparency);
      const subscription = AccessibilityInfo.addEventListener(
        "reduceTransparencyChanged",
        setReduceTransparency
      );
      return () => subscription.remove();
    }
  }, []);

  // Theme-aware colors using iOS PlatformColor for automatic adaptation
  const themedColors = useMemo(() => ({
    // Text color - uses system label which adapts to light/dark and accessibility
    text: Platform.OS === "ios"
      ? (PlatformColor("label") as unknown as string)
      : colors.onSurface,
    // Selected text - uses primary tint
    selectedText: Platform.OS === "ios"
      ? (PlatformColor("systemBlue") as unknown as string)
      : colors.primary,
    // Border for unselected state - uses system separator
    border: Platform.OS === "ios"
      ? (PlatformColor("separator") as unknown as string)
      : colors.outlineVariant,
    // Solid background fallback (for Android and reduce transparency)
    solidBackground: Platform.OS === "ios"
      ? (PlatformColor("secondarySystemBackground") as unknown as string)
      : colors.surfaceContainerHigh,
    // Selected solid background
    selectedSolidBackground: Platform.OS === "ios"
      ? (PlatformColor("systemGray5") as unknown as string)
      : colors.surfaceContainerHighest,
  }), [isDark, colors]);

  // Size configurations
  const sizeConfig = {
    sm: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      fontSize: TYPOGRAPHY.caption1,
      iconSize: 14,
      minHeight: 28,
    },
    md: {
      paddingHorizontal: SPACING.base,
      paddingVertical: SPACING.sm,
      fontSize: TYPOGRAPHY.subheadline,
      iconSize: 16,
      minHeight: 36,
    },
    lg: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      fontSize: TYPOGRAPHY.body,
      iconSize: 18,
      minHeight: 44,
    },
  };

  const config = sizeConfig[size];
  const useGlass = Platform.OS === "ios" && !reduceTransparency;
  const showIcon = iosIcon || androidIcon;
  const textColor = selected ? themedColors.selectedText : themedColors.text;

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const containerStyle: ViewStyle = {
    borderRadius: 50, // Pill shape
    overflow: "hidden",
    minHeight: config.minHeight,
    borderWidth: selected ? 0 : StyleSheet.hairlineWidth,
    borderColor: selected ? "transparent" : themedColors.border,
    opacity: disabled ? 0.5 : 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: selected ? 0.1 : 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: selected ? 2 : 1,
      },
    }),
  };

  const innerStyle: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: config.paddingHorizontal,
    paddingVertical: config.paddingVertical,
    gap: SPACING.xs,
  };

  const textStyle: TextStyle = {
    ...config.fontSize,
    fontWeight: selected ? "600" : "500",
    color: textColor,
  };

  const ChipContent = (
    <View style={innerStyle}>
      {showIcon && (
        <PlatformIcon
          name={androidIcon || ""}
          iosName={iosIcon}
          size={config.iconSize}
          color={textColor}
        />
      )}
      <Text style={textStyle}>{label}</Text>
    </View>
  );

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        containerStyle,
        style,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
    >
      {useGlass ? (
        <BlurView
          intensity={selected ? 80 : 60}
          tint={isDark 
            ? (selected ? "systemMaterialDark" : "systemUltraThinMaterialDark")
            : (selected ? "systemMaterial" : "systemUltraThinMaterial")
          }
          style={styles.blurContainer}
        >
          {ChipContent}
        </BlurView>
      ) : (
        <View
          style={[
            styles.solidContainer,
            {
              backgroundColor: selected
                ? themedColors.selectedSolidBackground
                : themedColors.solidBackground,
            },
          ]}
        >
          {ChipContent}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: Platform.OS === "ios" ? 0.7 : 1,
    transform: [{ scale: 0.98 }],
  },
  blurContainer: {
    flex: 1,
  },
  solidContainer: {
    flex: 1,
  },
});

export default GlassChip;
