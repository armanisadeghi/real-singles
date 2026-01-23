import ShippingInfoForm from "@/components/forms/ShippingInfoForm";
import NotificationBell from "@/components/NotificationBell";
import Success from "@/components/signup/Success";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

export default function ShippingInfo() {
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const {productId, selectedUsers, productPoints, redeemForYou} = useLocalSearchParams();

  const handleFormSubmit = () => {
    setSubmitted(true);
  };

  return (
    <>
      {/* <StatusBar barStyle="dark-content" backgroundColor="#ffffff" /> */}
    {
      submitted ? (
        <View className="flex-1 bg-backgground">
        <Success image={images.checkedSuccess} title="Congratulations!" onPress={() => router.replace('/(tabs)')} subTitle="Order Booked Successfully!" desc="Order Number: #LS124535"/>
        </View>
      ) : (
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
            <Text className="leading-[22px] text-dark text-base font-medium tracking-[-0.41px]">
              Shipping Information
            </Text>
          </View>

          <NotificationBell />
        </View>
        <ScrollView className="pt-8 px-4">
            <View className="mb-6">
                <Text className="text-primary font-bold text-lg">Address:</Text>
                <Text className="text-sm font-normal text-[#686A6F] leading-5">Please provide your shipping information</Text>
            </View>
            <ShippingInfoForm productId={productId} productPoints={productPoints} selectedUsers={selectedUsers} redeemForYou={redeemForYou} onSubmitSuccess={handleFormSubmit}/>
        </ScrollView>

      </View>
      )
    }
      
    </>
  );
}
