import GradientButton from "@/components/ui/GradientButton";
import { icons } from "@/constants/icons";
import { useThemeColors } from "@/context/ThemeContext";
import { getReferralLink, APP_NAME } from "@/lib/config";
import { useAuth } from "@/utils/authContext";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Alert,
  Image,
  Platform,
  PlatformColor,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";

export default function Refer() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useThemeColors();

  const themedColors = {
    cardBackground: Platform.OS === 'ios' ? (PlatformColor('secondarySystemBackground') as unknown as string) : colors.surfaceContainerLow,
    secondaryText: Platform.OS === 'ios' ? (PlatformColor('secondaryLabel') as unknown as string) : colors.onSurfaceVariant,
    inputBackground: Platform.OS === 'ios' ? (PlatformColor('tertiarySystemBackground') as unknown as string) : colors.surfaceContainerHighest,
    border: Platform.OS === 'ios' ? (PlatformColor('separator') as unknown as string) : colors.outline,
    text: Platform.OS === 'ios' ? (PlatformColor('label') as unknown as string) : colors.onSurface,
  };

  // Get the user's referral code from auth context
  const referralCode = user?.referral_code || '';
  const referralLink = referralCode ? getReferralLink(referralCode) : '';

  const handleCopyCode = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!referralCode) {
      Alert.alert("Error", "Referral code not available");
      return;
    }
    await Clipboard.setStringAsync(referralCode);
    Alert.alert("Copied!", "Referral code copied to clipboard");
  };

  const handleCopyLink = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
      const shareMessage = `Hey! I've been using ${APP_NAME} to meet amazing people and connect with like-minded individuals. Join me using my referral link!`;
      
      // On iOS, pass URL separately for better link preview support
      // On Android, include URL in the message
      const result = await Share.share(
        Platform.OS === 'ios'
          ? {
              message: shareMessage,
              url: referralLink,
            }
          : {
              title: `Join me on ${APP_NAME}!`,
              message: `${shareMessage} ${referralLink}`,
            }
      );

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
      {/* Native header is configured in _layout.tsx - no custom header needed */}
      <View className="flex-1 bg-background">
        <View className="mt-8 px-4">
          <View
            style={[styles.shadow, { borderRadius: 20, backgroundColor: themedColors.cardBackground }]}
            className="p-6"
          >
            <Text className="text-center font-bold text-[24px] leading-[24px] text-primary my-4">
              Invite Your Friend
            </Text>

            <Text style={{ color: themedColors.secondaryText }} className="text-center mx-8 text-[14px] leading-[18px]">
              Share your referral link and invite your friends via SMS/ Email/
              WhatsApp.
            </Text>

            <Text className="text-center text-[16px] font-medium mt-12 mb-3 text-[#CF944E]">
              Your Referral Code
            </Text>

            <TouchableOpacity 
              onPress={handleCopyCode}
              style={{ backgroundColor: themedColors.inputBackground, borderColor: themedColors.border }}
              className="border rounded-xl items-center py-4 mb-3 w-3/4 mx-auto flex-row justify-center gap-2"
            >
              <Text style={{ color: themedColors.text }} className="text-[16px] font-medium">{referralCode || 'Not Available'}</Text>
              <Image
                source={icons.link}
                className="size-4"
                resizeMode="contain"
                tintColor={themedColors.secondaryText}
              />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleCopyLink}
              style={{ backgroundColor: themedColors.inputBackground, borderColor: themedColors.border }}
              className="border rounded-xl items-center py-3 mb-3 w-3/4 mx-auto"
            >
              <Text style={{ color: themedColors.secondaryText }} className="text-[12px] mb-1">Tap to copy link</Text>
              <Text style={{ color: themedColors.text }} className="text-[11px] font-medium" numberOfLines={1}>{referralLink || 'Not Available'}</Text>
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
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
});
