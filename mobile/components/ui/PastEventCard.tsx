import { icons } from "@/constants/icons";
import { IMAGE_URL, VIDEO_URL } from "@/utils/token";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

// Define the interface for component props
export interface EventCardProps {
  EventID: string;
  EventName: string;
  EventDate: string;
  EventPrice: string;
  StartTime: string;
  EndTime: string;
  Description: string;
  Street: string;
  City: string;
  PostalCode: string;
  EventImage: string;
  Link: string;
  Latitude: string;
  Longitude: string;
  UserID: string;
  CreateDate: string;
  interestedUserImage: any[];
  HostedBy: string;
  HostedID: string;
}

// Array of background colors for random backgrounds
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

const PastEventCard = (
  { pastEvent }: { pastEvent: EventCardProps } // Destructure pastEvent from props
) => {
  const router = useRouter();
  
  // Generate a random but consistent color for the event
  const bgColor = useMemo(() => {
    const seed = pastEvent?.EventID || pastEvent?.EventName || "";
    const index = Math.abs(
      seed.toString().split("").reduce((acc, char) => {
        return acc + char.charCodeAt(0);
      }, 0) % BACKGROUND_COLORS.length
    );
    return BACKGROUND_COLORS[index];
  }, [pastEvent]);

  // Generate initials from the event name
  const getEventInitials = () => {
    if (!pastEvent?.EventName) return "E";
    
    const words = pastEvent.EventName.split(" ");
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    } else {
      return (
        words[0].charAt(0).toUpperCase() + 
        words[1].charAt(0).toUpperCase()
      );
    }
  };
  
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push(`/events/event/${pastEvent?.EventID}`)}
      className="h-[97px] rounded-[15px] px-[12px] py-[14px] flex-row items-center gap-[10px] bg-white overflow-hidden"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 5,
      }}
    >
      <View className="relative w-[69px] h-[69px] rounded-[10px] overflow-hidden">
        {pastEvent?.EventImage ? (
          <>
            <Image
              source={{ uri: pastEvent.EventImage.startsWith('uploads/') ? `${IMAGE_URL}${pastEvent?.EventImage}` : VIDEO_URL+pastEvent?.EventImage }}
              className="w-full h-full"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-black" style={{ opacity: 0.2 }} />
          </>
        ) : (
          <View 
            className="w-full h-full justify-center items-center"
            style={{ backgroundColor: bgColor }}
          >
            <Text className="text-white text-xl font-bold">
              {getEventInitials()}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-1">
        <View className="flex-row items-start justify-between">
          <View>
            <Text className="text-[14px] font-bold text-dark" numberOfLines={1}>
              {pastEvent?.EventName}
            </Text>

            <View className="flex-row items-center mt-1">
              <Ionicons name="location-sharp" size={14} color="#B06D1E" />
              <Text
                className="text-[12px] text-gray-600 ml-1"
                numberOfLines={1}
              >
                {pastEvent?.Street}, {pastEvent?.City}
              </Text>
            </View>
          </View>
          <Text className="text-primary font-semibold text-sm mt-1">
            {pastEvent?.EventPrice === '0' ? 'Free' : `$${pastEvent?.EventPrice}`}
          </Text>
        </View>
        <View className="flex-row items-center justify-between mt-2">
          <View className="bg-light-100 border border-light-200 px-2 py-[6px] rounded-full mt-2 self-start">
            <Text className="text-[8px] text-[#FF3131] font-medium">
              {pastEvent?.EventDate}, {pastEvent?.StartTime}
            </Text>
          </View>
          <View>
            <Image
              source={icons.back}
              className="rotate-180 w-3 h-3"
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default PastEventCard;