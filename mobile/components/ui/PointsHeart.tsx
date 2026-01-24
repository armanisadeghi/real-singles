/**
 * PointsHeart Component
 * 
 * A reusable heart badge that displays points with proper text positioning.
 * The text is positioned slightly below center to fit within the heart's
 * widest area (hearts are narrow at the top due to the dip).
 */

import React from "react";
import { View, Text, Image, StyleSheet, ViewStyle } from "react-native";
import { images } from "@/constants/images";
import { moderateScale } from "react-native-size-matters";

type HeartSize = "sm" | "md" | "lg";

interface PointsHeartProps {
  /** Number of points to display */
  points: number;
  /** Size variant of the heart badge */
  size?: HeartSize;
  /** Optional style overrides for the container */
  style?: ViewStyle;
}

// Size configurations with proportional dimensions
const SIZE_CONFIG = {
  sm: {
    width: moderateScale(56),
    height: moderateScale(52),
    pointsFontSize: moderateScale(14),
    labelFontSize: moderateScale(9),
    // Text offset from center (percentage of height to push down)
    textOffsetPercent: 0.08,
  },
  md: {
    width: moderateScale(72),
    height: moderateScale(67),
    pointsFontSize: moderateScale(18),
    labelFontSize: moderateScale(11),
    textOffsetPercent: 0.08,
  },
  lg: {
    width: moderateScale(88),
    height: moderateScale(82),
    pointsFontSize: moderateScale(22),
    labelFontSize: moderateScale(12),
    textOffsetPercent: 0.08,
  },
} as const;

export function PointsHeart({ points, size = "md", style }: PointsHeartProps) {
  const config = SIZE_CONFIG[size];
  
  // Calculate the text offset to position it in the heart's wider area
  const textOffset = config.height * config.textOffsetPercent;

  return (
    <View style={[styles.container, { width: config.width, height: config.height }, style]}>
      {/* Heart image fills the container */}
      <Image
        source={images.heart}
        style={[styles.heartImage, { width: config.width, height: config.height }]}
        resizeMode="contain"
      />
      
      {/* Text overlay positioned slightly below center */}
      <View style={[styles.textOverlay, { paddingTop: textOffset }]}>
        <Text
          style={[
            styles.pointsText,
            { fontSize: config.pointsFontSize, lineHeight: config.pointsFontSize * 1.1 }
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {points}
        </Text>
        <Text
          style={[
            styles.labelText,
            { fontSize: config.labelFontSize, lineHeight: config.labelFontSize * 1.2 }
          ]}
        >
          Points
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  heartImage: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  textOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  pointsText: {
    color: "#FFFFFF",
    fontWeight: "700",
    textAlign: "center",
  },
  labelText: {
    color: "#FFFFFF",
    fontWeight: "500",
    textAlign: "center",
    marginTop: -2,
  },
});

export default PointsHeart;
