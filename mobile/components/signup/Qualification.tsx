import { images } from "@/constants/images";
import { signupProps } from "@/types";
import React, { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import GradientButton from "../ui/GradientButton";

const Qualification = ({
  data,
  updateData,
  onNext,
  error,
}: signupProps) => {

const [validationError, setValidationError] = useState("");

  const qualificationOptions = [
    {
      label: "High School",
      value: "high school",
    },
    {
      label: "Some college",
      value: "some college",
    },
    {
      label: "Associate degree",
      value: "associate degree",
    },
    {
      label: "Bachelor’s degree",
      value: "bachelor’s degree",
    },
    {
      label: "Graduate degree",
      value: "graduate degree",
    },
    {
      label: "PHD/post-doctoral",
      value: "PHD/post-doctoral",
    },
  ];

  const handleSelect = (value: string) => {
    updateData({Education: value});
    setValidationError("");
  };

  const handleNext = () => {
    if(!data.Education){
      setValidationError("Please select your qualification to continue");
      return;
    }
    onNext();
  }

  return (
    <ScrollView className="flex-1 bg-backgground">
    <View className="mt-20 px-6 w-full">
      <View className="flex-row items-center justify-between px-2">
        <View className="">
          <Text className="text-primary font-bold text-2xl mb-2">Qualifications</Text>
          {/* <Text className="text-dark font-normal text-sm">
            Please Select An Option Below
          </Text> */}
        </View>
        <View className="">
          <Image
            source={images.qualification}
            width={114}
            height={76}
            resizeMode="contain"
            alt="gender"
          />
        </View>
      </View>

      <View className="mt-16 px-6 bg-white rounded-2xl shadow-lg py-6">
        {qualificationOptions.map((option, index) => (
          <TouchableOpacity
          activeOpacity={1}
            key={option.value + index}
            onPress={() => handleSelect(option.value)}
            className={`flex-row gap-4 items-center mb-4 py-5 px-4 border rounded-[99] ${data.Education === option.value ? 'bg-secondary border-primary' : 'border-border bg-light-200'} `}
          >
            <Text
              className="text-sm font-normal text-dark"
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Display validation error */}
        {validationError ? (
          <Text className="text-red-500 text-center text-sm px-2 mb-2">{validationError}</Text>
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

export default Qualification;