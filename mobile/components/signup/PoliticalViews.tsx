import { images } from "@/constants/images";
import { politicalViewsOptions } from "@/constants/utils";
import { signupProps } from "@/types";
import React, { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import GradientButton from "../ui/GradientButton";

const PoliticalViews = ({ data, updateData, onNext, error }: signupProps) => {
  const [validationError, setValidationError] = useState("");

 

  const handleSelect = (value: string) => {
    updateData({ NightAtHome: value });
    setValidationError("");
  };


  const handleNext = () => {
    if (!data.NightAtHome) {
      setValidationError("Please select your political views to continue");
      return;
    }
    onNext();
  };

  return (
    <ScrollView className="flex-1 bg-backgground">
    <View className="mt-20 px-6 w-full">
      <View className="flex-row items-center justify-between px-2">
        <View className="">
          <Text className="text-primary font-bold text-2xl mb-2">
            Political Views
          </Text>
          {/* <Text className="text-dark font-normal text-sm">
            Please Select An Option Below
          </Text> */}
        </View>
        <View className="">
          <Image
            source={images.politics}
            width={114}
            height={76}
            resizeMode="contain"
            alt="religion"
          />
        </View>
      </View>

      <View className="mt-16 px-6 bg-white rounded-2xl shadow-lg py-6">
        {politicalViewsOptions.map((option, index) => (
          <TouchableOpacity
            activeOpacity={1}
            key={option.value + index}
            onPress={() => handleSelect(option.value)}
            className={`flex-row gap-4 items-center mb-4 py-5 px-4 border rounded-[99] ${data.NightAtHome === option.value ? 'bg-secondary border-primary' : 'border-border bg-light-200'} `}
          >
            <Text className="text-sm font-normal text-dark">
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}

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

export default PoliticalViews;