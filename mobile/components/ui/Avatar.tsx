/**
 * Avatar Component
 * 
 * Reusable avatar component with consistent styling, error handling,
 * and fallback to initials when image is not available.
 */

import React, { useState } from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  ViewStyle,
  ImageSourcePropType,
} from "react-native";
import { COMPONENT_SIZES, TYPOGRAPHY, BORDER_RADIUS } from "@/constants/designTokens";
import { getImageUrl } from "@/utils/token";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

interface AvatarProps {
  /** Image URL or source - can be a full URL, storage path, or null */
  src?: string | null | ImageSourcePropType;
  /** Name used for fallback initials */
  name: string;
  /** Size variant */
  size?: AvatarSize;
  /** Additional styles for the container */
  style?: ViewStyle;
  /** Show online indicator */
  showOnlineIndicator?: boolean;
  /** Whether user is online */
  isOnline?: boolean;
  /** Border color (for overlay on images) */
  borderColor?: string;
  /** Border width */
  borderWidth?: number;
}

// Gradient color pairs for fallback avatars
const AVATAR_COLORS = [
  ["#ec4899", "#f43f5e"], // pink to rose
  ["#a855f7", "#6366f1"], // purple to indigo
  ["#3b82f6", "#06b6d4"], // blue to cyan
  ["#14b8a6", "#10b981"], // teal to emerald
  ["#22c55e", "#84cc16"], // green to lime
  ["#eab308", "#f97316"], // yellow to orange
  ["#f97316", "#ef4444"], // orange to red
  ["#ef4444", "#ec4899"], // red to pink
  ["#6366f1", "#a855f7"], // indigo to purple
  ["#06b6d4", "#3b82f6"], // cyan to blue
];

// Online indicator sizes based on avatar size
const onlineIndicatorSizes: Record<AvatarSize, number> = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  "2xl": 16,
};

// Font sizes for initials based on avatar size
const initialsFontSizes: Record<AvatarSize, number> = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 18,
  xl: 24,
  "2xl": 32,
};

/**
 * Get initials from a name
 * Takes first letter of first and last name, or first two letters if single word
 */
function getInitials(name: string): string {
  if (!name) return "?";

  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Generate a consistent color index based on name
 * Uses a simple hash to pick from a predefined palette
 */
function getColorIndex(name: string): number {
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return hash % AVATAR_COLORS.length;
}

/**
 * Resolve the image source from various input formats
 */
function resolveImageSource(
  src: string | null | undefined | ImageSourcePropType
): ImageSourcePropType | null {
  if (!src) return null;

  // If it's already an ImageSourcePropType (e.g., require())
  if (typeof src === "number" || (typeof src === "object" && "uri" in src)) {
    return src as ImageSourcePropType;
  }

  // If it's a string, convert to proper URL
  if (typeof src === "string") {
    const url = getImageUrl(src);
    if (!url) return null;
    return { uri: url };
  }

  return null;
}

/**
 * Reusable Avatar component with consistent styling and error handling
 * 
 * Features:
 * - Displays user image with graceful fallback to initials
 * - Consistent gradient colors based on name
 * - Multiple size variants using design tokens
 * - Optional online indicator
 * - Error handling for broken images
 * - Supports both URL strings and require() sources
 */
export function Avatar({
  src,
  name,
  size = "md",
  style,
  showOnlineIndicator = false,
  isOnline = false,
  borderColor,
  borderWidth,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const avatarSize = COMPONENT_SIZES.avatar[size];
  const imageSource = resolveImageSource(src);
  const showImage = imageSource && !imageError;
  const initials = getInitials(name);
  const colorIndex = getColorIndex(name);
  const [primaryColor] = AVATAR_COLORS[colorIndex];

  const containerStyle: ViewStyle = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    overflow: "hidden",
    ...(borderColor && { borderColor }),
    ...(borderWidth && { borderWidth }),
  };

  return (
    <View style={[styles.container, style]}>
      <View style={containerStyle}>
        {showImage ? (
          <Image
            source={imageSource}
            style={[
              styles.image,
              { width: avatarSize, height: avatarSize },
              isLoading && styles.hidden,
            ]}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setImageError(true);
              setIsLoading(false);
            }}
            resizeMode="cover"
          />
        ) : null}

        {/* Show initials when no image or image failed to load */}
        {(!showImage || isLoading) && (
          <View
            style={[
              styles.fallback,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
                backgroundColor: primaryColor,
              },
            ]}
          >
            <Text
              style={[
                styles.initials,
                { fontSize: initialsFontSizes[size] },
              ]}
            >
              {initials}
            </Text>
          </View>
        )}
      </View>

      {/* Online indicator */}
      {showOnlineIndicator && isOnline && (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: onlineIndicatorSizes[size],
              height: onlineIndicatorSizes[size],
              borderRadius: onlineIndicatorSizes[size] / 2,
              borderWidth: size === "xs" || size === "sm" ? 1 : 2,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  image: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  hidden: {
    opacity: 0,
  },
  fallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    color: "#ffffff",
    fontWeight: "600",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#22c55e",
    borderColor: "#ffffff",
  },
});

export default Avatar;
