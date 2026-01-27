/**
 * PointsBadge Component
 * 
 * An elegant, modern badge displaying reward points.
 * Clean pill design that scales properly and never causes overflow issues.
 * Designed for a premium dating app aesthetic.
 */

import React from "react";
import { View, Text, StyleSheet, ViewStyle, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { moderateScale } from "react-native-size-matters";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

type BadgeSize = "sm" | "md" | "lg";

interface PointsBadgeProps {
  /** Number of points to display */
  points: number;
  /** Size variant */
  size?: BadgeSize;
  /** Optional press handler */
  onPress?: () => void;
  /** Optional style overrides */
  style?: ViewStyle;
  /** Show "pts" label (default: true) */
  showLabel?: boolean;
}

// Size configurations
const SIZE_CONFIG = {
  sm: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    iconSize: moderateScale(14),
    pointsFontSize: moderateScale(13),
    labelFontSize: moderateScale(10),
    gap: moderateScale(4),
    borderRadius: moderateScale(16),
  },
  md: {
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    iconSize: moderateScale(18),
    pointsFontSize: moderateScale(16),
    labelFontSize: moderateScale(11),
    gap: moderateScale(5),
    borderRadius: moderateScale(20),
  },
  lg: {
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(10),
    iconSize: moderateScale(22),
    pointsFontSize: moderateScale(20),
    labelFontSize: moderateScale(12),
    gap: moderateScale(6),
    borderRadius: moderateScale(24),
  },
} as const;

// Format points with thousands separator
function formatPoints(points: number): string {
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return points.toLocaleString();
}

export function PointsBadge({
  points,
  size = "md",
  onPress,
  style,
  showLabel = true,
}: PointsBadgeProps) {
  const config = SIZE_CONFIG[size];

  const content = (
    <LinearGradient
      colors={["#E8527C", "#C44569", "#B83B5E"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.container,
        {
          paddingHorizontal: config.paddingHorizontal,
          paddingVertical: config.paddingVertical,
          borderRadius: config.borderRadius,
        },
        style,
      ]}
    >
      <MaterialIcons
        name="favorite"
        size={config.iconSize}
        color="rgba(255, 255, 255, 0.95)"
      />
      <View style={[styles.textContainer, { gap: config.gap / 2 }]}>
        <Text
          style={[
            styles.pointsText,
            { fontSize: config.pointsFontSize },
          ]}
          numberOfLines={1}
        >
          {formatPoints(points)}
        </Text>
        {showLabel && (
          <Text
            style={[
              styles.labelText,
              { fontSize: config.labelFontSize },
            ]}
          >
            pts
          </Text>
        )}
      </View>
    </LinearGradient>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          { opacity: pressed ? 0.85 : 1 },
          styles.pressable,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: "flex-start",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    // Subtle shadow for depth
    shadowColor: "#B83B5E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  textContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  pointsText: {
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  labelText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "500",
    textTransform: "lowercase",
  },
});

export default PointsBadge;
