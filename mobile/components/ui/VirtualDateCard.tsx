import { VIDEO_URL } from "@/utils/token";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export interface VirtualDateProps {
    ID: string;
    Title: string;
    Description: string;
    Image: string;
    UserID: string;
    CreatedDate: string;
    type: string;
    Status: string;
}

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

export default function VirtualDateCard({virtualDate}: { virtualDate: VirtualDateProps }) {    
  const router = useRouter();
  
  // Generate a random but consistent color based on the virtual date ID or title
  const bgColor = useMemo(() => {
    const seed = virtualDate?.ID || virtualDate?.Title || "";
    const index = Math.abs(
      seed.toString().split("").reduce((acc, char) => {
        return acc + char.charCodeAt(0);
      }, 0) % BACKGROUND_COLORS.length
    );
    return BACKGROUND_COLORS[index];
  }, [virtualDate]);

  // Generate initials from the virtual date title
  const getInitials = () => {
    if (!virtualDate?.Title) return "VD";
    
    const words = virtualDate.Title.split(" ");
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
      onPress={() => router.push(`/virtualdate/${virtualDate?.ID}`)}
      className="w-[154px] h-[175px] rounded-[10px] overflow-hidden"
    >
      {/* Top image container */}
      <View className="relative w-[154px] h-[127px] rounded-[10px] overflow-hidden">
        {virtualDate?.Image ? (
          <Image
            source={{ uri: VIDEO_URL + virtualDate.Image }}
            className="w-full h-full rounded-[10px]"
            resizeMode="cover"
          />
        ) : (
          <View 
            className="w-full h-full rounded-[10px] justify-center items-center"
            style={{ backgroundColor: bgColor }}
          >
            <Text className="text-white text-3xl font-bold">
              {getInitials()}
            </Text>
          </View>
        )}
      </View>

      {/* Text content container */}
      <View className="p-2">
        <Text className="font-bold text-dark text-xs" numberOfLines={1}>
          {virtualDate?.Title}
        </Text>
        <Text className="text-[10px] text-[#9A9CA0] mt-1" numberOfLines={1}>
          {virtualDate?.Description || "User"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}