import ProfileDetails from "@/components/ProfileDetails";
import SideMenu from "@/components/SidebarMenu";
import { icons } from "@/constants/icons";
import { getProfile } from "@/lib/api";
import { User } from "@/types";
import { IMAGE_URL, MEDIA_BASE_URL } from "@/utils/token";
import { AntDesign } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
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
  Image,
  ImageBackground,
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
      const finalUrl = img.startsWith("uploads/")
        ? IMAGE_URL + img
        : MEDIA_BASE_URL + img;

      return { uri: finalUrl };
    }

    if (profile?.livePicture) {
      const firstImage = profile.livePicture.split(",")[0].trim();
      const finalUrl = firstImage.startsWith("uploads/")
        ? IMAGE_URL + firstImage
        : MEDIA_BASE_URL + firstImage;

      return { uri: finalUrl };
    }

    return icons.placeholder;
  };



  return (
    <View className="flex-1 bg-backgground">
      <SideMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        userAvatar={
          profile?.Image
            ? { uri: MEDIA_BASE_URL + profile.Image }
            : icons.ic_user
        }
        userName={profile?.DisplayName || ""}
      />
      <ImageBackground
        className="h-[347px]"
        source={getProfileImage()}
        resizeMode="cover"
      >
        <View className={`absolute inset-0 bg-black/20`} />
        <View className="flex-row justify-between items-start px-3 mt-16">
           <TouchableOpacity onPress={() => setMenuVisible(true)}
            className="border border-white rounded-lg p-2 bg-black/45"
          >
            <Image source={icons.menu} className="size-[15px]" />
          </TouchableOpacity>
          <View className="flex-row gap-2 items-center">
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/settings",
                  params: { profile: JSON.stringify(profile) },
                })
              }
              className="border border-border rounded-lg p-1"
            >
              <AntDesign name="setting" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/editProfile",
                  params: { profile: JSON.stringify(profile) },
                })
              }
              className="border border-border rounded-lg p-2"
            >
              <Image source={icons.edit} />
            </TouchableOpacity>
          </View>
        </View>
        <View className="flex-row justify-between items-start px-3 mt-40">
          <View className="flex-1"></View>
          <View className="">
            <View className="p-3 w-[60px] h-[60px] flex justify-center items-center border border-white rounded-[15px]">
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
        </View>
      </ImageBackground>
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
