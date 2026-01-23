import { IMAGE_URL, MEDIA_BASE_URL } from '@/utils/token';
import React, { memo } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
}

interface ConversationProps {
  messages: Message[];
  currentUserId: string | null;
  chatUserId: string;
  contact: any;
}

const Conversation = ({ messages, currentUserId, contact }: ConversationProps) => {

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
    "#F44336", // Red
    "#E91E63", // Pink
    "#9C27B0", // Purple
    "#673AB7", // Deep Purple
    "#3F51B5", // Indigo
    "#2196F3", // Blue
    "#03A9F4", // Light Blue
    "#00BCD4", // Cyan
    "#009688", // Teal
    "#4CAF50", // Green
    "#8BC34A", // Light Green
    "#FF9800", // Orange
    "#FF5722", // Deep Orange
    "#795548", // Brown
    "#607D8B", // Blue Grey
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
              contact.image ? (
                <Image
                  source={{
                    uri: contact.image.startsWith('uploads/')
                      ? IMAGE_URL + contact.image
                      : MEDIA_BASE_URL + contact.image
                  }}
                  className="w-8 h-8 rounded-full mr-2 mt-1"
                  resizeMode="cover"
                />
              ) : (
                <View
                  className="w-8 h-8 rounded-full mr-2 mt-1 justify-center items-center"
                  style={{
                    backgroundColor: BACKGROUND_COLORS[
                      Math.abs(
                        (contact.name || "User")
                          .split("")
                          .reduce((acc: any, char: any) => acc + char.charCodeAt(0), 0) %
                        BACKGROUND_COLORS.length
                      )
                    ],
                  }}
                >
                  <Text className="text-white font-bold text-xs">
                    {(contact.name || "User")
                      .split(" ")
                      .map((part: any) => part.charAt(0))
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </Text>
                </View>
              )
            )}

            {/* {!isMine && ( 
              <Image
                source={contact.image ? { uri: contact.image.startsWith('uploads/') ? IMAGE_URL + contact.image : MEDIA_BASE_URL + contact.image } : icons.ic_user}
                className="w-8 h-8 rounded-full mr-2 mt-1"
              />
            )} */}
            <View className="max-w-[60%]">
              <View
                className={`px-4 py-2 ${isMine
                  ? 'bg-chatBg rounded-tl-lg rounded-tr-lg rounded-bl-lg'
                  : 'bg-white rounded-tr-lg rounded-tl-lg rounded-br-lg'
                  }`}
              >
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

export default memo(Conversation);