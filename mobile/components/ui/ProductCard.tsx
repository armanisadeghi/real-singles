import { icons } from '@/constants/icons';
import { ProductCardProps } from '@/types';
import { VIDEO_URL } from '@/utils/token';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Platform, PlatformColor, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useThemeColors } from "@/context/ThemeContext";


const ProductCard = ({product} : {product: ProductCardProps}) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useThemeColors();

  const themedColors = {
    cardBackground: Platform.OS === 'ios' ? (PlatformColor('secondarySystemBackground') as unknown as string) : colors.surfaceContainer,
    text: Platform.OS === 'ios' ? (PlatformColor('label') as unknown as string) : colors.onSurface,
    secondaryText: Platform.OS === 'ios' ? (PlatformColor('secondaryLabel') as unknown as string) : colors.onSurfaceVariant,
  };

  return (
    <TouchableOpacity
    activeOpacity={0.8}
    onPress={() => router.push(`/redeem/product/${product?.ProductID}`)}
    className='rounded-lg overflow-hidden'
      style={[
        {
          width: 160,
          height: 208,
        },
      ]}
    >
      <Image
        source={product?.Image ? {uri: product.Image.startsWith('http') ? product.Image : VIDEO_URL + product?.Image} : icons.placeholder} // replace with your image path
        className='rounded-lg'
        style={[
          {
            width: 178,
            height: 178,
          },
        ]}
      />

      <View
      className='rounded-md absolute bottom-2 left-2'
        style={[
          {
            backgroundColor: themedColors.cardBackground,
            width: 146,
            height: 68,
            paddingTop: 8,
            paddingRight: 10,
            paddingBottom: 8,
            paddingLeft: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 10,
            elevation: 4,
          },
        ]}
      >
        <Text className={`text-dark text-xs font-medium line-clamp-2`}>
          {product?.ProductName || 'Product Name'}
        </Text>
        <Text className={`text-primary text-[14px] font-bold`}>{product?.Points || 0} Pts</Text>
      </View>
    </TouchableOpacity>
  );
};

export default ProductCard;
