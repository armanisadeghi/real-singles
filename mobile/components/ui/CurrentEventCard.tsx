import { markEventAsInterested } from '@/lib/api';
import { EventCardProps } from '@/types';
import { IMAGE_URL, VIDEO_URL } from '@/utils/token';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

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

const CurrentEventCard = ({currentEvent, currUserId}: {currentEvent: EventCardProps, currUserId: string}) => {
  console.log("Current Event Card Props:", currentEvent);
  
  const router = useRouter();
  
  // Generate a random but consistent color for the event
  const eventBgColor = useMemo(() => {
    const seed = currentEvent?.EventID || currentEvent?.EventName || "";
    const index = Math.abs(
      seed.toString().split("").reduce((acc, char) => {
        return acc + char.charCodeAt(0);
      }, 0) % BACKGROUND_COLORS.length
    );
    return BACKGROUND_COLORS[index];
  }, [currentEvent]);

  // Function to get user initials
  const getUserInitials = (user: any) => {
    if (!user?.DisplayName) return "?";
    
    const nameParts = user.DisplayName.split(" ");
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    } else {
      return (
        nameParts[0].charAt(0).toUpperCase() + 
        nameParts[nameParts.length - 1].charAt(0).toUpperCase()
      );
    }
  };

  // Function to generate background color for a user
  const getUserBgColor = (user: any) => {
    const seed = user?.ID || user?.DisplayName || "";
    const index = Math.abs(
      seed.toString().split("").reduce((acc: number, char: string) => {
        return acc + char.charCodeAt(0);
      }, 0) % BACKGROUND_COLORS.length
    );
    return BACKGROUND_COLORS[index];
  };
  
  const handleEventInterested = async () => {
      const formData = new FormData();
      formData.append("EventID", currentEvent?.EventID);
      formData.append("Status", currentEvent?.interestedUserImage.find((u) => u?.ID === currUserId) ? "0" : "1");
  
      try {
        const res = await markEventAsInterested(formData);
        if (res?.success) {
          console.log(res?.msg);
        } else {
          console.log(res?.msg || "Failed to mark event as interested");
        }
      } catch (error) {
        console.error("Error marking event as interested:", error);
      }
    };

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => router.push(`/events/event/${currentEvent?.EventID}` as any)}>
    <View className="w-[309px] h-[263px] bg-white rounded-[18px] px-[17px] py-[16px] shadow-md">
      {/* Image and Time Badge */}
      <View className="relative rounded-xl overflow-hidden">
        {currentEvent?.EventImage ? (
          <Image
            source={{ uri: currentEvent?.EventImage.startsWith('http') ? currentEvent?.EventImage : (currentEvent?.EventImage.startsWith('uploads/') ? `${IMAGE_URL}${currentEvent?.EventImage}` : VIDEO_URL+currentEvent?.EventImage) }}
            className="w-full h-[150px]"
            resizeMode="cover"
          />
        ) : (
          <View 
            className="w-full h-[150px] justify-center items-center p-4"
            style={{ backgroundColor: eventBgColor }}
          >
            <Text className="text-white text-center font-semibold text-lg" numberOfLines={4}>
              {currentEvent?.EventName}
            </Text>
          </View>
        )}
        <View className="absolute z-10 top-2 right-2 bg-white px-2 py-1 rounded-full">
          <Text className="text-[8px] font-semibold text-red-600">{currentEvent?.EventDate} {currentEvent?.StartTime}</Text>
        </View>
        {currentEvent?.EventImage && (
          <View className="absolute inset-0 bg-black" style={{ opacity: 0.2 }} />
        )}
      </View>

      {/* Event Title and Price */}
      <View className="flex-row justify-between items-center mt-3">
        <Text className="text-base font-semibold text-dark">{currentEvent?.EventName}</Text>
        <Text className="text-sm font-medium text-primary">{currentEvent?.EventPrice === '0' ? 'Free' : `$${currentEvent?.EventPrice}`}</Text>
      </View>

      {/* Location */}
      <View className="flex-row items-center mt-1">
        <Ionicons name="location-sharp" size={14} color="#B06D1E" />
        <Text className="text-xs text-gray-500 ml-1">{currentEvent?.City}, {currentEvent?.State}</Text>
      </View>

      {/* Likes & Button */}
      <View className="flex-row justify-between items-center mt-2">
        <View className="flex-row items-center gap-1">
          {/* Display up to 3 avatars */}
          <View className="flex-row">
            {currentEvent?.interestedUserImage.length > 0 && currentEvent?.interestedUserImage.slice(0, 3).map((user, index) => (
              <TouchableOpacity 
                onPress={() => router.push(`/profiles/${user?.ID}`)}
                key={index} 
                className={`w-6 h-6 rounded-full border-2 border-white ${index > 0 ? 'ml-[-8px]' : ''}`}
                style={{ zIndex: 3 - index }}
              >
                {user?.Image ? (
                  <Image
                    source={{ uri: VIDEO_URL+user?.Image }}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <View 
                    className="w-full h-full rounded-full justify-center items-center"
                    style={{ backgroundColor: getUserBgColor(user) }}
                  >
                    <Text className="text-white text-[8px] font-bold">
                      {getUserInitials(user)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <Text className="text-xs text-gray-600">{currentEvent?.interestedUserImage?.length > 0 ? currentEvent?.interestedUserImage?.length : '0'} Likes</Text>
        </View>

        <TouchableOpacity 
          className="border border-primary px-3 py-1 rounded-lg"
          onPress={handleEventInterested}
        >
          <Text className="text-[10px] text-dark font-medium">{currentEvent?.interestedUserImage.find((u) => u?.ID === currUserId) ? 'Interested' : 'Mark Interested'}</Text>
        </TouchableOpacity>
      </View>
    </View>
    </TouchableOpacity>
  );
};

export default CurrentEventCard;