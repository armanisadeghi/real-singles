/**
 * ProfileVoiceRecorder Component
 * 
 * Voice prompt recording for profile.
 * Max duration: 30 seconds
 * 
 * Uses expo-audio for recording with real-time metering visualization.
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
  ActivityIndicator,
} from 'react-native';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  useAudioPlayer,
} from 'expo-audio';
import * as Haptics from 'expo-haptics';
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
import { AudioWaveform } from './AudioWaveform';
import { requestPermission } from '@/utils/permissions';

// Max recording duration in seconds
const MAX_DURATION = 30;

// M3 Expressive spring configs
const SPRING_FAST = { stiffness: 1400, damping: 67, mass: 1 };
const SPRING_DEFAULT = { stiffness: 700, damping: 48, mass: 1 };

interface ProfileVoiceRecorderProps {
  /** Called when recording is saved with file URI and duration */
  onSave: (uri: string, duration: number) => Promise<void>;
  /** Called when user cancels recording */
  onCancel: () => void;
  /** Existing voice prompt URL for playback */
  existingVoiceUrl?: string | null;
  /** Existing duration in seconds */
  existingDuration?: number | null;
}

type RecordingState = 'idle' | 'requesting' | 'ready' | 'recording' | 'preview' | 'saving';

/**
 * Performs haptic feedback appropriate for the platform
 */
function hapticFeedback(type: 'tap' | 'success' | 'error' | 'heavy' | 'selection') {
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
      case 'selection':
        Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Clock_Tick);
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
      case 'selection':
        Haptics.selectionAsync();
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

export function ProfileVoiceRecorder({
  onSave,
  onCancel,
  existingVoiceUrl,
  existingDuration,
}: ProfileVoiceRecorderProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const isDark = useIsDarkMode();
  
  // Recording state
  const [state, setState] = useState<RecordingState>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [meteringLevel, setMeteringLevel] = useState(-60);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  
  // Refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Audio recorder - RecordingStatus from callback has id, isFinished, hasError, error, url
  // For metering, we need to poll getStatus() which returns RecorderState with metering
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  
  // Audio player for preview
  const player = useAudioPlayer(recordedUri || existingVoiceUrl || '');
  
  // Animation values
  const recordPulse = useSharedValue(1);
  
  // Platform-specific colors
  const themedColors = {
    background: Platform.OS === 'ios'
      ? (PlatformColor('systemBackground') as unknown as string)
      : colors.background,
    secondaryBg: Platform.OS === 'ios'
      ? (PlatformColor('secondarySystemBackground') as unknown as string)
      : colors.surfaceContainer,
    text: Platform.OS === 'ios'
      ? (PlatformColor('label') as unknown as string)
      : colors.onSurface,
    secondaryText: Platform.OS === 'ios'
      ? (PlatformColor('secondaryLabel') as unknown as string)
      : colors.onSurfaceVariant,
    accent: Platform.OS === 'ios'
      ? (PlatformColor('systemPink') as unknown as string)
      : colors.primary,
    danger: Platform.OS === 'ios'
      ? (PlatformColor('systemRed') as unknown as string)
      : colors.error,
    success: Platform.OS === 'ios'
      ? (PlatformColor('systemGreen') as unknown as string)
      : '#34C759',
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
      if (recorder.isRecording) {
        recorder.stop();
      }
    };
  }, []);
  
  // Player event listeners - expo-audio uses 'playbackStatusUpdate' with AudioStatus
  useEffect(() => {
    if (!player) return;
    
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      setIsPlaying(status.playing);
    });
    
    return () => subscription.remove();
  }, [player]);
  
  // Metering update loop when recording
  useEffect(() => {
    if (state !== 'recording') return;
    
    const meteringInterval = setInterval(() => {
      const recorderState = recorder.getStatus();
      if (recorderState.metering !== undefined) {
        setMeteringLevel(recorderState.metering);
      }
    }, 100);
    
    return () => clearInterval(meteringInterval);
  }, [state, recorder]);
  
  // Recording pulse animation
  useEffect(() => {
    if (state === 'recording') {
      recordPulse.value = withRepeat(
        withTiming(1.15, { duration: 500 }),
        -1,
        true
      );
    } else {
      recordPulse.value = withSpring(1, SPRING_FAST);
    }
  }, [state]);
  
  const checkPermissions = async () => {
    const hasMic = await requestPermission('microphone');
    
    if (hasMic) {
      setHasPermission(true);
      setState('ready');
    } else {
      setError('Microphone permission is required to record voice prompts.');
    }
  };
  
  const startRecording = async () => {
    if (!hasPermission) {
      hapticFeedback('error');
      Alert.alert('Permission Required', 'Please grant microphone access to record.');
      return;
    }
    
    hapticFeedback('heavy');
    setState('recording');
    setRecordingDuration(0);
    setError(null);
    
    // Request audio permissions for expo-audio
    const permissionStatus = await AudioModule.requestRecordingPermissionsAsync();
    if (!permissionStatus.granted) {
      setError('Microphone permission was denied.');
      setState('ready');
      hapticFeedback('error');
      return;
    }
    
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
      await recorder.record();
    } catch (err) {
      console.error('Recording error:', err);
      setError('Failed to start recording. Please try again.');
      setState('ready');
      hapticFeedback('error');
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
  const stopRecording = async () => {
    hapticFeedback('tap');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    try {
      await recorder.stop();
      // Get the URI from the recorder object after stopping
      const uri = recorder.uri;
      if (uri) {
        setRecordedUri(uri);
        setState('preview');
        hapticFeedback('success');
      } else {
        setError('Recording failed. Please try again.');
        setState('ready');
        hapticFeedback('error');
      }
    } catch (err) {
      console.error('Stop recording error:', err);
      setError('Failed to save recording. Please try again.');
      setState('ready');
      hapticFeedback('error');
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
      setError('Failed to save recording. Please try again.');
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
    if (recorder.isRecording) {
      recorder.stop();
    }
    onCancel();
  };
  
  const togglePlayback = () => {
    hapticFeedback('selection');
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };
  
  // Animated styles
  const recordButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: recordPulse.value }],
  }));
  
  // Permission error state
  if (error && !hasPermission) {
    return (
      <View style={[styles.container, { backgroundColor: themedColors.background }]}>
        <View style={[styles.centered, { paddingTop: insets.top }]}>
          <PlatformIcon 
            name="mic-off" 
            iosName="mic.slash.fill" 
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
            <Text style={styles.buttonText}>Grant Permission</Text>
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
  
  return (
    <View style={[styles.container, { backgroundColor: themedColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={handleCancel} style={styles.closeButton}>
          <PlatformIcon name="close" iosName="xmark" size={20} color={themedColors.text} />
        </Pressable>
        <Text style={[styles.title, { color: themedColors.text }]}>
          {state === 'preview' ? 'Preview Recording' : 'Record Voice Prompt'}
        </Text>
        <View style={{ width: 40 }} />
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {/* Waveform visualization */}
        <View style={[styles.waveformContainer, { backgroundColor: themedColors.secondaryBg }]}>
          {state === 'recording' ? (
            <AudioWaveform
              meteringLevel={meteringLevel}
              isActive={true}
              width={280}
              height={80}
              color={themedColors.accent}
            />
          ) : (
            <View style={styles.micIconContainer}>
              <PlatformIcon 
                name="mic" 
                iosName="mic.fill" 
                size={48} 
                color={themedColors.accent} 
              />
            </View>
          )}
        </View>
        
        {/* Duration display */}
        <View style={styles.durationContainer}>
          {state === 'recording' && (
            <Animated.View entering={FadeIn} style={styles.recordingIndicator}>
              <Animated.View style={[styles.recordingDot, recordButtonStyle]} />
              <Text style={[styles.recordingLabel, { color: themedColors.danger }]}>
                Recording
              </Text>
            </Animated.View>
          )}
          <Text style={[styles.duration, { color: themedColors.text }]}>
            {formatDuration(state === 'preview' ? recordingDuration : recordingDuration)}
          </Text>
          <Text style={[styles.maxDuration, { color: themedColors.secondaryText }]}>
            / {formatDuration(MAX_DURATION)}
          </Text>
        </View>
        
        {/* Preview playback controls */}
        {state === 'preview' && recordedUri && (
          <Animated.View entering={FadeIn} style={styles.playbackControls}>
            <Pressable 
              style={[styles.playButton, { backgroundColor: themedColors.secondaryBg }]}
              onPress={togglePlayback}
            >
              <PlatformIcon 
                name={isPlaying ? 'pause' : 'play-arrow'} 
                iosName={isPlaying ? 'pause.fill' : 'play.fill'} 
                size={32} 
                color={themedColors.accent} 
              />
            </Pressable>
            <Text style={[styles.playbackHint, { color: themedColors.secondaryText }]}>
              {isPlaying ? 'Tap to pause' : 'Tap to preview'}
            </Text>
          </Animated.View>
        )}
        
        {/* Error message */}
        {error && (
          <Text style={[styles.errorMessage, { color: themedColors.danger }]}>
            {error}
          </Text>
        )}
      </View>
      
      {/* Bottom controls */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 20 }]}>
        {state === 'ready' && (
          <Pressable 
            style={[styles.recordButton, { borderColor: themedColors.accent }]}
            onPress={startRecording}
          >
            <View style={[styles.recordInner, { backgroundColor: themedColors.accent }]} />
          </Pressable>
        )}
        
        {state === 'recording' && (
          <Pressable 
            style={[styles.stopButton, { borderColor: themedColors.danger }]}
            onPress={stopRecording}
          >
            <View style={[styles.stopInner, { backgroundColor: themedColors.danger }]} />
          </Pressable>
        )}
        
        {(state === 'preview' || state === 'saving') && (
          <View style={styles.previewButtons}>
            <Pressable 
              style={[styles.secondaryButton, { borderColor: themedColors.secondaryText }]}
              onPress={handleRetake}
              disabled={state === 'saving'}
            >
              <PlatformIcon name="refresh" iosName="arrow.counterclockwise" size={20} color={themedColors.text} />
              <Text style={[styles.secondaryButtonText, { color: themedColors.text }]}>Retake</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.primaryButton, { backgroundColor: themedColors.success }]}
              onPress={handleSave}
              disabled={state === 'saving'}
            >
              {state === 'saving' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <PlatformIcon name="check" iosName="checkmark" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Save</Text>
                </>
              )}
            </Pressable>
          </View>
        )}
        
        {(state === 'ready' || state === 'recording') && (
          <Text style={[styles.hint, { color: themedColors.secondaryText }]}>
            {state === 'recording' 
              ? 'Tap to stop recording' 
              : 'Tap to start recording'}
          </Text>
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  waveformContainer: {
    width: 300,
    height: 120,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  micIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 24,
    gap: 4,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    gap: 6,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  recordingLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  duration: {
    fontSize: 48,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
  },
  maxDuration: {
    fontSize: 20,
    fontWeight: '300',
  },
  playbackControls: {
    alignItems: 'center',
    marginTop: 32,
    gap: 12,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playbackHint: {
    fontSize: 14,
  },
  errorMessage: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
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
  cancelLink: {
    marginTop: 16,
    padding: 8,
  },
  cancelLinkText: {
    fontSize: 16,
  },
  bottomControls: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopInner: {
    width: 28,
    height: 28,
    borderRadius: 4,
  },
  previewButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
    minWidth: 120,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    marginTop: 16,
    fontSize: 14,
  },
});

export default ProfileVoiceRecorder;
