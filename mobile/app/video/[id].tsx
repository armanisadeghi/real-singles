import NotificationBell from "@/components/NotificationBell";
import { icons } from "@/constants/icons";
import { VIDEO_URL } from "@/utils/token";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { Video } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Image,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function VideoPage() {
  const { id, data } = useLocalSearchParams<any>();
  const router = useRouter();
  const videoData = JSON.parse(data);

  const videoRef = useRef<Video>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Handle video status updates
  const onPlaybackStatusUpdate = (status: any) => {
    if (!status.isLoaded) return;
    setPosition(status.positionMillis / 1000);
    setDuration(status.durationMillis / 1000);
    setIsPlaying(status.isPlaying);
  };

  const togglePlay = async () => {
    if (!videoRef.current) return;
    const status = await videoRef.current.getStatusAsync();
    if (status.isPlaying) {
      await videoRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await videoRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const changeSpeed = async () => {
    const newRate = playbackRate >= 2 ? 1 : playbackRate + 0.5;
    setPlaybackRate(newRate);
    if (videoRef.current) {
      await videoRef.current.setRateAsync(newRate, true);
    }
  };

  const skipForward = async () => {
    if (videoRef.current) {
      const status = await videoRef.current.getStatusAsync();
      await videoRef.current.setPositionAsync(Math.min(status.positionMillis + 10000, status.durationMillis));
    }
  };

  const skipBackward = async () => {
    if (videoRef.current) {
      const status = await videoRef.current.getStatusAsync();
      await videoRef.current.setPositionAsync(Math.max(status.positionMillis - 10000, 0));
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <>
      <View className="flex-1 bg-backgground">
        {/* Header */}
        <View className="absolute top-0 left-0 w-full flex-row justify-between items-center px-4 pt-10 pb-6 z-30 bg-black/50 rounded-b-xl">
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-white border border-gray-300 rounded-lg justify-center items-center w-8 h-8"
            >
              <Image source={icons.back} className="w-4 h-4" resizeMode="contain" />
            </TouchableOpacity>
            <Text className="text-white text-base font-medium">Profile</Text>
          </View>
          <NotificationBell />
        </View>

        {/* Video */}
        <Video
          ref={videoRef}
          source={{ uri: VIDEO_URL + videoData?.VideoURL }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="contain"
          shouldPlay={false}
          isLooping
          rate={playbackRate}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        />

        {/* Controls */}
        <View className="absolute bottom-0 left-0 w-full px-4 py-6 bg-black/50 z-50 rounded-t-2xl">
          <Text className="text-white text-xl font-bold">{videoData?.Name}</Text>

          {/* Slider */}
          <Slider
            style={{ width: "100%", height: 30 }}
            minimumValue={0}
            maximumValue={duration}
            value={position}
            minimumTrackTintColor="#FFA500"
            maximumTrackTintColor="#fff"
            thumbTintColor="#FFA500"
            onSlidingComplete={async (value) => {
              if (videoRef.current) await videoRef.current.setPositionAsync(value * 1000);
            }}
          />
          <View className="flex-row justify-between">
            <Text className="text-white text-xs">{formatTime(position)}</Text>
            <Text className="text-white text-xs">{formatTime(duration)}</Text>
          </View>

          {/* Buttons */}
          <View className="flex-row justify-between items-center mt-2 pb-10">
            <TouchableOpacity onPress={changeSpeed}>
              <Text className="text-white font-medium text-base">{playbackRate}x</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={skipBackward}>
              <Ionicons name="play-back" size={28} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-white p-3 rounded-full"
              onPress={togglePlay}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={20}
                color="black"
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={skipForward}>
              <Ionicons name="play-forward" size={28} color="white" />
            </TouchableOpacity>

            <View>
              {/* <Ionicons name="share-social-outline" size={24} color="black" /> */}
            </View>
          </View>
        </View>
      </View>
    </>
  );
}
