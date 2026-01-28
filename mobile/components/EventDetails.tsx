import { icons } from "@/constants/icons";
import { markEventAsInterested, cancelEventRegistration } from "@/lib/api";
import { EventCardProps } from "@/types";
import { addEventToCalendar } from "@/utils/permissions";
import { VIDEO_URL } from "@/utils/token";
import { PlatformIcon } from "@/components/ui";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  Share,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
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
  const [isRsvpLoading, setIsRsvpLoading] = useState(false);
  const router = useRouter();

  const mapRegion = {
    latitude: parseFloat(event?.Latitude) || 37.78825,
    longitude: parseFloat(event?.Longitude) || -122.4324,
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
  const getUserBgColor = (user: any) => {
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
    }
  };

  // RSVP handler - single button flow
  const handleRsvp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRsvpLoading(true);

    const isRegistered = event?.isMarkInterested === 1;

    try {
      if (isRegistered) {
        // Cancel RSVP - use DELETE endpoint
        const res = await cancelEventRegistration(event?.EventID);
        if (res?.success) {
          fetchEventDetails();
        } else {
          Alert.alert("Error", res?.msg || "Failed to cancel RSVP");
        }
      } else {
        // Register - use POST endpoint
        const formData = new FormData();
        formData.append("EventID", event?.EventID);
        const res = await markEventAsInterested(formData);
        if (res?.success) {
          fetchEventDetails();
        } else {
          Alert.alert("Error", res?.msg || "Failed to RSVP");
        }
      }
    } catch (error) {
      console.error("Error updating RSVP:", error);
      Alert.alert("Error", "Failed to update RSVP. Please try again.");
    } finally {
      setIsRsvpLoading(false);
    }
  };

  // Add to Calendar - Uses centralized permissions utility
  const handleAddToCalendar = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Parse event date and time
      const startDate = new Date(event?.EventDate);
      if (event?.StartTime) {
        const [time, period] = event.StartTime.split(" ");
        const [hours, minutes] = time.split(":");
        let hour = parseInt(hours);
        if (period === "PM" && hour !== 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;
        startDate.setHours(hour, parseInt(minutes));
      }

      const endDate = new Date(startDate);
      if (event?.EndTime) {
        const [time, period] = event.EndTime.split(" ");
        const [hours, minutes] = time.split(":");
        let hour = parseInt(hours);
        if (period === "PM" && hour !== 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;
        endDate.setHours(hour, parseInt(minutes));
      } else {
        // Default to 2 hours if no end time
        endDate.setHours(endDate.getHours() + 2);
      }

      const location = [event?.VenueName, event?.Street, event?.City, event?.State]
        .filter(Boolean)
        .join(", ");

      // Use the centralized permissions utility
      const result = await addEventToCalendar({
        title: event?.EventName || "RealSingles Event",
        notes: event?.Description || "",
        startDate,
        endDate,
        location,
      });

      if (result.success) {
        // Format date for display
        const formattedDate = startDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        });
        const formattedTime = startDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

        // Build clean, native-style message
        const eventName = event?.EventName || "Event";
        let message = `${formattedDate} at ${formattedTime}`;
        if (location) {
          message += `\n${location}`;
        }

        // Native iOS alert style: clean text, no emojis, action button on right
        Alert.alert(
          `"${eventName}" Added`,
          message,
          [
            {
              text: "OK",
              style: "cancel",
            },
            {
              text: "View in Calendar",
              style: "default",
              onPress: () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // Open native Calendar app
                const calendarUrl = Platform.OS === "ios" 
                  ? "calshow:" 
                  : "content://com.android.calendar/time/";
                Linking.openURL(calendarUrl).catch(() => {
                  console.log("Could not open calendar app");
                });
              },
            },
          ]
        );
      } else if (result.error && result.error !== "Calendar permission not granted") {
        // Only show error if it's not a permission denial (utility handles that)
        Alert.alert("Error", result.error);
      }
    } catch (error) {
      console.error("Error adding to calendar:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to add event to calendar. Please try again.");
    }
  };

  // Share Event
  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const location = [event?.Street, event?.City, event?.State].filter(Boolean).join(", ");
    const eventDate = event?.EventDate ? formatEventDate(event.EventDate) : "";
    const deepLink = `trusingle://events/${event?.EventID}`;

    const shareMessage = `Check out this event on RealSingles!\n\n${event?.EventName}\n${eventDate}${event?.StartTime ? ` at ${event.StartTime}` : ""}\n${location ? `Location: ${location}` : ""}`;

    try {
      const result = await Share.share(
        Platform.OS === "ios"
          ? {
              message: shareMessage,
              url: deepLink,
            }
          : {
              message: `${shareMessage}\n\n${deepLink}`,
            }
      );

      if (result.action === Share.sharedAction) {
        console.log("Event shared successfully");
      }
    } catch (error) {
      console.error("Error sharing event:", error);
    }
  };

  // Open in Maps
  const handleOpenInMaps = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const lat = parseFloat(event?.Latitude) || 37.78825;
    const lng = parseFloat(event?.Longitude) || -122.4324;
    const address = [event?.Street, event?.City, event?.State].filter(Boolean).join(", ");
    const label = encodeURIComponent(event?.EventName || "Event Location");
    const addressEncoded = encodeURIComponent(address);

    let url: string;

    if (Platform.OS === "ios") {
      // Apple Maps
      url = `maps:0,0?q=${label}@${lat},${lng}`;
    } else {
      // Google Maps on Android
      url = `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
    }

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to Google Maps web
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        Linking.openURL(webUrl);
      }
    });
  };

  const isRegistered = event?.isMarkInterested === 1;

  return (
    <View className="px-4 mt-2">
      <View className="flex-row items-start justify-between py-2">
        <View className="space-y-2 flex-1 mr-4">
          <Text className="font-bold text-[20px] text-dark">
            {event?.EventName}
          </Text>
          <View className="flex-row items-center mt-1">
            <PlatformIcon name="location-on" size={14} color="#B06D1E" />
            <Text className="text-[14px] text-gray ml-1">
              {event?.Street}, {event?.City}
            </Text>
          </View>
        </View>
        
        {/* Action buttons */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={handleShare}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          >
            <PlatformIcon name="share" size={20} color="#B06D1E" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAddToCalendar}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          >
            <PlatformIcon name="event" size={20} color="#B06D1E" />
          </TouchableOpacity>
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
                  onPress={() => router.push(`/discover/profile/${member?.ID}`)}
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
                  onPress={() => router.push(`/discover/profile/${member?.ID}`)}
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
          onPress={handleRsvp}
          disabled={isRsvpLoading}
          className={`py-[10px] px-[16px] rounded-lg flex-row items-center gap-2 ${
            isRegistered
              ? "bg-gray-100 border border-gray-300"
              : "bg-primary"
          }`}
        >
          {isRsvpLoading ? (
            <ActivityIndicator size="small" color={isRegistered ? "#666" : "#fff"} />
          ) : null}
          <Text className={`text-xs font-semibold text-center ${
            isRegistered ? "text-gray-700" : "text-white"
          }`}>
            {isRegistered ? "Cancel RSVP" : "RSVP"}
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
        <View className="flex-1 mr-4">
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
            initialRegion={mapRegion}
          >
            <Marker
              coordinate={{
                latitude: parseFloat(event?.Latitude) || 37.78825,
                longitude: parseFloat(event?.Longitude) || -122.4324,
              }}
              pinColor="#B06D1E"
            />
          </MapView>
        </TouchableOpacity>
      </View>

      {/* Main RSVP Button */}
      <GradientButton
        text={isRegistered ? "Cancel RSVP" : "RSVP to Event"}
        onPress={handleRsvp}
        disabled={isRsvpLoading}
        containerStyle={{
          marginTop: 20,
          width: "80%",
          marginHorizontal: "auto",
          opacity: isRsvpLoading ? 0.7 : 1,
        }}
      />

      {/* Open in Maps Button */}
      <TouchableOpacity
        onPress={handleOpenInMaps}
        className="mt-4 mb-[120px] py-3 px-6 border border-primary rounded-full self-center flex-row items-center gap-2"
      >
        <PlatformIcon name="navigation" size={18} color="#B06D1E" />
        <Text className="text-primary font-medium">Get Directions</Text>
      </TouchableOpacity>

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
              <PlatformIcon name="close" size={24} color="#333" />
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
            <View className="flex-row items-center mb-2">
              <PlatformIcon name="location-on" size={16} color="#B06D1E" />
              <Text className="text-sm ml-2">
                {event?.Street}, {event?.City}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleOpenInMaps}
              className="py-3 px-6 bg-primary rounded-full self-center flex-row items-center gap-2 mb-2"
            >
              <PlatformIcon name="navigation" size={18} color="#fff" />
              <Text className="text-white font-medium">Get Directions</Text>
            </TouchableOpacity>
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
