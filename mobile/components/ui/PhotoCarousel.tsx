/**
 * PhotoCarousel Component
 * 
 * A horizontal swipeable photo carousel with:
 * - Horizontal FlatList with paging
 * - Dot indicators below photos
 * - Tap to open FullScreenImageViewer
 * - Smooth snap scrolling
 */

import React, { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  View,
  ViewToken,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { IMAGE_URL, VIDEO_URL } from "@/utils/token";
import FullScreenImageViewer from "./FullScreenImageViewer";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface PhotoCarouselProps {
  /** Array of image URLs */
  images: string[];
  /** Height of the carousel */
  height?: number;
  /** Show gradient overlay at bottom */
  showGradient?: boolean;
  /** Optional callback when photo index changes */
  onIndexChange?: (index: number) => void;
}

// Helper to get proper image URI
const getImageUri = (image: string): string => {
  if (!image) return "";
  const img = image.trim();
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  if (img.startsWith("uploads/")) return `${IMAGE_URL}${img}`;
  return `${VIDEO_URL}${img}`;
};

export default function PhotoCarousel({
  images,
  height = 400,
  showGradient = true,
  onIndexChange,
}: PhotoCarouselProps) {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  
  // Handle scroll end to update current index
  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const newIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < images.length) {
        setCurrentIndex(newIndex);
        onIndexChange?.(newIndex);
      }
    },
    [currentIndex, images.length, onIndexChange]
  );
  
  // Handle viewable items change
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        const newIndex = viewableItems[0].index;
        if (newIndex !== currentIndex) {
          setCurrentIndex(newIndex);
          onIndexChange?.(newIndex);
        }
      }
    },
    [currentIndex, onIndexChange]
  );
  
  // Open full screen viewer
  const openFullScreen = useCallback((index: number) => {
    setViewerInitialIndex(index);
    setIsViewerVisible(true);
  }, []);
  
  // Close full screen viewer
  const closeFullScreen = useCallback(() => {
    setIsViewerVisible(false);
  }, []);
  
  // Navigate to specific index via dot press
  const goToIndex = useCallback((index: number) => {
    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
    });
    setCurrentIndex(index);
    onIndexChange?.(index);
  }, [onIndexChange]);
  
  // Render single photo item
  const renderItem = useCallback(
    ({ item, index }: { item: string; index: number }) => (
      <Pressable
        onPress={() => openFullScreen(index)}
        style={[styles.imageContainer, { height }]}
      >
        <Image
          source={{ uri: getImageUri(item) }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
      </Pressable>
    ),
    [height, openFullScreen]
  );
  
  // Key extractor
  const keyExtractor = useCallback(
    (item: string, index: number) => `photo-${index}-${item}`,
    []
  );
  
  // Get item layout for better scrolling performance
  const getItemLayout = useCallback(
    (_: ArrayLike<string> | null | undefined, index: number) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    []
  );
  
  if (images.length === 0) {
    return (
      <View style={[styles.placeholder, { height }]}>
        <View style={styles.placeholderInner} />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { height }]}>
      {/* Photo list */}
      <FlatList
        ref={flatListRef}
        data={images}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
        getItemLayout={getItemLayout}
        initialScrollIndex={0}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="center"
      />
      
      {/* Gradient overlay */}
      {showGradient && (
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.6)"]}
          style={styles.gradient}
          pointerEvents="none"
        />
      )}
      
      {/* Dot indicators */}
      {images.length > 1 && (
        <View style={styles.dotsContainer}>
          {images.map((_, index) => (
            <Pressable
              key={index}
              onPress={() => goToIndex(index)}
              hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
            >
              <View
                style={[
                  styles.dot,
                  index === currentIndex && styles.dotActive,
                ]}
              />
            </Pressable>
          ))}
        </View>
      )}
      
      {/* Full screen viewer */}
      <FullScreenImageViewer
        images={images}
        initialIndex={viewerInitialIndex}
        visible={isViewerVisible}
        onClose={closeFullScreen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: SCREEN_WIDTH,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  dotsContainer: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  dotActive: {
    backgroundColor: "white",
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  placeholder: {
    width: SCREEN_WIDTH,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#D1D5DB",
  },
});
