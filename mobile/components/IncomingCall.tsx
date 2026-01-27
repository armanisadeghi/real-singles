import { useCall } from '@/context/CallContext';
import { PlatformIcon } from "@/components/ui";
import { useAudioPlayer, AudioPlayer } from "expo-audio";
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const IncomingCall = () => {
  const { incomingCall, acceptCall, rejectCall } = useCall();
  const player = useAudioPlayer(require("../assets/sounds/ringtone.mp3"));
  const hasStartedPlaying = useRef(false);
  const translationX = useSharedValue(0);

  // Play sound on incoming call
  useEffect(() => {
    if (incomingCall && player && !hasStartedPlaying.current) {
      try {
        player.loop = true;
        player.play();
        hasStartedPlaying.current = true;
      } catch (error) {
        console.error(
          "Failed to play sound. Please check the path and ensure the file exists in assets/sounds.",
          error
        );
      }
    }

    // Cleanup sound
    return () => {
      if (player) {
        player.pause();
        hasStartedPlaying.current = false;
      }
    };
  }, [incomingCall, player]);

  const handleReject = () => {
    if (player) {
      player.pause();
    }
    rejectCall();
  };

  const handleAccept = () => {
    if (player) {
      player.pause();
    }
    acceptCall();
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Limit sliding to the right direction and within bounds
      if (event.translationX > 0 && event.translationX < 200) {
        translationX.value = event.translationX;
      }
    })
    .onEnd(() => {
      if (translationX.value > 150) {
        // Threshold for accepting the call
        runOnJS(handleAccept)();
      } else {
        // Reset position with a spring animation (native iOS feel)
        translationX.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
    });

  const animatedSliderStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translationX.value }],
    };
  });

  if (!incomingCall) {
    return null;
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={!!incomingCall}
      onRequestClose={handleReject}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.container}>
          <View style={styles.modalView}>
            <Text style={styles.title}>Incoming Call</Text>
            <Text style={styles.callerId}>From: {incomingCall.callerId}</Text>

            {/* Slide to Accept */}
            <View style={styles.sliderContainer}>
              <GestureDetector gesture={panGesture}>
                <Animated.View
                  style={[styles.sliderButton, animatedSliderStyle]}
                >
                  <PlatformIcon name="call" size={32} color="#4CAF50" />
                </Animated.View>
              </GestureDetector>
              <Text style={styles.sliderText}>Slide to Answer</Text>
            </View>

            {/* Reject Button */}
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                handleReject();
              }}
            >
              <PlatformIcon name="close" size={32} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalView: {
    margin: 20,
    backgroundColor: '#2c2c2c',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#ffffff',
  },
  callerId: {
    fontSize: 18,
    marginBottom: 40,
    color: '#dddddd',
  },
  rejectButton: {
    backgroundColor: '#F44336',
    borderRadius: 40,
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    elevation: 8,
  },
  // Slider Styles
  sliderContainer: {
    height: 80,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  sliderButton: {
    position: 'absolute',
    left: 10,
    height: 60,
    width: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  sliderText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default IncomingCall; 