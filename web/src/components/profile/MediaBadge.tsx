"use client";

import { Mic, Video } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaBadgeProps {
  /** Whether the user has a voice prompt */
  hasVoicePrompt?: boolean;
  /** Whether the user has a video intro */
  hasVideoIntro?: boolean;
  /** Size variant */
  size?: "sm" | "md";
  /** Additional class names */
  className?: string;
}

/**
 * Small badge indicator showing if a user has voice/video media.
 * Used on compact profile displays like ProfileListItem and ProfileCard compact.
 */
export function MediaBadge({
  hasVoicePrompt,
  hasVideoIntro,
  size = "sm",
  className,
}: MediaBadgeProps) {
  // Don't render if no media
  if (!hasVoicePrompt && !hasVideoIntro) {
    return null;
  }

  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const containerSize = size === "sm" ? "gap-1 px-1.5 py-0.5" : "gap-1.5 px-2 py-1";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full bg-gray-100 text-gray-600",
        containerSize,
        className
      )}
      title={
        hasVoicePrompt && hasVideoIntro
          ? "Voice prompt & Video intro"
          : hasVoicePrompt
            ? "Voice prompt"
            : "Video intro"
      }
    >
      {hasVoicePrompt && (
        <Mic className={cn(iconSize, "text-pink-500")} aria-hidden="true" />
      )}
      {hasVideoIntro && (
        <Video className={cn(iconSize, "text-indigo-500")} aria-hidden="true" />
      )}
    </div>
  );
}

/**
 * Inline play button badge - clickable version for interactive contexts
 */
interface MediaPlayBadgeProps {
  /** Whether the user has a voice prompt */
  hasVoicePrompt?: boolean;
  /** Whether the user has a video intro */
  hasVideoIntro?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional class names */
  className?: string;
}

export function MediaPlayBadge({
  hasVoicePrompt,
  hasVideoIntro,
  onClick,
  className,
}: MediaPlayBadgeProps) {
  // Don't render if no media
  if (!hasVoicePrompt && !hasVideoIntro) {
    return null;
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick?.();
      }}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full",
        "bg-white/90 backdrop-blur-sm shadow-sm",
        "text-xs font-medium text-gray-700",
        "hover:bg-white hover:shadow-md",
        "transition-all duration-200 active:scale-95",
        className
      )}
      title="Play media"
    >
      {hasVoicePrompt && (
        <Mic className="w-3 h-3 text-pink-500" aria-hidden="true" />
      )}
      {hasVideoIntro && (
        <Video className="w-3 h-3 text-indigo-500" aria-hidden="true" />
      )}
    </button>
  );
}
