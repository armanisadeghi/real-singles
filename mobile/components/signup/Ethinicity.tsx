import { images } from "@/constants/images";
import { ethinicityOptions } from "@/constants/utils";
import { signupProps } from "@/types";
import React, { useState } from "react";
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import GradientButton from "../ui/GradientButton";

const Ethinicity = ({ data, updateData, onNext, error }: signupProps) => {
  const [validationError, setValidationError] = useState("");
  const [customEthnicity, setCustomEthnicity] = useState("");

   const handleSelect = (value: string) => {
    let updatedSelection = Array.isArray(data.Ethniticity)
      ? [...data.Ethniticity]
      : [];

    if (updatedSelection.includes(value)) {
      // Deselect if already selected
      updatedSelection = updatedSelection.filter((item) => item !== value);
    } else {
      updatedSelection.push(value);
    }

    updateData({ Ethniticity: updatedSelection });
    setValidationError("");

    if (value !== "Other") {
      setCustomEthnicity("");
    }
  };


   // Handle custom "Other" save
  const handleCustomSubmit = () => {
    if (!customEthnicity.trim()) {
      setValidationError("Please enter your ethnicity");
      return;
    }

    let updatedSelection = Array.isArray(data.Ethniticity)
      ? [...data.Ethniticity]
      : [];

    // Add or replace custom ethnicity
    updatedSelection = updatedSelection.filter(
      (item) => !item.startsWith("Other:")
    );
    updatedSelection.push(`Other: ${customEthnicity.trim()}`);

    updateData({ Ethniticity: updatedSelection });
    setValidationError("");
  };


    // Handle next step
  const handleNext = () => {
    if (!data.Ethniticity || data.Ethniticity.length === 0) {
      setValidationError("Please select at least one ethnicity to continue");
      return;
    }

    // Convert array → comma-separated string
    const ethnicityString = Array.isArray(data.Ethniticity)
      ? data.Ethniticity.join(", ")
      : data.Ethniticity;

    updateData({ Ethniticity: ethnicityString });
    onNext();
  };


  // const handleSelect = (value: string) => {
  //   updateData({ Ethniticity: value });
  //   setValidationError("");

  //   if (value !== "Other") {
  //     setCustomEthnicity("");
  //   }
  // };

  // const handleCustomSubmit = () => {
  //   if (!customEthnicity.trim()) {
  //     setValidationError("Please enter your ethnicity");
  //     return;
  //   }

  //   // Save the custom value with "Other:" prefix
  //   updateData({ Ethniticity: `${customEthnicity.trim()}` });
  //   setValidationError("");
  // };

  // const handleNext = () => {
  //   if (!data.Ethniticity) {
  //     setValidationError("Please select your ethinicity to continue");
  //     return;
  //   }

  //   if (data.Ethniticity === "Other" && !customEthnicity.trim()) {
  //     setValidationError("Please specify your ethnicity");
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
            Ethinicity?
          </Text>
          {/* <Text className="text-dark font-normal text-sm">
            Please Select An Option Below
          </Text> */}
        </View>
        <View className="">
          <Image
            source={images.ethinicity}
            width={114}
            height={76}
            resizeMode="contain"
            alt="ethinicity"
          />
        </View>
      </View>

      <View className="mt-16 px-6 bg-white rounded-2xl shadow-lg py-6">
         {ethinicityOptions.map((option, index) => {
          const isSelected =
            Array.isArray(data.Ethniticity) &&
            data.Ethniticity.includes(option.value);

          return (
            <TouchableOpacity
              activeOpacity={1}
              key={option.value + index}
              onPress={() => handleSelect(option.value)}
              className={`flex-row gap-4 items-center mb-4 py-5 px-4 border rounded-[99] ${
                isSelected
                  ? "bg-secondary border-primary"
                  : "border-border bg-light-200"
              }`}
            >
              <Text className="text-sm font-normal text-dark">
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}


         {/* Custom Ethnicity Input (only if "Other" is selected) */}
        {Array.isArray(data.Ethniticity) &&
          data.Ethniticity.some((item) => item === "Other" || item.startsWith("Other:")) && (
            <View className="mt-2 mb-4">
              <View className="flex-row items-center">
                <TextInput
                  value={customEthnicity}
                  onChangeText={(text) => {
                    setCustomEthnicity(text);
                    setValidationError("");
                  }}
                  placeholder="Enter your ethnicity"
                  className="flex-1 bg-gray-50 px-4 py-3 rounded-l-full"
                />
                <TouchableOpacity
                  onPress={handleCustomSubmit}
                  className="px-4 py-3 rounded-r-full"
                >
                  <Text className="text-primary">Save</Text>
                </TouchableOpacity>
              </View>

              {/* Show saved custom ethnicity */}
              {Array.isArray(data.Ethniticity) &&
                data.Ethniticity.some((item) => item.startsWith("Other:")) && (
                  <Text className="text-primary text-xs mt-2 pl-2">
                    Saved:{" "}
                    {
                      data.Ethniticity.find((item) =>
                        item.startsWith("Other:")
                      )?.replace("Other:", "").trim()
                    }
                  </Text>
                )}
            </View>
          )}
        {/* {ethinicityOptions.map((option, index) => (
          <TouchableOpacity
            activeOpacity={1}
            key={option.value + index}
            onPress={() => handleSelect(option.value)}
            className={`flex-row gap-4 items-center mb-4 py-5 px-4 border rounded-[99] ${data.Ethniticity === option.value ? 'bg-secondary border-primary' : 'border-border bg-light-200'} `}
          >
            <Text className="text-sm font-normal text-dark">
              {option.label}
            </Text>
          </TouchableOpacity>
        ))} */}

        {/* {(data.Ethniticity === "Other" ||
          data.Ethniticity?.startsWith("Other:")) && (
          <View className="mt-2 mb-4">
            <View className="flex-row items-center">
              <TextInput
                value={customEthnicity}
                onChangeText={(text) => {
                  setCustomEthnicity(text);
                  setValidationError("");
                }}
                placeholder="Enter your ethnicity"
                className="flex-1 bg-gray-50 px-4 py-3 rounded-l-full"
              />
              <TouchableOpacity
                onPress={handleCustomSubmit}
                className=" px-4 py-3 rounded-r-full"
              >
                <Text className="text-primary">Save</Text>
              </TouchableOpacity>
            </View>

            {data.Ethniticity?.startsWith("Other:") && (
              <Text className="text-primary text-xs mt-2 pl-2">
                Saved: {data.Ethniticity.replace("Other:", "").trim()}
              </Text>
            )}
          </View>
        )} */}

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

export default Ethinicity;
