"use client";

import { useEffect, useState, useCallback } from "react";
import { Phone, PhoneOff, Video, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CallInvitation } from "./types";

interface IncomingCallModalProps {
  invitation: CallInvitation | null;
  onAccept: (invitation: CallInvitation) => void;
  onReject: (invitation: CallInvitation) => void;
  onTimeout?: (invitation: CallInvitation) => void;
  timeoutSeconds?: number;
}

/**
 * Pulsing ring animation component
 */
function PulsingRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="absolute w-32 h-32 rounded-full border-2 border-green-500/30 animate-ping" />
      <div
        className="absolute w-40 h-40 rounded-full border-2 border-green-500/20 animate-ping"
        style={{ animationDelay: "0.5s" }}
      />
      <div
        className="absolute w-48 h-48 rounded-full border-2 border-green-500/10 animate-ping"
        style={{ animationDelay: "1s" }}
      />
    </div>
  );
}

/**
 * Caller avatar component
 */
function CallerAvatar({
  name,
  avatarUrl,
  callType,
}: {
  name: string;
  avatarUrl?: string;
  callType: "audio" | "video";
}) {
  const Icon = callType === "video" ? Video : Phone;

  return (
    <div className="relative">
      <div className="w-24 h-24 rounded-full bg-neutral-700 flex items-center justify-center overflow-hidden ring-4 ring-green-500/50">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-12 h-12 text-neutral-400" />
        )}
      </div>
      <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
        <Icon className="w-4 h-4 text-white" />
      </div>
    </div>
  );
}

/**
 * IncomingCallModal component
 * Displays an incoming call notification with accept/reject options
 */
export function IncomingCallModal({
  invitation,
  onAccept,
  onReject,
  onTimeout,
  timeoutSeconds = 30,
}: IncomingCallModalProps) {
  const [remainingTime, setRemainingTime] = useState(timeoutSeconds);

  // Reset timer when invitation changes
  useEffect(() => {
    if (invitation) {
      setRemainingTime(timeoutSeconds);
    }
  }, [invitation, timeoutSeconds]);

  // Countdown timer
  useEffect(() => {
    if (!invitation) return;

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeout?.(invitation);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [invitation, onTimeout]);

  // Handle keyboard shortcuts (Enter to accept, Escape to reject)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!invitation) return;
      
      if (e.key === "Escape") {
        onReject(invitation);
      } else if (e.key === "Enter") {
        onAccept(invitation);
      }
    };

    if (invitation) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [invitation, onReject, onAccept]);

  const handleAccept = useCallback(() => {
    if (invitation) {
      onAccept(invitation);
    }
  }, [invitation, onAccept]);

  const handleReject = useCallback(() => {
    if (invitation) {
      onReject(invitation);
    }
  }, [invitation, onReject]);

  if (!invitation) return null;

  const isVideoCall = invitation.call_type === "video";
  const callerName = invitation.callerName || "Someone";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      {/* Pulsing background rings */}
      <PulsingRings />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8 py-12">
        {/* Caller info */}
        <CallerAvatar
          name={callerName}
          avatarUrl={invitation.callerAvatar}
          callType={invitation.call_type}
        />

        <h2 className="mt-6 text-2xl font-semibold text-white">
          {callerName}
        </h2>
        <p className="mt-2 text-neutral-400">
          Incoming {isVideoCall ? "video" : "voice"} call...
        </p>

        {/* Timer */}
        <div className="mt-4 px-4 py-1.5 rounded-full bg-white/10 text-sm text-neutral-300">
          {remainingTime}s remaining
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-8 mt-10">
          {/* Reject button */}
          <button
            onClick={handleReject}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              "bg-red-500 hover:bg-red-600 active:bg-red-700",
              "transition-all duration-200 hover:scale-110",
              "shadow-lg shadow-red-500/30"
            )}
            aria-label="Decline call"
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </button>

          {/* Accept button */}
          <button
            onClick={handleAccept}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              "bg-green-500 hover:bg-green-600 active:bg-green-700",
              "transition-all duration-200 hover:scale-110",
              "shadow-lg shadow-green-500/30",
              "animate-pulse"
            )}
            aria-label="Accept call"
          >
            {isVideoCall ? (
              <Video className="w-7 h-7 text-white" />
            ) : (
              <Phone className="w-7 h-7 text-white" />
            )}
          </button>
        </div>

        {/* Keyboard hints */}
        <p className="mt-8 text-xs text-neutral-500">
          Press <kbd className="px-1.5 py-0.5 rounded bg-white/10">Enter</kbd> to accept,{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-white/10">Esc</kbd> to decline
        </p>
      </div>
    </div>
  );
}

export default IncomingCallModal;
