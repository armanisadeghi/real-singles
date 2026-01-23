import { images } from "@/constants/images";
import { BODY_TYPE_OPTIONS } from "@/constants/options";
import { signupProps } from "@/types";
import Slider from "@react-native-community/slider";
import React, { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import GradientButton from "../ui/GradientButton";

const Appearance = ({ data, updateData, onNext, error }: signupProps) => {
  const [validationError, setValidationError] = useState("");



  const handleSelect = (value: string) => {
  let updatedSelection = Array.isArray(data?.BodyType) ? [...data.BodyType] : [];

  if (updatedSelection.includes(value)) {
    // If already selected → remove it
    updatedSelection = updatedSelection.filter((item) => item !== value);
  } else {
    // Otherwise → add it
    updatedSelection.push(value);
  }

  updateData({ BodyType: updatedSelection });
  setValidationError("");
};

const handleNext = () => {
  if (!data?.BodyType || data.BodyType.length === 0) {
    setValidationError("Please select at least one body type to continue");
    return;
  }
  if (!data?.Height) {
    setValidationError("Please select your height to continue");
    return;
  }

  // Convert to comma-separated string before sending
  const bodyTypeString = Array.isArray(data?.BodyType)
    ? data.BodyType.join(", ")
    : data?.BodyType;

  updateData({ BodyType: bodyTypeString });

  onNext();
};
  // const handleSelect = (value: string) => {
  //   updateData({ BodyType: value });
  //   setValidationError("");
  // };


  // const handleNext = () => {
  //   if (!data.BodyType) {
  //     setValidationError("Please select your body to continue");
  //     return;
  //   }
  //   if (!data.Height) {
  //     setValidationError("Please select your height to continue");
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
            Appearance
          </Text>
          {/* <Text className="text-dark font-normal text-sm">
            Please Select An Option Below
          </Text> */}
        </View>

        <View className="">
          <Image
            source={images.appearance}
            width={114}
            height={76}
            resizeMode="contain"
            alt="appearance"
          />
        </View>
      </View>

      <View className="">
        {/* Schools section */}
        <View className="mt-16 px-6 bg-white rounded-2xl shadow-lg py-6">
          <Text className="text-dark font-medium text-sm mb-4">Height</Text>
          <View className="flex-row items-center justify-between">
            <Slider
              style={{ width: '100%', height: 30 }}
              minimumValue={4.5}
              maximumValue={7.0}
              value={data?.Height || 0}
              onValueChange={(value) => updateData({ Height: value })}
              step={0.1}
              minimumTrackTintColor="#B06D1E"
              maximumTrackTintColor="#D9D9D9"
              thumbTintColor="#B06D1E"
            />
          </View>
          <Text className="text-dark text-sm text-center mt-2">
              {data?.Height ? `${data.Height.toFixed(1)}ft` : ''}
            </Text>
        </View>

        {/* Job details section */}
        <View className="mt-16 px-6 bg-white rounded-2xl shadow-lg py-6">
          <Text className="text-dark font-medium text-sm mb-4">Body Type</Text>
          {/* {bodyTypeOptions.map((option, index) => (
            <TouchableOpacity
              activeOpacity={1}
              key={option.value + index}
              onPress={() => handleSelect(option.value)}
              className={`flex-row gap-4 items-center mb-4 py-5 px-4 border rounded-[99] ${data.BodyType === option.value ? 'bg-secondary border-primary' : 'border-border bg-light-200'} `}
            >
              <Text className="text-sm font-normal text-dark">
                {option.label}
              </Text>
            </TouchableOpacity>
          ))} */}
          {BODY_TYPE_OPTIONS.map((option, index) => {
              const isSelected = Array.isArray(data?.BodyType) && data.BodyType.includes(option.value);

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

export default Appearance;
