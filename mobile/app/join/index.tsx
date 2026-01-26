import { REFERRAL_CODE_STORAGE_KEY } from "@/lib/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

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
    <View className="flex-1 bg-white items-center justify-center px-8">
      <ActivityIndicator size="large" color="#B06D1E" />
      <Text className="text-lg text-gray-600 mt-4 text-center">
        {message}
      </Text>
      {ref && (
        <View className="mt-6 bg-amber-50 rounded-xl px-4 py-3 border border-amber-200">
          <Text className="text-amber-800 text-sm text-center">
            Referral code: <Text className="font-bold">{ref.toUpperCase()}</Text>
          </Text>
        </View>
      )}
    </View>
  );
}
