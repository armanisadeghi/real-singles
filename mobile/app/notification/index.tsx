import NotificationCard from "@/components/ui/NotificationCard";
import { icons } from "@/constants/icons";
import { getAllNotifications } from "@/lib/api";
import React, { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";

interface Notification {
  ID: string;
  senderID: string;
  receiverID: string;
  msg: string;
  type: string;
  CreatedDate: string;
  Status: string;
  senderFirstName: string;
  senderLastname: string;
  Image: string;
}

export default function Notification() {
  const [data, setData] = useState<Notification[]>([]);
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
      <View className="flex-1 bg-background">
        <Toast/>
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
