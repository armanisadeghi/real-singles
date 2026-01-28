import LinearBg from "@/components/LinearBg";
import ProductDetails from "@/components/ProductDetails";
import { images } from "@/constants/images";
import { useThemeColors } from "@/context/ThemeContext";
import { getProductsGiftDetail } from "@/lib/api";
import { ProductCardProps } from "@/types";
import { VIDEO_URL } from "@/utils/token";
import * as Haptics from "expo-haptics";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Platform,
  PlatformColor,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";
import Toast from "react-native-toast-message";

export default function ProductDetail() {
  const { productId } = useLocalSearchParams();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [data, setData] = useState<ProductCardProps>();
  const [loading, setLoading] = useState(false);
  const colors = useThemeColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Note: BottomSheet uses Reanimated which doesn't support PlatformColor objects.
  // Use plain hex colors for BottomSheet backgrounds, PlatformColor for other native components.
  const themedColors = useMemo(() => ({
    // For native components (Text, View, etc.) - can use PlatformColor
    text: Platform.OS === 'ios' ? (PlatformColor('label') as unknown as string) : colors.onSurface,
    secondaryText: Platform.OS === 'ios' ? (PlatformColor('secondaryLabel') as unknown as string) : colors.onSurfaceVariant,
    // For Reanimated components (BottomSheet) - must use plain colors
    background: isDark ? '#000000' : '#FFFFFF',
    secondaryBackground: isDark ? '#1C1C1E' : '#F2F2F7',
  }), [isDark, colors]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const data = new FormData();
      data.append("productid", productId as string);
      const res = await getProductsGiftDetail(data);
      if (res?.success) {
        setData(res?.data || {});
      } else {
        console.log("Failed to fetch product details:", res?.msg);
        Toast.show({
          type: "error",
          text1: res?.msg || "Failed to fetch product details",
          position: "bottom",
          visibilityTime: 2000,
          autoHide: true,
        });
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
      Toast.show({
        type: "error",
        text1: "Something went wrong",
        position: "bottom",
        visibilityTime: 2000,
        autoHide: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const snapPoints = useMemo(() => ["62%", "70%"], []);
  const router = useRouter();

  const handleRedeemForFriend = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/(tabs)/chats",
      params: {
        productId: productId,
        productPoints: data?.Points,
        fromProduct: "true",
      },
    });
  };

  const handleRedeemForYou = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/shipping",
      params: {
        productId: productId,
        productPoints: data?.Points,
        redeemForYou: "true",
      },
    });
  }

  if (loading) {
    return (
      <View className="w-full h-full flex items-center justify-center py-4">
        <ActivityIndicator size="large" color={themedColors.text} />
      </View>
    );
  }
  return (
    <>
      {/* Native header is configured in _layout.tsx - no custom header needed */}
      <View className="flex-1 bg-background">
        <Toast />
        <ImageBackground
          className="h-[253px] mt-[-10px]"
          source={data?.Image ? { uri: VIDEO_URL+data?.Image } : images.product}
          resizeMode="cover"
        ></ImageBackground>
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          index={0}
          enablePanDownToClose={false}
          enableContentPanningGesture={false}
          backgroundStyle={{ backgroundColor: themedColors.background }}
          handleIndicatorStyle={{ backgroundColor: isDark ? '#4B5563' : '#CBD5E1' }}
        >
          <BottomSheetScrollView className="relative" style={{ backgroundColor: themedColors.background }}>
            {data && <ProductDetails product={data} />}
            <View className="flex-row justify-between gap-3 items-center px-4 my-5">
              <TouchableOpacity onPress={handleRedeemForYou} className="border border-border bg-surface-secondary rounded-[50px] px-7 py-[14px]">
                <Text className="text-label-secondary text-base font-medium">
                  Redeem for You
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRedeemForFriend}
                className="border border-border rounded-[50px] overflow-hidden"
              >
                <LinearBg className="px-7 py-[14px]">
                  <Text className="text-white text-base font-medium">
                    Redeem for a Friend
                  </Text>
                </LinearBg>
              </TouchableOpacity>
            </View>
          </BottomSheetScrollView>
        </BottomSheet>
      </View>
    </>
  );
}
