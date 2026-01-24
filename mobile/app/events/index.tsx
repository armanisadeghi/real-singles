import NotificationBell from "@/components/NotificationBell";
import CurrentEventCard from "@/components/ui/CurrentEventCard";
import PastEventCard from "@/components/ui/PastEventCard";
import { icons } from "@/constants/icons";
import { getAllEvents } from "@/lib/api";
import { getCurrentUserId } from "@/utils/token";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function Events() {
  const router = useRouter();
  const [data, setData] = useState<any[any]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserid, setCurrentUserId] = useState<string | null>(null);

  const fetchAllEvents = async () => {
    setLoading(true);
    try {
      const currUserId = await getCurrentUserId();
      setCurrentUserId(currUserId);
      const res = await getAllEvents();
      console.log("Fetched events:", res);

      if (res?.success) {
        setData(res);
      } else {
        console.log(res?.msg || "Failed to fetch top matches");
      }
    } catch (error) {
      console.error("Error fetching top matches:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllEvents();
  }, []);
  const CurrentEventsHeader = () => (
    <>
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-bold text-primary">Current Events</Text>
        <TouchableOpacity onPress={() => router.push("/events/create")}>
          <Text className="text-xs font-medium underline text-dark">
            Create Event
          </Text>
        </TouchableOpacity>
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
          className="bg-white flex-row justify-between items-center px-4 pt-10 pb-6 rounded-b-xl z-30"
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
            <Text className="leading-[22px] text-base font-medium tracking-[-0.41px]">
              Nearby Events
            </Text>
          </View>

          <NotificationBell />
        </View>
        <View className="mt-8 pb-36">
          <FlatList
            // data={data?.pastEvent}
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
              <View className="flex-1 justify-center items-center">
                <Text className="text-gray">No events available</Text>
              </View>
            )}
          />
        </View>
      </View>
    </>
  );
}
