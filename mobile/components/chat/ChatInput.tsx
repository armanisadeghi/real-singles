import { icons } from "@/constants/icons";
import { PlatformIcon } from "@/components/ui";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from "react-native-reanimated";
import LinearBg from "../LinearBg";

interface ChatInputProps {
  onSend: (text: string) => void;
}

export default function ChatInput({ onSend }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [toggledMenu, setToggledMenu] = useState(false);

  // Native reanimated shared values (run on UI thread for smooth 60fps)
  const animationProgress = useSharedValue(0);

  // Spring animation configuration (native iOS feel)
  const springConfig = {
    damping: 18,
    stiffness: 150,
    mass: 1,
  };

  // React to menu toggle changes
  useEffect(() => {
    animationProgress.value = withSpring(toggledMenu ? 1 : 0, springConfig);
  }, [toggledMenu]);

  // Animated styles using native driver (runs on UI thread)
  const menuAnimatedStyle = useAnimatedStyle(() => {
    return {
      maxHeight: interpolate(animationProgress.value, [0, 1], [0, 80]),
      opacity: animationProgress.value,
      transform: [
        {
          translateY: interpolate(animationProgress.value, [0, 1], [-10, 0]),
        },
      ],
    };
  });

  const rotationAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${interpolate(animationProgress.value, [0, 1], [45, 0])}deg`,
        },
      ],
    };
  });

  const handleSend = useCallback(() => {
    if (message.trim().length > 0) {
      // Haptic feedback for message sent - success feel
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSend(message);
      setMessage("");
    }
  }, [message, onSend]);

  const handleToggleMenu = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setToggledMenu((prev) => !prev);
  }, []);

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
          // iOS-specific enhancements
          clearButtonMode="while-editing"
          enablesReturnKeyAutomatically={true}
          keyboardAppearance="light"
        />

        {/* Send button */}
        <TouchableOpacity
          className="w-[40px] h-[40px] rounded-[38px] items-center justify-center overflow-hidden"
          onPress={handleSend}
        >
          <LinearBg className="w-full h-full flex justify-center items-center" style={{padding: 10}}>
            <PlatformIcon 
              name="send" 
              size={20} 
              color="#FFFFFF" 
            />
          </LinearBg>
        </TouchableOpacity>
      </View>

      

      {/* Animated menu container - using native reanimated for smooth 60fps */}
      <Animated.View style={menuAnimatedStyle}>
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
