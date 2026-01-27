/**
 * FullScreenImageViewer Component
 * 
 * A native-feeling full-screen image viewer with:
 * - Pinch-to-zoom
 * - Pan when zoomed
 * - Double-tap to zoom in/out
 * - Swipe left/right to navigate images
 * - Swipe down to dismiss
 * - Photo counter
 */

import React, { useCallback, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  StatusBar,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

// Spring config for native iOS feel
const SPRING_CONFIG = { damping: 15, stiffness: 150 };
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from 'expo-haptics';
import { PlatformIcon } from "@/components/ui";
import { IMAGE_URL, VIDEO_URL } from "@/utils/token";
const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const DISMISS_THRESHOLD = 100;

interface FullScreenImageViewerProps {
  images: string[];
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
}

// Helper to get proper image URI
const getImageUri = (image: string): string => {
  if (!image) return "";
  const img = image.trim();
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  if (img.startsWith("uploads/")) return `${IMAGE_URL}${img}`;
  return `${VIDEO_URL}${img}`;
};

export default function FullScreenImageViewer({
  images,
  initialIndex = 0,
  visible,
  onClose,
}: FullScreenImageViewerProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  // Animation values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const dismissProgress = useSharedValue(0);
  
  // Reset transforms when changing images
  const resetTransforms = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIG);
    savedScale.value = 1;
    translateX.value = withSpring(0, SPRING_CONFIG);
    translateY.value = withSpring(0, SPRING_CONFIG);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, []);
  
  // Navigate to next/previous image
  const goToImage = useCallback((index: number) => {
    if (index >= 0 && index < images.length) {
      resetTransforms();
      setCurrentIndex(index);
    }
  }, [images.length, resetTransforms]);
  
  const goNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      goToImage(currentIndex + 1);
    }
  }, [currentIndex, images.length, goToImage]);
  
  const goPrevious = useCallback(() => {
    if (currentIndex > 0) {
      goToImage(currentIndex - 1);
    }
  }, [currentIndex, goToImage]);
  
  // Handle close
  const handleClose = useCallback(() => {
    resetTransforms();
    dismissProgress.value = 0;
    onClose();
  }, [onClose, resetTransforms]);
  
  // Pinch gesture for zooming
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.min(Math.max(savedScale.value * event.scale, MIN_SCALE), MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < MIN_SCALE) {
        scale.value = withSpring(MIN_SCALE, SPRING_CONFIG);
        savedScale.value = MIN_SCALE;
      }
    });
  
  // Pan gesture for moving when zoomed
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // If not zoomed, track vertical drag for dismiss
      if (savedScale.value <= 1) {
        translateY.value = event.translationY;
        dismissProgress.value = Math.abs(event.translationY) / DISMISS_THRESHOLD;
        
        // Horizontal swipe for image navigation
        translateX.value = event.translationX;
      } else {
        // When zoomed, allow panning
        const maxTranslateX = (screenWidth * (scale.value - 1)) / 2;
        const maxTranslateY = (screenHeight * (scale.value - 1)) / 2;
        
        translateX.value = Math.min(
          Math.max(savedTranslateX.value + event.translationX, -maxTranslateX),
          maxTranslateX
        );
        translateY.value = Math.min(
          Math.max(savedTranslateY.value + event.translationY, -maxTranslateY),
          maxTranslateY
        );
      }
    })
    .onEnd((event) => {
      if (savedScale.value <= 1) {
        // Check for dismiss gesture
        if (Math.abs(translateY.value) > DISMISS_THRESHOLD) {
          runOnJS(handleClose)();
          return;
        }
        
        // Check for horizontal swipe navigation
        if (Math.abs(event.translationX) > 50 && Math.abs(event.velocityX) > 100) {
          if (event.translationX > 0) {
            runOnJS(goPrevious)();
          } else {
            runOnJS(goNext)();
          }
        }
        
        translateX.value = withSpring(0, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
        dismissProgress.value = withSpring(0, SPRING_CONFIG);
      } else {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      }
    });
  
  // Double tap gesture for quick zoom
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((event) => {
      if (scale.value > 1) {
        // Zoom out
        scale.value = withSpring(1, SPRING_CONFIG);
        savedScale.value = 1;
        translateX.value = withSpring(0, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        // Zoom in to tap location
        scale.value = withSpring(DOUBLE_TAP_SCALE, SPRING_CONFIG);
        savedScale.value = DOUBLE_TAP_SCALE;
        
        // Calculate offset to zoom towards tap point
        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;
        const offsetX = (centerX - event.x) * (DOUBLE_TAP_SCALE - 1);
        const offsetY = (centerY - event.y) * (DOUBLE_TAP_SCALE - 1);
        
        translateX.value = withSpring(offsetX, SPRING_CONFIG);
        translateY.value = withSpring(offsetY, SPRING_CONFIG);
        savedTranslateX.value = offsetX;
        savedTranslateY.value = offsetY;
      }
    });
  
  // Combine gestures
  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    Gesture.Race(doubleTapGesture, panGesture)
  );
  
  // Animated styles
  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));
  
  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - dismissProgress.value * 0.5,
  }));
  
  if (!visible || images.length === 0) return null;
  
  const currentImage = images[currentIndex];
  const imageUri = getImageUri(currentImage);
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <GestureHandlerRootView style={styles.container}>
        {/* Dark background */}
        <Animated.View style={[styles.overlay, overlayAnimatedStyle]} />
        
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          {/* Close button */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleClose();
            }}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <PlatformIcon name="close" size={28} color="white" />
          </Pressable>
          
          {/* Photo counter */}
          {images.length > 1 && (
            <View style={styles.counter}>
              <Text style={styles.counterText}>
                {currentIndex + 1} / {images.length}
              </Text>
            </View>
          )}
          
          {/* Spacer for alignment */}
          <View style={styles.closeButton} />
        </View>
        
        {/* Image */}
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.imageContainer, imageAnimatedStyle]}>
            <Image
              source={{ uri: imageUri }}
              style={{ width: screenWidth, height: screenHeight }}
              contentFit="contain"
              transition={200}
            />
          </Animated.View>
        </GestureDetector>
        
        {/* Navigation hints for multiple images */}
        {images.length > 1 && (
          <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.dotsContainer}>
              {images.map((_, index) => (
                <Pressable
                  key={index}
                  onPress={() => {
                    Haptics.selectionAsync();
                    goToImage(index);
                  }}
                  style={[
                    styles.dot,
                    index === currentIndex && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "black",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  counter: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  counterText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  dotActive: {
    backgroundColor: "white",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
