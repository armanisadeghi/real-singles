/**
 * =============================================================================
 * PERFORMANCE STANDARDS IMPLEMENTATION REQUIRED
 * See /PERFORMANCE-STANDARDS.md for full requirements
 * =============================================================================
 *
 * TODO [PERF-IMG-001]: Replace ImageBackground with expo-image
 * - expo-image provides better caching and performance
 * - Supports blurhash placeholders for instant loading
 * - Example migration:
 *
 * ```typescript
 * import { Image } from 'expo-image';
 *
 * <Image
 *   source={{ uri: imageUrl }}
 *   placeholder={blurhash}           // Show low-res placeholder instantly
 *   contentFit="cover"
 *   cachePolicy="memory-disk"        // Cache to memory and disk
 *   transition={200}                 // Smooth fade-in transition
 *   style={{ width: cardWidth, height: cardHeight }}
 * />
 * ```
 *
 * TODO [PERF-IMG-002]: Add Supabase image transformations
 * - NEVER serve full-resolution images
 * - Append query params for optimization:
 *
 * ```typescript
 * const optimizedUrl = `${imageUrl}?width=400&quality=80&format=webp`;
 * ```
 *
 * TODO [PERF-IMG-003]: Preload images for smoother scrolling
 * - Prefetch images when they're about to enter viewport
 * - Use expo-image's Image.prefetch() method
 *
 * TODO [PERF-MEMO-002]: Wrap ProfileCard with React.memo
 * - Prevents unnecessary re-renders when parent updates
 * - Export: export default React.memo(ProfileCard, (prev, next) =>
 *     prev.profile.ID === next.profile.ID)
 * =============================================================================
 */

import { icons } from "@/constants/icons";
import { User } from "@/types";
import { IMAGE_URL, VIDEO_URL } from "@/utils/token";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Link, useRouter } from "expo-router";
import React, { useMemo, useCallback } from "react";
import {
  Image,
  ImageBackground,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCardDimensions } from "@/hooks/useResponsive";
import { TYPOGRAPHY, SPACING, ICON_SIZES } from "@/constants/designTokens";


// Array of background colors for initials
export const BACKGROUND_COLORS = [
  "#F44336", // Red
  "#E91E63", // Pink
  "#9C27B0", // Purple
  "#673AB7", // Deep Purple
  "#3F51B5", // Indigo
  "#2196F3", // Blue
  "#03A9F4", // Light Blue
  "#00BCD4", // Cyan
  "#009688", // Teal
  "#4CAF50", // Green
  "#8BC34A", // Light Green
  "#FF9800", // Orange
  "#FF5722", // Deep Orange
  "#795548", // Brown
  "#607D8B", // Blue Grey
];

export default function ProfileCard({ profile }: { profile: User }) {
  const router = useRouter();

  // Responsive card dimensions (2 columns, 1.18 aspect ratio)
  const { width: cardWidth, height: cardHeight, gap } = useCardDimensions(2, 1.18);

  // Generate a random but consistent color for each user based on their ID or name
  const bgColor = useMemo(() => {
    const seed = profile?.id || profile?.ID || profile?.DisplayName || "";
    const index = Math.abs(
      seed.toString().split("").reduce((acc, char) => {
        return acc + char.charCodeAt(0);
      }, 0) % BACKGROUND_COLORS.length
    );
    return BACKGROUND_COLORS[index];
  }, [profile]);

  // Generate initials from the name
  const getInitials = () => {
    if (!profile?.DisplayName) return "?";

    const nameParts = profile.DisplayName.split(" ");
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    } else {
      return (
        nameParts[0].charAt(0).toUpperCase() +
        nameParts[nameParts.length - 1].charAt(0).toUpperCase()
      );
    }
  };

  // Decide what to display as the background
  const displayContent = () => {
    if (profile?.Image) {
      const img = profile.Image.trim();
      
      // If it's already a full URL, use it directly
      if (img.startsWith("http://") || img.startsWith("https://")) {
        return {
          type: "image",
          source: { uri: img }
        };
      }
      
      // Otherwise, prepend the appropriate base URL
      if (img.startsWith("uploads/")) {
        return {
          type: "image",
          source: { uri: `${IMAGE_URL}${img}` }
        };
      } else {
        return {
          type: "image",
          source: { uri: `${VIDEO_URL}${img}` }
        };
      }
    }

    // Return initials with background color
    return {
      type: "initials",
      initials: getInitials(),
      bgColor: bgColor
    };
  };

  const content = displayContent();

  // Haptic feedback for native feel when tapping profile cards
  const handlePressIn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  return (
    <Link asChild href={`/discover/profile/${profile?.id || profile?.ID}`}>
      <TouchableOpacity
        className="relative rounded-card overflow-hidden"
        style={{ width: cardWidth, height: cardHeight }}
        onPressIn={handlePressIn}
      >
        {content.type === "image" ? (
          <ImageBackground
            source={content.source}
            className="w-full h-full rounded-card overflow-hidden"
            resizeMode="cover"
          >
            {/* Distance and content overlays for image background */}
            <DistanceOverlay profile={profile} />
            <GradientOverlay profile={profile} />
          </ImageBackground>
        ) : (
          <View
            className="w-full h-full rounded-card overflow-hidden justify-center items-center"
            style={{ backgroundColor: content.bgColor }}
          >
            {/* Initials */}
            <Text
              className="text-white font-bold"
              style={TYPOGRAPHY.display}
            >
              {content.initials !== '?' ? content.initials : "User"}
            </Text>

            {/* Distance overlay for solid background */}
            <DistanceOverlay profile={profile} />

            {/* Name and location overlay for solid background */}
            <View className="absolute bottom-0 left-0 right-0" style={{ padding: SPACING.sm }}>
              <Text
                className="text-white font-bold"
                style={TYPOGRAPHY.subheadline}
              >
                {profile?.DisplayName || "Anonymous User"}
              </Text>
              <Text
                className="text-white font-normal"
                style={TYPOGRAPHY.caption1}
              >
                {profile?.City}{profile?.City ? ',' : ''} {profile?.State}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Link>
  );
}


// Distance overlay - shows only distance, no ratings (users aren't products)
function DistanceOverlay({ profile }: { profile: User }) {
  if (!profile?.distance_in_km) return null;
  
  return (
    <View
      className="absolute flex-row items-center"
      style={{ top: SPACING.sm, right: SPACING.sm, gap: SPACING.xs }}
    >
      <View
        className="flex-row items-center bg-white rounded-full shadow-sm"
        style={{
          gap: SPACING.xxs,
          paddingHorizontal: SPACING.xs,
          paddingVertical: SPACING.xxs
        }}
      >
        <Text
          className="font-medium text-dark"
          style={TYPOGRAPHY.caption2}
        >
          {profile?.distance_in_km.toFixed(1)} km
        </Text>
      </View>
    </View>
  );
}

// Extracted Gradient overlay to avoid duplication
function GradientOverlay({ profile }: { profile: User }) {
  return (
    <LinearGradient
      colors={["#00000008", "#0000004D", "#000000"]}
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        height: 100,
        right: 0,
        zIndex: 50,
      }}
    >
      <View
        className="absolute z-20"
        style={{ bottom: SPACING.md, left: SPACING.sm }}
      >
        <Text
          className="text-white font-bold"
          style={TYPOGRAPHY.subheadline}
        >
          {profile?.DisplayName || "User"}
        </Text>
        <Text
          className="text-white font-normal"
          style={TYPOGRAPHY.caption1}
        >
          {profile?.State}{profile?.State ? ',' : ''} {profile?.City}
        </Text>
      </View>
    </LinearGradient>
  );
}