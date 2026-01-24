import { icons } from "@/constants/icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { Image, TouchableOpacity } from "react-native";
import LinearBg from "./LinearBg";

export default function NotificationBell() {
  const router = useRouter();
  
  const handlePress = useCallback(() => {
    // Haptic feedback for navigation - light tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/notification');
  }, [router]);

  return (
    <TouchableOpacity onPress={handlePress} className="border border-[#C07618] rounded-lg overflow-hidden flex justify-center items-center w-8 h-8 bg-primary">
      <LinearBg className="w-full h-full flex justify-center items-center">
        <Image source={icons.bell} tintColor="#ffffff" className="w-5 h-5" resizeMode="contain" />
      </LinearBg>
    </TouchableOpacity>
  );
}
