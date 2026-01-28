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
  useColorScheme,
  View,
} from "react-native";
import { SymbolView } from "expo-symbols";
import { SPACING } from "@/constants/designTokens";
import { useCardDimensions } from "@/hooks/useResponsive";

interface EventCardComponentProps {
  event: EventCardProps;
}

/**
 * Clean, native EventCard for horizontal scrolls
 * Shows only: Image with date badge, Title (2 lines), Location
 * Detailed info available on event detail page
 * 
 * Dark mode support:
 * - iOS: Uses PlatformColor() which adapts automatically
 * - Android: Uses useColorScheme() with appropriate fallbacks
 */
export function EventCard({ event }: EventCardComponentProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  
  // Match ProfileCard width for consistent horizontal scroll layout
  const { width: cardWidth } = useCardDimensions(2, 1.18);
  
  const location = [event.City, event.State].filter(Boolean).join(", ");
  const isRegistered = event.isMarkInterested === 1;
  
  // Theme-aware colors for Android (iOS uses PlatformColor automatically)
  const androidColors = {
    cardBackground: isDark ? "#2C2C2E" : "#F5F5F5",
    labelPrimary: isDark ? "#FFFFFF" : "#1F2937",
    labelSecondary: isDark ? "#9CA3AF" : "#6B7280",
    skeleton: isDark ? "#3A3A3C" : "#E5E7EB",
  };

  // Compact date format
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getImageUri = () => {
    if (!event.EventImage) return null;
    if (event.EventImage.startsWith("http")) return event.EventImage;
    if (event.EventImage.startsWith("uploads/")) return `${IMAGE_URL}${event.EventImage}`;
    return VIDEO_URL + event.EventImage;
  };

  const imageUri = getImageUri();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push(`/events/event/${event.EventID}` as any);
      }}
      className="rounded-xl overflow-hidden"
      style={{
        width: cardWidth,
        backgroundColor: Platform.OS === "ios" 
          ? (PlatformColor("secondarySystemBackground") as unknown as string)
          : androidColors.cardBackground,
      }}
    >
      {/* Image with overlays */}
      <View style={{ aspectRatio: 16 / 10 }} className="relative">
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
                style={{ width: 32, height: 32 }}
                tintColor="rgba(255,255,255,0.5)"
              />
            ) : (
              <PlatformIcon name="event" size={32} color="rgba(255,255,255,0.5)" />
            )}
          </View>
        )}

        {/* RSVP indicator - subtle checkmark */}
        {isRegistered && (
          <View 
            className="absolute top-2 right-2 rounded-full justify-center items-center"
            style={{ 
              width: 24, 
              height: 24, 
              backgroundColor: "rgba(34, 197, 94, 0.95)",
            }}
          >
            {Platform.OS === "ios" ? (
              <SymbolView
                name="checkmark"
                style={{ width: 12, height: 12 }}
                tintColor="#FFFFFF"
                type="monochrome"
              />
            ) : (
              <PlatformIcon name="check" size={12} color="#FFFFFF" />
            )}
          </View>
        )}

        {/* Date badge */}
        <View 
          className="absolute bottom-2 left-2 px-2 py-1 rounded-md"
          style={{ 
            backgroundColor: "rgba(0,0,0,0.7)",
          }}
        >
          <Text 
            className="font-semibold text-white"
            style={{ fontSize: 11 }}
          >
            {formatDate(event.EventDate)}
          </Text>
        </View>
      </View>

      {/* Content - minimal */}
      <View style={{ padding: SPACING.sm }}>
        {/* Event name - up to 2 lines */}
        <Text 
          className="font-semibold"
          style={{ 
            fontSize: 14,
            lineHeight: 18,
            color: Platform.OS === "ios" 
              ? (PlatformColor("label") as unknown as string)
              : androidColors.labelPrimary,
          }}
          numberOfLines={2}
        >
          {event.EventName}
        </Text>

        {/* Location - single line with icon */}
        {location && (
          <View className="flex-row items-center mt-1" style={{ gap: 3 }}>
            {Platform.OS === "ios" ? (
              <SymbolView
                name="location.fill"
                style={{ width: 10, height: 10 }}
                tintColor={PlatformColor("secondaryLabel") as unknown as string}
              />
            ) : (
              <PlatformIcon name="place" size={10} color={androidColors.labelSecondary} />
            )}
            <Text 
              style={{ 
                fontSize: 12,
                color: Platform.OS === "ios" 
                  ? (PlatformColor("secondaryLabel") as unknown as string)
                  : androidColors.labelSecondary,
              }}
              numberOfLines={1}
            >
              {location}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

/**
 * Skeleton loader for EventCard
 */
export function EventCardSkeleton() {
  const { width: cardWidth } = useCardDimensions(2, 1.18);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  
  // Theme-aware skeleton colors
  const skeletonBg = Platform.OS === "ios"
    ? (PlatformColor("secondarySystemBackground") as unknown as string)
    : isDark ? "#2C2C2E" : "#F5F5F5";
  const skeletonItem = Platform.OS === "ios"
    ? (PlatformColor("systemGray5") as unknown as string)
    : isDark ? "#3A3A3C" : "#E5E7EB";
  
  return (
    <View 
      className="rounded-xl overflow-hidden"
      style={{
        width: cardWidth,
        backgroundColor: skeletonBg,
      }}
    >
      <View style={{ aspectRatio: 16 / 10, backgroundColor: skeletonItem }} />
      <View style={{ padding: SPACING.sm, gap: 6 }}>
        <View style={{ height: 14, backgroundColor: skeletonItem, borderRadius: 4, width: "90%" }} />
        <View style={{ height: 14, backgroundColor: skeletonItem, borderRadius: 4, width: "60%" }} />
        <View style={{ height: 12, backgroundColor: skeletonItem, borderRadius: 4, width: "50%", marginTop: 2 }} />
      </View>
    </View>
  );
}

export default EventCard;
