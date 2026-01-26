/**
 * DiscoveryProfileView - Full Profile View for Matching
 * 
 * An immersive profile view designed for the discovery/matching flow.
 * Shows photo carousel, rich profile content, and action buttons.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Toast from "react-native-toast-message";

import PhotoCarousel from "@/components/ui/PhotoCarousel";
import ProfileSectionRenderer from "@/components/profile/ProfileSectionRenderer";
import { fetchOtherProfile, likeUser, passUser, superLikeUser, reportUser } from "@/lib/api";
import { User } from "@/types";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY, VERTICAL_SPACING } from "@/constants/designTokens";
import { IMAGE_URL, VIDEO_URL } from "@/utils/token";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const PHOTO_HEIGHT = SCREEN_HEIGHT * 0.55;

// Helper to get image URLs from profile
const getProfileImages = (profile: User, gallery?: any[]): string[] => {
  const images: string[] = [];
  
  // Add main profile image
  if (profile?.Image) {
    images.push(profile.Image);
  } else if (profile?.livePicture) {
    images.push(profile.livePicture);
  }
  
  // Add gallery images
  if (gallery && gallery.length > 0) {
    gallery
      .filter((item) => item.media_type === "image")
      .forEach((item) => {
        if (item.media_url && !images.includes(item.media_url)) {
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
  
  const [profile, setProfile] = useState<User | null>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showReportSheet, setShowReportSheet] = useState(false);
  
  // Animation for action buttons
  const passScale = useSharedValue(1);
  const superLikeScale = useSharedValue(1);
  const likeScale = useSharedValue(1);
  
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
    
    // Animate button
    const scaleRef = action === "like" ? likeScale : action === "pass" ? passScale : superLikeScale;
    scaleRef.value = withSpring(0.8, { damping: 10 });
    setTimeout(() => {
      scaleRef.value = withSpring(1, { damping: 10 });
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
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
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
            height={PHOTO_HEIGHT}
            showGradient={true}
          />
          
          {/* Header overlay */}
          <View style={[styles.headerOverlay, { paddingTop: insets.top + 10 }]}>
            {/* Close button */}
            <Pressable
              onPress={() => router.back()}
              style={styles.headerButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="white" />
            </Pressable>
            
            {/* Report button */}
            <Pressable
              onPress={() => setShowReportSheet(true)}
              style={styles.headerButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="flag-outline" size={22} color="white" />
            </Pressable>
          </View>
        </View>
        
        {/* Profile Content */}
        <ProfileSectionRenderer profile={profile} />
      </ScrollView>
      
      {/* Fixed Action Bar */}
      <Animated.View
        entering={SlideInDown.springify()}
        style={[
          styles.actionBar,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        {/* Pass Button */}
        <Animated.View style={passAnimatedStyle}>
          <Pressable
            onPress={() => handleAction("pass")}
            disabled={actionLoading !== null}
            style={[styles.actionButton, styles.passButton]}
          >
            {actionLoading === "pass" ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Ionicons name="close" size={32} color="#EF4444" />
            )}
          </Pressable>
        </Animated.View>
        
        {/* Super Like Button */}
        <Animated.View style={superLikeAnimatedStyle}>
          <Pressable
            onPress={() => handleAction("super_like")}
            disabled={actionLoading !== null}
            style={[styles.actionButton, styles.superLikeButton]}
          >
            {actionLoading === "super_like" ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <Ionicons name="star" size={24} color="#3B82F6" />
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
              <Ionicons name="heart" size={32} color="white" />
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
          <View style={[styles.reportSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.reportHandle} />
            <Text style={styles.reportTitle}>Report this profile</Text>
            <Text style={styles.reportSubtitle}>
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
                onPress={() => handleReport(reason)}
                style={styles.reportOption}
              >
                <Text style={styles.reportOptionText}>{reason}</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </Pressable>
            ))}
            
            <Pressable
              onPress={() => setShowReportSheet(false)}
              style={styles.reportCancel}
            >
              <Text style={styles.reportCancelText}>Cancel</Text>
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
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
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
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  actionButton: {
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  passButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#FEE2E2",
  },
  superLikeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#DBEAFE",
  },
  likeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
  },
  reportHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: SPACING.lg,
  },
  reportTitle: {
    ...TYPOGRAPHY.h3,
    color: "#111827",
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  reportSubtitle: {
    ...TYPOGRAPHY.subheadline,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  reportOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  reportOptionText: {
    ...TYPOGRAPHY.body,
    color: "#374151",
  },
  reportCancel: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  reportCancelText: {
    ...TYPOGRAPHY.bodySemibold,
    color: "#6B7280",
  },
});
