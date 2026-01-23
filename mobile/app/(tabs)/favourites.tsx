import NotificationBell from "@/components/NotificationBell";
import ProfileCard from "@/components/ui/ProfileCard";
import { icons } from "@/constants/icons";
import { getFavouriteList } from "@/lib/api";
import { User } from "@/types";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Toast from "react-native-toast-message";

export default function Favourites() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [favouriteProfiles, setFavouriteProfiles] = useState<User[]>([]);

  const fetchFavourites = async () => {
    setLoading(true);
    try {
      const res = await getFavouriteList();
      console.log("Favourites fetched:", res);
      if(res?.success){
        setFavouriteProfiles(res?.data || []);
      }else{
        console.log("Failed to fetch favourites:", res?.msg);
        Toast.show({
          type: "error",
          text1: res?.msg || "Failed to fetch favourites",
          position: "bottom",
          visibilityTime: 2000,
          autoHide: true,
        });
      }
    } catch (error) {
      console.error("Error fetching favourites:", error);
      Toast.show({
        type: "error",
        text1: "Failed to fetch favourites",
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
    fetchFavourites();
  }, []);
  return (
    <>
      {/* <StatusBar barStyle="dark-content" translucent /> */}
      <View className="flex-1 bg-backgground">
      <Toast/>
        <View className="bg-white flex-row justify-between items-center px-4 pt-10 pb-6 rounded-b-xl z-30"
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
            <Text className="leading-[22px] text-base font-medium tracking-[-0.41px] text-black">
              My Favourites
            </Text>
          </View>

          <NotificationBell />
        </View>
        <View className="mt-8 pb-56">
          <FlatList
            data={favouriteProfiles}
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
                  <Text className="text-sm text-gray-500 text-black">No Favourites available</Text>
                </View>
              }
          />
        </View>
      </View>
    </>
  );
}
