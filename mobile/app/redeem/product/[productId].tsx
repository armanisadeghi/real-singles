import LinearBg from "@/components/LinearBg";
import ProductDetails from "@/components/ProductDetails";
import { images } from "@/constants/images";
import { getProductsGiftDetail } from "@/lib/api";
import { ProductCardProps } from "@/types";
import { VIDEO_URL } from "@/utils/token";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Toast from "react-native-toast-message";

export default function ProductDetail() {
  const { productId } = useLocalSearchParams();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [data, setData] = useState<ProductCardProps>();
  const [loading, setLoading] = useState(false);

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
        <ActivityIndicator size="large" color="#000000" />
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
        >
          <BottomSheetScrollView className="relative">
            {data && <ProductDetails product={data} />}
            <View className="flex-row justify-between gap-3 items-center px-4 my-5">
              <TouchableOpacity onPress={handleRedeemForYou} className="border border-border bg-light-100 rounded-[50px] px-7 py-[14px]">
                <Text className="text-gray text-base font-medium">
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
