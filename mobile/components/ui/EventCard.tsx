import { EventCardProps } from "@/types";
import { IMAGE_URL, VIDEO_URL } from "@/utils/token";
import { PlatformIcon } from "./PlatformIcon";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  PlatformColor,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SymbolView } from "expo-symbols";
import { SPACING, TYPOGRAPHY } from "@/constants/designTokens";

interface EventCardComponentProps {
  event: EventCardProps;
  showDescription?: boolean;
}

/**
 * Unified EventCard component for mobile - matches web design
 * Shows: Image, Date overlay, RSVP badge, Title, Description, Time, Location, Attendees
 */
export function EventCard({ event, showDescription = true }: EventCardComponentProps) {
  const router = useRouter();
  
  const location = [event.City, event.State].filter(Boolean).join(", ");
  const isRegistered = event.isMarkInterested === 1;

  // Format date nicely (matches web)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Get image URI
  const getImageUri = () => {
    if (!event.EventImage) return null;
    if (event.EventImage.startsWith("http")) return event.EventImage;
    if (event.EventImage.startsWith("uploads/")) return `${IMAGE_URL}${event.EventImage}`;
    return VIDEO_URL + event.EventImage;
  };

  const imageUri = getImageUri();
  const attendeeCount = event.interestedUserImage?.length || 0;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push(`/events/event/${event.EventID}` as any);
      }}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      {/* Image Section */}
      <View className="aspect-video relative overflow-hidden">
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View 
            className="w-full h-full justify-center items-center"
            style={{ 
              backgroundColor: Platform.OS === "ios" 
                ? (PlatformColor("systemPink") as unknown as string) 
                : "#E91E63" 
            }}
          >
            {Platform.OS === "ios" ? (
              <SymbolView
                name="calendar"
                style={{ width: 48, height: 48 }}
                tintColor="rgba(255,255,255,0.4)"
              />
            ) : (
              <PlatformIcon name="event" size={48} color="rgba(255,255,255,0.4)" />
            )}
          </View>
        )}

        {/* RSVP Badge */}
        {isRegistered && (
          <View 
            className="absolute top-3 right-3 px-2 py-1 rounded-full"
            style={{ backgroundColor: "#22C55E" }}
          >
            <Text className="text-white text-xs font-semibold">RSVP'd</Text>
          </View>
        )}

        {/* Date Overlay */}
        <View 
          className="absolute bottom-3 left-3 px-2.5 py-1.5 rounded-lg"
          style={{ 
            backgroundColor: "rgba(255,255,255,0.95)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
          }}
        >
          <Text 
            className="font-semibold"
            style={{ 
              fontSize: 12,
              color: Platform.OS === "ios" 
                ? (PlatformColor("systemPink") as unknown as string)
                : "#E91E63"
            }}
          >
            {formatDate(event.EventDate)}
          </Text>
        </View>
      </View>

      {/* Content Section */}
      <View style={{ padding: SPACING.base }}>
        {/* Title */}
        <Text 
          className="font-bold text-gray-900 mb-1"
          style={TYPOGRAPHY.body}
          numberOfLines={1}
        >
          {event.EventName}
        </Text>

        {/* Description */}
        {showDescription && event.Description && (
          <Text 
            className="text-gray-600 mb-3"
            style={{ fontSize: 14, lineHeight: 20 }}
            numberOfLines={2}
          >
            {event.Description}
          </Text>
        )}

        {/* Metadata Row */}
        <View className="flex-row flex-wrap" style={{ gap: SPACING.md }}>
          {/* Time */}
          {event.StartTime && (
            <View className="flex-row items-center" style={{ gap: 4 }}>
              {Platform.OS === "ios" ? (
                <SymbolView
                  name="clock"
                  style={{ width: 14, height: 14 }}
                  tintColor="#6B7280"
                />
              ) : (
                <PlatformIcon name="schedule" size={14} color="#6B7280" />
              )}
              <Text className="text-gray-500" style={{ fontSize: 12 }}>
                {event.StartTime}
              </Text>
            </View>
          )}

          {/* Location */}
          {location && (
            <View className="flex-row items-center" style={{ gap: 4 }}>
              {Platform.OS === "ios" ? (
                <SymbolView
                  name="mappin"
                  style={{ width: 14, height: 14 }}
                  tintColor="#6B7280"
                />
              ) : (
                <PlatformIcon name="location-on" size={14} color="#6B7280" />
              )}
              <Text className="text-gray-500" style={{ fontSize: 12 }}>
                {location}
              </Text>
            </View>
          )}

          {/* Attendees */}
          <View className="flex-row items-center" style={{ gap: 4 }}>
            {Platform.OS === "ios" ? (
              <SymbolView
                name="person.2"
                style={{ width: 14, height: 14 }}
                tintColor="#6B7280"
              />
            ) : (
              <PlatformIcon name="people" size={14} color="#6B7280" />
            )}
            <Text className="text-gray-500" style={{ fontSize: 12 }}>
              {attendeeCount} going
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/**
 * Skeleton loader for EventCard
 */
export function EventCardSkeleton() {
  return (
    <View 
      className="bg-white rounded-2xl overflow-hidden border border-gray-100"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      <View className="aspect-video bg-gray-200" />
      <View style={{ padding: SPACING.base, gap: SPACING.sm }}>
        <View className="h-5 bg-gray-200 rounded w-3/4" />
        <View className="h-4 bg-gray-200 rounded w-full" />
        <View className="h-4 bg-gray-200 rounded w-2/3" />
        <View className="flex-row" style={{ gap: SPACING.md }}>
          <View className="h-4 bg-gray-200 rounded w-16" />
          <View className="h-4 bg-gray-200 rounded w-20" />
        </View>
      </View>
    </View>
  );
}

export default EventCard;
