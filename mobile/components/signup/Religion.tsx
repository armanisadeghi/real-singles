import { images } from "@/constants/images";
import { RELIGION_OPTIONS } from "@/constants/options";
import { signupProps } from "@/types";
import React, { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import GradientButton from "../ui/GradientButton";

const Religion = ({ data, updateData, onNext, error }: signupProps) => {
  const [validationError, setValidationError] = useState("");


  // Convert saved string into array for selection handling
  const selectedReligions: string[] = data?.Religion
    ? typeof data.Religion === 'string'
      ? data.Religion.split(",").map((item: string) => item.trim())
      : []
    : [];

  const handleSelect = (value: string) => {
    let updatedReligions: string[];

    if (selectedReligions.includes(value)) {
      // Remove if already selected
      updatedReligions = selectedReligions.filter((item) => item !== value);
    } else {
      // Add new selection
      updatedReligions = [...selectedReligions, value];
    }

    // Save back as comma-separated string
    updateData({ Religion: updatedReligions.join(", ") });
    setValidationError("");
  };

  const handleNext = () => {
    if (!data?.Religion || (typeof data.Religion === 'string' && data.Religion.trim() === "")) {
      setValidationError("Please select at least one religion to continue");
      return;
    }
    onNext();
  };

  // const handleSelect = (value: string) => {
  //   updateData({ Religion: value });
  //   setValidationError("");
  // };


  // const handleNext = () => {
  //   if (!data.Religion) {
  //     setValidationError("Please select your religion to continue");
  //     return;
  //   }
  //   onNext();
  // };

  return (
    <ScrollView className="flex-1 bg-backgground">
    <View className="mt-20 px-6 w-full">
      <View className="flex-row items-center justify-between px-2">
        <View className="">
          <Text className="text-primary font-bold text-2xl mb-2">
            Religion?
          </Text>
          {/* <Text className="text-dark font-normal text-sm">
            Please Select An Option Below
          </Text> */}
        </View>
        <View className="">
          <Image
            source={images.religion}
            width={114}
            height={76}
            resizeMode="contain"
            alt="religion"
          />
        </View>
      </View>

      <View className="mt-16 px-6 bg-white rounded-2xl shadow-lg py-6">
         {RELIGION_OPTIONS.map((option, index) => {
          const isSelected = selectedReligions.includes(option.value);

          return (
            <TouchableOpacity
              activeOpacity={1}
              key={option.value + index}
              onPress={() => handleSelect(option.value)}
              className={`flex-row gap-4 items-center mb-4 py-5 px-4 border rounded-[99] 
                ${isSelected ? "bg-secondary border-primary" : "border-border bg-light-200"}`}
            >
              <Text className="text-sm font-normal text-dark">
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* {religionOptions.map((option, index) => (
          <TouchableOpacity
            activeOpacity={1}
            key={option.value + index}
            onPress={() => handleSelect(option.value)}
            className={`flex-row gap-4 items-center mb-4 py-5 px-4 border rounded-[99] ${data.Religion === option.value ? 'bg-secondary border-primary' : 'border-border bg-light-200'} `}
          >
            <Text className="text-sm font-normal text-dark">
              {option.label}
            </Text>
          </TouchableOpacity>
        ))} */}

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

export default Religion;