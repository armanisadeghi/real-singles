import ProfileDetails from "@/components/ProfileDetails";
import SideMenu from "@/components/SidebarMenu";
import ProfileImageHeader from "@/components/ui/ProfileImageHeader";
import { icons } from "@/constants/icons";
import { getProfile } from "@/lib/api";
import { User } from "@/types";
import { IMAGE_URL, MEDIA_BASE_URL } from "@/utils/token";
import { PlatformIcon } from "@/components/ui";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from "expo-router";
import React, {
  useCallback,
  useMemo,
  useRef,
  useState
} from "react";
import {
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  View
} from "react-native";
import CircularProgress from "react-native-circular-progress-indicator";

export default function Profile() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [profile, setProfile] = useState<User | null>();
  const [currentSnapPointIndex, setCurrentSnapPointIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await getProfile();
      console.log("Profile data fetched successfully in profile screen:", res);
      if (res?.success) {
        setProfile(res?.data);
      } else {
        let err = res?.msg || "Failed to fetch profile details, Please try again later"
        setProfile(null);
        Alert.alert(err)
        console.log("Failed to fetch profile:", res?.msg);
      }
    } catch (error) {
      Alert.alert("There is some issue at our end. Please try again later")
      console.log("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  console.log("profile data->>>", profile)

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const snapPoints = useMemo(() => ["62%", "80%"], []);

  const handleSheetChanges = useCallback((index: number) => {
    setCurrentSnapPointIndex(index);
  }, []);

  if (loading) {
    return (
      <View className="w-full h-full flex items-center justify-center py-4">
        <ActivityIndicator size="large" color="#B06D1E" />
      </View>
    );
  }

  const getProfileImage = () => {
    if (profile?.Image) {
      const img = profile.Image.trim();
      
      // If it's already a full URL, use it directly
      if (img.startsWith("http://") || img.startsWith("https://")) {
        return { uri: img };
      }
      
      // Otherwise, prepend the appropriate base URL
      const finalUrl = img.startsWith("uploads/")
        ? IMAGE_URL + img
        : MEDIA_BASE_URL + img;

      return { uri: finalUrl };
    }

    if (profile?.livePicture) {
      const firstImage = profile.livePicture.split(",")[0].trim();
      
      // If it's already a full URL, use it directly
      if (firstImage.startsWith("http://") || firstImage.startsWith("https://")) {
        return { uri: firstImage };
      }
      
      // Otherwise, prepend the appropriate base URL
      const finalUrl = firstImage.startsWith("uploads/")
        ? IMAGE_URL + firstImage
        : MEDIA_BASE_URL + firstImage;

      return { uri: finalUrl };
    }

    return icons.placeholder;
  };



  return (
    <View className="flex-1 bg-background">
      <SideMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        userAvatar={profile?.Image}
        userName={profile?.DisplayName || "User"}
      />
      <ProfileImageHeader
        source={getProfileImage()}
        visibleHeight={300}
        overlayOpacity={0.2}
        topContent={
          <>
            <TouchableOpacity 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMenuVisible(true);
              }}
              className="border border-white rounded-lg p-2 bg-black/45"
            >
              <PlatformIcon name="menu" size={15} color="white" />
            </TouchableOpacity>
            <View className="flex-row gap-2 items-center">
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({
                    pathname: "/settings",
                    params: { profile: JSON.stringify(profile) },
                  });
                }}
                className="border border-white/50 rounded-lg p-1 bg-black/30"
              >
                <PlatformIcon name="settings" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({
                    pathname: "/editProfile",
                    params: { profile: JSON.stringify(profile) },
                  });
                }}
                className="border border-white/50 rounded-lg p-2 bg-black/30"
              >
                <PlatformIcon name="edit" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </>
        }
        bottomContent={
          <View className="flex-row justify-end">
            <View className="p-3 w-[60px] h-[60px] flex justify-center items-center border border-white rounded-[15px] bg-black/30">
              <CircularProgress
                value={85}
                radius={20}
                rotation={180}
                activeStrokeWidth={6}
                inActiveStrokeWidth={6}
                activeStrokeColor="#E38F28"
                inActiveStrokeColor={"#fff"}
                progressValueColor={"#efc959ec"}
                valueSuffix={"%"}
              />
            </View>
          </View>
        }
      />
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        index={currentSnapPointIndex}
        enablePanDownToClose={false}
        enableContentPanningGesture={true}
        onChange={handleSheetChanges}
      >
        <BottomSheetScrollView>
          {profile ? (
            <ProfileDetails profile={profile} me={true} />
          ) : (
            <View style={{ padding: 20, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#B06D1E" />
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}
