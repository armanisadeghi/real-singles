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
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo } from "react";
import {
  Image,
  Platform,
  PlatformColor,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
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
import { useThemeColors } from "@/context/ThemeContext";

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useThemeColors();
  
  // Theme-aware colors
  const themedColors = useMemo(() => ({
    background: Platform.OS === 'ios' 
      ? (PlatformColor('secondarySystemBackground') as unknown as string)
      : colors.surface,
    text: Platform.OS === 'ios'
      ? (PlatformColor('label') as unknown as string)
      : colors.onSurface,
    secondaryText: Platform.OS === 'ios'
      ? (PlatformColor('secondaryLabel') as unknown as string)
      : colors.onSurfaceVariant,
    tertiaryText: Platform.OS === 'ios'
      ? (PlatformColor('tertiaryLabel') as unknown as string)
      : (isDark ? '#9CA3AF' : '#6B7280'),
    badgeBackground: Platform.OS === 'ios'
      ? (PlatformColor('systemGray5') as unknown as string)
      : (isDark ? '#374151' : '#F3F4F6'),
    systemBlue: Platform.OS === 'ios'
      ? (PlatformColor('systemBlue') as unknown as string)
      : '#3B82F6',
  }), [isDark, colors]);
  
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
  // Always navigate to the discovery profile view (proper dating app UI)
  const href = `/discover/profile/${userId}`;

  // Format location string
  const locationString = [profile?.City, profile?.State]
    .filter(Boolean)
    .join(", ");

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
        <Text style={[styles.name, { color: themedColors.text }]} numberOfLines={1}>
          {profile?.DisplayName || "Anonymous"}
        </Text>

        {/* Location */}
        {locationString ? (
          <Text style={[styles.location, { color: themedColors.secondaryText }]} numberOfLines={1}>
            {locationString}
          </Text>
        ) : null}

        {/* Badges Row */}
        <View style={styles.badgesRow}>
          {/* Verified Badge */}
          {profile?.livePicture && (
            <View style={[styles.badge, { backgroundColor: themedColors.badgeBackground }]}>
              <Image
                source={icons.check}
                style={styles.badgeIcon}
                resizeMode="contain"
                tintColor={themedColors.systemBlue}
              />
              <Text style={[styles.badgeText, { color: themedColors.systemBlue }]}>Verified</Text>
            </View>
          )}

          {/* Distance Badge */}
          {distanceString && (
            <View style={[styles.badge, { backgroundColor: themedColors.badgeBackground }]}>
              <Image
                source={icons.mapMarker}
                style={styles.badgeIcon}
                resizeMode="contain"
                tintColor={themedColors.secondaryText}
              />
              <Text style={[styles.badgeText, { color: themedColors.secondaryText }]}>{distanceString}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Chevron - using text character for simplicity */}
      <View style={styles.chevronContainer}>
        <Text style={[styles.chevronText, { color: themedColors.tertiaryText }]}>›</Text>
      </View>
    </View>
  );

  // Handle navigation press
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
        { backgroundColor: themedColors.background },
        pressed && styles.pressed,
      ]}
      android_ripple={{ color: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)" }}
    >
      {content}
    </Pressable>
  );
}

const PHOTO_SIZE = moderateScale(72);

const styles = StyleSheet.create({
  pressable: {
    // backgroundColor is set dynamically
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
    color: "#FFFFFF", // White on colored background - intentional
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
    // color is set dynamically
  },
  location: {
    ...TYPOGRAPHY.subheadline,
    // color is set dynamically
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
    // backgroundColor is set dynamically
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
    // color is set dynamically
  },
  chevronContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: SPACING.xs,
  },
  chevronText: {
    fontSize: moderateScale(24),
    // color is set dynamically
    fontWeight: "300",
  },
});
