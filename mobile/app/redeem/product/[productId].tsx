import LinearBg from "@/components/LinearBg";
import NotificationBell from "@/components/NotificationBell";
import ProductDetails from "@/components/ProductDetails";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { getProductsGiftDetail } from "@/lib/api";
import { ProductCardProps } from "@/types";
import { VIDEO_URL } from "@/utils/token";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
      {/* <StatusBar barStyle="dark-content" backgroundColor="#ffffff" /> */}

      <View className="flex-1 bg-backgground">
        <Toast />
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
              Product Details
            </Text>
          </View>

          <NotificationBell />
        </View>
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
