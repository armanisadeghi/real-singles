import { icons } from "@/constants/icons";
import { markEventAsInterested } from "@/lib/api";
import { EventCardProps } from "@/types";
import { VIDEO_URL } from "@/utils/token";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Linking,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import GradientButton from "./ui/GradientButton";

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

export const formatEventDate = (dateString: string) => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString; // Return original if invalid
    }

    // Format: Monday, 20 July 2023
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString; // Return original if error
  }
};

export default function EventDetails({
  event,
  fetchEventDetails,
}: {
  event: EventCardProps;
  fetchEventDetails: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const router = useRouter();

  const mapRegion = {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

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
  const getUserBgColor = (user : any) => {
    const seed = user?.ID || user?.DisplayName || "";
    const index = Math.abs(
      seed.toString().split("").reduce((acc: any, char: any) => {
        return acc + char.charCodeAt(0);
      }, 0) % BACKGROUND_COLORS.length
    );
    return BACKGROUND_COLORS[index];
  };


  const handleOpenLink = async (url: string) => {
    // Make sure the link has proper protocol
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;

    // Check if the link can be opened
    const supported = await Linking.canOpenURL(formattedUrl);

    if (supported) {
      await Linking.openURL(formattedUrl);
    } else {
      console.error(`Cannot open URL: ${formattedUrl}`);
      // Optionally show an error message to the user
      // Alert.alert("Cannot open this link");
    }
  };
  

  const handleEventInterested = async () => {
    const formData = new FormData();
    formData.append("EventID", event?.EventID);
    formData.append("Status", event?.isMarkInterested === 1 ? "0" : "1");

    try {
      const res = await markEventAsInterested(formData);
      if (res?.success) {
        console.log(res?.msg);
        // setSuccessMsg(res?.msg);
        fetchEventDetails();
        // Optionally update local state to reflect change
      } else {
        console.log(res?.msg || "Failed to mark event as interested");
      }
    } catch (error) {
      console.error("Error marking event as interested:", error);
    }
  };
  return (
    <View className="px-4 mt-2">
      <View className="flex-row items-start justify-between py-2">
        <View className="space-y-2">
          <Text className="font-bold text-[20px] text-dark">
            {event?.EventName}
          </Text>
          <View className="flex-row items-center mt-1">
            <Ionicons name="location-sharp" size={14} color="#B06D1E" />
            <Text className="text-[14px] text-gray ml-1">
              {event?.Street}, {event?.City}
            </Text>
          </View>
        </View>
      </View>
      <View className="mt-2 flex-row items-start justify-between">
        <View className="flex-row">
          {event?.interestedUserImage &&
            event?.interestedUserImage
              .slice(0, 3)
              .map((member, index) => (
                member?.Image ? (
                  <TouchableOpacity key={member?.ID}
                  onPress={() => router.push(`/profiles/${member?.ID}`)}
                  >
                  <Image
                    source={{ uri: member.Image.startsWith('http') ? member.Image : VIDEO_URL + member?.Image }}
                    className={`w-[26px] h-[26px] rounded-full border-2 border-white ${
                      index > 0 ? "ml-[-8px]" : ""
                    }`}
                    style={{ zIndex: 3 - index }}
                  />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                  onPress={() => router.push(`/profiles/${member?.ID}`)}
                    key={index}
                    className={`w-[26px] h-[26px] rounded-full border-2 border-white justify-center items-center ${
                      index > 0 ? "ml-[-8px]" : ""
                    }`}
                    style={{ 
                      backgroundColor: getUserBgColor(member),
                      zIndex: 3 - index
                    }}
                  >
                    <Text className="text-white text-[8px] font-bold">
                      {getUserInitials(member)}
                    </Text>
                  </TouchableOpacity>
                )
              ))}
          
          {/* Show more count if there are more than 3 interested users */}
          {event?.interestedUserImage && event?.interestedUserImage.length > 3 && (
            <View 
              className="w-[26px] h-[26px] rounded-full bg-[#F0F0F0] border-2 border-white justify-center items-center ml-[-8px]"
              style={{ zIndex: 0 }}
            >
              <Text className="text-[#515151] text-[8px] font-bold">
                +{event.interestedUserImage.length - 3}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={handleEventInterested}
          className="py-[10px] px-[12px] bg-white border border-primary rounded-lg"
        >
          <Text className="text-xs font-medium text-dark text-center">
            {event?.isMarkInterested === 1
              ? "Interested"
              : "Mark as Interested"}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="mt-3">
        <Text className="text-base mb-2 text-primary font-bold">
          About Event
        </Text>
        <View>
          <Text
            numberOfLines={expanded ? undefined : 3}
            className="text-[12px] font-normal text-[#686A6F] leading-5"
          >
            {event?.Description}
          </Text>

          {event?.Description?.length > 120 && (
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

      <View className="mt-[18px] border border-border rounded-[15px] p-[14px] flex-row justify-between items-center">
        <View>
          <Text className="text-base font-medium text-primary">
            Event Info:
          </Text>
          <View className="flex-row items-center gap-2 mt-2">
            <Image
              source={icons.clock}
              className="w-3 h-3"
              resizeMode="contain"
            />
            <Text className="text-[10px] font-normal text-[#686A6F]">
              {event?.StartTime} - {event?.EndTime}
            </Text>
          </View>
          <View className="flex-row items-center gap-2 mt-2">
            <Image
              source={icons.calender}
              className="w-3 h-3"
              resizeMode="contain"
            />
            <Text className="text-[10px] font-normal text-[#686A6F]">
              {event?.EventDate
                ? formatEventDate(event?.EventDate)
                : "Date not available"}
            </Text>
          </View>
          <View className="flex-row items-center gap-2 mt-2">
            <Image
              source={icons.link}
              className="w-3 h-3"
              resizeMode="contain"
            />
            <TouchableOpacity onPress={() => { 
              if(event?.Link) handleOpenLink(event?.Link)}}>
              <Text className="text-[10px] font-normal text-primary underline">
                {event?.Link || "No link provided"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setMapModalVisible(true)}
          className="w-[78px] h-[78px] rounded-[15px] overflow-hidden"
        >
          <MapView
            className="w-full h-full"
            style={{ width: "100%", height: "100%" }}
            initialRegion={{
              latitude: 37.78825,
              longitude: -122.4324,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{ latitude: 37.78825, longitude: -122.4324 }}
              // title="Event Location"
              pinColor="#B06D1E"
            />
          </MapView>
        </TouchableOpacity>
      </View>
      {/* <View className="mt-4">
        <Text className="text-base text-primary font-bold">Past Events</Text>
        {pastEventData.map((item) => (
          <View key={item.id.toString()} className="mb-3">
            <PastEventCard
              id={item.id}
              image={item.image}
              title={item.title}
              location={item.location}
              price={item.price}
              time={item.time}
              onPress={() => {
                console.log(`Viewing past event: ${item.title}`);
              }}
            />
          </View>
        ))}
      </View> */}
      <GradientButton
        text={
          event?.isMarkInterested === 1 ? "Interested" : "Mark as Interested"
        }
        onPress={handleEventInterested}
        containerStyle={{
          marginTop: 20,
          marginBottom: 120,
          width: "80%",
          marginHorizontal: "auto",
        }}
      />
      <Modal
        animationType="slide"
        transparent={false}
        visible={mapModalVisible}
        onRequestClose={() => setMapModalVisible(false)}
      >
        <View className="flex-1">
          {/* Header with close button */}
          <View className="bg-white p-4 flex-row justify-between items-center" style={{marginTop: 40}}>
            <Text className="font-bold text-lg text-primary" >
              {event?.EventName} - Location
            </Text>
            <TouchableOpacity
              onPress={() => setMapModalVisible(false)}
              className="p-2"
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Full screen map */}
          <MapView
            style={{ width: "100%", flex: 1 }}
            initialRegion={mapRegion}
            showsUserLocation={true}
          >
            <Marker
              coordinate={{
                latitude: parseFloat(event?.Latitude) || 37.78825,
                longitude: parseFloat(event?.Longitude) || -122.4324,
              }}
              title={event?.EventName || "Event Location"}
              description={
                event?.Street
                  ? `${event?.Street}, ${event?.City}`
                  : "No address provided"
              }
              pinColor="#B06D1E"
            />
          </MapView>

          {/* Footer with location info */}
          <View className="bg-white p-4">
            <View className="flex-row items-center">
              <Ionicons name="location-sharp" size={16} color="#B06D1E" />
              <Text className="text-sm ml-2">
                {event?.Street}, {event?.City}
              </Text>
            </View>
            <GradientButton
              text="Close Map"
              onPress={() => setMapModalVisible(false)}
              containerStyle={{
                marginVertical: 5,
                width: "100%",
                marginHorizontal: "auto",
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
