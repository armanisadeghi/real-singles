import NotificationBell from "@/components/NotificationBell";
import ProfileDetails from "@/components/ProfileDetails";
import { PlatformIcon } from "@/components/ui";
import ProfileImageHeader from "@/components/ui/ProfileImageHeader";
import { BACKGROUND_COLORS } from "@/components/ui/ProfileCard";
import { icons } from "@/constants/icons";
import { fetchOtherProfile } from "@/lib/api";
import { User } from "@/types";
import { IMAGE_URL, VIDEO_URL } from "@/utils/token";
import * as Haptics from "expo-haptics";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useNavigationState } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Animated, { useSharedValue, withSpring, useAnimatedStyle, withSequence } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function ProfileDetail() {
  const navState = useNavigationState((state) => state);
  const canGoBack = navState?.routes?.length > 1;
  const insets = useSafeAreaInsets();

  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [profile, setProfile] = useState<User>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const retryScale = useSharedValue(1);

  // Android hardware back button handling
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack) {
        router.back();
      } else {
        router.replace("/(tabs)");
      }
      return true;
    });
    return () => backHandler.remove();
  }, [canGoBack]);
  // const [loadfollow, setLoadfollow] = useState(false);
  // const [isFollowing, setIsFollowing] = useState(false);



  const fetchProfile = async (id: string) => {
    // setLoading(true);
     setError(null);
    try {
      console.log("id: ", id);

      const res = await fetchOtherProfile(id as string);
      console.log("Profile data fetched:", res);
      if (res?.success) {
        setProfile(res?.data);
      } else {
        const errorMsg = res?.msg || "Profile unavailable";
        setError(errorMsg);
        Toast.show({
          type: "error",
          text1: errorMsg,
          position: "bottom",
          visibilityTime: 2000,
          autoHide: true,
        });
        console.log("Failed to fetch profile:", res?.msg);
      }
    } catch (err) {
      console.error("Error fetching profile data:", err instanceof Error ? err.message : String(err));
      const errorMsg = "An error occurred while fetching profile data";
      setError(errorMsg);
      Toast.show({
        type: "error",
        text1: errorMsg,
        position: "top",
        swipeable: true,
        visibilityTime: 4000,
        autoHide: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile(id as string);
  }, [id]);

  const bgColor = useMemo(() => {
    const seed = profile?.id || profile?.ID || profile?.DisplayName || "";
    const index = Math.abs(
      seed
        .toString()
        .split("")
        .reduce((acc, char) => {
          return acc + char.charCodeAt(0);
        }, 0) % BACKGROUND_COLORS.length
    );
    return BACKGROUND_COLORS[index];
  }, [profile]);

  const getInitial = () => {


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

  const displayContent = () => {

    if (profile?.Image) {
      const img = profile.Image.trim();
      
      // If it's already a full URL, use it directly
      if (img.startsWith("http://") || img.startsWith("https://")) {
        return {
          type: "image",
          source: { uri: img },
        };
      }
      
      // Otherwise, prepend the appropriate base URL
      if (img.startsWith("uploads/")) {
        return {
          type: "image",
          source: { uri: `${IMAGE_URL}${img}` },
        };
      } else {
        return {
          type: "image",
          source: { uri: `${VIDEO_URL}${img}` },
        };
      }
    }

    // Return initials with background color
    return {
      type: "initials",
      initials: getInitial(),
      bgColor: bgColor,
    };
  };

  const content = displayContent();



  const handleRetry = () => {
    // Haptic feedback for retry action
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Animate the retry button with M3 Expressive spring config
    retryScale.value = withSequence(
      withSpring(0.8, { damping: 20, stiffness: 300 }),
      withSpring(1, { damping: 20, stiffness: 300 })
    );

    // Fetch the profile again
    fetchProfile(id as string);
  };

  const retryAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: retryScale.value }],
  }));

  //change this function
  // const handleFollow = async () => {
  //   try {
  //     setLoadfollow(true);
  //     const res = await followUser(id as string);
  //     console.log("follow user res", res);

  //     if (res?.success) {
  //       // Toggle follow state
  //       setIsFollowing((prev) => !prev);
  //     } else {
  //       Toast.show({
  //         type: "error",
  //         text1: res?.msg || "Failed to follow user",
  //         position: "bottom",
  //         visibilityTime: 2000,
  //         autoHide: true,
  //       });
  //     }
  //   } catch (error) {
  //     Toast.show({
  //       type: "error",
  //       text1: "An error occurred while following user",
  //       position: "bottom",
  //       visibilityTime: 2000,
  //       autoHide: true,
  //     });
  //     console.log("something wrong while following user", error);
  //   } finally {
  //     setLoadfollow(false);
  //   }
  // };


  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => ["62%", "80%"], []);


  if (loading) {
    return (
      <View className="w-full h-full flex items-center justify-center py-4">
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Toast />
        <View
          className="bg-white flex-row justify-between items-center px-4 pt-10 pb-6 rounded-b-xl z-30"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 16,
            elevation: 5,
          }}
        >
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="border border-gray rounded-lg flex justify-center items-center w-8 h-8"
            >
              <PlatformIcon name="chevron-left" size={16} color="#000" />
            </TouchableOpacity>
            <Text className="leading-[22px] text-dark text-base font-medium tracking-[-0.41px]">
              Profile
            </Text>
          </View>

          <NotificationBell />
        </View>

        <View style={styles.errorContent}>
          <PlatformIcon name="error-outline" size={80} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorMessage}>{error}</Text>

          <Animated.View
            style={[
              styles.retryButtonContainer,
              retryAnimatedStyle,
            ]}
          >
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
              activeOpacity={0.8}
            >
              <PlatformIcon name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity 
            style={styles.goBackButton} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Text style={styles.goBackText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Get image URI for ProfileImageHeader
  const getImageUri = () => {
    if (!profile?.Image) return null;
    const img = profile.Image.trim();
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    if (img.startsWith('uploads/')) return IMAGE_URL + img;
    return VIDEO_URL + img;
  };

  const imageUri = getImageUri();

  // Header buttons component (shared between image and initials views)
  const headerButtons = (
    <>
      <View className="flex-row gap-2 items-center">
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (canGoBack) {
              router.back();
            } else {
              router.replace("/(tabs)");
            }
          }}
          className="border border-white rounded-lg p-2 px-3 bg-white"
        >
          <PlatformIcon name="chevron-left" size={16} color="#1D2733" />
        </TouchableOpacity>
        <Text className="text-base tracking-[-0.41px] font-medium text-white drop-shadow-sm">
          Profile
        </Text>
      </View>
      <NotificationBell />
    </>
  );

  return (
    <View className="flex-1 bg-background">
      <Toast />
      {profile && imageUri ? (
        <ProfileImageHeader
          source={{ uri: imageUri }}
          visibleHeight={300}
          overlayOpacity={0.1}
          topContent={headerButtons}
        />
      ) : (
        <ProfileImageHeader
          source={icons.placeholder}
          visibleHeight={300}
          showTopGradient={false}
          showBottomGradient={false}
          overlayOpacity={0}
          topContent={headerButtons}
          style={{ backgroundColor: content.bgColor }}
        >
          {/* Initials overlay */}
          <View style={styles.initialsOverlay}>
            <View style={styles.initialsCircle}>
              <Text style={styles.initialsText}>{content.initials}</Text>
            </View>
          </View>
        </ProfileImageHeader>
      )}
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        index={0}
        enablePanDownToClose={false}
        enableContentPanningGesture={true}
      >
        <BottomSheetView  style={{ backgroundColor: "transparent" }}> 
          {profile && (
            <ProfileDetails
              profile={profile}
              me={false}
              fetchProfile={() => fetchProfile(id as string)}
              // handleFollow={handleFollow}
              // loadfollow={loadfollow}
              // isFollowing={isFollowing} //add this
            />
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: "#333333",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
  },
  errorContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333333",
    marginTop: 24,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: "center",
    color: "#666666",
    marginBottom: 32,
    lineHeight: 22,
  },
  retryButtonContainer: {
    width: "100%",
    maxWidth: 200,
  },
  retryButton: {
    flexDirection: "row",
    backgroundColor: "#B06D1E",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  goBackButton: {
    marginTop: 16,
    padding: 12,
  },
  goBackText: {
    color: "#666666",
    fontSize: 14,
  },
  initialsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  initialsCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  initialsText: {
    fontSize: 72,
    fontWeight: "bold",
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
