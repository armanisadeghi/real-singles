import { EventCardProps } from "@/types";
import { IMAGE_URL, VIDEO_URL } from "@/utils/token";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ImageBackground,
  Text,
  TouchableOpacity,
  View
} from "react-native";

// Function to get initials from event name
const getInitials = (name: string) => {
  if (!name) return '?';
  
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Array of background colors for initials
const bgColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#F9C80E', 
  '#9370DB', '#66BB6A', '#FFA726', '#5C6BC0'
];

export default function EventCard({event} : {event: EventCardProps}) {

  const { EventID, EventName, EventImage, City, State, EventPrice } = event;
  const router = useRouter();

  // Generate a consistent color based on event ID
  const backgroundColor = useMemo(() => {
    // Use event ID to make color consistent for same event
    const colorIndex = EventID ? parseInt(EventID) % bgColors.length : Math.floor(Math.random() * bgColors.length);
    return bgColors[colorIndex];
  }, [EventID]);

  // Get initials for the event name
  const initials = useMemo(() => getInitials(EventName), [EventName]);

  return (
    <Link asChild href={`/events/event/${EventID}`}>
      <TouchableOpacity className="relative w-[149px] h-[176px] rounded-xl overflow-hidden">
        {EventImage ? (
          <ImageBackground
            source={{ uri: EventImage.startsWith('uploads/') ? `${IMAGE_URL}${EventImage}` : VIDEO_URL+EventImage }}
            className="w-full h-full rounded-xl overflow-hidden"
            resizeMode="cover"
          >
            {renderContent()}
          </ImageBackground>
        ) : (
          <View style={{ backgroundColor, width: '100%', height: '100%' }} className="justify-center items-center">
            <Text className="text-white font-bold text-2xl">{initials}</Text>
            {renderContent()}
          </View>
        )}
      </TouchableOpacity>
    </Link>
  );

  function renderContent() {
    return (
      <>
        <View className="absolute top-2 right-2 flex-row items-center gap-2">
          <View className="flex-row items-center gap-[2px] bg-white px-3 py-[3px] rounded-[30px] shadow-black shadow-lg">
            <Text className={`font-medium text-[6px] ${EventPrice === '0' ? 'text-green-600' : 'text-[#1D2733]'}`}>
              {EventPrice === '0' ? 'Free' : `$${EventPrice}`}
            </Text>
          </View>
        </View>

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
            <Text className="text-white font-bold text-xs">{EventName}</Text>
            <Text className="text-white font-normal text-[10px]">
              {State}{State ? ',' : ''} {City}
            </Text>
          </View>
        </LinearGradient>
      </>
    );
  }
}