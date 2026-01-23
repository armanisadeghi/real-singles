import { icons } from "@/constants/icons";
import { VIDEO_URL } from "@/utils/token";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

// Array of background colors for initials
const BACKGROUND_COLORS = [
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

export default function VideoCard(videoProps: any) {
  const router = useRouter();
  
  
  // Generate a random but consistent color for each video based on its ID or title
  const bgColor = useMemo(() => {
    const seed = videoProps?.video?.ID || videoProps?.video?.Name || "";
    const index = Math.abs(
      seed.toString().split("").reduce((acc: any, char: any) => {
        return acc + char.charCodeAt(0);
      }, 0) % BACKGROUND_COLORS.length
    );
    return BACKGROUND_COLORS[index];
  }, [videoProps?.video]);

  // Generate initials from the video title
  const getInitials = () => {
    if (!videoProps?.video?.Name) return "V";
    
    const words = videoProps.video.Name.split(" ");
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    } else {
      // Get first letter of first and last words
      return (
        words[0].charAt(0).toUpperCase() + 
        words[Math.min(1, words.length - 1)].charAt(0).toUpperCase()
      );
    }
  };
  
  
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push({pathname: `/video/${videoProps?.video?.ID}`, params: { data: JSON.stringify(videoProps?.video) }})}
      className="w-[154px] rounded-[10px] overflow-hidden"
    >
      {/* Top image container */}
      <View className="relative w-[154px] h-[127px] rounded-[10px] overflow-hidden border-[0.5px] border-[#D0D0D0]">
       <View
            className="w-full h-full rounded-[10px] justify-center items-center"
            style={{ backgroundColor: bgColor }}
          >
            {videoProps?.video?.VideoURL && (
              <Image
                source={{ uri: VIDEO_URL + videoProps.video.VideoURL }}
                className="w-full h-full absolute rounded-[10px]"
                resizeMode="cover"
              />
            )}

            {!videoProps?.video?.VideoURL && (
              <Text className="text-white text-3xl font-bold">
                {getInitials()}
              </Text>
            )}
          </View>



        {videoProps?.isVideo && (
            <View
              className="absolute top-0 left-0 right-0 bottom-0 items-center justify-center"
              style={{ flex: 1 }}
            >
              <View className="bg-black/40 p-2 rounded-full">
                <Image source={icons.videoIcon} className="w-6 h-6" />
              </View>
            </View>
          )}
      </View>

      {/* Text content container */}
      <View className="p-2">
        <Text className="font-bold text-dark text-xs" numberOfLines={1}>
          {videoProps?.video?.Name}
        </Text>
        {/* <Text className="text-[10px] text-[#9A9CA0] mt-1" numberOfLines={1}>
          By {videoProps?.video?.ID || "User"}
        </Text> */}
      </View>
    </TouchableOpacity>
  );
}