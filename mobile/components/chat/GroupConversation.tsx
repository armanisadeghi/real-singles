import { useThemeColors } from '@/context/ThemeContext';
import React, { memo } from 'react';
import { Platform, PlatformColor, ScrollView, Text, useColorScheme, View } from 'react-native';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  senderName?: string; // For group chat
}

interface GroupConversationProps {
  messages: Message[];
  currentUserId: string | null;
}

const GroupConversation = ({ messages, currentUserId }: GroupConversationProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useThemeColors();

  const themedColors = {
    text: Platform.OS === 'ios' ? (PlatformColor('label') as unknown as string) : colors.onSurface,
    secondaryText: Platform.OS === 'ios' ? (PlatformColor('secondaryLabel') as unknown as string) : colors.onSurfaceVariant,
    background: Platform.OS === 'ios' ? (PlatformColor('systemBackground') as unknown as string) : colors.background,
    inputBackground: Platform.OS === 'ios' ? (PlatformColor('secondarySystemBackground') as unknown as string) : colors.surfaceContainer,
    border: Platform.OS === 'ios' ? (PlatformColor('separator') as unknown as string) : colors.outline,
  };

  // Format timestamp to readable time
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;
  };

  const BACKGROUND_COLORS = [
    "#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5",
    "#2196F3", "#03A9F4", "#00BCD4", "#009688", "#4CAF50",
    "#8BC34A", "#FF9800", "#FF5722", "#795548", "#607D8B",
  ];

  return (
    <ScrollView
      className="flex-1 px-4 py-4"
      contentContainerStyle={{ paddingBottom: 200 }}
      showsVerticalScrollIndicator={false}
    >
      {messages.map((message) => {
        const isMine = message.senderId === currentUserId;
        return (
          <View
            key={message.id}
            className={`flex-row mb-4 ${isMine ? 'justify-end' : 'justify-start'}`}
          >
            {!isMine && (
              <View
                className="w-8 h-8 rounded-full mr-2 mt-1 justify-center items-center"
                style={{
                  backgroundColor: BACKGROUND_COLORS[
                    Math.abs(
                      (message.senderName || "U")
                        .split("")
                        .reduce((acc, char) => acc + char.charCodeAt(0), 0) %
                      BACKGROUND_COLORS.length
                    )
                  ],
                }}
              >
                <Text className="text-white font-bold text-xs">
                  {(message.senderName || "U")
                    .split(" ")
                    .map((part) => part?.charAt(0) || "")
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </Text>
              </View>
            )}
            <View className="max-w-[60%]">
              <View
                className={`px-4 py-2 ${isMine
                  ? 'bg-chatBg rounded-tl-lg rounded-tr-lg rounded-bl-lg'
                  : 'rounded-tr-lg rounded-tl-lg rounded-br-lg'
                  }`}
                style={!isMine ? { backgroundColor: themedColors.inputBackground } : undefined}
              >
                {!isMine && (
                  <Text className="text-xs font-semibold mb-1" style={{ color: themedColors.secondaryText }}>
                    {message.senderName || message.senderId}
                  </Text>
                )}
                <Text
                  className={`${isMine ? 'text-white leading-[22px]' : ''} text-[12px]`}
                  style={!isMine ? { color: themedColors.text } : undefined}
                >
                  {message.content}
                </Text>
              </View>
              <Text className="text-xs mt-1 text-right" style={{ color: themedColors.secondaryText }}>
                {formatTime(message.timestamp)}
              </Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

export default memo(GroupConversation); 