import { images } from "@/constants/images";
import { useDeviceSize } from "@/hooks/useResponsive";
import { signupProps } from "@/types";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Image, ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import GradientButton from "../ui/GradientButton";

const ChooseInterests = ({ data, updateData, onNext, error }: signupProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const { gridColumns } = useDeviceSize();
  const [validationError, setValidationError] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(data?.Interest || []);

  useEffect(() => {
    updateData({ Interest: selectedInterests });
  }, [selectedInterests]);

  const chooseInterestsOptions = [
    {
      label: "Dining Out",
      value: "dining out",
      image: images.dining,
    },
    {
      label: "Playing Sports",
      value: "sports",
      image: images.sports,
    },
    {
      label: "Museums & Arts",
      value: "museums",
      image: images.museum,
    },
    {
      label: "Music",
      value: "music",
      image: images.music,
    },
    {
      label: "Gardening",
      value: "gardening",
      image: images.gardening,
    },
    {
      label: "Basketball",
      value: "basketball",
      image: images.basketball,
    },
    {
      label: "Dancing",
      value: "dancing",
      image: images.dancing,
    },
    {
      label: "Travel & Places",
      value: "travel",
      image: images.travel,
    },
  ];

  const toggleInterest = (value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedInterests(prev => {
      if (prev.includes(value)) {
        return prev.filter(item => item !== value);
      } else {
        return [...prev, value];
      }
    });
    setValidationError("");
  };

  const handleNext = () => {
    if (selectedInterests.length === 0) {
      setValidationError("Please choose at least one interest to continue");
      return;
    }
    onNext();
  };

  const cardWidth = useMemo(() => (screenWidth - 60 - 12 * (gridColumns - 1)) / gridColumns, [screenWidth, gridColumns]);

  return (
    <ScrollView className="flex-1 bg-background">
    <View className="mt-20 px-6 w-full">
      <View className="flex-row items-center justify-between gap-7 px-2">
        <View className="flex-1">
          <Text className="text-primary font-bold text-2xl mb-2">
            Pick Your Interest
          </Text>
          <Text className="text-dark font-normal text-sm">
          Enhance Your Brand Potential With Giant 
          Advertising Blimps
          </Text>
        </View>
        <View className=""></View>
      </View>

      <View className="mt-10">
        <FlatList
          key={`interests-${gridColumns}`}
          data={chooseInterestsOptions}
          numColumns={gridColumns}
          columnWrapperStyle={{
            justifyContent: "space-between",
            marginBottom: 12
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => toggleInterest(item.value)}
              style={{
                width: cardWidth,
                height: 170,
                borderRadius: 22,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Background Image */}
              <Image
                source={item.image}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                }}
                resizeMode="cover"
              />

              {/* Label with gradient */}
              <LinearGradient
                colors={['#000000', '#0000004D', '#00000008']}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  zIndex: 50,
                }}
              >
                <Text className="text-white font-bold text-base z-50">
                  {item.label}
                </Text>
              </LinearGradient>

              {/* Selection Overlay */}
              {selectedInterests.includes(item.value) && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: '#F29A2C99',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 10,
                  }}
                >
                  <Image
                    source={require("../../assets/icons/check.png")}
                    className="rounded-full w-8 h-8 bg-white"
                  />
                </View>
              )}
            </TouchableOpacity>
          )}
          keyExtractor={item => item.value}
        />

        {/* Display validation error */}
        {validationError ? (
          <Text className="text-red-500 text-center text-sm px-2 mt-2">
            {validationError}
          </Text>
        ) : null}

        {/* Display parent component error if any */}
        {error ? (
          <Text className="text-red-500 text-sm px-2 mt-2">{error}</Text>
        ) : null}
      </View>
      
      <GradientButton
        text={`Next`}
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

export default ChooseInterests;