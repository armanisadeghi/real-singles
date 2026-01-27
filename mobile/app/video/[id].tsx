import NotificationBell from "@/components/NotificationBell";
import { VIDEO_URL } from "@/utils/token";
import { PlatformIcon } from "@/components/ui";
import * as Haptics from "expo-haptics";
import Slider from "@react-native-community/slider";
import { useVideoPlayer, VideoView } from "expo-video";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import {
  BackHandler,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function VideoPage() {
  const { id, data } = useLocalSearchParams<any>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const videoData = JSON.parse(data);

  const [isPlaying, setIsPlaying] = useState(false);

  // Android hardware back button handling
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      router.back();
      return true;
    });
    return () => backHandler.remove();
  }, []);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isSeeking, setIsSeeking] = useState(false);

  const videoUrl = videoData?.VideoURL?.startsWith('http') ? videoData.VideoURL : VIDEO_URL + videoData?.VideoURL;
  
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
      <View className="flex-1 bg-background">
        {/* Header */}
        <View 
          className="absolute top-0 left-0 w-full flex-row justify-between items-center px-4 pb-6 z-30 bg-black/50 rounded-b-xl"
          style={{ paddingTop: insets.top + 8 }}
        >
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="bg-white border border-gray-300 rounded-lg justify-center items-center w-8 h-8"
            >
              <PlatformIcon name="chevron-left" size={16} color="#000" />
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
            <TouchableOpacity onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              changeSpeed();
            }}>
              <Text className="text-white font-medium text-base">{playbackRate}x</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              skipBackward();
            }}>
              <PlatformIcon name="replay-10" size={28} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-white p-3 rounded-full"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                togglePlay();
              }}
            >
              <PlatformIcon
                name={isPlaying ? "pause" : "play-arrow"}
                size={20}
                color="black"
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              skipForward();
            }}>
              <PlatformIcon name="forward-10" size={28} color="white" />
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
