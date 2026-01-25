import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { useAuth } from "@/utils/authContext";
import * as SplashScreen from "expo-splash-screen";
import { useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { Image, ScrollView, StatusBar, View } from "react-native";

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [minDelayPassed, setMinDelayPassed] = useState(false);
  const hasNavigated = useRef(false);

  // 500ms minimum display timer for the animated splash
  useEffect(() => {
    const timer = setTimeout(() => setMinDelayPassed(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Navigate when both auth check completes AND minimum delay has passed
  useEffect(() => {
    if (!authLoading && minDelayPassed && !hasNavigated.current) {
      hasNavigated.current = true;
      
      // Hide native splash screen before navigating
      SplashScreen.hideAsync();
      
      // Navigate based on auth state
      if (isAuthenticated) {
        router.replace("/(tabs)");
      } else {
        router.replace("/(auth)");
      }
    }
  }, [authLoading, minDelayPassed, isAuthenticated]);

  // Show animated splash while waiting
  const showSplash = authLoading || !minDelayPassed;

  return (
    <>
      {showSplash && (
        <>
          <StatusBar hidden />
          <ScrollView className="flex-1 bg-white">
            <View className="flex-col justify-center items-baseline h-screen">
              <Image
                source={images.splash1}
                resizeMode="cover"
                className="w-full"
              />
              <Image
                source={icons.ic_splash}
                resizeMode="contain"
                className="w-60 mx-auto"
              />
              <Image
                source={images.splash2}
                resizeMode="cover"
                className="w-full"
              />
            </View>
          </ScrollView>
        </>
      )}
    </>
  );
}
