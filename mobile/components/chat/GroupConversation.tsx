import React, { memo } from 'react';
import { ScrollView, Text, View } from 'react-native';

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
                  : 'bg-white rounded-tr-lg rounded-tl-lg rounded-br-lg'
                  }`}
              >
                {!isMine && (
                  <Text className="text-xs text-gray-500 font-semibold mb-1">
                    {message.senderName || message.senderId}
                  </Text>
                )}
                <Text
                  className={`${isMine ? 'text-white leading-[22px]' : 'text-dark'} text-[12px]`}
                >
                  {message.content}
                </Text>
              </View>
              <Text className="text-xs text-gray mt-1 text-right">
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