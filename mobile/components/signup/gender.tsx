import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { signupProps } from "@/types";
import React, { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import GradientButton from "../ui/GradientButton";

// Gender options that match database constraint
const GENDER_OPTIONS = [
  { label: "Man", value: "male", icon: icons.man },
  { label: "Woman", value: "female", icon: icons.women },
  { label: "Non-binary", value: "non-binary", icon: icons.man },
  { label: "Other", value: "other", icon: icons.man },
];

// Looking for options (can select multiple)
const LOOKING_FOR_OPTIONS = [
  { label: "Men", value: "male", icon: icons.man },
  { label: "Women", value: "female", icon: icons.women },
  { label: "Everyone", value: "everyone", icon: icons.womentomen1 },
];

const Gender = ({
  data,
  updateData,
  onNext,
  error,
}: signupProps) => {
  const [validationError, setValidationError] = useState("");
  const [step, setStep] = useState<"gender" | "looking_for">("gender");

  const handleGenderSelect = (value: string) => {
    updateData({ Gender: value });
    setValidationError("");
  };

  const handleLookingForSelect = (value: string) => {
    // "everyone" means both male and female
    if (value === "everyone") {
      updateData({ LookingFor: ["male", "female"] });
    } else {
      // For single selection, store as array
      updateData({ LookingFor: [value] });
    }
    setValidationError("");
  };

  const handleNext = () => {
    if (step === "gender") {
      if (!data?.Gender) {
        setValidationError("Please select your gender to continue");
        return;
      }
      setStep("looking_for");
      setValidationError("");
    } else {
      if (!data?.LookingFor || data.LookingFor.length === 0) {
        setValidationError("Please select who you're looking for");
        return;
      }
      onNext();
    }
  };

  const handleBack = () => {
    if (step === "looking_for") {
      setStep("gender");
      setValidationError("");
    }
  };

  // Determine if "everyone" is selected
  const isEveryoneSelected = 
    data?.LookingFor?.includes("male") && data?.LookingFor?.includes("female");

  return (
    <ScrollView className="flex-1 bg-backgground">
      <View className="mt-20 px-6 w-full">
        <View className="flex-row items-center justify-between px-2">
          <View className="">
            <Text className="text-primary font-bold text-2xl mb-2">
              {step === "gender" ? "I am a..." : "I'm interested in..."}
            </Text>
            <Text className="text-dark font-normal text-sm">
              {step === "gender" 
                ? "Please select your gender" 
                : "Who are you looking to meet?"}
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
          {step === "gender" ? (
            // Gender selection
            GENDER_OPTIONS.map((option, index) => (
              <TouchableOpacity
                activeOpacity={1}
                key={option.value + index}
                onPress={() => handleGenderSelect(option.value)}
                className={`flex-row gap-4 items-center my-4 py-5 px-4 border rounded-2xl ${
                  data?.Gender === option.value 
                    ? 'bg-secondary border-primary' 
                    : 'border-border bg-light-200'
                }`}
              >
                <View className="w-8 h-8 mr-4 justify-center items-center">
                  <Image
                    source={option.icon}
                    style={{ width: 20, height: 24 }}
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-sm font-normal text-dark">
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            // Looking for selection
            LOOKING_FOR_OPTIONS.map((option, index) => {
              const isSelected = option.value === "everyone" 
                ? isEveryoneSelected 
                : data?.LookingFor?.length === 1 && data?.LookingFor?.[0] === option.value;
              
              return (
                <TouchableOpacity
                  activeOpacity={1}
                  key={option.value + index}
                  onPress={() => handleLookingForSelect(option.value)}
                  className={`flex-row gap-4 items-center my-4 py-5 px-4 border rounded-2xl ${
                    isSelected 
                      ? 'bg-secondary border-primary' 
                      : 'border-border bg-light-200'
                  }`}
                >
                  <View className="w-8 h-8 mr-4 justify-center items-center">
                    <Image
                      source={option.icon}
                      style={{ width: 20, height: 24 }}
                      resizeMode="contain"
                    />
                  </View>
                  <Text className="text-sm font-normal text-dark">
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}

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

        <View className="flex-row justify-center gap-4 mt-8">
          {step === "looking_for" && (
            <GradientButton
              text="Back"
              onPress={handleBack}
              containerStyle={{
                width: "40%",
                backgroundColor: "#ccc",
              }}
            />
          )}
          <GradientButton
            text="Next"
            onPress={handleNext}
            containerStyle={{
              width: step === "looking_for" ? "40%" : "50%",
            }}
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default Gender;
