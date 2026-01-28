import { EventCard, EventCardSkeleton } from "@/components/ui/EventCard";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { SPACING, TYPOGRAPHY, VERTICAL_SPACING } from "@/constants/designTokens";
import { useBottomSpacing, useCardDimensions } from "@/hooks/useResponsive";
import { EventCardProps } from "@/types";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { Stack } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Platform,
  PlatformColor,
  RefreshControl,
  Text,
  useColorScheme,
  View,
} from "react-native";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { apiRequest } from "@/lib/api";

type FilterStatus = "upcoming" | "past";

export default function EventsPage() {
  const [events, setEvents] = useState<EventCardProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterIndex, setFilterIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { contentPadding } = useBottomSpacing(true);
  const { gap } = useCardDimensions(2, 1.18);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  
  const filter: FilterStatus = filterIndex === 0 ? "upcoming" : "past";
  
  // Theme-aware colors for Android (iOS uses PlatformColor automatically)
  const androidColors = {
    background: isDark ? "#000000" : "#F9FAFB",
    labelPrimary: isDark ? "#FFFFFF" : "#374151",
    labelSecondary: isDark ? "#9CA3AF" : "#6B7280",
  };

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

  const handleFilterChange = (index: number) => {
    if (index !== filterIndex) {
      Haptics.selectionAsync();
      setFilterIndex(index);
    }
  };

  const primaryColor = Platform.OS === "ios" 
    ? (PlatformColor("systemPink") as unknown as string) 
    : "#B06D1E";

  // Native segmented control for filter (iOS) or simple tabs (Android)
  const FilterControl = () => (
    <View style={{ paddingHorizontal: SPACING.screenPadding, paddingVertical: SPACING.sm }}>
      {Platform.OS === "ios" ? (
        <SegmentedControl
          values={["Upcoming", "Past"]}
          selectedIndex={filterIndex}
          onChange={(event) => handleFilterChange(event.nativeEvent.selectedSegmentIndex)}
        />
      ) : (
        <View 
          className="flex-row rounded-lg overflow-hidden"
          style={{ backgroundColor: "#E5E7EB" }}
        >
          {["Upcoming", "Past"].map((label, index) => (
            <View
              key={label}
              style={{
                flex: 1,
                backgroundColor: filterIndex === index ? primaryColor : "transparent",
                paddingVertical: SPACING.sm,
              }}
              onTouchEnd={() => handleFilterChange(index)}
            >
              <Text
                className="text-center font-medium"
                style={{
                  fontSize: 14,
                  color: filterIndex === index ? "#FFFFFF" : "#4B5563",
                }}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  // Empty state component
  const EmptyState = () => (
    <View 
      className="items-center justify-center flex-1" 
      style={{ paddingVertical: VERTICAL_SPACING.xl * 2 }}
    >
      {Platform.OS === "ios" ? (
        <SymbolView
          name="calendar.badge.exclamationmark"
          style={{ width: 56, height: 56, marginBottom: SPACING.md }}
          tintColor={PlatformColor("secondaryLabel") as unknown as string}
        />
      ) : (
        <PlatformIcon 
          name="event-busy" 
          size={56} 
          color={androidColors.labelSecondary}
          style={{ marginBottom: SPACING.md }}
        />
      )}
      <Text 
        className="font-semibold text-center"
        style={{
          ...TYPOGRAPHY.body,
          color: Platform.OS === "ios" 
            ? (PlatformColor("label") as unknown as string)
            : androidColors.labelPrimary,
        }}
      >
        {filter === "upcoming" ? "No Upcoming Events" : "No Past Events"}
      </Text>
      <Text 
        className="text-center"
        style={{ 
          fontSize: 14, 
          marginTop: SPACING.xs, 
          paddingHorizontal: SPACING.xl,
          color: Platform.OS === "ios" 
            ? (PlatformColor("secondaryLabel") as unknown as string)
            : androidColors.labelSecondary,
        }}
      >
        {filter === "upcoming"
          ? "Check back later for new events"
          : "Your past events will appear here"}
      </Text>
    </View>
  );

  // Error state component
  const ErrorState = () => (
    <View 
      className="items-center justify-center flex-1" 
      style={{ paddingVertical: VERTICAL_SPACING.xl * 2 }}
    >
      {Platform.OS === "ios" ? (
        <SymbolView
          name="exclamationmark.triangle"
          style={{ width: 48, height: 48, marginBottom: SPACING.md }}
          tintColor={PlatformColor("systemRed") as unknown as string}
        />
      ) : (
        <PlatformIcon 
          name="error-outline" 
          size={48} 
          color="#EF4444" 
          style={{ marginBottom: SPACING.md }}
        />
      )}
      <Text 
        className="text-center mb-4" 
        style={{
          ...TYPOGRAPHY.body,
          color: Platform.OS === "ios" 
            ? (PlatformColor("systemRed") as unknown as string)
            : "#EF4444",
        }}
      >
        {error}
      </Text>
    </View>
  );

  // Loading skeletons in 2-column grid
  const LoadingSkeletons = () => (
    <View style={{ paddingHorizontal: SPACING.screenPadding }}>
      {[0, 1, 2].map((rowIndex) => (
        <View 
          key={rowIndex}
          style={{ 
            flexDirection: "row", 
            justifyContent: "space-between",
            marginBottom: gap,
          }}
        >
          <EventCardSkeleton />
          <EventCardSkeleton />
        </View>
      ))}
    </View>
  );

  // Render item for 2-column grid
  const renderItem = ({ item }: { item: EventCardProps }) => (
    <EventCard event={item} />
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "Events",
          headerLargeTitle: Platform.OS === "ios",
          headerLargeTitleShadowVisible: false,
          headerBlurEffect: Platform.OS === "ios" ? "regular" : undefined,
          // Don't use headerTransparent with large titles - it breaks content insets
        }}
      />
      
      <View 
        className="flex-1"
        style={{
          backgroundColor: Platform.OS === "ios" 
            ? (PlatformColor("systemBackground") as unknown as string)
            : androidColors.background,
        }}
      >
        {isLoading && !isRefreshing ? (
          <FlatList
            key="loading-list"
            data={[]}
            renderItem={() => null}
            ListHeaderComponent={FilterControl}
            ListFooterComponent={LoadingSkeletons}
            contentContainerStyle={{ paddingBottom: contentPadding }}
            contentInsetAdjustmentBehavior="automatic"
          />
        ) : error ? (
          <FlatList
            key="error-list"
            data={[]}
            renderItem={() => null}
            ListHeaderComponent={FilterControl}
            ListFooterComponent={ErrorState}
            contentContainerStyle={{ paddingBottom: contentPadding, flexGrow: 1 }}
            contentInsetAdjustmentBehavior="automatic"
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
            key="events-list"
            data={events}
            keyExtractor={(item) => item.EventID}
            renderItem={renderItem}
            numColumns={2}
            ListHeaderComponent={FilterControl}
            ListEmptyComponent={EmptyState}
            contentContainerStyle={{
              paddingBottom: contentPadding,
              paddingHorizontal: SPACING.screenPadding,
              flexGrow: 1,
            }}
            columnWrapperStyle={{
              justifyContent: "space-between",
              marginBottom: gap,
            }}
            contentInsetAdjustmentBehavior="automatic"
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
