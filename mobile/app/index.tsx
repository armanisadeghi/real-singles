import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { getToken } from "@/utils/token";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ScrollView, StatusBar, View } from "react-native";

export default function Index() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const token = await getToken();

        if (token) {
          router.replace("/(tabs)");
        } else {
          router.replace("/(auth)");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.replace("/(auth)");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <>
      {isLoading && (
        <>
          <StatusBar hidden />
          <ScrollView className="flex-1 bg-white">
            <View className="flex-col justify-center items-baseline h-screen">
              <Image
                source={images.splash1}
                resizeMode="cover"
                className="w-full"
              />
              {/* <Image
                source={images.logo}
                resizeMode="contain"
                className="w-60 mx-auto"
              /> */}
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
