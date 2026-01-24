import NotificationBell from "@/components/NotificationBell";
import ProfileCard from "@/components/ui/ProfileCard";
import { icons } from "@/constants/icons";
import { SPACING, TYPOGRAPHY, VERTICAL_SPACING } from "@/constants/designTokens";
import { getHomeScreenData } from "@/lib/api";
import { User } from "@/types";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function Discover() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [discoverProfiles, setDiscoverProfiles] = useState<User[]>([]);

  const fetchDiscoverProfiles = async () => {
    setLoading(true);
    try {
      const res = await getHomeScreenData();
      console.log("Discover profiles fetched:", res);
      if (res?.success) {
        // Combine TopMatch and NearBy for discover feed
        const allProfiles = [
          ...(res?.TopMatch || []),
          ...(res?.NearBy || []),
        ];
        setDiscoverProfiles(allProfiles);
      } else {
        console.log("Failed to fetch discover profiles:", res?.msg);
        Toast.show({
          type: "error",
          text1: res?.msg || "Failed to fetch profiles",
          position: "bottom",
          visibilityTime: 2000,
          autoHide: true,
        });
      }
    } catch (error) {
      console.error("Error fetching discover profiles:", error);
      Toast.show({
        type: "error",
        text1: "Failed to fetch profiles",
        position: "bottom",
        bottomOffset: 100,
        visibilityTime: 2000,
        autoHide: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchDiscoverProfiles();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDiscoverProfiles();
  }, []);

  return (
    <>
      <View className="flex-1 bg-background">
        <Toast />
        <View
          className="bg-white flex-row justify-between items-center rounded-b-xl z-30"
          style={{
            paddingHorizontal: SPACING.screenPadding,
            paddingTop: 40,
            paddingBottom: VERTICAL_SPACING.md,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 16,
            elevation: 5,
          }}
        >
          <View className="flex-row items-center" style={{ gap: SPACING.xs }}>
            <Image
              source={icons.search}
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
            <Text
              className="text-black font-medium"
              style={TYPOGRAPHY.title2}
            >
              Discover
            </Text>
          </View>

          <NotificationBell />
        </View>

        {loading && !refreshing ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#B06D1E" />
          </View>
        ) : (
          <View className="flex-1" style={{ paddingTop: VERTICAL_SPACING.md, paddingBottom: 56 }}>
            <FlatList
              data={discoverProfiles}
              numColumns={2}
              columnWrapperStyle={{
                justifyContent: "space-between",
                paddingHorizontal: SPACING.screenPadding,
                gap: SPACING.md,
                marginBottom: VERTICAL_SPACING.md,
              }}
              renderItem={({ item }) => (
                <ProfileCard key={item?.ID} profile={item} />
              )}
              keyExtractor={(item, index) => `${item?.ID}-${index}`}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#B06D1E"]}
                  tintColor="#B06D1E"
                />
              }
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center py-20">
                  <Text className="text-sm text-gray-500">
                    No profiles available
                  </Text>
                </View>
              }
            />
          </View>
        )}
      </View>
    </>
  );
}
