import { icons } from "@/constants/icons";
import { VIDEO_URL } from "@/utils/token";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, CARD_DIMENSIONS, ICON_SIZES } from "@/constants/designTokens";

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
      onPress={() => router.push({pathname: `/video/[id]`, params: { id: videoProps?.video?.ID, data: JSON.stringify(videoProps?.video) }})}
      className="overflow-hidden"
      style={{ width: CARD_DIMENSIONS.listItem.width, borderRadius: BORDER_RADIUS.input }}
    >
      {/* Top image container */}
      <View
        className="relative overflow-hidden border border-border"
        style={{
          width: CARD_DIMENSIONS.listItem.width,
          height: CARD_DIMENSIONS.video.height,
          borderRadius: BORDER_RADIUS.input
        }}
      >
       <View
            className="w-full h-full justify-center items-center"
            style={{ backgroundColor: bgColor, borderRadius: BORDER_RADIUS.input }}
          >
            {videoProps?.video?.VideoURL && (
              <Image
                source={{ uri: VIDEO_URL + videoProps.video.VideoURL }}
                className="w-full h-full absolute"
                resizeMode="cover"
                style={{ borderRadius: BORDER_RADIUS.input }}
              />
            )}

            {!videoProps?.video?.VideoURL && (
              <Text className="text-white font-bold" style={TYPOGRAPHY.h2}>
                {getInitials()}
              </Text>
            )}
          </View>

        {videoProps?.isVideo && (
            <View
              className="absolute top-0 left-0 right-0 bottom-0 items-center justify-center"
              style={{ flex: 1 }}
            >
              <View className="bg-black/40 rounded-full" style={{ padding: SPACING.xs }}>
                <Image
                  source={icons.videoIcon}
                  style={{ width: ICON_SIZES.md, height: ICON_SIZES.md }}
                  resizeMode="contain"
                />
              </View>
            </View>
          )}
      </View>

      {/* Text content container */}
      <View style={{ padding: SPACING.xs }}>
        <Text className="font-bold text-dark" style={TYPOGRAPHY.subheadline} numberOfLines={1}>
          {videoProps?.video?.Name}
        </Text>
      </View>
    </TouchableOpacity>
  );
}