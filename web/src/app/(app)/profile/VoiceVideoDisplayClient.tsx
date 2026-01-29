"use client";

import { VoiceVideoDisplay } from "@/components/profile";

interface VoiceVideoDisplayClientProps {
  voicePromptUrl?: string | null;
  voicePromptDuration?: number | null;
  videoIntroUrl?: string | null;
  videoIntroDuration?: number | null;
  userName?: string;
}

/**
 * Client component wrapper for VoiceVideoDisplay
 * Used in the server-rendered profile page
 */
export function VoiceVideoDisplayClient({
  voicePromptUrl,
  voicePromptDuration,
  videoIntroUrl,
  videoIntroDuration,
  userName,
}: VoiceVideoDisplayClientProps) {
  return (
    <VoiceVideoDisplay
      voicePromptUrl={voicePromptUrl}
      voicePromptDuration={voicePromptDuration}
      videoIntroUrl={videoIntroUrl}
      videoIntroDuration={videoIntroDuration}
      userName={userName}
    />
  );
}
