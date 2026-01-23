import EventDetails, { formatEventDate } from "@/components/EventDetails";
import NotificationBell from "@/components/NotificationBell";
import { icons } from "@/constants/icons";
import { getEventDetails } from "@/lib/api";
import { EventCardProps } from "@/types";
import { IMAGE_URL, VIDEO_URL } from "@/utils/token";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";

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

export default function EventDetail() {
  const { id } = useLocalSearchParams();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [data, setData] = useState<EventCardProps>();
  const [loading, setLoading] = useState(false);

  const snapPoints = useMemo(() => ["62%", "70%"], []);
  const router = useRouter();

  // Generate a random but consistent color for the event
  const bgColor = useMemo(() => {
    if (!data) return BACKGROUND_COLORS[0];
    
    const seed = data?.EventID || data?.EventName || "";
    const index = Math.abs(
      seed.toString().split("").reduce((acc, char) => {
        return acc + char.charCodeAt(0);
      }, 0) % BACKGROUND_COLORS.length
    );
    return BACKGROUND_COLORS[index];
  }, [data]);

  const fetchEventDetails = async () => {
    setLoading(true);
    try {
      const res = await getEventDetails(id);
      console.log("Fetched event details:", res);
      
      if (res?.success) {
        setData(res?.data);
      } else {
        console.log(res?.msg || "Failed to fetch event details");
      }
    } catch (error) {
      console.error("Error fetching event details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  if(loading){
    return (
      <View className="flex-1 items-center justify-center bg-backgground">
        <ActivityIndicator size="large" color="#B06D1E" />
      </View>
    );
  }
  
  return (
    <>
      {/* <StatusBar barStyle="dark-content" backgroundColor="#ffffff" /> */}

      <View className="flex-1 bg-backgground">
        <View
          className="bg-white flex-row justify-between items-center px-4 pt-10 pb-6 rounded-b-xl z-[1]"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 16,
            elevation: 5,
          }}
        >
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={router.back}
              className="border border-gray rounded-lg flex justify-center items-center w-8 h-8"
            >
              <Image
                source={icons.back}
                className="size-4"
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text className="leading-[22px] text-dark text-base font-medium tracking-[-0.41px]">
              Event Details
            </Text>
          </View>

          <NotificationBell />
        </View>
        
        {data?.EventImage ? (
          <ImageBackground
            className="relative h-[253px] mt-[-10px]"
            source={{uri: data?.EventImage?.startsWith('uploads/') ? IMAGE_URL + data?.EventImage : VIDEO_URL + data?.EventImage}}
            resizeMode="cover"
          >
            {/* Add semi-transparent overlay */}
            <View className="absolute inset-0 bg-black/20" />
            
            <View className="absolute z-1 bottom-12 right-2 bg-white px-2 py-2 rounded-full">
              <Text className="text-[10px] font-semibold text-[#FF3131]">
              {data?.EventDate
                ? formatEventDate(data?.EventDate)
                : "Date not available"}
              </Text>
            </View>
          </ImageBackground>
        ) : (
          <View 
            className="relative h-[253px] mt-[-10px] justify-center items-center px-6"
            style={{ backgroundColor: bgColor }}
          >
            <Text className="text-white text-center font-bold text-2xl" numberOfLines={4}>
              {data?.EventName || "Event"}
            </Text>
            
            <View className="absolute z-1 bottom-12 right-2 bg-white px-2 py-2 rounded-full">
              <Text className="text-[10px] font-semibold text-[#FF3131]">
                {data?.EventDate}, {data?.StartTime}
              </Text>
            </View>
          </View>
        )}
        
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          index={0}
          enablePanDownToClose={false}
          enableContentPanningGesture={false}
          // enableHandlePanningGesture={false}
          // handleComponent={null} // Remove the handle to prevent dragging
          // backdropComponent={renderBackdrop}
        >
          <BottomSheetScrollView className="relative">
            <ScrollView>
              <EventDetails event={data} fetchEventDetails={fetchEventDetails} />
            </ScrollView>
          </BottomSheetScrollView>
        </BottomSheet>
      </View>
    </>
  );
}