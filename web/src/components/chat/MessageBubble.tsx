"use client";

import { Check, CheckCheck, Image as ImageIcon, Video } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";

export interface Message {
  id: string;
  sender_id: string;
  content: string;
  type: "text" | "image" | "video";
  media_url?: string | null;
  created_at: string;
  is_read?: boolean;
  status?: "sending" | "sent" | "delivered" | "read" | "failed";
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  senderName?: string;
  senderImage?: string | null;
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar = false,
  senderName,
  senderImage,
}: MessageBubbleProps) {
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = () => {
    switch (message.status) {
      case "sending":
        return (
          <div className="w-3 h-3 border border-gray-300 border-t-transparent rounded-full animate-spin" />
        );
      case "sent":
        return <Check className="w-3 h-3 text-gray-400" />;
      case "delivered":
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case "read":
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case "failed":
        return (
          <span className="text-xs text-red-500 font-medium">Failed</span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "flex gap-2 max-w-[85%] sm:max-w-[70%]",
        isOwn ? "ml-auto flex-row-reverse" : ""
      )}
    >
      {/* Avatar (for group chats) */}
      {showAvatar && !isOwn && (
        <Avatar
          src={senderImage}
          name={senderName || "?"}
          size="sm"
        />
      )}

      <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
        {/* Sender name (for group chats) */}
        {showAvatar && !isOwn && senderName && (
          <span className="text-xs text-gray-500 mb-1 px-1">{senderName}</span>
        )}

        {/* Message content - iOS iMessage style */}
        <div
          className={cn(
            "rounded-[20px] px-3.5 py-2",
            isOwn
              ? "bg-[#007AFF] text-white rounded-br-[6px]"
              : "bg-[#E9E9EB] text-gray-900 rounded-bl-[6px]"
          )}
        >
          {/* Media content */}
          {(message.type === "image" || message.type === "video") &&
            message.media_url && (
              <div className="mb-2 -mx-2 -mt-1">
                {message.type === "image" ? (
                  <img
                    src={message.media_url}
                    alt=""
                    className="max-w-full rounded-xl"
                    loading="lazy"
                  />
                ) : (
                  <video
                    src={message.media_url}
                    controls
                    className="max-w-full rounded-xl"
                  />
                )}
              </div>
            )}

          {/* Text content */}
          {message.content && (
            <p className="text-[15px] leading-[1.35] whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}
        </div>

        {/* Time and status */}
        <div className="flex items-center gap-1 mt-1 px-1">
          <span
            className={cn(
              "text-xs",
              isOwn ? "text-gray-400" : "text-gray-400"
            )}
          >
            {formatTime(message.created_at)}
          </span>
          {isOwn && getStatusIcon()}
        </div>
      </div>
    </div>
  );
}

interface MessageGroupProps {
  messages: Message[];
  currentUserId: string;
  showAvatars?: boolean;
  participants?: Map<
    string,
    { name: string; image: string | null }
  >;
}

export function MessageGroup({
  messages,
  currentUserId,
  showAvatars = false,
  participants,
}: MessageGroupProps) {
  // Group messages by date
  const groupByDate = (messages: Message[]) => {
    const groups: Record<string, Message[]> = {};
    messages.forEach((message) => {
      const date = new Date(message.created_at).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }
  };

  const groupedMessages = groupByDate(messages);

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(groupedMessages).map(([date, msgs]) => (
        <div key={date}>
          {/* Date header */}
          <div className="flex items-center justify-center my-4">
            <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
              {formatDateHeader(date)}
            </span>
          </div>

          {/* Messages */}
          <div className="flex flex-col gap-3">
            {msgs.map((message, index) => {
              const isOwn = message.sender_id === currentUserId;
              const sender = participants?.get(message.sender_id);

              // Show avatar only for first message in a sequence from the same sender
              const prevMessage = msgs[index - 1];
              const showAvatar =
                showAvatars &&
                !isOwn &&
                (!prevMessage || prevMessage.sender_id !== message.sender_id);

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  senderName={sender?.name}
                  senderImage={sender?.image}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
