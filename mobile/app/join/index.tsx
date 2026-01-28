import { useThemeColors } from "@/context/ThemeContext";
import { REFERRAL_CODE_STORAGE_KEY } from "@/lib/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, PlatformColor, Text, View, useColorScheme } from "react-native";

/**
 * Join Page - Handles referral deep links
 * 
 * When someone opens a referral link (e.g., /join?ref=ABC123):
 * 1. Extract the referral code from the URL
 * 2. Store it in AsyncStorage for later use during signup
 * 3. Redirect to the signup flow
 */
export default function JoinPage() {
  const router = useRouter();
  const { ref } = useLocalSearchParams<{ ref?: string }>();
  const [message, setMessage] = useState("Processing your invite...");
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useThemeColors();

  const themedColors = {
    background: Platform.OS === 'ios' ? (PlatformColor('systemBackground') as unknown as string) : colors.background,
    secondaryText: Platform.OS === 'ios' ? (PlatformColor('secondaryLabel') as unknown as string) : colors.onSurfaceVariant,
    cardBackground: Platform.OS === 'ios' ? (PlatformColor('secondarySystemBackground') as unknown as string) : colors.surfaceContainerLow,
    cardBorder: Platform.OS === 'ios' ? (PlatformColor('separator') as unknown as string) : colors.outline,
    cardText: Platform.OS === 'ios' ? (PlatformColor('label') as unknown as string) : colors.onSurface,
  };

  useEffect(() => {
    handleReferral();
  }, [ref]);

  const handleReferral = async () => {
    try {
      // If we have a referral code, store it for later use
      if (ref && ref.trim()) {
        const referralCode = ref.trim().toUpperCase();
        await AsyncStorage.setItem(REFERRAL_CODE_STORAGE_KEY, referralCode);
        setMessage("Invite code saved! Redirecting to sign up...");
        console.log("Stored referral code:", referralCode);
      } else {
        setMessage("Redirecting to sign up...");
      }

      // Small delay so user sees the message
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to signup
      router.replace("/(auth)/signup");
    } catch (error) {
      console.error("Error handling referral:", error);
      setMessage("Something went wrong. Redirecting...");
      
      // Still redirect even if there was an error
      setTimeout(() => {
        router.replace("/(auth)/signup");
      }, 1500);
    }
  };

  return (
    <View style={{ backgroundColor: themedColors.background }} className="flex-1 items-center justify-center px-8">
      <ActivityIndicator size="large" color="#B06D1E" />
      <Text style={{ color: themedColors.secondaryText }} className="text-lg mt-4 text-center">
        {message}
      </Text>
      {ref && (
        <View style={{ backgroundColor: themedColors.cardBackground, borderColor: themedColors.cardBorder }} className="mt-6 rounded-xl px-4 py-3 border">
          <Text style={{ color: themedColors.cardText }} className="text-sm text-center">
            Referral code: <Text className="font-bold">{ref.toUpperCase()}</Text>
          </Text>
        </View>
      )}
    </View>
  );
}
