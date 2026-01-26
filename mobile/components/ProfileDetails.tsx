import { icons } from "@/constants/icons";
import { saveLink, toggleFavorite } from "@/lib/api";
import { getProfileLink, APP_NAME } from "@/lib/config";
import { User } from "@/types";
import { removeToken } from "@/utils/token";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
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

console.log("profile?.Height",profile?.Height);

  const interests = profile?.Interest?.split(",") || [];
  const horoscopes = profile?.HSign?.split(",") || [];
  console.log("profile in ProfileDetails:", profile);
   

  const handleLogout = async () => {
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
    const data = new FormData();
    data.append("OtherID", profile?.ID);
    data.append("Status", profile?.IsFavorite === 1 ? "0" : "1");
    try {
      const res = await toggleFavorite(data);
      console.log("Add to favorites response:", res);

      if (res?.success) {
        console.log(res?.msg || "Added to favorites");
        fetchProfile();
      } else {
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
      console.log("Error adding to favorites:", error);
    }
  };

  const handleNavigateReview = () => {
    router.push({
      pathname: "/review",
      params: {
        userId: profile?.ID,
        userName: profile?.DisplayName,
        userImage: profile?.Image,
        userRating: profile?.RATINGS,
      },
    });
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
    try {
      // Build the deep link URL
      const deepLinkUrl = getProfileLink(profile?.ID || '');

      // Share message text
      const message = `Hi there! ${APP_NAME} has helped me meet some wonderful people. Here’s a profile I thought you might like. You can connect with it directly on the ${APP_NAME} App by using the link below!\n${deepLinkUrl}`;

      // Use Share API
      const result = await Share.share({
        title: `Join the ${APP_NAME} App!`,
        message,
        url: Platform.OS === "ios" ? deepLinkUrl : undefined, // iOS supports URL separately
      });

      if (result.action === Share.sharedAction) {
        console.log(result.activityType ? `Shared via: ${result.activityType}` : "Shared successfully");
        saveShareLinks(message); // Call the function to save share links

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

          <Text className="font-normal text-[14px] text-[#686A6E] mb-2">
            {profile?.Email}
          </Text>

          {/* Rating + City/State Row */}
          <View className="flex-row items-center gap-3">
            {/* Rating */}
            <View className="flex-row items-center gap-2 py-[3px] px-[6px] border border-border rounded-[30px]">
              <Text className="font-medium text-[9px] text-black">
                {profile?.RATINGS || 0}
              </Text>
              <Image
                source={icons.star}
                className="size-2"
                resizeMode="contain"
              />
            </View>

            {/* City, State */}
             {profile?.City && profile?.State && (
                <Text className="font-normal text-[13px] text-[#686A6E]">
                  {profile.City}, {profile.State}
                </Text>
              )}

               {/* Distance */}
              {profile?.distance_in_km !== undefined && (
                <Text className="font-medium text-[12px] text-[#4B5563]">
               • {Number(profile.distance_in_km).toFixed(1)} km away
                </Text>
              )}

          </View>
        </View>
        <View className="flex-row items-center gap-2">
          {!me &&
           <TouchableOpacity
            onPress={() => 
              router.push({
                pathname: "/appGallery",
                params:{otherUserID: profile?.ID}
              })
            }
            className={`border border-[#C07618] rounded-lg overflow-hidden flex justify-center items-center w-8 h-8 bg-primary`}
          >
            <Ionicons
              name="image-outline"
              size={18}
              color="white"
            />
          </TouchableOpacity>}
          <TouchableOpacity
            onPress={() =>
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
                })
              // router.push(`/chat/${profile?.ID}`)
            }
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
            className="text-[12px] font-normal text-[#686A6F] leading-5"
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
          Interest:{" "}
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

      <View className="mt-[18px]">
        <Text className="text-base mb-2 text-primary font-medium">
          {profile?.DisplayName} Info:{" "}
        </Text>
        <View className="flex-col gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-[#686A6F] leading-5 font-normal">
              Gender
            </Text>
            <Text className="text-dark leading-5 text-xs font-normal">
              {capitalizeWords(profile?.Gender) || "N/A"}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-[#686A6F] leading-5 font-normal">
              Age
            </Text>
            <Text className="text-dark leading-5 text-xs font-normal">
              {calculateAge(profile?.DOB)} Yrs
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-[#686A6F] leading-5 font-normal">
              Height
            </Text>
            <Text className="text-dark leading-5 text-xs font-normal">
                  {Number(profile.Height).toFixed(1)} ft
            </Text>
          </View>
        </View>
      </View>

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
            {/* <TouchableOpacity
              onPress={handleFollow}
              className="flex-1 py-5 bg-light-100 rounded-[99]"
            >
              <Text className="text-center text-gray font-medium">
                {isFollowing ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity> */}
            <TouchableOpacity
              onPress={handleReferFriend}
              className="flex-1 py-4 bg-light-100 rounded-[99] border border-[#EAEAEB]"
            >
              <Text className="text-center text-gray font-medium">
                {"Refer to a Friends"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNavigateReview}
              className="flex-1 py-5 rounded-[99] overflow-hidden"
            >
              <LinearGradient
                colors={["#B06D1E", "#F99F2D", "#B06D1E", "#F99F2D", "#B06D1E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Text className="text-center text-white font-medium">
                Write a Review
              </Text>
            </TouchableOpacity>
          </View>


        ) : null
      )}
    </ScrollView>

  );
}
