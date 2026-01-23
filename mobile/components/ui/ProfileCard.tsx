import { icons } from "@/constants/icons";
import { User } from "@/types";
import { IMAGE_URL, VIDEO_URL } from "@/utils/token";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Image,
  ImageBackground,
  Text,
  TouchableOpacity,
  View,
} from "react-native";


// Array of background colors for initials
export const BACKGROUND_COLORS = [
  "#F44336", // Red
  "#E91E63", // Pink
  "#9C27B0", // Purple
  "#673AB7", // Deep Purple
  "#3F51B5", // Indigo
  "#2196F3", // Blue
  "#03A9F4", // Light Blue
  "#00BCD4", // Cyan
  "#009688", // Teal
  "#4CAF50", // Green
  "#8BC34A", // Light Green
  "#FF9800", // Orange
  "#FF5722", // Deep Orange
  "#795548", // Brown
  "#607D8B", // Blue Grey
];

export default function ProfileCard({ profile }: { profile: User }) {
  const router = useRouter();
 


  // Generate a random but consistent color for each user based on their ID or name
  const bgColor = useMemo(() => {
    const seed = profile?.id || profile?.ID || profile?.DisplayName || "";
    const index = Math.abs(
      seed.toString().split("").reduce((acc, char) => {
        return acc + char.charCodeAt(0);
      }, 0) % BACKGROUND_COLORS.length
    );
    return BACKGROUND_COLORS[index];
  }, [profile]);

  // Generate initials from the name
  const getInitials = () => {
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

  // Decide what to display as the background
  const displayContent = () => {
    if (profile?.Image) {
      if (profile.Image.startsWith("uploads/")) {
        return {
          type: "image",
          source: { uri: `${IMAGE_URL}${profile.Image}` }
        };
      } else {
        return {
          type: "image",
          source: { uri: `${VIDEO_URL}${profile.Image}` }
        };
      }
    }

    // Return initials with background color
    return {
      type: "initials",
      initials: getInitials(),
      bgColor: bgColor
    };
  };

  const content = displayContent();



  return (
    <Link asChild href={`/profiles/${profile?.id || profile?.ID}`}>
      <TouchableOpacity className="relative w-[149px] h-[176px] rounded-xl overflow-hidden">
        {content.type === "image" ? (
          <ImageBackground
            source={content.source}
            className="w-full h-full rounded-xl overflow-hidden"
            resizeMode="cover"
          >
            {/* Rating and content overlays for image background */}
            <RatingOverlay profile={profile} />
            <GradientOverlay profile={profile} />
          </ImageBackground>
        ) : (
          <View
            className="w-full h-full rounded-xl overflow-hidden justify-center items-center"
            style={{ backgroundColor: content.bgColor }}
          >
            {/* Initials */}
            <Text className="text-white text-4xl font-bold">
              {content.initials !== '?' ? content.initials : "User"}
            </Text>

            {/* Rating overlay for solid background */}
            <RatingOverlay profile={profile} />

            {/* Name and location overlay for solid background */}
            <View className="absolute bottom-0 left-0 right-0 p-3">
              <Text className="text-white font-bold text-xs">
                {profile?.DisplayName || "Anonymous User"}
              </Text>
              <Text className="text-white font-normal text-[10px]">
                {profile?.City}{profile?.City ? ',' : ''} {profile?.State}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Link>
  );
}


// Extracted Rating component to avoid duplication
function RatingOverlay({ profile }: { profile: User }) {
  // console.log("profile in RatingOverlay",profile);


  const finalRating =
    profile?.RATINGS !== undefined && profile?.RATINGS !== null
      ? profile.RATINGS
      : profile?.TotalRating ?? "";

  return (
    <View className="absolute top-2 right-2 flex-row items-center gap-2">
      {profile?.distance_in_km && (
        <View className="flex-row items-center gap-[2px] bg-white px-[4px] py-[3px] rounded-[30px] shadow-black shadow-lg">
          <Text className="font-medium text-[6px] text-[#1D2733]">
            {profile?.distance_in_km.toFixed(2)} Away
          </Text>
        </View>
      )}
      <View className="flex-row items-center gap-[2px] bg-white px-[4px] py-[3px] rounded-[30px] shadow-black shadow-lg">
        <Text className="font-medium text-[6px] text-[#1D2733]">
          {profile?.RATINGS ?? profile?.TotalRating ?? profile?.AvgRating ?? ""}
        </Text>
        <Image source={icons.star} className="w-[6px] h-[6px]" />
      </View>
    </View>
  );
}

// Extracted Gradient overlay to avoid duplication
function GradientOverlay({ profile }: { profile: User }) {
  return (
    <LinearGradient
      colors={["#00000008", "#0000004D", "#000000"]}
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        height: 100,
        right: 0,
        zIndex: 50,
      }}
    >
      <View className="absolute bottom-4 left-3 z-20">
        <Text className="text-white font-bold text-xs">
          {profile?.DisplayName || "User"}
        </Text>
        <Text className="text-white font-normal text-[10px]">
          {profile?.State}{profile?.State ? ',' : ''} {profile?.City}
        </Text>
      </View>
    </LinearGradient>
  );
}