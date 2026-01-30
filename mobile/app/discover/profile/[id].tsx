/**
 * DiscoveryProfileView - Full Profile View for Matching
 * 
 * An immersive profile view designed for the discovery/matching flow.
 * Shows photo carousel, rich profile content, and action buttons.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  PlatformColor,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { PlatformIcon } from "@/components/ui";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { useThemeColors } from "@/context/ThemeContext";

import PhotoCarousel from "@/components/ui/PhotoCarousel";
import ProfileSectionRenderer from "@/components/profile/ProfileSectionRenderer";
import { fetchOtherProfile, likeUser, passUser, superLikeUser, reportUser } from "@/lib/api";
import { User } from "@/types";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY, VERTICAL_SPACING } from "@/constants/designTokens";
import { IMAGE_URL, VIDEO_URL } from "@/utils/token";

// Helper to get image URLs from profile
const getProfileImages = (profile: User, gallery?: any[]): string[] => {
  const images: string[] = [];
  
  // Add main profile image
  if (profile?.Image) {
    images.push(profile.Image);
  } else if (profile?.livePicture) {
    images.push(profile.livePicture);
  }
  
  // Add gallery images - filter out primary since it's already added as profile.Image
  if (gallery && gallery.length > 0) {
    gallery
      .filter((item) => item.media_type === "image" && !item.is_primary)
      .forEach((item) => {
        if (item.media_url) {
          images.push(item.media_url);
        }
      });
  }
  
  return images;
};

export default function DiscoveryProfileView() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useThemeColors();

  // Colors for regular Views - PlatformColor works here
  const viewColors = useMemo(() => ({
    background: Platform.OS === 'ios' ? PlatformColor('systemBackground') : colors.background,
    secondaryBackground: Platform.OS === 'ios' ? PlatformColor('secondarySystemBackground') : colors.surfaceContainer,
    text: Platform.OS === 'ios' ? PlatformColor('label') : colors.onSurface,
    secondaryText: Platform.OS === 'ios' ? PlatformColor('secondaryLabel') : colors.onSurfaceVariant,
    separator: Platform.OS === 'ios' ? PlatformColor('separator') : colors.outlineVariant,
  }), [colors]);

  // Colors for Reanimated Animated.View - must be actual strings, not PlatformColor objects
  // Reanimated cannot process PlatformColor native objects
  const animatedColors = useMemo(() => ({
    separator: isDark ? '#38383A' : '#C6C6C8', // iOS opaque separator equivalents
    actionBarBg: isDark ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
  }), [isDark]);
  
  // Calculate visible photo height (below safe area)
  // PhotoCarousel will add safe area inset to this for total height
  const visiblePhotoHeight = useMemo(() => screenHeight * 0.50, [screenHeight]);
  
  const [profile, setProfile] = useState<User | null>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showReportSheet, setShowReportSheet] = useState(false);
  
  // Animation for action buttons
  const passScale = useSharedValue(1);
  const superLikeScale = useSharedValue(1);
  const likeScale = useSharedValue(1);
  
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
    const loadProfile = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const res = await fetchOtherProfile(id as string);
        if (res?.success) {
          setProfile(res.data);
          setGallery(res.data?.gallery || []);
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
    
    loadProfile();
  }, [id]);
  
  // Get images for carousel
  const images = useMemo(() => {
    if (!profile) return [];
    return getProfileImages(profile, gallery);
  }, [profile, gallery]);
  
  // Handle action with haptic feedback
  const handleAction = useCallback(async (action: "like" | "pass" | "super_like") => {
    if (!profile?.ID && !profile?.id) return;
    
    const userId = (profile.ID || profile.id) as string;
    setActionLoading(action);
    
    // Haptic feedback
    if (Platform.OS !== "web") {
      Haptics.impactAsync(
        action === "super_like" 
          ? Haptics.ImpactFeedbackStyle.Heavy 
          : Haptics.ImpactFeedbackStyle.Medium
      );
    }
    
    // Animate button with M3 Expressive spring config
    const scaleRef = action === "like" ? likeScale : action === "pass" ? passScale : superLikeScale;
    scaleRef.value = withSpring(0.8, { damping: 20, stiffness: 300 });
    setTimeout(() => {
      scaleRef.value = withSpring(1, { damping: 20, stiffness: 300 });
    }, 100);
    
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
        
        // Navigate back after short delay
        setTimeout(() => router.back(), 800);
      } else {
        Toast.show({
          type: "error",
          text1: res?.msg || "Action failed",
          position: "bottom",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Something went wrong",
        position: "bottom",
      });
    } finally {
      setActionLoading(null);
    }
  }, [profile, router, likeScale, passScale, superLikeScale]);
  
  // Handle report
  const handleReport = useCallback(async (reason: string) => {
    if (!profile?.ID && !profile?.id) return;
    
    const userId = (profile.ID || profile.id) as string;
    
    try {
      const res = await reportUser(userId, reason);
      if (res?.success) {
        Toast.show({
          type: "success",
          text1: "Report submitted",
          text2: "We'll review this profile",
          position: "bottom",
        });
        setShowReportSheet(false);
      } else {
        Toast.show({
          type: "error",
          text1: res?.msg || "Failed to submit report",
          position: "bottom",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to submit report",
        position: "bottom",
      });
    }
  }, [profile]);
  
  // Animated styles for buttons
  const passAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: passScale.value }],
  }));
  
  const superLikeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: superLikeScale.value }],
  }));
  
  const likeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));
  
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: viewColors.background }]}>
        <ActivityIndicator size="large" color="#B06D1E" />
      </View>
    );
  }
  
  if (!profile) {
    return null;
  }
  
  return (
    <View style={[styles.container, { backgroundColor: viewColors.background }]}>
      <Toast />
      
      {/* Main scrollable content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Photo Carousel */}
        <View style={styles.photoSection}>
          <PhotoCarousel
            images={images}
            height={visiblePhotoHeight}
            showGradient={true}
            showTopGradient={true}
            compensateSafeArea={true}
          />
          
          {/* Header overlay */}
          <View style={[styles.headerOverlay, { paddingTop: insets.top + 10 }]}>
            {/* Back button */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={styles.headerButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <PlatformIcon name="chevron-left" size={24} color="white" />
            </Pressable>
            
            {/* Report button */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowReportSheet(true);
              }}
              style={styles.headerButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <PlatformIcon name="flag" size={22} color="white" />
            </Pressable>
          </View>
        </View>
        
        {/* Profile Content */}
        <ProfileSectionRenderer profile={profile} />
      </ScrollView>
      
      {/* Fixed Action Bar - Compact native-style */}
      <Animated.View
        entering={SlideInDown.springify()}
        style={[
          styles.actionBar,
          { 
            paddingBottom: Math.max(insets.bottom, 8) + 8,
            backgroundColor: animatedColors.actionBarBg,
            borderTopColor: animatedColors.separator,
          },
        ]}
      >
        {/* Pass Button */}
        <Animated.View style={passAnimatedStyle}>
          <Pressable
            onPress={() => handleAction("pass")}
            disabled={actionLoading !== null}
            style={[styles.actionButton, styles.passButton, { backgroundColor: viewColors.background }]}
          >
            {actionLoading === "pass" ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <PlatformIcon name="close" size={24} color="#EF4444" />
            )}
          </Pressable>
        </Animated.View>
        
        {/* Super Like Button */}
        <Animated.View style={superLikeAnimatedStyle}>
          <Pressable
            onPress={() => handleAction("super_like")}
            disabled={actionLoading !== null}
            style={[styles.actionButton, styles.superLikeButton, { backgroundColor: viewColors.background }]}
          >
            {actionLoading === "super_like" ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <PlatformIcon name="star" size={18} color="#3B82F6" />
            )}
          </Pressable>
        </Animated.View>
        
        {/* Like Button */}
        <Animated.View style={likeAnimatedStyle}>
          <Pressable
            onPress={() => handleAction("like")}
            disabled={actionLoading !== null}
            style={[styles.actionButton, styles.likeButton]}
          >
            {actionLoading === "like" ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <PlatformIcon name="favorite" size={24} color="white" />
            )}
          </Pressable>
        </Animated.View>
      </Animated.View>
      
      {/* Report Sheet (Simple modal for now) */}
      {showReportSheet && (
        <View style={styles.reportOverlay}>
          <Pressable
            style={styles.reportBackdrop}
            onPress={() => setShowReportSheet(false)}
          />
          <View style={[styles.reportSheet, { paddingBottom: insets.bottom + 20, backgroundColor: viewColors.background }]}>
            <View style={[styles.reportHandle, { backgroundColor: viewColors.separator }]} />
            <Text style={[styles.reportTitle, { color: viewColors.text }]}>Report this profile</Text>
            <Text style={[styles.reportSubtitle, { color: viewColors.secondaryText }]}>
              Why are you reporting {profile.DisplayName || "this user"}?
            </Text>
            
            {[
              "Inappropriate photos",
              "Fake profile",
              "Harassment",
              "Spam",
              "Other",
            ].map((reason) => (
              <Pressable
                key={reason}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleReport(reason);
                }}
                style={[styles.reportOption, { borderBottomColor: viewColors.separator }]}
              >
                <Text style={[styles.reportOptionText, { color: viewColors.text }]}>{reason}</Text>
                <PlatformIcon name="chevron-right" size={20} color={viewColors.secondaryText} />
              </Pressable>
            ))}
            
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowReportSheet(false);
              }}
              style={styles.reportCancel}
            >
              <Text style={[styles.reportCancelText, { color: viewColors.secondaryText }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor applied inline with viewColors.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor applied inline with viewColors.background
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  photoSection: {
    position: "relative",
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    // backgroundColor and borderTopColor applied inline with dark mode support
    borderTopWidth: StyleSheet.hairlineWidth,
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
    // backgroundColor applied inline with viewColors.background
    borderWidth: 1.5,
    borderColor: "#FECACA", // Semantic red border - keeps visibility in both modes
  },
  superLikeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    // backgroundColor applied inline with viewColors.background
    borderWidth: 1.5,
    borderColor: "#BFDBFE", // Semantic blue border - keeps visibility in both modes
  },
  likeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#B06D1E",
  },
  reportOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    zIndex: 100,
  },
  reportBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  reportSheet: {
    // backgroundColor applied inline with viewColors.background
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
  },
  reportHandle: {
    width: 40,
    height: 4,
    // backgroundColor applied inline with viewColors.separator
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: SPACING.lg,
  },
  reportTitle: {
    ...TYPOGRAPHY.h3,
    // color applied inline with viewColors.text
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  reportSubtitle: {
    ...TYPOGRAPHY.subheadline,
    // color applied inline with viewColors.secondaryText
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  reportOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    // borderBottomColor applied inline with viewColors.separator
  },
  reportOptionText: {
    ...TYPOGRAPHY.body,
    // color applied inline with viewColors.text
  },
  reportCancel: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  reportCancelText: {
    ...TYPOGRAPHY.bodySemibold,
    // color applied inline with viewColors.secondaryText
  },
});
