import { images } from '@/constants/images';
import React from 'react';
import { Image, StatusBar, Text, View } from 'react-native';
import GradientButton from '../ui/GradientButton';

interface SuccessProps {
    image: any;
    title: string;
    subTitle: string;
    desc: string;
    onPress: () => void;
}

export default function Success({image, title, subTitle, desc, onPress} : SuccessProps) {
  return (
    <View className='relative flex-1 mt-20'>
        <StatusBar barStyle='dark-content' backgroundColor='transparent' translucent />
        <View className='flex-row-reverse'>
                <Image source={images.ellipseEnd} resizeMode='contain' className='-mb-3' />
            </View>
        <View className='px-6'>
        <View className='relative flex-col items-center justify-center px-6 bg-white py-6 shadow-lg rounded-2xl z-10'>
            <Image source={image} resizeMode='contain' className='w-32 h-32 my-6'/>
            <Text className='text-3xl text-primary font-bold mt-3 mb-6'>{title}</Text>
            <Text className='text-[#303030] text-[15px] font-normal text-center mb-1'>
           {subTitle}
            </Text>
            <Text className='text-gray text-[14px] font-normal text-center mb-6'>
           {desc}
            </Text>
        </View>
        </View>
            <View>
                <Image source={images.ellipseStart} resizeMode='contain' className='-mt-3' />
            </View>
        <GradientButton
            text='Back to Home'
            className='w-[60%] mx-auto mt-10 mb-5'
            onPress={onPress}
        />
    </View>
  )
}