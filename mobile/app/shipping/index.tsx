import ShippingInfoForm from "@/components/forms/ShippingInfoForm";
import Success from "@/components/signup/Success";
import { images } from "@/constants/images";
import { useThemeColors } from "@/context/ThemeContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Platform, PlatformColor, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

export default function ShippingInfo() {
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const {productId, selectedUsers, productPoints, redeemForYou} = useLocalSearchParams();
  const colors = useThemeColors();

  const themedColors = {
    secondaryText: Platform.OS === 'ios' ? (PlatformColor('secondaryLabel') as unknown as string) : colors.onSurfaceVariant,
  };

  const handleFormSubmit = () => {
    setSubmitted(true);
  };

  return (
    <>
    {
      submitted ? (
        <View className="flex-1 bg-background">
        <Success image={images.checkedSuccess} title="Congratulations!" onPress={() => router.replace('/(tabs)')} subTitle="Order Booked Successfully!" desc="Order Number: #LS124535"/>
        </View>
      ) : (
        <View className="flex-1 bg-background">
        {/* Native header is configured in _layout.tsx - no custom header needed */}
        <ScrollView className="pt-4 px-4">
            <View className="mb-6">
                <Text className="text-primary font-bold text-lg">Address:</Text>
                <Text style={{ color: themedColors.secondaryText }} className="text-sm font-normal leading-5">Please provide your shipping information</Text>
            </View>
            <ShippingInfoForm productId={Array.isArray(productId) ? productId[0] : productId} productPoints={productPoints} selectedUsers={selectedUsers} redeemForYou={Array.isArray(redeemForYou) ? redeemForYou[0] : redeemForYou} onSubmitSuccess={handleFormSubmit}/>
        </ScrollView>

      </View>
      )
    }
      
    </>
  );
}
