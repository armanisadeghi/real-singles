import NotificationBell from "@/components/NotificationBell";
import GradientButton from "@/components/ui/GradientButton";
import { icons } from "@/constants/icons";
import { getReferralLink, APP_NAME } from "@/lib/config";
import { useAuth } from "@/utils/authContext";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Image,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function Refer() {
  const router = useRouter();
  const { user } = useAuth();

  // Get the user's referral code from auth context
  const referralCode = user?.referral_code || '';
  const referralLink = referralCode ? getReferralLink(referralCode) : '';

  const handleCopyCode = async () => {
    if (!referralCode) {
      Alert.alert("Error", "Referral code not available");
      return;
    }
    await Clipboard.setStringAsync(referralCode);
    Alert.alert("Copied!", "Referral code copied to clipboard");
  };

  const handleCopyLink = async () => {
    if (!referralLink) {
      Alert.alert("Error", "Referral link not available");
      return;
    }
    await Clipboard.setStringAsync(referralLink);
    Alert.alert("Copied!", "Referral link copied to clipboard");
  };

  const handleReferFriend = async () => {
    if (!referralCode) {
      Alert.alert("Error", "Referral code not available. Please try again later.");
      return;
    }

    try {
      const result = await Share.share({
        title: `Join me on ${APP_NAME}!`,
        message:
          `Hey! I've been using ${APP_NAME} to meet amazing people and connect with like-minded individuals. Join me using my referral link and get started today! ${referralLink}`,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log("Shared via:", result.activityType);
        } else {
          console.log("Shared successfully");
        }
      } else if (result.action === Share.dismissedAction) {
        console.log("Share dismissed");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };
  return (
    <>
      {/* <StatusBar barStyle="dark-content" backgroundColor="#ffffff" /> */}

      <View className="flex-1 bg-background">
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
              Refer
            </Text>
          </View>

          <NotificationBell />
        </View>
        <View className="mt-20 px-4">
          <View
            style={[styles.shadow, { borderRadius: 20 }]}
            className="bg-white p-6"
          >
            <Text className="text-center font-bold text-[24px] leading-[24px] text-primary my-4">
              Invite Your Friend
            </Text>

            <Text className="text-center mx-8 text-[14px] leading-[18px] text-[#686A6E]">
              Share your referral link and invite your friends via SMS/ Email/
              WhatsApp.
            </Text>

            <Text className="text-center text-[16px] font-medium mt-12 mb-3 text-[#CF944E]">
              Your Referral Code
            </Text>

            <TouchableOpacity 
              onPress={handleCopyCode}
              className="bg-light-100 border border-light-200 rounded-xl items-center py-4 mb-3 w-3/4 mx-auto flex-row justify-center gap-2"
            >
              <Text className="text-[16px] font-medium text-dark">{referralCode || 'Not Available'}</Text>
              <Image
                source={icons.link}
                className="size-4"
                resizeMode="contain"
                tintColor="#686A6E"
              />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleCopyLink}
              className="bg-light-100 border border-light-200 rounded-xl items-center py-3 mb-3 w-3/4 mx-auto"
            >
              <Text className="text-[12px] text-[#686A6E] mb-1">Tap to copy link</Text>
              <Text className="text-[11px] font-medium text-dark" numberOfLines={1}>{referralLink || 'Not Available'}</Text>
            </TouchableOpacity>

            <GradientButton
              text="Share with Friends"
              containerStyle={{
                marginVertical: 30,
                width: "80%",
                marginHorizontal: "auto",
                paddingVertical: 15
              }}
              onPress={handleReferFriend}
            />
          </View>
        </View>
      </View>
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
