import NotificationBell from "@/components/NotificationBell";
import ProductCard from "@/components/ui/ProductCard";
import { icons } from "@/constants/icons";
import { getProductsGiftList } from "@/lib/api";
import { ProductCardProps } from "@/types";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Toast from "react-native-toast-message";

interface Data {
  status: string;
  success: boolean;
  Featured: ProductCardProps[];
  NewArrival: ProductCardProps[];
}

export default function Redeem() {
  const router = useRouter();

  const [data, setData] = useState<Data>();
  const [loading, setLoading] = useState(false);

  const fetchProductsGiftsList = async () => {
    setLoading(true);
    try {
      const res = await getProductsGiftList();
      console.log("Products gifts list fetched successfully:", res);
      
      if (res?.success) {
        setData(res || {});
      }else{
        Toast.show({
          type: "error",
          text1: res?.msg || "Failed to fetch products gifts list",
          position: "bottom",
          visibilityTime: 2000,
          autoHide: true,
        });
        console.log("Failed to fetch products gifts list:", res?.msg);
      }
    } catch (error) {
      console.error("Error fetching products gifts list:", error);
      // Handle error appropriately, e.g., show a toast message
      Toast.show({
        type: "error",
        text1: "Something went wrong",
        position: "bottom",
        visibilityTime: 2000,
        autoHide: true,
      });
    }finally{
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsGiftsList();
  }, []);

  const { width } = Dimensions.get("window");
  const columnWidth = (width - 32 - 15) / 2;



  const CurrentEventsHeader = () => (
    <>
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-bold text-primary">
          Featured Products
        </Text>
      </View>

      {/* Horizontal FlatList with 15px spacing */}
      <FlatList
        data={data?.Featured}
        keyExtractor={(item) => item?.ProductID.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 15 }}
        ItemSeparatorComponent={() => <View style={{ width: 15 }} />}
        renderItem={({ item }) => (
          <View>
            <ProductCard product={item} />
          </View>
        )}
      />

      <View className="flex-row justify-between items-center mt-6 mb-4">
        <Text className="text-lg font-bold text-primary">New Arrivals</Text>
      </View>
    </>
  );

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
            <Text className="leading-[22px] text-base font-medium tracking-[-0.41px] text-dark">
              Redeem Points
            </Text>
          </View>

          <NotificationBell />
        </View>
        <View className="mt-8 pb-36">
          <FlatList
            data={data?.NewArrival}
            keyExtractor={(item) => item?.ProductID.toString()}
            numColumns={2}
            columnWrapperStyle={{
              justifyContent: "space-between",
              marginBottom: 15,
              gap: 15,
            }}
            renderItem={({ item, index }) => (
                <ProductCard product={item} />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 40,
              paddingHorizontal: 16,
            }}
            ListHeaderComponent={<CurrentEventsHeader />}
          />
        </View>
      </View>
    </>
  );
}
