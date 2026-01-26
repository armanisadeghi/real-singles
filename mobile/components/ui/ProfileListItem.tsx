/**
 * ProfileListItem Component
 * 
 * A horizontal list item for displaying user profiles in lists.
 * Photo on left, info on right. No action buttons - taps navigate to ProfileFocusView.
 * 
 * Designed to be native-first for iOS and Android.
 */

import { icons } from "@/constants/icons";
import { User } from "@/types";
import { IMAGE_URL, VIDEO_URL } from "@/utils/token";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";
import {
  BORDER_RADIUS,
  ICON_SIZES,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
  VERTICAL_SPACING,
} from "@/constants/designTokens";

// Background colors for initials (same as ProfileCard for consistency)
const BACKGROUND_COLORS = [
  "#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5",
  "#2196F3", "#03A9F4", "#00BCD4", "#009688", "#4CAF50",
  "#8BC34A", "#FF9800", "#FF5722", "#795548", "#607D8B",
];

interface ProfileListItemProps {
  profile: User;
  /** Navigate to focus view instead of profile page */
  navigateToFocus?: boolean;
  /** Optional onPress override */
  onPress?: () => void;
}

export default function ProfileListItem({ 
  profile, 
  navigateToFocus = true,
  onPress 
}: ProfileListItemProps) {
  const router = useRouter();
  
  // Generate consistent background color based on user ID/name
  const bgColor = useMemo(() => {
    const seed = profile?.id || profile?.ID || profile?.DisplayName || "";
    const index = Math.abs(
      seed.toString().split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % BACKGROUND_COLORS.length
    );
    return BACKGROUND_COLORS[index];
  }, [profile]);

  // Generate initials from the display name
  const getInitials = () => {
    if (!profile?.DisplayName) return "?";
    const nameParts = profile.DisplayName.split(" ");
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    return (
      nameParts[0].charAt(0).toUpperCase() +
      nameParts[nameParts.length - 1].charAt(0).toUpperCase()
    );
  };

  // Get image source
  const getImageSource = () => {
    if (profile?.Image) {
      const img = profile.Image.trim();
      if (img.startsWith("http://") || img.startsWith("https://")) {
        return { uri: img };
      }
      if (img.startsWith("uploads/")) {
        return { uri: `${IMAGE_URL}${img}` };
      }
      return { uri: `${VIDEO_URL}${img}` };
    }
    return null;
  };

  const imageSource = getImageSource();
  const userId = profile?.id || profile?.ID;
  // Navigate to the discovery profile view for matching flow
  const href = navigateToFocus 
    ? `/discover/profile/${userId}` 
    : `/profiles/${userId}`;

  // Format location string
  const locationString = [profile?.City, profile?.State]
    .filter(Boolean)
    .join(", ");

  // Get rating value
  const rating = profile?.TotalRating ?? profile?.RATINGS;

  // Format distance
  const distanceString = profile?.distance_in_km 
    ? `${profile.distance_in_km.toFixed(1)} km away`
    : null;

  const content = (
    <View style={styles.container}>
      {/* Photo Section */}
      <View style={styles.photoContainer}>
        {imageSource ? (
          <Image
            source={imageSource}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.initialsContainer, { backgroundColor: bgColor }]}>
            <Text style={styles.initials}>{getInitials()}</Text>
          </View>
        )}
      </View>

      {/* Info Section */}
      <View style={styles.infoContainer}>
        {/* Name */}
        <Text style={styles.name} numberOfLines={1}>
          {profile?.DisplayName || "Anonymous"}
        </Text>

        {/* Location */}
        {locationString ? (
          <Text style={styles.location} numberOfLines={1}>
            {locationString}
          </Text>
        ) : null}

        {/* Badges Row */}
        <View style={styles.badgesRow}>
          {/* Verified Badge */}
          {profile?.livePicture && (
            <View style={styles.badge}>
              <Image
                source={icons.check}
                style={styles.badgeIcon}
                resizeMode="contain"
                tintColor="#3B82F6"
              />
              <Text style={[styles.badgeText, { color: "#3B82F6" }]}>Verified</Text>
            </View>
          )}

          {/* Rating Badge */}
          {rating !== undefined && rating !== null && (
            <View style={styles.badge}>
              <Image
                source={icons.star}
                style={styles.badgeIcon}
                resizeMode="contain"
              />
              <Text style={styles.badgeText}>{rating}</Text>
            </View>
          )}

          {/* Distance Badge */}
          {distanceString && (
            <View style={styles.badge}>
              <Image
                source={icons.mapMarker}
                style={styles.badgeIcon}
                resizeMode="contain"
                tintColor="#6B7280"
              />
              <Text style={styles.badgeText}>{distanceString}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Chevron - using text character for simplicity */}
      <View style={styles.chevronContainer}>
        <Text style={styles.chevronText}>›</Text>
      </View>
    </View>
  );

  // Handle navigation press
  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
    } else {
      // Use programmatic navigation instead of Link
      // This fixes Android touch issues inside FlatList
      router.push(href as any);
    }
  }, [onPress, router, href]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.pressable,
        pressed && styles.pressed,
      ]}
      android_ripple={{ color: "rgba(0, 0, 0, 0.08)" }}
    >
      {content}
    </Pressable>
  );
}

const PHOTO_SIZE = moderateScale(72);

const styles = StyleSheet.create({
  pressable: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: SPACING.screenPadding,
    marginVertical: VERTICAL_SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  pressed: {
    opacity: Platform.OS === "ios" ? 0.7 : 1,
    transform: [{ scale: 0.99 }],
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    gap: SPACING.md,
  },
  photoContainer: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: BORDER_RADIUS.md,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  initialsContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    color: "#FFFFFF",
    fontSize: moderateScale(24),
    fontWeight: "700",
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
    gap: verticalScale(2),
  },
  name: {
    ...TYPOGRAPHY.bodySemibold,
    color: "#111827",
  },
  location: {
    ...TYPOGRAPHY.subheadline,
    color: "#6B7280",
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginTop: verticalScale(4),
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xxs,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xxs,
    borderRadius: BORDER_RADIUS.badge,
  },
  badgeIcon: {
    width: ICON_SIZES.xs * 0.75,
    height: ICON_SIZES.xs * 0.75,
  },
  badgeText: {
    ...TYPOGRAPHY.caption2,
    color: "#6B7280",
  },
  chevronContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: SPACING.xs,
  },
  chevronText: {
    fontSize: moderateScale(24),
    color: "#9CA3AF",
    fontWeight: "300",
  },
});
