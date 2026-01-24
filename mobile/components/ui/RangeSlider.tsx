import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';

interface RangeSliderProps {
  sliderWidth: number;
  min: number;
  max: number;
  step: number;
  label: string;
  initialMin?: number;
  initialMax?: number;
  onValueChange: (range: { min: number; max: number }) => void;
}

const RangeSlider = ({sliderWidth, min, max, step, label, initialMin, initialMax, onValueChange}: RangeSliderProps) => {
  // Calculate initial positions based on initial values
  const getPositionFromValue = (value: number) => {
    return ((value - min) / (max - min)) * sliderWidth;
  };
  
  const initialPos1 = initialMin !== undefined ? getPositionFromValue(initialMin) : 0;
  const initialPos2 = initialMax !== undefined ? getPositionFromValue(initialMax) : sliderWidth;
  
  const position = useSharedValue(initialPos1);
  const position2 = useSharedValue(initialPos2);
  const opacity = useSharedValue(0);
  const opacity2 = useSharedValue(0);
  const zIndex = useSharedValue(0);
  const zIndex2 = useSharedValue(0);
  const context = useSharedValue(0);
  const context2 = useSharedValue(0);

  // Helper to calculate current values from position
  const getValuesFromPositions = (pos1: number, pos2: number) => {
    'worklet';
    return {
      min: min + Math.floor(pos1 / (sliderWidth / ((max - min) / step))) * step,
      max: min + Math.floor(pos2 / (sliderWidth / ((max - min) / step))) * step,
    };
  };

  // Using new Gesture API with proper configuration for use inside BottomSheet
  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10]) // Only activate after 10px horizontal movement
    .failOffsetY([-5, 5]) // Fail if vertical movement detected first
    .onBegin(() => {
      context.value = position.value;
    })
    .onUpdate(e => {
      opacity.value = 1;
      if (context.value + e.translationX < 0) {
        position.value = 0;
      } else if (context.value + e.translationX > position2.value) {
        position.value = position2.value;
        zIndex.value = 1;
        zIndex2.value = 0;
      } else {
        position.value = context.value + e.translationX;
      }
      // Update values in real-time during drag
      const values = getValuesFromPositions(position.value, position2.value);
      runOnJS(onValueChange)(values);
    })
    .onEnd(() => {
      opacity.value = 0;
      const values = getValuesFromPositions(position.value, position2.value);
      runOnJS(onValueChange)(values);
    });

  const pan2 = Gesture.Pan()
    .activeOffsetX([-10, 10]) // Only activate after 10px horizontal movement
    .failOffsetY([-5, 5]) // Fail if vertical movement detected first
    .onBegin(() => {
      context2.value = position2.value;
    })
    .onUpdate(e => {
      opacity2.value = 1;
      if (context2.value + e.translationX > sliderWidth) {
        position2.value = sliderWidth;
      } else if (context2.value + e.translationX < position.value) {
        position2.value = position.value;
        zIndex.value = 0;
        zIndex2.value = 1;
      } else {
        position2.value = context2.value + e.translationX;
      }
      // Update values in real-time during drag
      const values = getValuesFromPositions(position.value, position2.value);
      runOnJS(onValueChange)(values);
    })
    .onEnd(() => {
      opacity2.value = 0;
      const values = getValuesFromPositions(position.value, position2.value);
      runOnJS(onValueChange)(values);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: position.value}],
    zIndex: zIndex.value,
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{translateX: position2.value}],
    zIndex: zIndex2.value,
  }));

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const opacityStyle2 = useAnimatedStyle(() => ({
    opacity: opacity2.value,
  }));

  const sliderStyle = useAnimatedStyle(() => ({
    transform: [{translateX: position.value}],
    width: position2.value - position.value,
  }));

  // Add this line for Reanimated from v3.5.0
  Animated.addWhitelistedNativeProps({text: true});
  const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

  const minLabelText = useAnimatedProps(() => {
    return {
      value: `${
        min +
        Math.floor(position.value / (sliderWidth / ((max - min) / step))) * step
      } ${label}`,
    };
  });
  const maxLabelText = useAnimatedProps(() => {
    return {
      value: `${
        min +
        Math.floor(position2.value / (sliderWidth / ((max - min) / step))) *
          step
      } ${label}`,
    };
  });

  return (
    <View style={[styles.sliderContainer, {width: sliderWidth}]}>
      <View style={[styles.sliderBack, {width: sliderWidth}]} />
      <Animated.View style={[sliderStyle, styles.sliderFront]} />
      <GestureDetector gesture={pan}>
        <Animated.View style={[animatedStyle, styles.thumb]}>
          <Animated.View style={[opacityStyle, styles.label]}>
            <AnimatedTextInput
              style={styles.labelText}
              animatedProps={minLabelText}
              editable={false}
              textAlign="center"
            />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
      <GestureDetector gesture={pan2}>
        <Animated.View style={[animatedStyle2, styles.thumb]}>
          <Animated.View style={[opacityStyle2, styles.label]}>
            <AnimatedTextInput
              style={styles.labelText}
              animatedProps={maxLabelText}
              editable={false}
              textAlign="center"
            />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

export default RangeSlider;

const styles = StyleSheet.create({
  sliderContainer: {
    justifyContent: 'center',
    alignSelf: 'center',
  },
  sliderBack: {
    height: 20,
    backgroundColor: '#FFF0DC',
    borderRadius: 20,
  },
  sliderFront: {
    height: 20,
    backgroundColor: '#CF944E',
    borderRadius: 20,
    position: 'absolute',
  },
  thumb: {
    left: -10,
    width: 20,
    height: 20,
    position: 'absolute',
    backgroundColor: '#B06D1E',
    borderColor: '#B06D1E',
    borderWidth: 5,
    borderRadius: 10,
  },
  label: {
    position: 'absolute',
    top: -40,
    bottom: 20,
    backgroundColor: 'black',
    borderRadius: 5,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelText: {
    color: 'white',
    padding: 5,
    fontWeight: 'bold',
    fontSize: 16,
    width: '100%',
    marginHorizontal: 2,
    textAlign: 'center',
  },
});