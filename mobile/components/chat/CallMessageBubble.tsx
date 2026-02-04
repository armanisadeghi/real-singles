import React, { memo, useMemo } from 'react';
import { View, Text, Platform, PlatformColor, useColorScheme } from 'react-native';
import { PlatformIcon } from '@/components/ui';
import { useThemeColors } from '@/context/ThemeContext';

interface CallMetadata {
  call_id: string;
  call_type: 'audio' | 'video';
  duration_seconds: number;
  status: 'completed' | 'missed' | 'declined';
  participants: string[];
  started_at: string;
  ended_at: string;
}

interface CallMessageBubbleProps {
  metadata: CallMetadata;
  isOwn: boolean;
  timestamp: number;
}

/**
 * CallMessageBubble - Displays call history in chat (Mobile)
 * Shows call type, duration, and status with appropriate icons
 */
const CallMessageBubble = ({ metadata, isOwn, timestamp }: CallMessageBubbleProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useThemeColors();

  const themedColors = useMemo(() => ({
    text: Platform.OS === 'ios' ? (PlatformColor('label') as unknown as string) : colors.onSurface,
    secondaryText: Platform.OS === 'ios' ? (PlatformColor('secondaryLabel') as unknown as string) : colors.onSurfaceVariant,
    background: Platform.OS === 'ios' ? (PlatformColor('systemBackground') as unknown as string) : colors.background,
    secondaryBackground: Platform.OS === 'ios' ? (PlatformColor('secondarySystemBackground') as unknown as string) : colors.surfaceContainer,
  }), [isDark, colors]);

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) {
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;
  };

  const isVideo = metadata.call_type === 'video';
  const isMissed = metadata.status === 'missed' || metadata.status === 'declined';
  const duration = metadata.duration_seconds || 0;

  // Determine icon based on call type and status
  const getIconName = (): string => {
    if (isVideo) {
      return isMissed ? 'videocam-off' : 'videocam';
    }
    return isMissed ? 'phone-missed' : 'call';
  };

  // Determine text based on status
  const getCallText = () => {
    if (metadata.status === 'missed') {
      return isVideo ? 'Missed video call' : 'Missed call';
    }
    if (metadata.status === 'declined') {
      return isVideo ? 'Declined video call' : 'Declined call';
    }
    return isVideo ? 'Video call' : 'Voice call';
  };

  // Colors based on status
  const iconBgColor = isMissed 
    ? (isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)') 
    : isOwn 
    ? (isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)')
    : (isDark ? 'rgba(156, 163, 175, 0.2)' : 'rgba(156, 163, 175, 0.1)');

  const iconColor = isMissed 
    ? '#EF4444' 
    : isOwn 
    ? '#22C55E' 
    : (isDark ? '#9CA3AF' : '#6B7280');

  const cardBgColor = isMissed
    ? (isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(254, 226, 226, 1)')
    : (isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(243, 244, 246, 1)');

  const textColor = isMissed
    ? (isDark ? '#FCA5A5' : '#B91C1C')
    : themedColors.text;

  return (
    <View className={`flex-row mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <View className="max-w-[280px]">
        {/* Call card */}
        <View
          className="flex-row items-center px-4 py-3 rounded-2xl"
          style={{ backgroundColor: cardBgColor }}
        >
          {/* Icon */}
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: iconBgColor }}
          >
            <PlatformIcon name={getIconName()} size={20} color={iconColor} />
          </View>

          {/* Call info */}
          <View className="flex-col">
            <Text className="text-[15px] font-medium" style={{ color: textColor }}>
              {getCallText()}
            </Text>
            {!isMissed && duration > 0 && (
              <Text className="text-[13px]" style={{ color: themedColors.secondaryText }}>
                {formatDuration(duration)}
              </Text>
            )}
          </View>
        </View>

        {/* Timestamp */}
        <Text
          className={`text-[11px] mt-1 ${isOwn ? 'text-right mr-1' : 'ml-1'}`}
          style={{ color: themedColors.secondaryText }}
        >
          {formatTime(timestamp)}
        </Text>
      </View>
    </View>
  );
};

export default memo(CallMessageBubble);
