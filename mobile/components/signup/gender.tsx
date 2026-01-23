import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { signupProps } from "@/types";
import React, { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import GradientButton from "../ui/GradientButton";

const Gender = ({
  data,
  updateData,
  onNext,
  error,
}: signupProps) => {

const [validationError, setValidationError] = useState("");

  const genderOptions = [
    {
      label: "I'm a man seeking a woman",
      value: "man",
      icon: icons.man,
    },
    {
      label: "I'm a woman seeking a man",
      value: "woman",
      icon: icons.women,
    },
    {
      label: "I'm a man seeking a man",
      value: "man2",
      icon: icons.womentomen1,
    },
    {
      label: "I'm a woman seeking a woman",
      value: "woman2",
      icon: icons.womentomen2,
    },
  ];

  const handleSelect = (value: string) => {
    updateData({Gender: value});
    setValidationError("");
  };

  const handleNext = () => {
    if(!data.Gender){
      setValidationError("Please select your gender to continue");
      return;
    }
    onNext();
  }

  return (
    <ScrollView className="flex-1 bg-backgground">
    <View className="mt-20 px-6 w-full">
      <View className="flex-row items-center justify-between px-2">
        <View className="">
          <Text className="text-primary font-bold text-2xl mb-2">Gender?</Text>
          <Text className="text-dark font-normal text-sm">
            Please Select An Option Below
          </Text>
        </View>
        <View className="">
          <Image
            source={images.gender}
            width={114}
            height={76}
            resizeMode="contain"
            alt="gender"
          />
        </View>
      </View>

      <View className="mt-16 px-6 bg-white py-6 shadow-lg rounded-2xl">
        {genderOptions.map((option, index) => (
          <TouchableOpacity
          activeOpacity={1}
            key={option.value + index}
            onPress={() => handleSelect(option.value)}
            className={`flex-row gap-4 items-center my-4 py-5 px-4 border rounded-2xl ${data.Gender === option.value ? 'bg-secondary border-primary' : 'border-border bg-light-200'} `}
          >
            <View className="w-8 h-8 mr-4 justify-center items-center">
              <Image
                source={option.icon}
                style={{ width: 20, height: 24 }}
                resizeMode="contain"
              />
            </View>
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
          marginTop: 50,
          width: "50%",
          marginHorizontal: "auto",
        }}
      />
    </View>
    </ScrollView>
  );
};

export default Gender;
