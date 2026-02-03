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
  /** Whether avatars are enabled for this conversation (group chats) */
  avatarsEnabled?: boolean;
  senderName?: string;
  senderImage?: string | null;
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar = false,
  avatarsEnabled = false,
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
        "flex gap-2",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar (for group chats) */}
      {showAvatar && !isOwn && (
        <div className="shrink-0 self-end mb-5">
          <Avatar
            src={senderImage}
            name={senderName || "?"}
            size="sm"
          />
        </div>
      )}
      {/* Spacer when in avatar mode (group chat) but this message doesn't show its avatar */}
      {avatarsEnabled && !showAvatar && !isOwn && (
        <div className="w-8 shrink-0" />
      )}

      <div className={cn(
        "flex flex-col max-w-[75%]",
        isOwn ? "items-end" : "items-start"
      )}>
        {/* Sender name (for group chats) */}
        {showAvatar && !isOwn && senderName && (
          <span className="text-[11px] text-gray-500 dark:text-gray-400 mb-1 ml-3 font-medium">{senderName}</span>
        )}

        {/* Message bubble - iOS iMessage style */}
        <div
          className={cn(
            "relative px-4 py-2.5 shadow-sm",
            // iOS-style rounded corners with tail
            isOwn
              ? "bg-[#007AFF] dark:bg-[#0A84FF] text-white rounded-[22px] rounded-br-[8px]"
              : "bg-[#E9E9EB] dark:bg-[#3a3a3c] text-gray-900 dark:text-gray-100 rounded-[22px] rounded-bl-[8px]"
          )}
        >
          {/* Media content */}
          {(message.type === "image" || message.type === "video") &&
            message.media_url && (
              <div className={cn(
                "mb-2 -mx-2 -mt-1 overflow-hidden",
                isOwn ? "rounded-[18px] rounded-br-[4px]" : "rounded-[18px] rounded-bl-[4px]"
              )}>
                {message.type === "image" ? (
                  <img
                    src={message.media_url}
                    alt=""
                    className="max-w-full"
                    loading="lazy"
                  />
                ) : (
                  <video
                    src={message.media_url}
                    controls
                    className="max-w-full"
                  />
                )}
              </div>
            )}

          {/* Text content */}
          {message.content && (
            <p className="text-[17px] leading-[1.3] whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}
        </div>

        {/* Time and status - iOS style below bubble */}
        <div className={cn(
          "flex items-center gap-1 mt-0.5",
          isOwn ? "mr-1" : "ml-1"
        )}>
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
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
    <div className="flex flex-col gap-2">
      {Object.entries(groupedMessages).map(([date, msgs]) => (
        <div key={date}>
          {/* Date header - iOS style floating pill */}
          <div className="flex items-center justify-center my-5">
            <span className="px-3 py-1.5 bg-gray-100/80 dark:bg-neutral-800/80 backdrop-blur-sm text-gray-500 dark:text-gray-400 text-[11px] font-semibold rounded-full shadow-sm">
              {formatDateHeader(date)}
            </span>
          </div>

          {/* Messages - tighter spacing like iOS */}
          <div className="flex flex-col gap-1">
            {msgs.map((message, index) => {
              const isOwn = message.sender_id === currentUserId;
              const sender = participants?.get(message.sender_id);

              // Show avatar only for first message in a sequence from the same sender
              const prevMessage = msgs[index - 1];
              const isNewSender = !prevMessage || prevMessage.sender_id !== message.sender_id;
              const showAvatar = showAvatars && !isOwn && isNewSender;

              return (
                <div 
                  key={message.id}
                  className={cn(
                    // Add extra spacing between different senders
                    isNewSender && index > 0 && "mt-0.5"
                  )}
                >
                  <MessageBubble
                    message={message}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                    avatarsEnabled={showAvatars}
                    senderName={sender?.name}
                    senderImage={sender?.image}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
