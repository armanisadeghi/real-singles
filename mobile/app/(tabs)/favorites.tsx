import NotificationBell from "@/components/NotificationBell";
import ProfileListItem from "@/components/ui/ProfileListItem";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { VERTICAL_SPACING } from "@/constants/designTokens";
import { getFavoriteList } from "@/lib/api";
import { User } from "@/types";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Text,
  View
} from "react-native";
import Toast from "react-native-toast-message";

export default function Favorites() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [favoriteProfiles, setFavoriteProfiles] = useState<User[]>([]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const res = await getFavoriteList();
      console.log("Favorites fetched:", res);
      if(res?.success){
        setFavoriteProfiles(res?.data || []);
      }else{
        console.log("Failed to fetch favorites:", res?.msg);
        Toast.show({
          type: "error",
          text1: res?.msg || "Failed to fetch favorites",
          position: "bottom",
          visibilityTime: 2000,
          autoHide: true,
        });
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
      Toast.show({
        type: "error",
        text1: "Failed to fetch favorites",
        position: "bottom",
        bottomOffset: 100,
        visibilityTime: 2000,
        autoHide: true,
      });
    }finally{
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFavorites();
  }, []);
  return (
    <>
      {/* <StatusBar barStyle="dark-content" translucent /> */}
      <View className="flex-1 bg-background">
      <Toast/>
        <ScreenHeader
          title="My Favorites"
          showBackButton
          onBackPress={router.back}
          rightContent={<NotificationBell />}
        />
        <View className="mt-4 pb-56">
          <FlatList
            data={favoriteProfiles}
            contentContainerStyle={{
              gap: VERTICAL_SPACING.xs,
            }}
            renderItem={({ item }) => (
              <ProfileListItem
                key={item?.ID}
                profile={item}
                navigateToFocus={true}
              />
            )}
            keyExtractor={(item, index) => `${index}`}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
                <View className="flex-1 items-center justify-center py-20" >
                  <Text className="text-sm text-gray-500 text-black">No Favorites available</Text>
                </View>
              }
          />
        </View>
      </View>
    </>
  );
}
