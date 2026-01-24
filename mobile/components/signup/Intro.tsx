import { images } from "@/constants/images";
import { signupProps } from "@/types";
import React, { useState } from "react";
import { Image, ScrollView, Text, TextInput, View } from "react-native";
import GradientButton from "../ui/GradientButton";

const Intro = ({ data, updateData, onNext, error }: signupProps) => {
  const [validationError, setValidationError] = useState("");

  const handleNext = () => {
    if (!data?.About) {
      setValidationError("Please fill out to continue");
      return;
    }
    if (!data?.CraziestThings) {
      setValidationError("Please fill out to continue");
      return;
    }
    onNext();
  };

  return (
    <ScrollView className="flex-1 bg-background">
    <View className="mt-20 px-6 w-full">
      <View className="flex-row items-center justify-between px-2">
        <View className="">
          <Text className="text-primary font-bold text-2xl mb-2">
            In a Few Words
          </Text>
          {/* <Text className="text-dark font-normal text-sm">
            Please Select An Option Below
          </Text> */}
        </View>
        <View className="">
          <Image
            source={images.intro}
            width={114}
            height={76}
            resizeMode="contain"
            alt="religion"
          />
        </View>
      </View>

      <View className="flex-col gap-4 mt-16 px-6 bg-white rounded-2xl shadow-lg py-6">
        <View className="relative py-[13px] px-[15px] border border-border rounded-2xl bg-light-200">
          <TextInput
            multiline={true}
            numberOfLines={6}
            maxLength={300}
            placeholder="Tell me a little about yourself"
            placeholderTextColor="#B0B0B0"
            value={data?.About}
            onChangeText={(text) => updateData({ About: text })}
            textAlignVertical="top"
            style={{
              height: 120, // Fixed height instead of relying on numberOfLines
              paddingBottom: 20, // Space for the counter
            }}
          />
          <Text className="absolute bottom-3 right-3 text-xs text-gray">
            {data?.About?.length || 0}/300
          </Text>
        </View>
        <View className="relative py-[13px] px-[15px] border border-border rounded-2xl bg-light-200">
          <TextInput
            multiline={true}
            numberOfLines={6}
            maxLength={300}
            placeholder="Craziest thing you have done"
            placeholderTextColor="#B0B0B0"
            value={data?.CraziestThings}
            onChangeText={(text) => updateData({ CraziestThings: text })}
            textAlignVertical="top"
            style={{
              height: 120,
              paddingBottom: 20,
            }}
          />
          <Text className="absolute bottom-3 right-3 text-xs text-gray">
            {data?.CraziestThings?.length || 0}/300
          </Text>
        </View>

        {/* Display validation error */}
        {validationError ? (
          <Text className="text-red-500 text-center text-sm px-2 mb-2">
            {validationError}
          </Text>
        ) : null}

        {/* Display parent component error if any */}
        {error ? (
          <Text className="text-red-500 text-sm px-2 mb-2">{error}</Text>
        ) : null}
      </View>
      <GradientButton
        text="Next"
        onPress={handleNext}
        containerStyle={{
          marginVertical: 50,
          width: "50%",
          marginHorizontal: "auto",
        }}
      />
    </View>
    </ScrollView>
  );
};

export default Intro;
