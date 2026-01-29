/**
 * ProfileVideoRecorder Component
 * 
 * Full-screen video recording for profile video intro.
 * Max duration: 60 seconds
 * 
 * Native UI features:
 * - iOS: SF Symbols, PlatformColor, haptic feedback
 * - Android: Material Icons, Material You colors, M3 springs, haptics
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  PlatformColor,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraType, CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useThemeColors, useIsDarkMode } from '@/context/ThemeContext';
import { PlatformIcon } from '@/components/ui/PlatformIcon';
import { LiquidGlassView } from '@/components/ui/LiquidGlass';
import { requestPermission } from '@/utils/permissions';

// Max recording duration in seconds
const MAX_DURATION = 60;

// M3 Expressive spring configs
const SPRING_FAST = { stiffness: 1400, damping: 67, mass: 1 };
const SPRING_DEFAULT = { stiffness: 700, damping: 48, mass: 1 };

interface ProfileVideoRecorderProps {
  /** Called when recording is saved with file URI and duration */
  onSave: (uri: string, duration: number) => Promise<void>;
  /** Called when user cancels recording */
  onCancel: () => void;
  /** Existing video URL for preview (if re-recording) */
  existingVideoUrl?: string | null;
}

type RecordingState = 'idle' | 'requesting' | 'ready' | 'recording' | 'preview' | 'saving';

/**
 * Performs haptic feedback appropriate for the platform
 */
function hapticFeedback(type: 'tap' | 'success' | 'error' | 'heavy') {
  if (Platform.OS === 'android') {
    switch (type) {
      case 'tap':
        Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Virtual_Key);
        break;
      case 'success':
        Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);
        break;
      case 'error':
        Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject);
        break;
      case 'heavy':
        Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Long_Press);
        break;
    }
  } else {
    switch (type) {
      case 'tap':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
    }
  }
}

/**
 * Format seconds as MM:SS
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function ProfileVideoRecorder({
  onSave,
  onCancel,
  existingVideoUrl,
}: ProfileVideoRecorderProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const isDark = useIsDarkMode();
  
  // Camera state
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission] = useCameraPermissions();
  const [audioPermission] = useMicrophonePermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  
  // Recording state
  const [state, setState] = useState<RecordingState>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Animation values
  const recordPulse = useSharedValue(1);
  const buttonScale = useSharedValue(1);
  
  // Video player for preview
  const player = useVideoPlayer(recordedUri || '', (p) => {
    p.loop = true;
  });
  
  // Platform-specific colors
  const themedColors = {
    background: Platform.OS === 'ios'
      ? (PlatformColor('systemBackground') as unknown as string)
      : colors.background,
    text: Platform.OS === 'ios'
      ? (PlatformColor('label') as unknown as string)
      : colors.onSurface,
    secondaryText: Platform.OS === 'ios'
      ? (PlatformColor('secondaryLabel') as unknown as string)
      : colors.onSurfaceVariant,
    danger: Platform.OS === 'ios'
      ? (PlatformColor('systemRed') as unknown as string)
      : colors.error,
    controlsBg: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.6)',
  };
  
  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Recording pulse animation
  useEffect(() => {
    if (state === 'recording') {
      recordPulse.value = withRepeat(
        withTiming(1.2, { duration: 500 }),
        -1,
        true
      );
    } else {
      recordPulse.value = withSpring(1, SPRING_FAST);
    }
  }, [state]);
  
  const checkPermissions = async () => {
    const hasCamera = await requestPermission('camera');
    const hasMic = await requestPermission('microphone');
    
    if (hasCamera && hasMic) {
      setState('ready');
    } else {
      setError('Camera and microphone permissions are required to record video.');
    }
  };
  
  const handleCameraReady = () => {
    setCameraReady(true);
  };
  
  const toggleFacing = () => {
    hapticFeedback('tap');
    setFacing(current => current === 'front' ? 'back' : 'front');
  };
  
  const startRecording = async () => {
    if (!cameraRef.current || !cameraReady) {
      hapticFeedback('error');
      Alert.alert('Camera not ready', 'Please wait for the camera to initialize.');
      return;
    }
    
    hapticFeedback('heavy');
    setState('recording');
    setRecordingDuration(0);
    setError(null);
    
    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingDuration(prev => {
        const newDuration = prev + 1;
        if (newDuration >= MAX_DURATION) {
          stopRecording();
          return MAX_DURATION;
        }
        return newDuration;
      });
    }, 1000);
    
    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration: MAX_DURATION,
      });
      
      if (video?.uri) {
        setRecordedUri(video.uri);
        setState('preview');
        hapticFeedback('success');
      }
    } catch (err) {
      console.error('Recording error:', err);
      setError('Failed to record video. Please try again.');
      setState('ready');
      hapticFeedback('error');
    } finally {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
  const stopRecording = () => {
    hapticFeedback('tap');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (cameraRef.current) {
      cameraRef.current.stopRecording();
    }
  };
  
  const handleSave = async () => {
    if (!recordedUri) return;
    
    hapticFeedback('tap');
    setState('saving');
    
    try {
      await onSave(recordedUri, recordingDuration);
      hapticFeedback('success');
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save video. Please try again.');
      setState('preview');
      hapticFeedback('error');
    }
  };
  
  const handleRetake = () => {
    hapticFeedback('tap');
    setRecordedUri(null);
    setRecordingDuration(0);
    setState('ready');
  };
  
  const handleCancel = () => {
    hapticFeedback('tap');
    onCancel();
  };
  
  // Animated styles
  const recordButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: recordPulse.value }],
  }));
  
  const pressableStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));
  
  // Permission error state
  if (error && state === 'idle') {
    return (
      <View style={[styles.container, { backgroundColor: themedColors.background }]}>
        <View style={[styles.centered, { paddingTop: insets.top }]}>
          <PlatformIcon 
            name="videocam-off" 
            iosName="video.slash.fill" 
            size={64} 
            color={themedColors.secondaryText} 
          />
          <Text style={[styles.errorText, { color: themedColors.text }]}>
            {error}
          </Text>
          <Pressable
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={checkPermissions}
          >
            <Text style={styles.buttonText}>Grant Permissions</Text>
          </Pressable>
          <Pressable style={styles.cancelLink} onPress={handleCancel}>
            <Text style={[styles.cancelLinkText, { color: themedColors.secondaryText }]}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }
  
  // Preview state (also show during saving to maintain UI)
  if ((state === 'preview' || state === 'saving') && recordedUri) {
    return (
      <View style={[styles.container, { backgroundColor: '#000' }]}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
        
        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <LiquidGlassView
            style={styles.durationBadge}
            fallbackColor={themedColors.controlsBg}
          >
            <Text style={styles.durationText}>{formatDuration(recordingDuration)}</Text>
          </LiquidGlassView>
        </View>
        
        {/* Bottom controls */}
        <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 20 }]}>
          <LiquidGlassView
            style={styles.controlsContainer}
            fallbackColor={themedColors.controlsBg}
          >
            <Pressable
              style={styles.controlButton}
              onPress={handleRetake}
              disabled={state === 'saving'}
            >
              <PlatformIcon name="refresh" iosName="arrow.counterclockwise" size={24} color="#fff" />
              <Text style={styles.controlText}>Retake</Text>
            </Pressable>
            
            <Pressable
              style={[styles.saveButton, state === 'saving' && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={state === 'saving'}
            >
              <PlatformIcon 
                name={state === 'saving' ? 'hourglass-empty' : 'check'} 
                iosName={state === 'saving' ? 'hourglass' : 'checkmark'} 
                size={28} 
                color="#fff" 
              />
              <Text style={styles.saveText}>
                {state === 'saving' ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
            
            <Pressable
              style={styles.controlButton}
              onPress={handleCancel}
              disabled={state === 'saving'}
            >
              <PlatformIcon name="close" iosName="xmark" size={24} color="#fff" />
              <Text style={styles.controlText}>Cancel</Text>
            </Pressable>
          </LiquidGlassView>
        </View>
      </View>
    );
  }
  
  // Camera / Recording state
  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      {(permission?.granted && audioPermission?.granted) && (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          mode="video"
          onCameraReady={handleCameraReady}
        />
      )}
      
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        {state === 'recording' ? (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <LiquidGlassView
              style={styles.recordingBadge}
              fallbackColor="rgba(255, 59, 48, 0.9)"
            >
              <Animated.View style={[styles.recordingDot, recordButtonStyle]} />
              <Text style={styles.recordingText}>{formatDuration(recordingDuration)}</Text>
            </LiquidGlassView>
          </Animated.View>
        ) : (
          <Pressable onPress={handleCancel}>
            <LiquidGlassView style={styles.closeButton} fallbackColor={themedColors.controlsBg}>
              <PlatformIcon name="close" iosName="xmark" size={20} color="#fff" />
            </LiquidGlassView>
          </Pressable>
        )}
        
        <Text style={styles.maxDurationHint}>Max {MAX_DURATION}s</Text>
      </View>
      
      {/* Bottom controls */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 20 }]}>
        <LiquidGlassView
          style={styles.controlsContainer}
          fallbackColor={themedColors.controlsBg}
        >
          {/* Flip camera */}
          <Pressable
            style={styles.controlButton}
            onPress={toggleFacing}
            disabled={state === 'recording'}
          >
            <PlatformIcon 
              name="flip-camera-ios" 
              iosName="camera.rotate.fill" 
              size={28} 
              color="#fff" 
            />
          </Pressable>
          
          {/* Record button */}
          {state === 'recording' ? (
            <Pressable style={styles.recordButtonOuter} onPress={stopRecording}>
              <View style={styles.stopButton}>
                <View style={styles.stopInner} />
              </View>
            </Pressable>
          ) : (
            <Pressable 
              style={styles.recordButtonOuter} 
              onPress={startRecording}
              disabled={!cameraReady}
            >
              <View style={[styles.recordButton, !cameraReady && styles.buttonDisabled]}>
                <View style={styles.recordInner} />
              </View>
            </Pressable>
          )}
          
          {/* Spacer for symmetry */}
          <View style={styles.controlButton} />
        </LiquidGlassView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 24,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  cancelLink: {
    marginTop: 16,
    padding: 8,
  },
  cancelLinkText: {
    fontSize: 16,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  maxDurationHint: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  recordingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
  },
  recordingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  durationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  durationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 32,
    width: '100%',
    maxWidth: 320,
  },
  controlButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonOuter: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FF3B30',
  },
  stopButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopInner: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#34C759',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
  },
  saveText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  controlText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
});

export default ProfileVideoRecorder;
