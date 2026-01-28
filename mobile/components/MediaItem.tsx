import { IMAGE_URL } from "@/utils/token";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useState, useEffect } from "react";
import { Image, Pressable, View } from "react-native";

interface MediaItemProps {
  item: string;
  itemWidth: number;
}

const MediaItem: React.FC<MediaItemProps> = ({ item, itemWidth }) => {
  const videoExtensions = [".mp4", ".mov", ".MOV", ".avi"];
  const isVideo = videoExtensions.some(ext => item.toLowerCase().endsWith(ext));

  const isLocalFile = item.startsWith("file://");
  const isFullUrl = item.startsWith("http://") || item.startsWith("https://");
  // final URL to display
  const mediaUri = isLocalFile || isFullUrl ? item : IMAGE_URL + item;

  const [isPlaying, setIsPlaying] = useState(false);
  
  // Create video player only for video items
  const player = useVideoPlayer(isVideo ? mediaUri : null, (player) => {
    if (player) {
      player.loop = true;
    }
  });

  // Subscribe to playing state changes
  useEffect(() => {
    if (!player) return;
    
    const subscription = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
    });
    
    return () => {
      subscription.remove();
    };
  }, [player]);

  if (!isVideo) {
    if (item.startsWith("file://")) {
      return null; // Remove extra blank box for local files
    }

    return (
      <View
        style={{
          width: itemWidth,
          aspectRatio: 1,
          borderRadius: 12,
          backgroundColor: "#fff",
          padding: 5,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
          elevation: 6,
        }}
      >
        <Image
          source={{ uri: mediaUri }}
          style={{ width: "100%", height: "100%", borderRadius: 12 }}
          resizeMode="cover"
        />
      </View>
    );
  }

  const togglePlayback = () => {
    if (!player) return;
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <View
      style={{
        width: itemWidth,
        aspectRatio: 1,
        borderRadius: 12,
        backgroundColor: "#fff",
        padding: 5,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 6,
      }}
    >
      <Pressable style={{ flex: 1 }} onPress={togglePlayback}>
        <VideoView
          player={player}
          style={{ width: "100%", height: "100%", borderRadius: 12 }}
          contentFit="cover"
          nativeControls={false}
        />

        {/* Play/Pause Overlay */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <PlatformIcon
            name={isPlaying ? "pause-circle-outline" : "play-circle-outline"}
            size={48}
            color="white"
          />
        </View>
      </Pressable>
    </View>
  );
};

export default MediaItem;
