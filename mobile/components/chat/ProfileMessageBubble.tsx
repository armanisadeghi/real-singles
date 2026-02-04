import React, { memo, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, Platform, PlatformColor, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { PlatformIcon } from '@/components/ui';
import { useThemeColors } from '@/context/ThemeContext';
import * as Haptics from 'expo-haptics';

interface ProfileMetadata {
  profile_id: string;
  first_name: string | null;
  age: number | null;
  location: string | null;
  profile_image_url: string | null;
  bio: string | null;
  occupation: string | null;
  is_hidden?: boolean;
}

interface ProfileMessageBubbleProps {
  content: string;
  metadata: ProfileMetadata;
  isOwn: boolean;
  timestamp: number;
}

// Background colors for avatar fallback
const BACKGROUND_COLORS = [
  "#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5",
  "#2196F3", "#03A9F4", "#00BCD4", "#009688", "#4CAF50",
  "#8BC34A", "#FF9800", "#FF5722", "#795548", "#607D8B",
];

const getColorForName = (name: string): string => {
  const index = Math.abs(
    name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  ) % BACKGROUND_COLORS.length;
  return BACKGROUND_COLORS[index];
};

/**
 * ProfileMessageBubble - Displays a profile preview card in chat (Mobile)
 * Used when matchmakers share profiles with their clients
 */
const ProfileMessageBubble = ({ content, metadata, isOwn, timestamp }: ProfileMessageBubbleProps) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useThemeColors();

  const themedColors = useMemo(() => ({
    text: Platform.OS === 'ios' ? (PlatformColor('label') as unknown as string) : colors.onSurface,
    secondaryText: Platform.OS === 'ios' ? (PlatformColor('secondaryLabel') as unknown as string) : colors.onSurfaceVariant,
    background: Platform.OS === 'ios' ? (PlatformColor('systemBackground') as unknown as string) : colors.background,
    secondaryBackground: Platform.OS === 'ios' ? (PlatformColor('secondarySystemBackground') as unknown as string) : colors.surfaceContainer,
    border: Platform.OS === 'ios' ? (PlatformColor('separator') as unknown as string) : colors.outline,
  }), [isDark, colors]);

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/discover/profile/${metadata.profile_id}`);
  };

  // Handle hidden/unavailable profiles
  if (metadata.is_hidden) {
    return (
      <View className={`flex-row mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <View className="max-w-[280px]">
          {/* Message text if provided */}
          {content && (
            <View
              className={`px-4 py-2.5 mb-2 rounded-2xl ${
                isOwn ? 'rounded-br-lg bg-chatBg' : 'rounded-bl-lg'
              }`}
              style={!isOwn ? { backgroundColor: themedColors.secondaryBackground } : undefined}
            >
              <Text
                className={`text-[14px] ${isOwn ? 'text-white' : ''}`}
                style={!isOwn ? { color: themedColors.text } : undefined}
              >
                {content}
              </Text>
            </View>
          )}

          {/* Unavailable profile card */}
          <View
            className="rounded-2xl p-4"
            style={{ backgroundColor: themedColors.secondaryBackground }}
          >
            <View className="flex-row items-center">
              <View
                className="w-14 h-14 rounded-full items-center justify-center"
                style={{ backgroundColor: isDark ? 'rgba(107, 114, 128, 0.3)' : 'rgba(229, 231, 235, 1)' }}
              >
                <PlatformIcon name="person" size={28} color={isDark ? '#6B7280' : '#9CA3AF'} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-[15px] font-medium" style={{ color: themedColors.secondaryText }}>
                  Profile unavailable
                </Text>
                <Text className="text-[13px]" style={{ color: themedColors.secondaryText }}>
                  This profile is no longer available
                </Text>
              </View>
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
  }

  return (
    <View className={`flex-row mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <View className="max-w-[280px]">
        {/* Message text if provided */}
        {content && content !== 'Check out this profile' && (
          <View
            className={`px-4 py-2.5 mb-2 rounded-2xl ${
              isOwn ? 'rounded-br-lg bg-chatBg' : 'rounded-bl-lg'
            }`}
            style={!isOwn ? { backgroundColor: themedColors.secondaryBackground } : undefined}
          >
            <Text
              className={`text-[14px] ${isOwn ? 'text-white' : ''}`}
              style={!isOwn ? { color: themedColors.text } : undefined}
            >
              {content}
            </Text>
          </View>
        )}

        {/* Profile card */}
        <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
          <View
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: themedColors.background,
              borderWidth: 1,
              borderColor: themedColors.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {/* Profile image */}
            {metadata.profile_image_url ? (
              <View className="aspect-[4/3] overflow-hidden">
                <Image
                  source={{ uri: metadata.profile_image_url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
                {/* Gradient overlay */}
                <View
                  className="absolute inset-x-0 bottom-0 h-20"
                  style={{
                    backgroundColor: 'transparent',
                    backgroundImage: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                  }}
                >
                  {/* Name and age overlay - positioned at bottom */}
                  <View className="absolute bottom-3 left-3 right-3">
                    <View className="flex-row items-baseline">
                      <Text className="text-xl font-bold text-white" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
                        {metadata.first_name || 'Unknown'}
                      </Text>
                      {metadata.age && (
                        <Text className="text-lg text-white/90 ml-1.5" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
                          {metadata.age}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View
                className="aspect-[4/3] items-center justify-center"
                style={{ backgroundColor: getColorForName(metadata.first_name || 'User') }}
              >
                <View
                  className="w-20 h-20 rounded-full items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                >
                  <Text className="text-3xl font-bold text-white">
                    {(metadata.first_name || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                {/* Name overlay for no-image state */}
                <View className="absolute bottom-3 left-3 right-3">
                  <View className="flex-row items-baseline">
                    <Text className="text-xl font-bold text-white">
                      {metadata.first_name || 'Unknown'}
                    </Text>
                    {metadata.age && (
                      <Text className="text-lg text-white/90 ml-1.5">
                        {metadata.age}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Profile details */}
            <View className="p-3">
              {/* Location */}
              {metadata.location && (
                <View className="flex-row items-center mb-1">
                  <PlatformIcon name="location-on" size={14} color={isDark ? '#6B7280' : '#9CA3AF'} />
                  <Text className="text-[13px] ml-1.5" style={{ color: themedColors.secondaryText }}>
                    {metadata.location}
                  </Text>
                </View>
              )}

              {/* Occupation */}
              {metadata.occupation && (
                <View className="flex-row items-center mb-1">
                  <PlatformIcon name="work" size={14} color={isDark ? '#6B7280' : '#9CA3AF'} />
                  <Text className="text-[13px] ml-1.5" style={{ color: themedColors.secondaryText }}>
                    {metadata.occupation}
                  </Text>
                </View>
              )}

              {/* Bio preview */}
              {metadata.bio && (
                <Text
                  className="text-[13px] mt-2"
                  style={{ color: themedColors.secondaryText }}
                  numberOfLines={2}
                >
                  {metadata.bio}
                </Text>
              )}

              {/* View profile CTA */}
              <View
                className="flex-row items-center justify-between pt-2 mt-2"
                style={{ borderTopWidth: 1, borderTopColor: themedColors.border }}
              >
                <Text className="text-[13px] font-medium" style={{ color: '#EC4899' }}>
                  View Profile
                </Text>
                <PlatformIcon name="chevron-right" size={16} color="#EC4899" />
              </View>
            </View>
          </View>
        </TouchableOpacity>

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

export default memo(ProfileMessageBubble);
