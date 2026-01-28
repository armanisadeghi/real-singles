import { icons } from "@/constants/icons";
import { saveLink, toggleFavorite } from "@/lib/api";
import { getProfileLink, APP_NAME } from "@/lib/config";
import { User } from "@/types";
import { removeToken } from "@/utils/token";
import { PlatformIcon } from "@/components/ui";
import { useThemeColors } from "@/context/ThemeContext";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  PlatformColor,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";
import Toast from "react-native-toast-message";
import LinearBg from "./LinearBg";


export default function ProfileDetails({
  profile,
  me,
  fetchProfile,
  handleFollow,
  loadfollow,
  isFollowing
}: {
  profile: User;
  me: boolean;
  fetchProfile?: any;
  handleFollow?: () => void;
  loadfollow?: boolean;
  isFollowing?: boolean; //add this
}) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const [loadingLogout, setLoadingLogout] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useThemeColors();

  const themedColors = {
    background: Platform.OS === 'ios' ? (PlatformColor('systemBackground') as unknown as string) : colors.background,
    text: Platform.OS === 'ios' ? (PlatformColor('label') as unknown as string) : colors.onSurface,
    secondaryText: Platform.OS === 'ios' ? (PlatformColor('secondaryLabel') as unknown as string) : colors.onSurfaceVariant,
    border: Platform.OS === 'ios' ? (PlatformColor('separator') as unknown as string) : colors.outline,
  };

console.log("profile?.Height",profile?.Height);

  const interests = profile?.Interest?.split(",") || [];
  const horoscopes = profile?.HSign?.split(",") || [];
  console.log("profile in ProfileDetails:", profile);
   

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await removeToken();
    router.replace("/(auth)/login");
  };

  const capitalizeWords = (str: any) => {
    if (!str) return "";
    return str
      .split(" ")
      .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };


  const handleAddFav = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const data = new FormData();
    data.append("OtherID", profile?.ID);
    data.append("Status", profile?.IsFavorite === 1 ? "0" : "1");
    try {
      const res = await toggleFavorite(data);
      console.log("Add to favorites response:", res);

      if (res?.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        console.log(res?.msg || "Added to favorites");
        fetchProfile();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Toast.show({
          type: "error",
          text1: res?.msg || "Failed to add to favorites",
          position: "bottom",
          visibilityTime: 2000,
          autoHide: true,
        });
        console.log("Failed to add to favorites:", res?.msg);
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.log("Error adding to favorites:", error);
    }
  };



  function calculateAge(dob: any): number {
    const birthDate = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();

    // Check if the birthday has not occurred yet this year
    const hasBirthdayOccurred =
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

    if (!hasBirthdayOccurred) {
      age--;
    }

    return age;
  }
  //  console.log("profile?.ID in profile details:", profile);

  const handleReferFriend = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      // Build the deep link URL
      const deepLinkUrl = getProfileLink(profile?.ID || '');

      // Share message text (without URL for iOS, with URL for Android)
      const shareMessage = `Hi there! ${APP_NAME} has helped me meet some wonderful people. Here's a profile I thought you might like. You can connect with it directly on the ${APP_NAME} App!`;

      // On iOS, pass URL separately for better link preview support
      // On Android, include URL in the message
      const result = await Share.share(
        Platform.OS === 'ios'
          ? {
              message: shareMessage,
              url: deepLinkUrl,
            }
          : {
              title: `Join the ${APP_NAME} App!`,
              message: `${shareMessage}\n${deepLinkUrl}`,
            }
      );

      if (result.action === Share.sharedAction) {
        console.log(result.activityType ? `Shared via: ${result.activityType}` : "Shared successfully");
        // Save the share with full message including URL
        saveShareLinks(`${shareMessage}\n${deepLinkUrl}`);

      } else if (result.action === Share.dismissedAction) {
        console.log("Share dismissed");
      }
    } catch (error) {
      console.error("Error sharing profile:", error);
      Alert.alert("Oops!", "Something went wrong while sharing. Please try again.");
    }
  };

  const saveShareLinks =async (message: string)=>{
    try {
      const formData = new FormData();
      formData.append("receiverID", '12');
      formData.append("msg", message);
      formData.append("type", 'ShareLink');

      console.log("formdata in login:", formData);
      

      const res = await saveLink(formData);
      console.log("Login response:", res);

      if (res?.success) {
       console.log("Link share successful");
      } else {
        console.log("Link share failed");
      }
    } catch (error) {
      console.error("Link share error:", error);
    } 
  }

  return (

    <ScrollView 
      className="px-4 mt-2"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        flexGrow: 1, // fill the screen
      }}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >

      <Toast />
      <View className="flex-row items-start justify-between py-2">
        <View className="space-y-2">
          <Text className="font-bold text-[20px] text-dark">
            {profile?.DisplayName}
          </Text>

          <Text className="font-normal text-[14px] mb-2" style={{ color: themedColors.secondaryText }}>
            {profile?.Email}
          </Text>

          {/* City/State + Distance Row */}
          <View className="flex-row items-center gap-3">
            {/* City, State */}
             {profile?.City && profile?.State && (
                <Text className="font-normal text-[13px]" style={{ color: themedColors.secondaryText }}>
                  {profile.City}, {profile.State}
                </Text>
              )}

               {/* Distance */}
              {profile?.distance_in_km !== undefined && (
                <Text className="font-medium text-[12px]" style={{ color: themedColors.secondaryText }}>
               • {Number(profile.distance_in_km).toFixed(1)} km away
                </Text>
              )}

          </View>
        </View>
        <View className="flex-row items-center gap-2">
          {!me &&
           <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({
                pathname: "/appGallery",
                params:{otherUserID: profile?.ID}
              });
            }}
            className={`border border-[#C07618] rounded-lg overflow-hidden flex justify-center items-center w-8 h-8 bg-primary`}
          >
            <PlatformIcon
              name="image"
              size={18}
              color="white"
            />
          </TouchableOpacity>}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              me
                ? router.push("/(tabs)/chats")
                :
                router.push({
                  pathname: "/chat/[userid]",
                  params: {
                    userid: profile?.ID || "",
                    name: `${profile?.FirstName || ""} ${profile?.LastName || ""}`,
                    image: profile?.Image || "",
                    online: "false",
                    time: "Few min ago",
                  },
                });
            }}
            className="border border-[#C07618] rounded-lg overflow-hidden flex justify-center items-center w-8 h-8 bg-primary"
          >
            <LinearBg className="w-full h-full flex justify-center items-center">
              <Image
                source={icons.chats}
                tintColor="#ffffff"
                resizeMode="contain"
                className="size-4"
              />
            </LinearBg>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              me ? router.push("/(tabs)/favorites") : handleAddFav()
            }
            className={`border border-[#C07618] rounded-lg overflow-hidden flex justify-center items-center w-8 h-8 ${profile?.IsFavorite === 1 ? "bg-primary" : ""
              }`}
          >
            {profile?.IsFavorite === 1 ? (
              <LinearBg className="w-full h-full flex justify-center items-center">
                <Image
                  source={icons.heart}
                  tintColor="#ffffff"
                  resizeMode="contain"
                  className="size-4"
                />
              </LinearBg>
            ) : (
              <Image
                source={icons.heart}
                tintColor="#000000"
                resizeMode="contain"
                className="size-4"
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View className="mt-[16px]">
        <Text className="text-base mb-2 text-primary font-medium">About: </Text>
        <View>
          <Text
            numberOfLines={expanded ? undefined : 3}
            className="text-[12px] font-normal leading-5"
            style={{ color: themedColors.secondaryText }}
          >
            {profile?.About || "No information available."}
          </Text>

          {profile?.About && profile?.About.length > 120 && (
            <TouchableOpacity
              onPress={() => setExpanded(!expanded)}
              className="mt-1"
            >
              <Text className="text-[12px] text-primary font-normal leading-3 underline">
                {expanded ? "Read less" : "Read more"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className="mt-[18px]">
        <Text className="text-base mb-2 text-primary font-medium">
          Interests:{" "}
        </Text>
        <View className="flex-row items-center justify-start gap-3 flex-wrap">
          {profile?.Interest &&
            interests.map((interest, index) => (
              <View
                key={index}
                className="flex-row items-center justify-center gap-2 bg-light-100 border border-border py-[6px] px-3 rounded-[50px]"
              >
                <Text className="font-medium text-[10px] text-dark">
                  {interest.charAt(0).toUpperCase() +
                    interest.slice(1, interest.length)}
                </Text>
              </View>
            ))}
        </View>
      </View>

      {me && (
        <View className="mt-[18px]">
          <Text className="text-base mb-2 text-primary font-medium">
            Horoscope:{" "}
          </Text>
          <View className="flex-row items-center justify-start gap-3 flex-wrap">
            {profile?.HSign &&
              horoscopes.map((horoscope, index) => (
                <View
                  key={index}
                  className="flex-row items-center justify-center gap-2 bg-light-100 border border-border py-[6px] px-3 rounded-[50px]"
                >
                  <Text className="font-medium text-[10px] text-dark">
                    {horoscope.charAt(0).toUpperCase() +
                      horoscope.slice(1, horoscope.length)}
                  </Text>
                </View>
              ))}
          </View>
        </View>
      )}

      {/* Details Section - matches web */}
      <View className="mt-[18px]">
        <Text className="text-base mb-2 text-primary font-medium">
          Details
        </Text>
        <View className="flex-col gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs leading-5 font-normal" style={{ color: themedColors.secondaryText }}>
              Gender
            </Text>
            <Text className="text-dark leading-5 text-xs font-normal">
              {capitalizeWords(profile?.Gender) || "N/A"}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-xs leading-5 font-normal" style={{ color: themedColors.secondaryText }}>
              Age
            </Text>
            <Text className="text-dark leading-5 text-xs font-normal">
              {calculateAge(profile?.DOB)} Yrs
            </Text>
          </View>
          {profile?.Height && (
            <View className="flex-row items-center justify-between">
              <Text className="text-xs leading-5 font-normal" style={{ color: themedColors.secondaryText }}>
                Height
              </Text>
              <Text className="text-dark leading-5 text-xs font-normal">
                {Number(profile.Height).toFixed(1)} ft
              </Text>
            </View>
          )}
          {profile?.BodyType && (
            <View className="flex-row items-center justify-between">
              <Text className="text-xs leading-5 font-normal" style={{ color: themedColors.secondaryText }}>
                Body Type
              </Text>
              <Text className="text-dark leading-5 text-xs font-normal capitalize">
                {profile.BodyType.replace(/_/g, " ")}
              </Text>
            </View>
          )}
          {profile?.Education && (
            <View className="flex-row items-center justify-between">
              <Text className="text-xs leading-5 font-normal" style={{ color: themedColors.secondaryText }}>
                Education
              </Text>
              <Text className="text-dark leading-5 text-xs font-normal capitalize">
                {profile.Education.replace(/_/g, " ")}
              </Text>
            </View>
          )}
          {profile?.Religion && (
            <View className="flex-row items-center justify-between">
              <Text className="text-xs leading-5 font-normal" style={{ color: themedColors.secondaryText }}>
                Religion
              </Text>
              <Text className="text-dark leading-5 text-xs font-normal capitalize">
                {profile.Religion}
              </Text>
            </View>
          )}
          {profile?.Ethnicity && (
            <View className="flex-row items-center justify-between">
              <Text className="text-xs leading-5 font-normal" style={{ color: themedColors.secondaryText }}>
                Ethnicity
              </Text>
              <Text className="text-dark leading-5 text-xs font-normal capitalize">
                {Array.isArray(profile.Ethnicity) 
                  ? profile.Ethnicity.map(e => e.replace(/_/g, " ")).join(", ")
                  : profile.Ethnicity.replace(/_/g, " ")}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Lifestyle Section - matches web */}
      {(profile?.Smoking || profile?.Drinks || profile?.HaveChild || profile?.WantChild) && (
        <View className="mt-[18px]">
          <Text className="text-base mb-2 text-primary font-medium">
            Lifestyle
          </Text>
          <View className="flex-col gap-2">
            {profile?.Smoking && (
              <View className="flex-row items-center justify-between">
                <Text className="text-xs leading-5 font-normal" style={{ color: themedColors.secondaryText }}>
                  Smoking
                </Text>
                <Text className="text-dark leading-5 text-xs font-normal capitalize">
                  {profile.Smoking.replace(/_/g, " ")}
                </Text>
              </View>
            )}
            {profile?.Drinks && (
              <View className="flex-row items-center justify-between">
                <Text className="text-xs leading-5 font-normal" style={{ color: themedColors.secondaryText }}>
                  Drinking
                </Text>
                <Text className="text-dark leading-5 text-xs font-normal capitalize">
                  {profile.Drinks.replace(/_/g, " ")}
                </Text>
              </View>
            )}
            {profile?.Marijuana && (
              <View className="flex-row items-center justify-between">
                <Text className="text-xs leading-5 font-normal" style={{ color: themedColors.secondaryText }}>
                  Marijuana
                </Text>
                <Text className="text-dark leading-5 text-xs font-normal capitalize">
                  {profile.Marijuana.replace(/_/g, " ")}
                </Text>
              </View>
            )}
            {profile?.HaveChild && (
              <View className="flex-row items-center justify-between">
                <Text className="text-xs leading-5 font-normal" style={{ color: themedColors.secondaryText }}>
                  Has Kids
                </Text>
                <Text className="text-dark leading-5 text-xs font-normal capitalize">
                  {profile.HaveChild.replace(/_/g, " ")}
                </Text>
              </View>
            )}
            {profile?.WantChild && (
              <View className="flex-row items-center justify-between">
                <Text className="text-xs leading-5 font-normal" style={{ color: themedColors.secondaryText }}>
                  Wants Kids
                </Text>
                <Text className="text-dark leading-5 text-xs font-normal capitalize">
                  {profile.WantChild.replace(/_/g, " ")}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {me ? (
        <TouchableOpacity
          onPress={handleLogout}
          className="w-1/2 mx-auto shadow-lg shadow-white rounded-[99] mt-10 overflow-hidden"
        >
          <LinearBg className="px-6 py-5" style={{ paddingVertical: 10 }}>
            {loadingLogout ? (
              <ActivityIndicator
                size="small"
                color="#ffffff"
                className="text-center"
              />
            ) : (
              <Text className="text-center text-white font-bold text-[16px]">
                Logout
              </Text>
            )}
          </LinearBg>
        </TouchableOpacity>
      ) : (
        profile ? (
          <View className="flex-row gap-4 my-10">
            <TouchableOpacity
              onPress={handleReferFriend}
              className="flex-1 py-4 bg-light-100 rounded-[99] border"
              style={{ borderColor: themedColors.border }}
            >
              <Text className="text-center text-gray font-medium">
                Refer to a Friend
              </Text>
            </TouchableOpacity>
          </View>
        ) : null
      )}
    </ScrollView>

  );
}
