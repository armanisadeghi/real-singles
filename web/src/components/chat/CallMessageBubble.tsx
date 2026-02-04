"use client";

import { Phone, PhoneOff, PhoneMissed, Video, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface CallMetadata {
  call_id: string;
  call_type: "audio" | "video";
  duration_seconds: number;
  status: "completed" | "missed" | "declined" | "no_answer";
  participants: string[];
  started_at: string;
  ended_at: string;
}

interface CallMessageBubbleProps {
  metadata: CallMetadata;
  isOwn: boolean;
  createdAt: string;
}

/**
 * CallMessageBubble - Displays call history in chat
 * Shows call type, duration, and status with appropriate icons
 */
export function CallMessageBubble({
  metadata,
  isOwn,
  createdAt,
}: CallMessageBubbleProps) {
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) {
      return remainingSeconds > 0 
        ? `${minutes}m ${remainingSeconds}s` 
        : `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isVideo = metadata.call_type === "video";
  const isUnanswered = metadata.status === "missed" || metadata.status === "declined" || metadata.status === "no_answer";
  const duration = metadata.duration_seconds || 0;

  // Determine icon based on call type and status
  const getIcon = () => {
    if (isVideo) {
      if (isUnanswered) {
        return <VideoOff className="w-5 h-5" />;
      }
      return <Video className="w-5 h-5" />;
    } else {
      if (isUnanswered) {
        return <PhoneMissed className="w-5 h-5" />;
      }
      return <Phone className="w-5 h-5" />;
    }
  };

  // Determine text based on status
  const getCallText = () => {
    const callType = isVideo ? "Video call" : "Voice call";
    
    switch (metadata.status) {
      case "missed":
        return `Missed ${callType.toLowerCase()}`;
      case "declined":
        return `${callType} declined`;
      case "no_answer":
        return `${callType} - No answer`;
      case "completed":
      default:
        return callType;
    }
  };

  // Color scheme based on status
  const bgColor = isUnanswered
    ? "bg-red-50 dark:bg-red-950/30"
    : isOwn
    ? "bg-green-50 dark:bg-green-950/30"
    : "bg-gray-100 dark:bg-neutral-800";

  const iconColor = isUnanswered
    ? "text-red-500"
    : isOwn
    ? "text-green-600 dark:text-green-400"
    : "text-gray-600 dark:text-gray-400";

  const textColor = isUnanswered
    ? "text-red-700 dark:text-red-300"
    : "text-gray-800 dark:text-gray-200";

  return (
    <div
      className={cn(
        "flex gap-2",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div className="flex flex-col max-w-[280px]">
        {/* Call card */}
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-2xl shadow-sm",
            bgColor
          )}
        >
          {/* Icon */}
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full",
              isUnanswered
                ? "bg-red-100 dark:bg-red-900/50"
                : isOwn
                ? "bg-green-100 dark:bg-green-900/50"
                : "bg-gray-200 dark:bg-neutral-700"
            )}
          >
            <span className={iconColor}>{getIcon()}</span>
          </div>

          {/* Call info */}
          <div className="flex flex-col">
            <span className={cn("text-[15px] font-medium", textColor)}>
              {getCallText()}
            </span>
            {metadata.status === "completed" && duration > 0 && (
              <span className="text-[13px] text-gray-500 dark:text-gray-400">
                {formatDuration(duration)}
              </span>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <div
          className={cn(
            "flex items-center gap-1 mt-0.5",
            isOwn ? "justify-end mr-1" : "ml-1"
          )}
        >
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            {formatTime(createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
