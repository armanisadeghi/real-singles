import { images } from "@/constants/images";
import { DRINKING_OPTIONS, MARIJUANA_OPTIONS, SMOKING_OPTIONS, PETS_OPTIONS } from "@/constants/options";
import { signupProps } from "@/types";
import React, { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import GradientButton from "../ui/GradientButton";

const HabitInterests = ({ data, updateData, onNext, error }: signupProps) => {
  const [validationError, setValidationError] = useState("");

  const handleMarijuanaSelect = (value: string) => {
    updateData({ Marijuana: value });
    setValidationError("");
  };
  const handleSmokingSelect = (value: string) => {
    updateData({ Smoking: value });
    setValidationError("");
  };
  const handleDrinkingSelect = (value: string) => {
    updateData({ Drinks: value });
    setValidationError("");
  };
  const handlePetsSelect = (value: string) => {
    updateData({ Pets: value });
    setValidationError("");
  };

  const handleNext = () => {
    if (!data?.Marijuana) {
      setValidationError("Please select your marijuana status to continue");
      return;
    }
    if (!data?.Smoking) {
      setValidationError("Please select your smoking status to continue");
      return;
    }
    if (!data?.Drinks) {
      setValidationError("Please select your drinking status to continue");
      return;
    }
    if (!data?.Pets) {
      setValidationError("Please select your pets status to continue");
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
            Habits & Interests
          </Text>
          {/* <Text className="text-dark font-normal text-sm">
            Please Select An Option Below
          </Text> */}
        </View>

        <View className="">
          <Image
            source={images.habit}
            width={114}
            height={76}
            resizeMode="contain"
            alt="appearance"
          />
        </View>
      </View>

      <View className="">
    
        <View className="mt-16 px-6 bg-white rounded-2xl shadow-lg py-6">
          <Text className="text-dark font-medium text-sm mb-4">Marijuana?</Text>
          {MARIJUANA_OPTIONS.map((option, index) => (
            <TouchableOpacity
              activeOpacity={1}
              key={option.value + index}
              onPress={() => handleMarijuanaSelect(option.value)}
              className={`flex-row gap-4 items-center mb-4 py-5 px-4 border rounded-[99] ${data?.Marijuana === option.value ? 'bg-secondary border-primary' : 'border-border bg-light-200'} `}
            >
              <Text className="text-sm font-normal text-dark">
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View className="mt-16 px-6 bg-white rounded-2xl shadow-lg py-6">
          <Text className="text-dark font-medium text-sm mb-4">Smoking?</Text>
          {SMOKING_OPTIONS.map((option, index) => (
            <TouchableOpacity
              activeOpacity={1}
              key={option.value + index}
              onPress={() => handleSmokingSelect(option.value)}
              className={`flex-row gap-4 items-center mb-4 py-5 px-4 border rounded-[99] ${data?.Smoking === option.value ? 'bg-secondary border-primary' : 'border-border bg-light-200'} `}
            >
              <Text className="text-sm font-normal text-dark">
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View className="mt-16 px-6 bg-white rounded-2xl shadow-lg py-6">
          <Text className="text-dark font-medium text-sm mb-4">How often do you drink?</Text>
          {DRINKING_OPTIONS.map((option, index) => (
            <TouchableOpacity
              activeOpacity={1}
              key={option.value + index}
              onPress={() => handleDrinkingSelect(option.value)}
              className={`flex-row gap-4 items-center mb-4 py-5 px-4 border rounded-[99] ${data?.Drinks === option.value ? 'bg-secondary border-primary' : 'border-border bg-light-200'} `}
            >
              <Text className="text-sm font-normal text-dark">
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View className="mt-16 px-6 bg-white rounded-2xl shadow-lg py-6">
          <Text className="text-dark font-medium text-sm mb-4">Pets</Text>
          {PETS_OPTIONS.map((option, index) => (
            <TouchableOpacity
              activeOpacity={1}
              key={option.value + index}
              onPress={() => handlePetsSelect(option.value)}
              className={`flex-row gap-4 items-center mb-4 py-5 px-4 border rounded-[99] ${data?.Pets === option.value ? 'bg-secondary border-primary' : 'border-border bg-light-200'} `}
            >
              <Text className="text-sm font-normal text-dark">
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
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

export default HabitInterests;