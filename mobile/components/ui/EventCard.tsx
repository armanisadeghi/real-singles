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
import { useCardDimensions } from "@/hooks/useResponsive";
import { TYPOGRAPHY, SPACING } from "@/constants/designTokens";

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

  // Responsive card dimensions (2 columns, 1.18 aspect ratio)
  const { width: cardWidth, height: cardHeight } = useCardDimensions(2, 1.18);

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
      <TouchableOpacity
        className="relative rounded-card overflow-hidden"
        style={{ width: cardWidth, height: cardHeight }}
      >
        {EventImage ? (
          <ImageBackground
            source={{ uri: EventImage.startsWith('uploads/') ? `${IMAGE_URL}${EventImage}` : VIDEO_URL+EventImage }}
            className="w-full h-full rounded-card overflow-hidden"
            resizeMode="cover"
          >
            {renderContent()}
          </ImageBackground>
        ) : (
          <View style={{ backgroundColor, width: '100%', height: '100%' }} className="justify-center items-center rounded-card">
            <Text className="text-white font-bold" style={TYPOGRAPHY.h2}>{initials}</Text>
            {renderContent()}
          </View>
        )}
      </TouchableOpacity>
    </Link>
  );

  function renderContent() {
    return (
      <>
        <View
          className="absolute flex-row items-center"
          style={{ top: SPACING.sm, right: SPACING.sm, gap: SPACING.xs }}
        >
          <View
            className="flex-row items-center bg-white rounded-full shadow-sm"
            style={{
              gap: SPACING.xxs,
              paddingHorizontal: SPACING.sm,
              paddingVertical: SPACING.xxs
            }}
          >
            <Text
              className={`font-medium ${EventPrice === '0' ? 'text-green-600' : 'text-dark'}`}
              style={TYPOGRAPHY.caption2}
            >
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
          <View
            className="absolute z-20"
            style={{ bottom: SPACING.md, left: SPACING.sm }}
          >
            <Text className="text-white font-bold" style={TYPOGRAPHY.subheadline}>
              {EventName}
            </Text>
            <Text className="text-white font-normal" style={TYPOGRAPHY.caption1}>
              {State}{State ? ',' : ''} {City}
            </Text>
          </View>
        </LinearGradient>
      </>
    );
  }
}