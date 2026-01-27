import LinearBg from "@/components/LinearBg";
import NotificationBell from "@/components/NotificationBell";
import { icons } from "@/constants/icons";
import { getVirtualSpeedDetails, registerVirtualSlot } from "@/lib/api";
import { VirtualDataListItem, VirtualDateSpeedDetails } from "@/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import Toast from "react-native-toast-message";

export default function Review() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VirtualDateSpeedDetails[]>([]);
  const [virtual, setVirtual] = useState<VirtualDataListItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<VirtualDataListItem>();
  const [registering, setRegistering] = useState(false);

  const { id } = useLocalSearchParams();

  // Android hardware back button handling
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      router.back();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  const fetchVirtualDateDetails = async () => {
    setLoading(true);
    try {
      const res = await getVirtualSpeedDetails(id as string);
      console.log("Virtual Date Details:", res);
      if (res?.success) {
        setData(res?.data);
        setVirtual(res?.data?.virtual_data_list);
      } else {
        Toast.show({
          type: "error",
          text1: res?.msg || "Failed to fetch profile",
          position: "bottom",
          visibilityTime: 2000,
        });
        console.log("Failed to fetch profile:", res?.msg);
      }
    } catch (error) {
      console.error("Error fetching virtual date details:", error);
      Toast.show({
        type: "error",
        text1: "Failed to fetch virtual date details.",
        position: "bottom",
        visibilityTime: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Date TBD";

    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    const formattedDate = date.toLocaleDateString("en-US", options);
    const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" });

    return `${formattedDate} – ${dayOfWeek}`;
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "Time TBD";

    // Extract hours and minutes from the time string
    const [hours, minutes] = timeString.split(":");

    // Convert hours to 12-hour format
    let hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    hour = hour ? hour : 12; // Convert 0 to 12

    // Format as "01:30 PM"
    return `${hour.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  };

  const handleRegister = async () => {
    try {
      const data = new FormData();
      // data.append("OtherID", selectedDate?.VirtualDateID);
      data.append("SlotsID", selectedDate?.SlotID || "");
      console.log("Registering for virtual date with data:", data);

      setRegistering(true);
      const res = await registerVirtualSlot(data);
      console.log("Register Virtual Date Response:", res);
      
      if (res?.success) {
        Toast.show({
          type: "success",
          text1: "Registered Successfully!",
          text2: `You have registered for the virtual date on ${formatDate(selectedDate?.VirtualDate || "")} at ${formatTime(selectedDate?.StartTime || "")}.`,
          position: "bottom",
          autoHide: false,
        });
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 1000);
      } else {
        Toast.show({
          type: "error",
          text1: res?.msg || "Failed to register for virtual date",
          position: "bottom",
          visibilityTime: 2000,
        });
        console.log("Failed to register for virtual date:", res);
      }
    } catch (error) {
      console.error("Error registering for virtual date:", error);
      Toast.show({
        type: "error",
        text1: "Failed to register for virtual date.",
        position: "bottom",
        visibilityTime: 2000,
      });
    }finally{
      setRegistering(false);
    }
  };

  useEffect(() => {
    fetchVirtualDateDetails();
  }, [id]);

  if (loading) {
    return (
      <View className="w-full h-full flex items-center justify-center py-4">
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <>
      {/* <StatusBar barStyle="dark-content" backgroundColor="#ffffff" /> */}

      <SafeAreaView className="flex-1 bg-background" edges={['left', 'right', 'bottom']}>
        <Toast />
        <View
          className="bg-white flex-row justify-between items-center px-4 pb-6 rounded-b-xl z-30"
          style={{
            paddingTop: insets.top + 8,
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
              Virtual Date
            </Text>
          </View>

          <NotificationBell />
        </View>
        <Toast />
        <View className="mt-10 px-6">
          <View className="mb-6">
            <Text className="text-primary font-bold text-2xl">
              Virtual Speed Dating
            </Text>
            <Text className="text-[#303030] font-normal text-[15px]">
              Claim your spot at the next one now
            </Text>
          </View>
          <View
            style={[styles.shadow, { borderRadius: 20 }]}
            className="bg-white p-6 my-8"
          >
            <Text>Choose One</Text>

            <ScrollView className="my-6">
              {virtual.length ? (
                virtual.map((item, index) => (
                  <TouchableOpacity
                    key={item?.SlotID}
                    onPress={() => setSelectedDate(item)}
                    className={`p-4 border rounded-[30px] mb-4 ${
                      selectedDate?.SlotID === item?.SlotID
                        ? "bg-[#F3961D33] border-primary"
                        : "bg-light-100 border-border"
                    }`}
                  >
                    <Text className="font-normal text-sm text-dark">
                      {formatDate(item?.VirtualDate)},{" "}
                      {formatTime(item?.StartTime)}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text className="text-gray-500 text-sm">
                  No virtual dates available at the moment.
                </Text>
              )}
            </ScrollView>
          </View>
          <View className="flex-col items-center gap-6 mt-6">
          {/* Register Button with full gradient background */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={!selectedDate || registering}
            className="w-3/4 mx-auto border border-primary rounded-[30px] overflow-hidden"
          >
            <LinearBg className="w-full py-4 items-center justify-center" style={{paddingVertical: 10}}>
              {registering ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="font-medium text-base text-white text-center">
                  Register
                </Text>
              )}
            </LinearBg>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-3/4 mx-auto bg-light-100 border border-border rounded-[30px] py-4 flex items-center justify-center"
          >
            <Text className="font-medium text-base text-gray">Cancel</Text>
          </TouchableOpacity>
        </View>

          {/* <View className="flex-col items-center gap-6 mt-6">
            <TouchableOpacity
              onPress={handleRegister}
              disabled={!selectedDate || registering}
              className="w-3/4 mx-auto border border-primary rounded-[30px] flex items-center justify-center overflow-hidden"
            >
              <LinearBg className="py-4 w-full" style={{paddingVertical: 10}}>
                {registering ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                <Text className="font-medium text-base text-white text-center">
                    Register
                  </Text>
                )}
              </LinearBg>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()} className="w-3/4 mx-auto bg-light-100 border border-border rounded-[30px] py-4 flex items-center justify-center">
              <Text className="font-medium text-base text-gray">Cancel</Text>
            </TouchableOpacity>
          </View> */}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#000000",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
});
