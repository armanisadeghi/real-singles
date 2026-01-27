/**
 * ProfileFocusView - Full-Screen Profile with Action Buttons
 * 
 * A dedicated full-screen view for viewing a single profile and taking actions
 * (Like, Pass, Super Like). Used when users tap on a ProfileListItem.
 */

import { icons } from "@/constants/icons";
import { BACKGROUND_COLORS } from "@/components/ui/ProfileCard";
import {
  BORDER_RADIUS,
  COMPONENT_SIZES,
  ICON_SIZES,
  LAYOUT,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
  VERTICAL_SPACING,
} from "@/constants/designTokens";
import { fetchOtherProfile, likeUser, passUser, superLikeUser } from "@/lib/api";
import { User } from "@/types";
import { IMAGE_URL, VIDEO_URL } from "@/utils/token";
import { PlatformIcon } from "@/components/ui";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

export default function ProfileFocusView() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  // Calculate photo height based on screen height (reactive to orientation changes)
  const photoHeight = useMemo(() => screenHeight * 0.55, [screenHeight]);

  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Android hardware back button handling
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      router.back();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetchOtherProfile(id as string);
        if (res?.success) {
          setProfile(res.data);
        } else {
          Toast.show({
            type: "error",
            text1: res?.msg || "Failed to load profile",
            position: "bottom",
          });
          router.back();
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        Toast.show({
          type: "error",
          text1: "Failed to load profile",
          position: "bottom",
        });
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProfile();
    }
  }, [id]);

  // Generate background color for initials
  const bgColor = useMemo(() => {
    const seed = profile?.id || profile?.ID || profile?.DisplayName || "";
    const index = Math.abs(
      seed.toString().split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % BACKGROUND_COLORS.length
    );
    return BACKGROUND_COLORS[index];
  }, [profile]);

  // Get initials
  const getInitials = () => {
    if (!profile?.DisplayName) return "?";
    const parts = profile.DisplayName.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
  };

  // Get image source
  const getImageSource = () => {
    if (profile?.Image) {
      const img = profile.Image.trim();
      if (img.startsWith("http://") || img.startsWith("https://")) return { uri: img };
      if (img.startsWith("uploads/")) return { uri: `${IMAGE_URL}${img}` };
      return { uri: `${VIDEO_URL}${img}` };
    }
    return null;
  };

  // Calculate age from DOB
  const calculateAge = (dob: string | undefined) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const hasBirthdayOccurred =
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
    if (!hasBirthdayOccurred) age--;
    return age;
  };

  // Handle match actions
  const handleAction = async (action: "like" | "pass" | "super_like") => {
    if (!profile?.ID && !profile?.id) return;
    
    // Haptic feedback based on action type
    if (action === "like" || action === "super_like") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    const userId = (profile.ID || profile.id) as string;
    setActionLoading(action);

    try {
      let res;
      switch (action) {
        case "like":
          res = await likeUser(userId);
          break;
        case "pass":
          res = await passUser(userId);
          break;
        case "super_like":
          res = await superLikeUser(userId);
          break;
      }

      if (res?.success) {
        // Success haptic for matches
        if (res.is_mutual) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        // Show success feedback
        const messages = {
          like: "Liked!",
          pass: "Passed",
          super_like: "Super Liked!",
        };
        
        Toast.show({
          type: action === "pass" ? "info" : "success",
          text1: messages[action],
          text2: res.is_mutual ? "It's a match! 🎉" : undefined,
          position: "top",
          visibilityTime: 1500,
        });

        // Go back after action
        setTimeout(() => router.back(), 800);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Toast.show({
          type: "error",
          text1: res?.msg || "Action failed",
          position: "bottom",
        });
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Something went wrong",
        position: "bottom",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const imageSource = getImageSource();
  const age = calculateAge(profile?.DOB);
  const interests = profile?.Interest?.split(",").slice(0, 5) || [];
  const location = [profile?.City, profile?.State].filter(Boolean).join(", ");

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B06D1E" />
      </View>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Toast />

      {/* Photo Section */}
      <View style={[styles.photoSection, { height: photoHeight }]}>
        {imageSource ? (
          <Image source={imageSource} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={[styles.initialsContainer, { backgroundColor: bgColor }]}>
            <Text style={styles.initialsText}>{getInitials()}</Text>
          </View>
        )}

        {/* Gradient overlay */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.7)"]}
          style={styles.photoGradient}
        />

        {/* Close button */}
        <TouchableOpacity
          style={[styles.closeButton, { top: insets.top + SPACING.sm }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          activeOpacity={0.7}
        >
          <PlatformIcon name="close" size={24} color="white" />
        </TouchableOpacity>

        {/* Profile info overlay */}
        <View style={[styles.photoOverlay, { bottom: SPACING.lg }]}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {profile.DisplayName || "Anonymous"}
              {age && <Text style={styles.age}>, {age}</Text>}
            </Text>
            {profile.livePicture && (
              <View style={styles.verifiedBadge}>
                <PlatformIcon name="check-circle" size={20} color="#3B82F6" />
              </View>
            )}
          </View>

          {location && (
            <View style={styles.locationRow}>
              <Image
                source={icons.mapMarker}
                style={styles.locationIcon}
                resizeMode="contain"
                tintColor="white"
              />
              <Text style={styles.locationText}>{location}</Text>
              {profile.distance_in_km && (
                <Text style={styles.distanceText}>
                  • {profile.distance_in_km.toFixed(1)} km away
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Info Section */}
      <ScrollView
        style={styles.infoSection}
        contentContainerStyle={styles.infoContent}
        showsVerticalScrollIndicator={false}
      >
        {/* About */}
        {profile.About && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.aboutText}>{profile.About}</Text>
          </View>
        )}

        {/* Interests */}
        {interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.interestsContainer}>
              {interests.map((interest, index) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestText}>
                    {interest.trim().charAt(0).toUpperCase() + interest.trim().slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Quick Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Info</Text>
          <View style={styles.quickInfoGrid}>
            {profile.Gender && (
              <View style={styles.quickInfoItem}>
                <Text style={styles.quickInfoLabel}>Gender</Text>
                <Text style={styles.quickInfoValue}>
                  {profile.Gender.charAt(0).toUpperCase() + profile.Gender.slice(1)}
                </Text>
              </View>
            )}
            {profile.Height && (
              <View style={styles.quickInfoItem}>
                <Text style={styles.quickInfoLabel}>Height</Text>
                <Text style={styles.quickInfoValue}>{Number(profile.Height).toFixed(1)} ft</Text>
              </View>
            )}
            {profile.HSign && (
              <View style={styles.quickInfoItem}>
                <Text style={styles.quickInfoLabel}>Zodiac</Text>
                <Text style={styles.quickInfoValue}>
                  {profile.HSign.charAt(0).toUpperCase() + profile.HSign.slice(1)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Spacer for action bar */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Action Bar */}
      <Animated.View
        entering={SlideInDown.springify()}
        style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 8) + 8 }]}
      >
        <View style={styles.actionButtons}>
          {/* Pass Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.passButton]}
            onPress={() => handleAction("pass")}
            disabled={actionLoading !== null}
            activeOpacity={0.7}
          >
            {actionLoading === "pass" ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <PlatformIcon name="close" size={24} color="#EF4444" />
            )}
          </TouchableOpacity>

          {/* Super Like Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.superLikeButton]}
            onPress={() => handleAction("super_like")}
            disabled={actionLoading !== null}
            activeOpacity={0.7}
          >
            {actionLoading === "super_like" ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <PlatformIcon name="star" size={18} color="#3B82F6" />
            )}
          </TouchableOpacity>

          {/* Like Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.likeButton]}
            onPress={() => handleAction("like")}
            disabled={actionLoading !== null}
            activeOpacity={0.7}
          >
            {actionLoading === "like" ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <PlatformIcon name="favorite" size={24} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  photoSection: {
    width: "100%",
    position: "relative",
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
  initialsText: {
    fontSize: 80,
    fontWeight: "bold",
    color: "white",
  },
  photoGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
  },
  closeButton: {
    position: "absolute",
    left: SPACING.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  photoOverlay: {
    position: "absolute",
    left: SPACING.lg,
    right: SPACING.lg,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    color: "white",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  age: {
    fontWeight: "400",
  },
  verifiedBadge: {
    marginLeft: SPACING.xs,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  locationIcon: {
    width: 14,
    height: 14,
    marginRight: SPACING.xxs,
  },
  locationText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
  },
  distanceText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginLeft: SPACING.xs,
  },
  infoSection: {
    flex: 1,
    backgroundColor: "white",
  },
  infoContent: {
    padding: SPACING.lg,
  },
  section: {
    marginBottom: VERTICAL_SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.bodySemibold,
    color: "#B06D1E",
    marginBottom: SPACING.sm,
  },
  aboutText: {
    ...TYPOGRAPHY.body,
    color: "#4B5563",
    lineHeight: 22,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  interestTag: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  interestText: {
    ...TYPOGRAPHY.caption1,
    color: "#92400E",
    fontWeight: "500",
  },
  quickInfoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },
  quickInfoItem: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 100,
  },
  quickInfoLabel: {
    ...TYPOGRAPHY.caption2,
    color: "#6B7280",
    marginBottom: 2,
  },
  quickInfoValue: {
    ...TYPOGRAPHY.subheadline,
    color: "#111827",
    fontWeight: "500",
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.lg,
  },
  actionButton: {
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  passButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: "#FECACA",
  },
  superLikeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
  },
  likeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#B06D1E",
  },
});
