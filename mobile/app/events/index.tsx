import CurrentEventCard from "@/components/ui/CurrentEventCard";
import PastEventCard from "@/components/ui/PastEventCard";
import { getAllEvents } from "@/lib/api";
import { getCurrentUserId } from "@/utils/token";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  PlatformColor,
  RefreshControl,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SymbolView } from "expo-symbols";

export default function Events() {
  const router = useRouter();
  const [data, setData] = useState<any[any]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserid, setCurrentUserId] = useState<string | null>(null);

  const fetchAllEvents = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      setLoading(true);
    }
    
    try {
      const currUserId = await getCurrentUserId();
      setCurrentUserId(currUserId);
      const res = await getAllEvents();
      console.log("Fetched events:", res);

      if (res?.success) {
        setData(res);
        if (isRefresh) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        console.log(res?.msg || "Failed to fetch events");
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    fetchAllEvents(true);
  }, [fetchAllEvents]);

  useEffect(() => {
    fetchAllEvents();
  }, []);
  const CurrentEventsHeader = () => (
    <>
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-bold text-primary">Current Events</Text>
      </View>

      <FlatList
        // data={data?.currentEvent}
        data={data?.currentEvent}
        keyExtractor={(item) => item.EventID.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 20 }}
        renderItem={({ item }) => (
          <View style={{ marginRight: 16, marginBottom: 24 }}>
            <CurrentEventCard currentEvent={item} currUserId={currentUserid || ""} />
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray">No current events available</Text>
          </View>
        )}
      />

      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-bold text-primary">Past Events</Text>
      </View>
    </>
  );
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator 
          size="large" 
          color={Platform.OS === "ios" ? (PlatformColor("systemPink") as unknown as string) : "#E91E63"} 
        />
      </View>
    );
  }
  return (
    <>
      {/* <StatusBar barStyle="dark-content" backgroundColor="#ffffff" /> */}
      <View className="flex-1 bg-background">
        <View className="mt-4 pb-36">
          <FlatList
            data={data?.pastEvent}
            keyExtractor={(item) => item.EventID.toString()}
            renderItem={({ item }) => (
              <View className="mb-3">
                <PastEventCard pastEvent={item} />
              </View>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}
            ListHeaderComponent={<CurrentEventsHeader />}
            ListEmptyComponent={() => (
              <View className="flex-1 justify-center items-center py-8">
                {Platform.OS === "ios" && (
                  <SymbolView
                    name="calendar.badge.exclamationmark"
                    style={{ width: 48, height: 48, marginBottom: 12 }}
                    tintColor={Platform.select({ ios: PlatformColor("secondaryLabel") as unknown as string, default: "#8E8E93" })}
                  />
                )}
                <Text className="text-gray">No events available</Text>
              </View>
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Platform.OS === "ios" ? (PlatformColor("systemPink") as unknown as string) : "#E91E63"}
              />
            }
          />
        </View>
      </View>
    </>
  );
}
