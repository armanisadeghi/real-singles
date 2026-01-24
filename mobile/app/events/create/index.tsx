import CreateEventForm from "@/components/forms/CreateEventForm";
import NotificationBell from "@/components/NotificationBell";
import { icons } from "@/constants/icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";

export default function CreateEvent() {
  const router = useRouter();
   const showMsg = (e: any) => {
      // console.log("event create form submitted successfully:", e);
      Toast.show({
        type: e?.success ? "success" : "error",
        text1: e?.msg || "Event created successfully!",
        position: "bottom",
        visibilityTime: 2000,
        autoHide: true,
      });
      router.replace(`/events/event/${e?.data?.EventID}`);
    }
  return (
    <>
      <SafeAreaView className="flex-1 bg-background">
        {/* <StatusBar barStyle="dark-content" backgroundColor="#ffffff" /> */}
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
          <Toast />
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
              Create Event
            </Text>
          </View>

          <NotificationBell />
        </View>
        <ScrollView className="pt-8 px-4">
          <View className="mb-6">
            <Text className="text-primary font-bold text-lg">Create Event</Text>
            <Text className="text-sm font-normal text-[#686A6F] leading-5">
              Provide information to help attendees find and join your
              event.
            </Text>
          </View>
          <CreateEventForm showMsg={showMsg}/>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
