/**
 * Record Voice Prompt Screen
 * 
 * Voice recording screen for profile voice prompt.
 * Navigates back to edit profile after recording is saved.
 */

import React, { useCallback } from 'react';
import { Alert, Platform, PlatformColor, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileVoiceRecorder } from '@/components/profile';
import { uploadVoicePrompt } from '@/lib/api';
import { useThemeColors } from '@/context/ThemeContext';
import Toast from 'react-native-toast-message';

/**
 * Get MIME type from file URI
 */
function getMimeType(uri: string): string {
  const ext = uri.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'm4a':
      return 'audio/mp4';
    case 'mp4':
      return 'audio/mp4';
    case 'wav':
      return 'audio/wav';
    case 'webm':
      return 'audio/webm';
    case 'aac':
      return 'audio/aac';
    case 'caf':
      return 'audio/x-caf';
    default:
      // Default for iOS recordings
      return 'audio/mp4';
  }
}

export default function RecordVoiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  
  // Platform-specific background color
  const backgroundColor = Platform.OS === 'ios'
    ? (PlatformColor('systemBackground') as unknown as string)
    : colors.background;
  
  const handleSave = useCallback(async (uri: string, duration: number) => {
    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('Audio file not found');
      }
      
      // Create FormData
      const formData = new FormData();
      const fileName = uri.split('/').pop() || `voice_${Date.now()}.m4a`;
      const mimeType = getMimeType(uri);
      
      formData.append('file', {
        uri: uri,
        name: fileName,
        type: mimeType,
      } as any);
      formData.append('duration', duration.toString());
      
      // Upload
      const response = await uploadVoicePrompt(formData);
      
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Voice Prompt Saved',
          text2: 'Your voice prompt has been uploaded successfully.',
        });
        router.back();
      } else {
        throw new Error(response.msg || 'Failed to upload voice prompt');
      }
    } catch (error) {
      console.error('Voice prompt upload error:', error);
      Alert.alert(
        'Upload Failed',
        'There was a problem uploading your voice prompt. Please try again.'
      );
      throw error; // Re-throw to let the recorder component handle the error state
    }
  }, [router]);
  
  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Stack.Screen 
        options={{
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: true,
        }} 
      />
      <ProfileVoiceRecorder
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
