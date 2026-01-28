import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { ICON_SIZES, SPACING } from "@/constants/designTokens";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { Platform, PlatformColor, TouchableOpacity, useColorScheme } from "react-native";
import LinearBg from "./LinearBg";

interface NotificationBellProps {
  /**
   * Icon size - defaults to ICON_SIZES.md (24pt) for HIG compliance
   */
  size?: number;
  /**
   * Whether to show the gradient background pill style
   * @default true
   */
  showBackground?: boolean;
}

export default function NotificationBell({ 
  size = ICON_SIZES.md, 
  showBackground = true 
}: NotificationBellProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const handlePress = useCallback(() => {
    // Haptic feedback for navigation - light tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/notification');
  }, [router]);

  // Icon color adapts to background style
  const iconColor = showBackground 
    ? '#ffffff' 
    : Platform.OS === 'ios'
      ? (PlatformColor('label') as unknown as string)
      : (isDark ? '#FFFFFF' : '#000000');

  // Calculate container size for proper touch target (minimum 44pt)
  const containerSize = Math.max(size + SPACING.md * 2, 44);

  if (showBackground) {
    return (
      <TouchableOpacity 
        onPress={handlePress} 
        activeOpacity={0.7}
        style={{
          borderRadius: containerSize / 2,
          overflow: 'hidden',
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            },
            android: {
              elevation: 3,
            },
          }),
        }}
      >
        <LinearBg 
          style={{ 
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize / 2,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <PlatformIcon 
            name="notifications" 
            iosName="bell.fill"
            size={size} 
            color={iconColor} 
          />
        </LinearBg>
      </TouchableOpacity>
    );
  }

  // Simple icon without background
  return (
    <TouchableOpacity 
      onPress={handlePress} 
      activeOpacity={0.7}
      style={{
        width: containerSize,
        height: containerSize,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <PlatformIcon 
        name="notifications" 
        iosName="bell.fill"
        size={size} 
        color={iconColor} 
      />
    </TouchableOpacity>
  );
}
