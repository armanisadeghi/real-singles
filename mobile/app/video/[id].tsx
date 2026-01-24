import NotificationBell from "@/components/NotificationBell";
import { icons } from "@/constants/icons";
import { VIDEO_URL } from "@/utils/token";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useVideoPlayer, VideoView } from "expo-video";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
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

  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isSeeking, setIsSeeking] = useState(false);

  const videoUrl = VIDEO_URL + videoData?.VideoURL;
  
  const player = useVideoPlayer(videoUrl, (player) => {
    player.loop = true;
    player.playbackRate = playbackRate;
  });

  // Subscribe to player events
  useEffect(() => {
    if (!player) return;

    const playingSubscription = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
    });

    const statusSubscription = player.addListener('statusChange', (event) => {
      if (event.status === 'readyToPlay') {
        setDuration(player.duration);
      }
    });

    // Poll for position updates (expo-video doesn't have a position change event)
    const positionInterval = setInterval(() => {
      if (!isSeeking && player.currentTime !== undefined) {
        setPosition(player.currentTime);
      }
    }, 250);

    return () => {
      playingSubscription.remove();
      statusSubscription.remove();
      clearInterval(positionInterval);
    };
  }, [player, isSeeking]);

  const togglePlay = () => {
    if (!player) return;
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  const changeSpeed = () => {
    if (!player) return;
    const newRate = playbackRate >= 2 ? 1 : playbackRate + 0.5;
    setPlaybackRate(newRate);
    player.playbackRate = newRate;
  };

  const skipForward = () => {
    if (!player) return;
    const newPosition = Math.min(player.currentTime + 10, duration);
    player.currentTime = newPosition;
    setPosition(newPosition);
  };

  const skipBackward = () => {
    if (!player) return;
    const newPosition = Math.max(player.currentTime - 10, 0);
    player.currentTime = newPosition;
    setPosition(newPosition);
  };

  const onSeekStart = () => {
    setIsSeeking(true);
  };

  const onSeekComplete = (value: number) => {
    if (!player) return;
    player.currentTime = value;
    setPosition(value);
    setIsSeeking(false);
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
        <VideoView
          player={player}
          style={{ width: "100%", height: "100%" }}
          contentFit="contain"
          nativeControls={false}
        />

        {/* Controls */}
        <View className="absolute bottom-0 left-0 w-full px-4 py-6 bg-black/50 z-50 rounded-t-2xl">
          <Text className="text-white text-xl font-bold">{videoData?.Name}</Text>

          {/* Slider */}
          <Slider
            style={{ width: "100%", height: 30 }}
            minimumValue={0}
            maximumValue={duration || 1}
            value={position}
            minimumTrackTintColor="#FFA500"
            maximumTrackTintColor="#fff"
            thumbTintColor="#FFA500"
            onSlidingStart={onSeekStart}
            onSlidingComplete={onSeekComplete}
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
