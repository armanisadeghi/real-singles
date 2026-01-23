import { icons } from "@/constants/icons";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import LinearBg from "../LinearBg";

interface ChatInputProps {
  onSend: (text: string) => void;
}

export default function ChatInput({ onSend }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [toggledMenu, setToggledMenu] = useState(false);

  // Animation values
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const animatedOpacity = useRef(new Animated.Value(0)).current;
  const animatedRotation = useRef(new Animated.Value(0)).current;

  // Animation configurations
  const animationDuration = 300;
  const easing = Easing.bezier(0.25, 0.1, 0.25, 1); // Smooth easing function

  // Animation effect
  useEffect(() => {
    if (toggledMenu) {
      // Animate menu in
      Animated.parallel([
        Animated.timing(animatedHeight, {
          toValue: 1,
          duration: animationDuration,
          easing,
          useNativeDriver: false,
        }),
        Animated.timing(animatedOpacity, {
          toValue: 1,
          duration: animationDuration,
          easing,
          useNativeDriver: false,
        }),
        Animated.timing(animatedRotation, {
          toValue: 1,
          duration: animationDuration,
          easing,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // Animate menu out
      Animated.parallel([
        Animated.timing(animatedHeight, {
          toValue: 0,
          duration: animationDuration,
          easing,
          useNativeDriver: false,
        }),
        Animated.timing(animatedOpacity, {
          toValue: 0,
          duration: animationDuration,
          easing,
          useNativeDriver: false,
        }),
        Animated.timing(animatedRotation, {
          toValue: 0,
          duration: animationDuration,
          easing,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [toggledMenu]);

  // Interpolate rotation for menu button
  const rotate = animatedRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["45deg", "0deg"],
  });

  // Calculate height of the menu (from 0 to 80)
  const maxHeight = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 80],
  });

  const handleSend = () => {
    if (message.trim().length > 0) {
      onSend(message);
      setMessage("");
    }
  };

  return (
    <View
      className="bg-white rounded-t-[20px] px-4 pt-6 pb-20"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 5,
      }}
    >
      <View className="flex-row items-center gap-2">
        {/* Menu button with animated rotation */}
        {/* <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setToggledMenu((prev) => !prev)}
          className="w-[30px] h-[30px] rounded-[38px] items-center justify-center overflow-hidden"
        >
          <LinearBg className="w-full h-full flex justify-center items-center">
            <Animated.View style={{ transform: [{ rotate }] }}>
              <Image
                source={icons.times}
                className="w-3 h-3"
                resizeMode="contain"
              />
            </Animated.View>
          </LinearBg>
        </TouchableOpacity> */}

        {/* Text input */}
        <TextInput
          className="flex-1 bg-light-100 rounded-full px-[15px] py-[13px] text-dark text-sm"
          placeholder="Write a message..."
          placeholderTextColor="#B0B0B0"
          value={message}
          onChangeText={setMessage}
          multiline
          style={{
            minHeight: 45,
            maxHeight: 50,
            textAlignVertical: "center",
          }}
          onSubmitEditing={handleSend}
        />

        {/* Send button */}
        <TouchableOpacity
          className="w-[40px] h-[40px] rounded-[38px] items-center justify-center overflow-hidden"
          onPress={handleSend}
        >
          <LinearBg className="w-full h-full flex justify-center items-center" style={{padding: 10}}>
            <Ionicons 
              name="send" 
              size={20} 
              color="#FFFFFF" 
            />
          </LinearBg>
        </TouchableOpacity>
      </View>

      

      {/* Animated menu container */}
      <Animated.View
        style={{
          maxHeight,
          opacity: animatedOpacity,
          transform: [
            {
              translateY: animatedOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [-10, 0],
              }),
            },
          ],
        }}
      >
        <View className="border-[1px] border-border w-full my-4 rounded-full" />
        <View className="flex-row items-center justify-center gap-4">
          <TouchableOpacity className="flex-row items-center justify-center gap-2 bg-light-100 border border-border py-[6px] px-3 rounded-[50px]">
            <Image source={icons.file} resizeMode="contain" />
            <Text className="font-medium text-[10px] text-dark">File</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center justify-center gap-2 bg-light-100 border border-border py-[6px] px-3 rounded-[50px]">
            <Image source={icons.gallary} resizeMode="contain" />
            <Text className="font-medium text-[10px] text-dark">Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center justify-center gap-2 bg-light-100 border border-border py-[6px] px-3 rounded-[50px]">
            <Image source={icons.camera} resizeMode="contain" />
            <Text className="font-medium text-[10px] text-dark">Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center justify-center gap-2 bg-light-100 border border-border py-[6px] px-3 rounded-[50px]">
            <Image source={icons.video} resizeMode="contain" />
            <Text className="font-medium text-[10px] text-dark">Video</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}
