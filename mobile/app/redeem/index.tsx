import ProductCard from "@/components/ui/ProductCard";
import { useDeviceSize } from "@/hooks/useResponsive";
import { getProductsGiftList } from "@/lib/api";
import { ProductCardProps } from "@/types";
import React, { useEffect, useState, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Toast from "react-native-toast-message";

interface Data {
  status: string;
  success: boolean;
  Featured: ProductCardProps[];
  NewArrival: ProductCardProps[];
}

export default function Redeem() {
  const { gridColumns } = useDeviceSize();
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

  const { width: screenWidth } = useWindowDimensions();
  const columnWidth = useMemo(() => (screenWidth - 32 - 15) / 2, [screenWidth]);



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
      {/* Native header is configured in _layout.tsx - no custom header needed */}
      <View className="flex-1 bg-background">
        <Toast />
        <View className="mt-4 pb-36">
          <FlatList
            key={`products-${gridColumns}`}
            data={data?.NewArrival}
            keyExtractor={(item) => item?.ProductID.toString()}
            numColumns={gridColumns}
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
