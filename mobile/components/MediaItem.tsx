import { IMAGE_URL } from "@/utils/token";
import { MaterialIcons } from "@expo/vector-icons";
import { Video } from "expo-av";
import React, { useRef, useState } from "react";
import { Image, Pressable, View } from "react-native";

interface MediaItemProps {
  item: string;
  itemWidth: number;
}

const MediaItem: React.FC<MediaItemProps> = ({ item, itemWidth }) => {
  const videoExtensions = [".mp4", ".mov", ".MOV", ".avi"];
  const isVideo = videoExtensions.some(ext => item.toLowerCase().endsWith(ext));

  const isLocalFile = item.startsWith("file://");
   // final URL to display
   const mediaUri = isLocalFile ? item : IMAGE_URL + item;

  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  if (!isVideo) {
     if (item.startsWith("file://")) {
    return null; // <-- ye line extra blank box remove karegi
  }

  
    return (
      <View
        style={{
          width: itemWidth,
          aspectRatio: 1,
          borderRadius: 12,
          // overflow: "hidden",
          backgroundColor: "#fff",
          padding: 5,

           // Shadow
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
            elevation: 6,
        }}
      >
        <Image
          source={{ uri: IMAGE_URL + item }}
          style={{ width: "100%", height: "100%", borderRadius: 12, }}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View
      style={{
        width: itemWidth,
        aspectRatio: 1,
        borderRadius: 12,
        // overflow: "hidden",
        backgroundColor: "#fff",
        padding: 5,

        // ⭐ BEAUTIFUL SHADOW
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },

        elevation: 6, // Android shadow
      }}
    >
      <Pressable
        style={{ flex: 1 }}
        onPress={async () => {
          if (!videoRef.current) return;
          const status: any = await videoRef.current.getStatusAsync();
          console.log("status of video:",status);
          
          if (status.isPlaying) {
            await videoRef.current.pauseAsync();
            setIsPlaying(false);
          } else {
            await videoRef.current.playAsync();
            setIsPlaying(true);
          }
        }}
      >
        <Video
          ref={videoRef}
          source={{ uri: mediaUri }}
          style={{ width: "100%", height: "100%", borderRadius: 12 }}
          resizeMode="cover"
          isLooping
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
          <MaterialIcons
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
