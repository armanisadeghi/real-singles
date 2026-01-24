import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DEFAULT_SLIDER_WIDTH = SCREEN_WIDTH - 80; // 40px padding on each side

interface RangeSliderProps {
  sliderWidth?: number;
  min: number;
  max: number;
  step: number;
  label: string;
  initialMin?: number;
  initialMax?: number;
  onValueChange: (range: { min: number; max: number }) => void;
}

const RangeSlider = ({
  sliderWidth = DEFAULT_SLIDER_WIDTH,
  min,
  max,
  step,
  label,
  initialMin,
  initialMax,
  onValueChange,
}: RangeSliderProps) => {
  // State for displaying current values (updated via runOnJS)
  const [displayMin, setDisplayMin] = useState(initialMin ?? min);
  const [displayMax, setDisplayMax] = useState(initialMax ?? max);
  const [isDragging1, setIsDragging1] = useState(false);
  const [isDragging2, setIsDragging2] = useState(false);

  // Calculate position from value
  const getPositionFromValue = (value: number) => {
    return ((value - min) / (max - min)) * sliderWidth;
  };

  // Calculate value from position
  const getValueFromPosition = (pos: number) => {
    const rawValue = min + (pos / sliderWidth) * (max - min);
    // Round to nearest step
    const steppedValue = Math.round(rawValue / step) * step;
    // Clamp to min/max
    return Math.max(min, Math.min(max, steppedValue));
  };

  // Initial positions
  const initialPos1 = getPositionFromValue(initialMin ?? min);
  const initialPos2 = getPositionFromValue(initialMax ?? max);

  const position1 = useSharedValue(initialPos1);
  const position2 = useSharedValue(initialPos2);
  const context1 = useSharedValue(0);
  const context2 = useSharedValue(0);

  // Update display values and call callback
  const updateValues = (pos1: number, pos2: number) => {
    const val1 = getValueFromPosition(pos1);
    const val2 = getValueFromPosition(pos2);
    setDisplayMin(val1);
    setDisplayMax(val2);
    onValueChange({ min: val1, max: val2 });
  };

  // Gesture for left thumb
  const pan1 = Gesture.Pan()
    .onBegin(() => {
      context1.value = position1.value;
      runOnJS(setIsDragging1)(true);
    })
    .onUpdate((e) => {
      let newPos = context1.value + e.translationX;
      // Constrain to valid range
      newPos = Math.max(0, Math.min(newPos, position2.value - 10));
      position1.value = newPos;
      runOnJS(updateValues)(newPos, position2.value);
    })
    .onEnd(() => {
      runOnJS(setIsDragging1)(false);
    })
    .minDistance(0)
    .activeOffsetX([-5, 5]);

  // Gesture for right thumb
  const pan2 = Gesture.Pan()
    .onBegin(() => {
      context2.value = position2.value;
      runOnJS(setIsDragging2)(true);
    })
    .onUpdate((e) => {
      let newPos = context2.value + e.translationX;
      // Constrain to valid range
      newPos = Math.max(position1.value + 10, Math.min(newPos, sliderWidth));
      position2.value = newPos;
      runOnJS(updateValues)(position1.value, newPos);
    })
    .onEnd(() => {
      runOnJS(setIsDragging2)(false);
    })
    .minDistance(0)
    .activeOffsetX([-5, 5]);

  // Animated styles
  const thumb1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: position1.value }],
  }));

  const thumb2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: position2.value }],
  }));

  const trackStyle = useAnimatedStyle(() => ({
    left: position1.value,
    width: position2.value - position1.value,
  }));

  // Format value for display
  const formatValue = (value: number) => {
    if (step < 1) {
      return value.toFixed(1);
    }
    return Math.round(value).toString();
  };

  return (
    <View style={[styles.container, { width: sliderWidth }]}>
      {/* Background track */}
      <View style={[styles.track, { width: sliderWidth }]} />
      
      {/* Active track (between thumbs) */}
      <Animated.View style={[styles.activeTrack, trackStyle]} />
      
      {/* Left thumb */}
      <GestureDetector gesture={pan1}>
        <Animated.View style={[styles.thumbContainer, thumb1Style]}>
          <View style={styles.thumb} />
          {isDragging1 && (
            <View style={styles.tooltip}>
              <Text style={styles.tooltipText}>
                {formatValue(displayMin)} {label}
              </Text>
            </View>
          )}
        </Animated.View>
      </GestureDetector>
      
      {/* Right thumb */}
      <GestureDetector gesture={pan2}>
        <Animated.View style={[styles.thumbContainer, thumb2Style]}>
          <View style={styles.thumb} />
          {isDragging2 && (
            <View style={styles.tooltip}>
              <Text style={styles.tooltipText}>
                {formatValue(displayMax)} {label}
              </Text>
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

export default RangeSlider;

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  track: {
    height: 8,
    backgroundColor: '#FFF0DC',
    borderRadius: 4,
  },
  activeTrack: {
    position: 'absolute',
    height: 8,
    backgroundColor: '#CF944E',
    borderRadius: 4,
  },
  thumbContainer: {
    position: 'absolute',
    width: 28,
    height: 28,
    marginLeft: -14, // Center the thumb on the position
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumb: {
    width: 28,
    height: 28,
    backgroundColor: '#B06D1E',
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  tooltip: {
    position: 'absolute',
    bottom: 36,
    backgroundColor: '#333',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
