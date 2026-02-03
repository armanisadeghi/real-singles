"use client";

import { useState, useRef } from "react";
import { Mic, Video, Play, Pause, Volume2 } from "lucide-react";

interface VoiceVideoDisplayProps {
  /** Voice prompt URL (signed) */
  voicePromptUrl?: string | null;
  /** Voice prompt duration in seconds */
  voicePromptDuration?: number | null;
  /** Video intro URL (signed) */
  videoIntroUrl?: string | null;
  /** Video intro duration in seconds */
  videoIntroDuration?: number | null;
  /** User's name for accessibility */
  userName?: string;
  /** Compact mode for smaller displays */
  compact?: boolean;
}

/**
 * Display component for voice prompts and video intros on profile view pages.
 * Used when viewing another user's profile.
 */
export function VoiceVideoDisplay({
  voicePromptUrl,
  voicePromptDuration,
  videoIntroUrl,
  videoIntroDuration,
  userName = "User",
  compact = false,
}: VoiceVideoDisplayProps) {
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // If neither voice nor video, don't render anything
  if (!voicePromptUrl && !videoIntroUrl) {
    return null;
  }

  // Toggle audio playback
  const toggleAudio = () => {
    if (!audioRef.current) return;

    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      audioRef.current.play();
      setIsAudioPlaying(true);
    }
  };

  // Toggle video playback
  const toggleVideo = () => {
    if (!videoRef.current) return;

    if (isVideoPlaying) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    } else {
      videoRef.current.play();
      setIsVideoPlaying(true);
    }
  };

  // Handle audio ended
  const handleAudioEnded = () => {
    setIsAudioPlaying(false);
  };

  // Handle video ended
  const handleVideoEnded = () => {
    setIsVideoPlaying(false);
  };

  // Format duration
  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (compact) {
    // Compact mode: Small inline buttons
    return (
      <div className="flex items-center gap-2">
        {voicePromptUrl && (
          <>
            <audio
              ref={audioRef}
              src={voicePromptUrl}
              onEnded={handleAudioEnded}
              preload="metadata"
            />
            <button
              onClick={toggleAudio}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                transition-all duration-200 active:scale-95
                ${isAudioPlaying 
                  ? "bg-pink-100 dark:bg-pink-950/50 text-pink-700 dark:text-pink-400" 
                  : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
                }`}
              title={`Listen to ${userName}'s voice prompt`}
            >
              {isAudioPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
              <span>Voice</span>
            </button>
          </>
        )}

        {videoIntroUrl && (
          <button
            onClick={() => setShowVideoModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
              bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700
              transition-all duration-200 active:scale-95"
            title={`Watch ${userName}'s video intro`}
          >
            <Video className="w-4 h-4" />
            <span>Video</span>
          </button>
        )}

        {/* Video Modal */}
        {showVideoModal && videoIntroUrl && (
          <VideoModal
            url={videoIntroUrl}
            userName={userName}
            duration={videoIntroDuration}
            onClose={() => setShowVideoModal(false)}
          />
        )}
      </div>
    );
  }

  // Full mode: Larger display with preview
  return (
    <div className="space-y-4">
      {/* Voice Prompt */}
      {voicePromptUrl && (
        <div className="bg-gradient-to-r from-pink-50 to-indigo-50 dark:from-pink-950/30 dark:to-indigo-950/30 rounded-xl p-4">
          <audio
            ref={audioRef}
            src={voicePromptUrl}
            onEnded={handleAudioEnded}
            preload="metadata"
          />
          <div className="flex items-center gap-4">
            <button
              onClick={toggleAudio}
              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
                transition-all duration-200 active:scale-95
                ${isAudioPlaying 
                  ? "bg-pink-500 text-white" 
                  : "bg-white dark:bg-neutral-800 text-pink-500 shadow-md dark:shadow-black/20 hover:shadow-lg dark:hover:shadow-black/30"
                }`}
              aria-label={isAudioPlaying ? "Pause voice prompt" : "Play voice prompt"}
            >
              {isAudioPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-pink-500" />
                <span className="font-medium text-gray-900 dark:text-gray-100">Voice Prompt</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Listen to {userName}&apos;s voice introduction
                {voicePromptDuration && (
                  <span className="ml-2 text-gray-400 dark:text-gray-500">
                    ({formatDuration(voicePromptDuration)})
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {/* Waveform visualization placeholder */}
          {isAudioPlaying && (
            <div className="mt-3 h-8 bg-white/50 dark:bg-neutral-800/50 rounded-lg flex items-center justify-center gap-1 px-4">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-pink-400 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 20 + 8}px`,
                    animationDelay: `${i * 50}ms`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Video Intro */}
      {videoIntroUrl && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl p-4">
          <video
            ref={videoRef}
            src={videoIntroUrl}
            onEnded={handleVideoEnded}
            playsInline
            className="hidden"
          />
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowVideoModal(true)}
              className="flex-shrink-0 w-12 h-12 rounded-full bg-white dark:bg-neutral-800 text-indigo-500 shadow-md dark:shadow-black/20
                flex items-center justify-center hover:shadow-lg dark:hover:shadow-black/30
                transition-all duration-200 active:scale-95"
              aria-label="Watch video introduction"
            >
              <Play className="w-5 h-5 ml-0.5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-indigo-500" />
                <span className="font-medium text-gray-900 dark:text-gray-100">Video Introduction</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Watch {userName}&apos;s video intro
                {videoIntroDuration && (
                  <span className="ml-2 text-gray-400 dark:text-gray-500">
                    ({formatDuration(videoIntroDuration)})
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && videoIntroUrl && (
        <VideoModal
          url={videoIntroUrl}
          userName={userName}
          duration={videoIntroDuration}
          onClose={() => setShowVideoModal(false)}
        />
      )}
    </div>
  );
}

/**
 * Video playback modal
 */
function VideoModal({
  url,
  userName,
  duration,
  onClose,
}: {
  url: string;
  userName: string;
  duration?: number | null;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md max-h-[80vh] bg-black rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              <span className="font-medium">{userName}&apos;s Video Intro</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close video"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Video */}
        <video
          ref={videoRef}
          src={url}
          controls
          autoPlay
          playsInline
          className="w-full aspect-[9/16] object-cover"
        />
      </div>
    </div>
  );
}
