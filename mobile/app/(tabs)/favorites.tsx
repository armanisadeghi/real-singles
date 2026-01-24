import NotificationBell from "@/components/NotificationBell";
import ProfileCard from "@/components/ui/ProfileCard";
import { getFavoriteList } from "@/lib/api";
import { User } from "@/types";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Platform,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function Favorites() {
  const insets = useSafeAreaInsets();
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
  // Native header height: iOS 44pt, Android 56dp
  const headerHeight = Platform.OS === 'ios' ? 44 : 56;
  
  return (
    <>
      <View className="flex-1 bg-background">
        <Toast/>
        {/* Native-style header for tab screen */}
        <View 
          style={{ 
            paddingTop: insets.top,
            backgroundColor: '#FFFFFF',
          }}
        >
          <View 
            style={{ 
              height: headerHeight,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
            }}
          >
            <View style={{ width: 40 }} />
            <Text style={{ fontSize: 17, fontWeight: '600', color: '#000' }}>
              My Favorites
            </Text>
            <NotificationBell />
          </View>
        </View>
        <View className="pb-56">
          <FlatList
            data={favoriteProfiles}
            numColumns={2}
            columnWrapperStyle={{
              justifyContent: "space-between",
              marginBottom: 20,
              paddingHorizontal: 20,
              gap: 20,
            }}
            renderItem={({ item }) => (
              <ProfileCard
                key={item?.ID}
                profile={item}
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
