/**
 * Profile Stack Layout
 * 
 * Handles navigation for profile-related screens including
 * voice and video recording modals.
 */

import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="record-video"
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="record-voice"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}
