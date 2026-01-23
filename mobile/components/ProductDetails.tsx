import { ProductCardProps } from "@/types";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function ProductDetails({ product }: { product: ProductCardProps }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View className="px-4 mt-2">
      <View className="flex-row items-start justify-between py-2">
        <View className="space-y-2">
          <Text className="font-bold text-xl text-dark leading-[27px] mr-3">
            {product?.ProductName || "Product Name"}
          </Text>
          <View className="flex-row items-center mt-1">
        <Text className="text-lg font-bold text-primary">{product?.Points || 0} Pts</Text>
      </View>
        </View>
      </View>

      <View className="mt-3 mb-52">
        <Text className="text-base mb-2 text-primary font-bold">Info: </Text>
        <View>
          <Text
            numberOfLines={expanded ? undefined : 3}
            className="text-[12px] font-normal text-[#686A6F] leading-5"
          >
            {product?.Description}
          </Text>

          {product?.Description?.length > 120 && (
            <TouchableOpacity
              onPress={() => setExpanded(!expanded)}
              className="mt-1"
            >
              <Text className="text-[12px] text-primary font-normal leading-3 underline">
                {expanded ? "Read less" : "Read more"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
    
  );
}
