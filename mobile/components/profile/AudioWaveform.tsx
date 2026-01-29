/**
 * AudioWaveform Component
 * 
 * Real-time audio waveform visualization for voice recording.
 * Uses the audio metering data from expo-audio to display an animated waveform.
 * 
 * Supports:
 * - Platform-specific colors (iOS PlatformColor, Android Material You)
 * - Accessibility (respects reduced motion)
 * - Dark/light mode
 */

import React, { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Platform,
  PlatformColor,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useThemeColors } from '@/context/ThemeContext';

// M3 Expressive spring config for smooth, bouncy animations
const SPRING_CONFIG_ANDROID = {
  stiffness: 1400,
  damping: 67,
  mass: 1,
};

// iOS spring config - slightly softer
const SPRING_CONFIG_IOS = {
  damping: 20,
  stiffness: 300,
};

const SPRING_CONFIG = Platform.OS === 'android' ? SPRING_CONFIG_ANDROID : SPRING_CONFIG_IOS;

// Number of bars in the waveform
const BAR_COUNT = 32;

// Bar width and gap
const BAR_WIDTH = 3;
const BAR_GAP = 2;

interface AudioWaveformProps {
  /** Current audio metering level (-160 to 0 dB, or 0-1 normalized) */
  meteringLevel?: number;
  /** Whether the waveform is actively recording */
  isActive: boolean;
  /** Total width of the waveform container */
  width?: number;
  /** Height of the waveform container */
  height?: number;
  /** Custom style for the container */
  style?: StyleProp<ViewStyle>;
  /** Primary color for bars (defaults to platform accent) */
  color?: string;
  /** Secondary/muted color for background bars */
  secondaryColor?: string;
}

/**
 * Single animated bar in the waveform
 */
function WaveformBar({
  index,
  meteringLevel,
  isActive,
  height,
  color,
  secondaryColor,
  reducedMotion,
}: {
  index: number;
  meteringLevel: number;
  isActive: boolean;
  height: number;
  color: string;
  secondaryColor: string;
  reducedMotion: boolean;
}) {
  const barHeight = useSharedValue(0.15);
  
  useEffect(() => {
    if (!isActive) {
      // When not active, return to minimum height
      barHeight.value = reducedMotion 
        ? withTiming(0.15, { duration: 200 })
        : withSpring(0.15, SPRING_CONFIG);
      return;
    }
    
    // Create variation based on bar position and metering
    // Each bar gets a slightly different height for organic look
    const phase = (index / BAR_COUNT) * Math.PI * 2;
    const variation = Math.sin(phase + meteringLevel * 10) * 0.2;
    
    // Convert metering to height (0.15 to 1.0 range)
    const normalizedMeter = Math.max(0, Math.min(1, (meteringLevel + 60) / 60));
    const targetHeight = Math.max(0.15, Math.min(1, normalizedMeter + variation));
    
    if (reducedMotion) {
      barHeight.value = withTiming(targetHeight, { duration: 100 });
    } else {
      barHeight.value = withSpring(targetHeight, SPRING_CONFIG);
    }
  }, [meteringLevel, isActive, index, reducedMotion]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: interpolate(
        barHeight.value,
        [0, 1],
        [height * 0.15, height],
        Extrapolation.CLAMP
      ),
      backgroundColor: isActive ? color : secondaryColor,
    };
  });
  
  return (
    <Animated.View
      style={[
        {
          width: BAR_WIDTH,
          borderRadius: BAR_WIDTH / 2,
          marginHorizontal: BAR_GAP / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

/**
 * AudioWaveform Component
 * 
 * Displays an animated waveform visualization during audio recording.
 * Falls back to static bars when reduced motion is enabled.
 */
export function AudioWaveform({
  meteringLevel = -60,
  isActive,
  width = 200,
  height = 60,
  style,
  color,
  secondaryColor,
}: AudioWaveformProps) {
  const colors = useThemeColors();
  const [reducedMotion, setReducedMotion] = React.useState(false);
  
  // Check reduced motion preference
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion
    );
    
    return () => subscription.remove();
  }, []);
  
  // Platform-specific default colors
  const primaryColor = color || (
    Platform.OS === 'ios'
      ? (PlatformColor('systemPink') as unknown as string)
      : colors.primary
  );
  
  const mutedColor = secondaryColor || (
    Platform.OS === 'ios'
      ? (PlatformColor('systemGray4') as unknown as string)
      : colors.surfaceContainerHighest
  );
  
  // Generate bars
  const bars = Array.from({ length: BAR_COUNT }, (_, i) => i);
  
  return (
    <View
      style={[
        {
          width,
          height,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
      accessibilityLabel={isActive ? 'Audio waveform visualization, recording' : 'Audio waveform'}
      accessibilityRole="image"
    >
      {bars.map((index) => (
        <WaveformBar
          key={index}
          index={index}
          meteringLevel={meteringLevel}
          isActive={isActive}
          height={height}
          color={primaryColor}
          secondaryColor={mutedColor}
          reducedMotion={reducedMotion}
        />
      ))}
    </View>
  );
}

export default AudioWaveform;
