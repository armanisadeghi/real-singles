import { images } from "@/constants/images";
import { languageOptions } from "@/constants/utils";
import { signupProps } from "@/types";
import React, { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import GradientButton from "../ui/GradientButton";

const Languages = ({ data, updateData, onNext, error }: signupProps) => {
  const [validationError, setValidationError] = useState("");

   // Convert saved string to array (for toggling)
  const selectedLanguages = data.Language
    ? data.Language.split(",").map((lang) => lang.trim())
    : [];

  const handleSelect = (value: string) => {
    let updatedLanguages: string[];

    if (selectedLanguages.includes(value)) {
      // Remove if already selected
      updatedLanguages = selectedLanguages.filter((item) => item !== value);
    } else {
      // Add new selection
      updatedLanguages = [...selectedLanguages, value];
    }

    // Save back as a comma-separated string
    updateData({ Language: updatedLanguages.join(", ") });
    setValidationError("");
  };

  const handleNext = () => {
    if (!data.Language || data.Language.trim() === "") {
      setValidationError("Please select at least one language to continue");
      return;
    }
    onNext();
  };

  // const handleSelect = (value: string) => {
  //   updateData({ Language: value });
  //   setValidationError("");
  // };

  // const handleNext = () => {
  //   if (!data.Language) {
  //     setValidationError("Please select your language to continue");
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
            Languages
          </Text>
          {/* <Text className="text-dark font-normal text-sm">
            Please Select An Option Below
          </Text> */}
        </View>
        <View className="">
          <Image
            source={images.lang}
            width={114}
            height={76}
            resizeMode="contain"
            alt="ethinicity"
          />
        </View>
      </View>

      <View className="mt-16 px-6 bg-white rounded-2xl shadow-lg py-6">
         {languageOptions.map((option, index) => {
          const isSelected = selectedLanguages.includes(option.value);

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
        {/* {languageOptions.map((option, index) => (
          <TouchableOpacity
            activeOpacity={1}
            key={option.value + index}
            onPress={() => handleSelect(option.value)}
            className={`flex-row gap-4 items-center mb-4 py-5 px-4 border rounded-[99] ${data.Language === option.value ? 'bg-secondary border-primary' : 'border-border bg-light-200'} `}
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

export default Languages;
