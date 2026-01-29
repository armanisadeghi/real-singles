/**
 * Record Video Intro Screen
 * 
 * Full-screen video recording for profile video intro.
 * Navigates back to edit profile after recording is saved.
 */

import React, { useCallback } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileVideoRecorder } from '@/components/profile';
import { uploadVideoIntro } from '@/lib/api';
import Toast from 'react-native-toast-message';

/**
 * Get MIME type from file URI
 */
function getMimeType(uri: string): string {
  const ext = uri.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'mp4':
      return 'video/mp4';
    case 'mov':
      return 'video/quicktime';
    case 'webm':
      return 'video/webm';
    default:
      return 'video/mp4';
  }
}

export default function RecordVideoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const handleSave = useCallback(async (uri: string, duration: number) => {
    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('Video file not found');
      }
      
      // Create FormData
      const formData = new FormData();
      const fileName = uri.split('/').pop() || `video_${Date.now()}.mp4`;
      const mimeType = getMimeType(uri);
      
      formData.append('file', {
        uri: uri,
        name: fileName,
        type: mimeType,
      } as any);
      formData.append('duration', duration.toString());
      
      // Upload
      const response = await uploadVideoIntro(formData);
      
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Video Saved',
          text2: 'Your video intro has been uploaded successfully.',
        });
        router.back();
      } else {
        throw new Error(response.msg || 'Failed to upload video');
      }
    } catch (error) {
      console.error('Video upload error:', error);
      Alert.alert(
        'Upload Failed',
        'There was a problem uploading your video. Please try again.'
      );
      throw error; // Re-throw to let the recorder component handle the error state
    }
  }, [router]);
  
  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
          gestureEnabled: false,
        }} 
      />
      <ProfileVideoRecorder
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
