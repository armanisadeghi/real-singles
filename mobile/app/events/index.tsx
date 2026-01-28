import { EventCard, EventCardSkeleton } from "@/components/ui/EventCard";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { SPACING, TYPOGRAPHY, VERTICAL_SPACING } from "@/constants/designTokens";
import { useSafeArea, useBottomSpacing, useHeaderSpacing } from "@/hooks/useResponsive";
import { EventCardProps } from "@/types";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { Stack } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  PlatformColor,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { apiRequest } from "@/lib/api";

type FilterStatus = "upcoming" | "past";

export default function EventsPage() {
  const [events, setEvents] = useState<EventCardProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>("upcoming");
  const [error, setError] = useState<string | null>(null);

  const safeArea = useSafeArea();
  const { contentPadding } = useBottomSpacing(true);

  const fetchEvents = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const res = await apiRequest(`/events?status=${filter}&limit=50`);
      
      if (res?.success) {
        setEvents(res.data || []);
        if (showRefresh) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        throw new Error(res?.msg || "Failed to fetch events");
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Unable to load events. Please try again.");
      if (showRefresh) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const onRefresh = useCallback(() => {
    fetchEvents(true);
  }, [fetchEvents]);

  const handleFilterChange = (newFilter: FilterStatus) => {
    if (newFilter !== filter) {
      Haptics.selectionAsync();
      setFilter(newFilter);
    }
  };

  const primaryColor = Platform.OS === "ios" 
    ? (PlatformColor("systemPink") as unknown as string) 
    : "#B06D1E";

  // Header component with filter tabs
  const ListHeader = () => (
    <View style={{ paddingBottom: VERTICAL_SPACING.md }}>
      {/* Page Header */}
      <View 
        className="flex-row items-center" 
        style={{ 
          paddingHorizontal: SPACING.screenPadding, 
          paddingTop: SPACING.md,
          paddingBottom: SPACING.base,
          gap: SPACING.md,
        }}
      >
        <View 
          className="rounded-full justify-center items-center"
          style={{ 
            width: 44, 
            height: 44, 
            backgroundColor: Platform.OS === "ios" 
              ? (PlatformColor("systemPink") as unknown as string) + "20"
              : "#B06D1E20"
          }}
        >
          {Platform.OS === "ios" ? (
            <SymbolView
              name="calendar"
              style={{ width: 22, height: 22 }}
              tintColor={primaryColor}
            />
          ) : (
            <PlatformIcon name="event" size={22} color={primaryColor} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text className="font-bold text-gray-900" style={TYPOGRAPHY.h3}>
            Events
          </Text>
          <Text className="text-gray-500" style={{ fontSize: 13 }}>
            Discover and RSVP to upcoming events
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View 
        className="flex-row"
        style={{ 
          paddingHorizontal: SPACING.screenPadding, 
          gap: SPACING.sm,
        }}
      >
        <TouchableOpacity
          onPress={() => handleFilterChange("upcoming")}
          className="rounded-full"
          style={{
            paddingHorizontal: SPACING.base,
            paddingVertical: SPACING.sm,
            backgroundColor: filter === "upcoming" ? primaryColor : "#F3F4F6",
          }}
          activeOpacity={0.7}
        >
          <Text
            className="font-medium"
            style={{
              fontSize: 14,
              color: filter === "upcoming" ? "#FFFFFF" : "#4B5563",
            }}
          >
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleFilterChange("past")}
          className="rounded-full"
          style={{
            paddingHorizontal: SPACING.base,
            paddingVertical: SPACING.sm,
            backgroundColor: filter === "past" ? primaryColor : "#F3F4F6",
          }}
          activeOpacity={0.7}
        >
          <Text
            className="font-medium"
            style={{
              fontSize: 14,
              color: filter === "past" ? "#FFFFFF" : "#4B5563",
            }}
          >
            Past
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Empty state component
  const EmptyState = () => (
    <View 
      className="items-center justify-center" 
      style={{ paddingVertical: VERTICAL_SPACING.xl * 2 }}
    >
      {Platform.OS === "ios" ? (
        <SymbolView
          name="calendar.badge.exclamationmark"
          style={{ width: 64, height: 64, marginBottom: SPACING.md }}
          tintColor={Platform.select({ 
            ios: PlatformColor("secondaryLabel") as unknown as string, 
            default: "#8E8E93" 
          })}
        />
      ) : (
        <PlatformIcon 
          name="event-busy" 
          size={64} 
          color="#8E8E93" 
          style={{ marginBottom: SPACING.md }}
        />
      )}
      <Text 
        className="font-semibold text-gray-700 text-center"
        style={TYPOGRAPHY.body}
      >
        {filter === "upcoming" ? "No upcoming events" : "No past events"}
      </Text>
      <Text 
        className="text-gray-500 text-center"
        style={{ fontSize: 14, marginTop: SPACING.xs, paddingHorizontal: SPACING.xl }}
      >
        {filter === "upcoming"
          ? "Check back later for new events in your area"
          : "Past events will appear here"}
      </Text>
    </View>
  );

  // Error state component
  const ErrorState = () => (
    <View 
      className="items-center justify-center" 
      style={{ paddingVertical: VERTICAL_SPACING.xl * 2 }}
    >
      {Platform.OS === "ios" ? (
        <SymbolView
          name="exclamationmark.triangle"
          style={{ width: 48, height: 48, marginBottom: SPACING.md }}
          tintColor="#EF4444"
        />
      ) : (
        <PlatformIcon 
          name="error-outline" 
          size={48} 
          color="#EF4444" 
          style={{ marginBottom: SPACING.md }}
        />
      )}
      <Text className="text-red-500 text-center mb-4" style={TYPOGRAPHY.body}>
        {error}
      </Text>
      <TouchableOpacity
        onPress={() => fetchEvents()}
        className="rounded-full"
        style={{
          paddingHorizontal: SPACING.base,
          paddingVertical: SPACING.sm,
          backgroundColor: primaryColor,
        }}
        activeOpacity={0.7}
      >
        <Text className="text-white font-medium" style={{ fontSize: 14 }}>
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Loading skeletons
  const LoadingSkeletons = () => (
    <View style={{ paddingHorizontal: SPACING.screenPadding, gap: SPACING.md }}>
      {[...Array(6)].map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "Events",
          headerLargeTitle: Platform.OS === "ios",
          headerLargeTitleShadowVisible: false,
          headerBlurEffect: Platform.OS === "ios" ? "regular" : undefined,
          headerTransparent: Platform.OS === "ios",
        }}
      />
      
      <View className="flex-1 bg-gray-50">
        {isLoading && !isRefreshing ? (
          <FlatList
            data={[]}
            renderItem={() => null}
            ListHeaderComponent={ListHeader}
            ListFooterComponent={LoadingSkeletons}
            contentContainerStyle={{ paddingBottom: contentPadding }}
          />
        ) : error ? (
          <FlatList
            data={[]}
            renderItem={() => null}
            ListHeaderComponent={ListHeader}
            ListFooterComponent={ErrorState}
            contentContainerStyle={{ paddingBottom: contentPadding }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor={primaryColor}
              />
            }
          />
        ) : (
          <FlatList
            data={events}
            keyExtractor={(item) => item.EventID}
            renderItem={({ item }) => (
              <View style={{ paddingHorizontal: SPACING.screenPadding }}>
                <EventCard event={item} />
              </View>
            )}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={EmptyState}
            contentContainerStyle={{
              paddingBottom: contentPadding,
              gap: SPACING.md,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor={primaryColor}
              />
            }
          />
        )}
      </View>
    </>
  );
}
