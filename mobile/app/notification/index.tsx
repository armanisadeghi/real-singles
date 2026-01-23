import NotificationBell from "@/components/NotificationBell";
import NotificationCard from "@/components/ui/NotificationCard";
import { icons } from "@/constants/icons";
import { getAllNotifications } from "@/lib/api";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";

export default function Notification() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNotiifications = async () => {
    setLoading(true);
    try {
      const res = await getAllNotifications();
      if(res?.success){
        setData(res?.data);
      }else{
        console.log(res?.msg || "Failed to fetch notifications");
        setData([]);
        Toast.show({
          type: "error",
          text1: res?.msg || "Failed to fetch notifications",
          position: "bottom",
          visibilityTime: 2000,
          autoHide: true,
        });
      }
    } catch (error) {
      console.error("Error fetching notifications:", error); 
      setData([]);
      Toast.show({
        type: "error",
        text1: "Failed to fetch notifications.",
        position: "bottom",
        visibilityTime: 2000,
        autoHide: true,
      });
    }finally{
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotiifications();
  }, []);

  const EmptyNotifications = () => (
  <View className="flex-1 items-center justify-center my-20">
    <Image 
      source={icons.bell}
      className="w-16 h-16 mb-4"
      tintColor={"#C07618"}
      resizeMode="contain"
    />
    <Text className="text-lg font-medium text-dark text-center mb-2">
      No Notifications Yet
    </Text>
    <Text className="text-sm text-gray-500 text-center max-w-[250px]">
      You don&apos;t have any notifications at the moment. 
      We&apos;ll notify you when something new happens.
    </Text>
  </View>
);
  return (
    <>
      {/* <StatusBar barStyle="dark-content" backgroundColor="#ffffff" /> */}
      <View className="flex-1 bg-backgground">
        <Toast/>
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
            <Text className="leading-[22px] text-dark text-base font-medium tracking-[-0.41px]">
              Notification
            </Text>
          </View>

          <NotificationBell />
        </View>
        <View className="mt-4 px-2">
          <FlatList
            data={data}
            refreshing={loading}
            onRefresh={fetchNotiifications}
            keyExtractor={(item) => item?.ID.toString()}
            renderItem={({ item }) => <NotificationCard item={item} />}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyNotifications />}
          />
        </View>
      </View>
    </>
  );
}
