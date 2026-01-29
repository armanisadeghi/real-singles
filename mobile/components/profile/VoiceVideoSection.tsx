/**
 * VoiceVideoSection Component
 * 
 * Section for displaying and managing profile voice prompts and video intros.
 * Shows existing recordings with playback, delete, and re-record options.
 * Navigates to dedicated recording screens for new recordings.
 * 
 * Native UI features:
 * - iOS: SF Symbols, PlatformColor, haptic feedback, Liquid Glass cards
 * - Android: Material Icons, Material You colors, M3 springs, haptics
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  PlatformColor,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useThemeColors, useIsDarkMode } from '@/context/ThemeContext';
import { PlatformIcon } from '@/components/ui/PlatformIcon';
import { LiquidGlassView } from '@/components/ui/LiquidGlass';
import { 
  getVideoIntro, 
  deleteVideoIntro, 
  getVoicePrompt, 
  deleteVoicePrompt 
} from '@/lib/api';

// M3 spring configs
const SPRING_FAST = { stiffness: 1400, damping: 67, mass: 1 };

interface VoiceVideoSectionProps {
  /** Called when data changes (for parent form state sync) */
  onDataChange?: (data: { hasVoicePrompt: boolean; hasVideoIntro: boolean }) => void;
}

interface MediaData {
  url: string | null;
  storagePath: string | null;
  durationSeconds: number | null;
}

/**
 * Performs haptic feedback appropriate for the platform
 */
function hapticFeedback(type: 'tap' | 'success' | 'error' | 'selection') {
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
      case 'selection':
        Haptics.selectionAsync();
        break;
    }
  }
}

/**
 * Format seconds as M:SS
 */
function formatDuration(seconds: number | null): string {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Voice Prompt Card - displays existing voice prompt with playback
 */
function VoicePromptCard({
  voiceData,
  isLoading,
  onRecord,
  onDelete,
  themedColors,
}: {
  voiceData: MediaData | null;
  isLoading: boolean;
  onRecord: () => void;
  onDelete: () => void;
  themedColors: Record<string, string>;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const player = useAudioPlayer(voiceData?.url || '');
  
  // expo-audio uses 'playbackStatusUpdate' with AudioStatus containing 'playing'
  useEffect(() => {
    if (!player) return;
    
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      setIsPlaying(status.playing);
    });
    
    return () => subscription.remove();
  }, [player]);
  
  const togglePlayback = () => {
    hapticFeedback('selection');
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };
  
  const handleDelete = () => {
    hapticFeedback('tap');
    Alert.alert(
      'Delete Voice Prompt',
      'Are you sure you want to delete your voice prompt?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: onDelete 
        },
      ]
    );
  };
  
  const hasVoice = voiceData?.url;
  
  return (
    <LiquidGlassView
      style={styles.card}
      fallbackColor={themedColors.cardBg}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <PlatformIcon name="mic" iosName="mic.fill" size={24} color={themedColors.accent} />
        </View>
        <View style={styles.cardTitleContainer}>
          <Text style={[styles.cardTitle, { color: themedColors.text }]}>Voice Prompt</Text>
          <Text style={[styles.cardSubtitle, { color: themedColors.secondaryText }]}>
            {hasVoice 
              ? `${formatDuration(voiceData?.durationSeconds)} recorded` 
              : 'Add a voice intro'}
          </Text>
        </View>
        {hasVoice && (
          <View style={[styles.badge, { backgroundColor: themedColors.successBg }]}>
            <PlatformIcon name="check" iosName="checkmark" size={12} color={themedColors.success} />
          </View>
        )}
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={themedColors.accent} />
        </View>
      ) : hasVoice ? (
        <View style={styles.cardActions}>
          <Pressable 
            style={[styles.playButton, { backgroundColor: themedColors.secondaryBg }]}
            onPress={togglePlayback}
          >
            <PlatformIcon 
              name={isPlaying ? 'pause' : 'play-arrow'} 
              iosName={isPlaying ? 'pause.fill' : 'play.fill'} 
              size={20} 
              color={themedColors.accent} 
            />
            <Text style={[styles.actionText, { color: themedColors.text }]}>
              {isPlaying ? 'Pause' : 'Play'}
            </Text>
          </Pressable>
          <Pressable 
            style={[styles.actionButton, { borderColor: themedColors.border }]}
            onPress={onRecord}
          >
            <PlatformIcon name="refresh" iosName="arrow.counterclockwise" size={18} color={themedColors.text} />
          </Pressable>
          <Pressable 
            style={[styles.actionButton, { borderColor: themedColors.border }]}
            onPress={handleDelete}
          >
            <PlatformIcon name="delete-outline" iosName="trash" size={18} color={themedColors.danger} />
          </Pressable>
        </View>
      ) : (
        <Pressable 
          style={[styles.recordButton, { backgroundColor: themedColors.accent }]}
          onPress={() => {
            hapticFeedback('tap');
            onRecord();
          }}
        >
          <PlatformIcon name="mic" iosName="mic.fill" size={20} color="#fff" />
          <Text style={styles.recordButtonText}>Record Voice Prompt</Text>
        </Pressable>
      )}
    </LiquidGlassView>
  );
}

/**
 * Video Intro Card - displays existing video intro with preview
 */
function VideoIntroCard({
  videoData,
  isLoading,
  onRecord,
  onDelete,
  themedColors,
}: {
  videoData: MediaData | null;
  isLoading: boolean;
  onRecord: () => void;
  onDelete: () => void;
  themedColors: Record<string, string>;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const player = useVideoPlayer(videoData?.url || '', (p) => {
    p.loop = false;
  });
  
  useEffect(() => {
    if (!player) return;
    
    const subscription = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
    });
    
    return () => subscription.remove();
  }, [player]);
  
  const togglePlayback = () => {
    hapticFeedback('selection');
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };
  
  const handleDelete = () => {
    hapticFeedback('tap');
    Alert.alert(
      'Delete Video Intro',
      'Are you sure you want to delete your video intro?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: onDelete 
        },
      ]
    );
  };
  
  const hasVideo = videoData?.url;
  
  return (
    <LiquidGlassView
      style={styles.card}
      fallbackColor={themedColors.cardBg}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <PlatformIcon name="videocam" iosName="video.fill" size={24} color={themedColors.accent} />
        </View>
        <View style={styles.cardTitleContainer}>
          <Text style={[styles.cardTitle, { color: themedColors.text }]}>Video Intro</Text>
          <Text style={[styles.cardSubtitle, { color: themedColors.secondaryText }]}>
            {hasVideo 
              ? `${formatDuration(videoData?.durationSeconds)} video` 
              : 'Add a video intro'}
          </Text>
        </View>
        {hasVideo && (
          <View style={[styles.badge, { backgroundColor: themedColors.successBg }]}>
            <PlatformIcon name="check" iosName="checkmark" size={12} color={themedColors.success} />
          </View>
        )}
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={themedColors.accent} />
        </View>
      ) : hasVideo ? (
        <>
          {/* Video preview thumbnail */}
          <View style={styles.videoPreview}>
            <VideoView
              player={player}
              style={styles.videoThumbnail}
              contentFit="cover"
              nativeControls={false}
            />
            <Pressable 
              style={styles.videoPlayOverlay}
              onPress={togglePlayback}
            >
              <View style={[styles.videoPlayButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                <PlatformIcon 
                  name={isPlaying ? 'pause' : 'play-arrow'} 
                  iosName={isPlaying ? 'pause.fill' : 'play.fill'} 
                  size={32} 
                  color="#fff" 
                />
              </View>
            </Pressable>
            <View style={styles.videoDurationBadge}>
              <Text style={styles.videoDurationText}>
                {formatDuration(videoData?.durationSeconds)}
              </Text>
            </View>
          </View>
          <View style={styles.cardActions}>
            <Pressable 
              style={[styles.actionButton, { borderColor: themedColors.border }]}
              onPress={onRecord}
            >
              <PlatformIcon name="refresh" iosName="arrow.counterclockwise" size={18} color={themedColors.text} />
              <Text style={[styles.actionText, { color: themedColors.text }]}>Re-record</Text>
            </Pressable>
            <Pressable 
              style={[styles.actionButton, { borderColor: themedColors.border }]}
              onPress={handleDelete}
            >
              <PlatformIcon name="delete-outline" iosName="trash" size={18} color={themedColors.danger} />
            </Pressable>
          </View>
        </>
      ) : (
        <Pressable 
          style={[styles.recordButton, { backgroundColor: themedColors.accent }]}
          onPress={() => {
            hapticFeedback('tap');
            onRecord();
          }}
        >
          <PlatformIcon name="videocam" iosName="video.fill" size={20} color="#fff" />
          <Text style={styles.recordButtonText}>Record Video Intro</Text>
        </Pressable>
      )}
    </LiquidGlassView>
  );
}

export function VoiceVideoSection({ onDataChange }: VoiceVideoSectionProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const isDark = useIsDarkMode();
  
  const [voiceData, setVoiceData] = useState<MediaData | null>(null);
  const [videoData, setVideoData] = useState<MediaData | null>(null);
  const [isLoadingVoice, setIsLoadingVoice] = useState(true);
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [isDeletingVoice, setIsDeletingVoice] = useState(false);
  const [isDeletingVideo, setIsDeletingVideo] = useState(false);
  
  // Platform-specific colors
  const themedColors = {
    text: Platform.OS === 'ios'
      ? (PlatformColor('label') as unknown as string)
      : colors.onSurface,
    secondaryText: Platform.OS === 'ios'
      ? (PlatformColor('secondaryLabel') as unknown as string)
      : colors.onSurfaceVariant,
    cardBg: Platform.OS === 'ios'
      ? (isDark ? 'rgba(44, 44, 46, 0.9)' : 'rgba(255, 255, 255, 0.9)')
      : colors.surfaceContainer,
    secondaryBg: Platform.OS === 'ios'
      ? (PlatformColor('tertiarySystemBackground') as unknown as string)
      : colors.surfaceContainerHigh,
    accent: Platform.OS === 'ios'
      ? (PlatformColor('systemPink') as unknown as string)
      : colors.primary,
    danger: Platform.OS === 'ios'
      ? (PlatformColor('systemRed') as unknown as string)
      : colors.error,
    success: Platform.OS === 'ios'
      ? (PlatformColor('systemGreen') as unknown as string)
      : '#34C759',
    successBg: isDark ? 'rgba(52, 199, 89, 0.2)' : 'rgba(52, 199, 89, 0.15)',
    border: Platform.OS === 'ios'
      ? (PlatformColor('separator') as unknown as string)
      : colors.outline,
  };
  
  // Load data on mount
  useEffect(() => {
    loadVoicePrompt();
    loadVideoIntro();
  }, []);
  
  // Notify parent of data changes
  useEffect(() => {
    onDataChange?.({
      hasVoicePrompt: !!voiceData?.url,
      hasVideoIntro: !!videoData?.url,
    });
  }, [voiceData, videoData, onDataChange]);
  
  const loadVoicePrompt = async () => {
    try {
      setIsLoadingVoice(true);
      const response = await getVoicePrompt();
      if (response.success && response.data) {
        setVoiceData({
          url: response.data.voicePromptUrl,
          storagePath: response.data.storagePath,
          durationSeconds: response.data.durationSeconds,
        });
      }
    } catch (err) {
      console.error('Failed to load voice prompt:', err);
    } finally {
      setIsLoadingVoice(false);
    }
  };
  
  const loadVideoIntro = async () => {
    try {
      setIsLoadingVideo(true);
      const response = await getVideoIntro();
      if (response.success && response.data) {
        setVideoData({
          url: response.data.videoIntroUrl,
          storagePath: response.data.storagePath,
          durationSeconds: response.data.durationSeconds,
        });
      }
    } catch (err) {
      console.error('Failed to load video intro:', err);
    } finally {
      setIsLoadingVideo(false);
    }
  };
  
  const handleDeleteVoice = async () => {
    try {
      setIsDeletingVoice(true);
      const response = await deleteVoicePrompt();
      if (response.success) {
        setVoiceData(null);
        hapticFeedback('success');
      } else {
        hapticFeedback('error');
        Alert.alert('Error', response.msg || 'Failed to delete voice prompt.');
      }
    } catch (err) {
      console.error('Failed to delete voice prompt:', err);
      hapticFeedback('error');
      Alert.alert('Error', 'Failed to delete voice prompt. Please try again.');
    } finally {
      setIsDeletingVoice(false);
    }
  };
  
  const handleDeleteVideo = async () => {
    try {
      setIsDeletingVideo(true);
      const response = await deleteVideoIntro();
      if (response.success) {
        setVideoData(null);
        hapticFeedback('success');
      } else {
        hapticFeedback('error');
        Alert.alert('Error', response.msg || 'Failed to delete video intro.');
      }
    } catch (err) {
      console.error('Failed to delete video intro:', err);
      hapticFeedback('error');
      Alert.alert('Error', 'Failed to delete video intro. Please try again.');
    } finally {
      setIsDeletingVideo(false);
    }
  };
  
  const navigateToVoiceRecorder = () => {
    hapticFeedback('tap');
    // Type assertion needed until expo-router types are regenerated
    router.push('/profile/record-voice' as Href);
  };
  
  const navigateToVideoRecorder = () => {
    hapticFeedback('tap');
    // Type assertion needed until expo-router types are regenerated
    router.push('/profile/record-video' as Href);
  };
  
  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: themedColors.text }]}>
        Voice & Video
      </Text>
      <Text style={[styles.sectionDescription, { color: themedColors.secondaryText }]}>
        Add a voice prompt or video intro to help others get to know you better.
      </Text>
      
      <View style={styles.cardsContainer}>
        <VoicePromptCard
          voiceData={voiceData}
          isLoading={isLoadingVoice || isDeletingVoice}
          onRecord={navigateToVoiceRecorder}
          onDelete={handleDeleteVoice}
          themedColors={themedColors}
        />
        
        <VideoIntroCard
          videoData={videoData}
          isLoading={isLoadingVideo || isDeletingVideo}
          onRecord={navigateToVideoRecorder}
          onDelete={handleDeleteVideo}
          themedColors={themedColors}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  cardsContainer: {
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  videoPreview: {
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDurationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  videoDurationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default VoiceVideoSection;
