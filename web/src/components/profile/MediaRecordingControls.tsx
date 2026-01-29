"use client";

import { Mic, MicOff, Video, VideoOff, Square, Trash2, Upload, Loader2, AlertCircle } from "lucide-react";

export type RecordingState = "idle" | "requesting" | "ready" | "recording" | "processing" | "preview" | "uploading";

interface MediaRecordingControlsProps {
  /** Current state of the recording */
  state: RecordingState;
  /** Whether this is for audio or video */
  mediaType: "audio" | "video";
  /** Current recording time in seconds */
  recordingTime: number;
  /** Maximum recording time in seconds */
  maxDuration: number;
  /** Whether there's an existing recording/upload */
  hasExisting: boolean;
  /** Error message to display */
  error?: string | null;
  /** Callbacks */
  onStartRecording: () => void;
  onStopRecording: () => void;
  onDelete: () => void;
  onUploadFile?: () => void;
  onRetry?: () => void;
  /** Whether the browser supports media recording */
  isSupported: boolean;
  /** Permission state */
  permissionDenied?: boolean;
}

/**
 * Shared recording controls for voice and video recording.
 * Provides consistent UI for record/stop/delete actions.
 */
export function MediaRecordingControls({
  state,
  mediaType,
  recordingTime,
  maxDuration,
  hasExisting,
  error,
  onStartRecording,
  onStopRecording,
  onDelete,
  onUploadFile,
  onRetry,
  isSupported,
  permissionDenied,
}: MediaRecordingControlsProps) {
  const isAudio = mediaType === "audio";
  const Icon = isAudio ? Mic : Video;
  const OffIcon = isAudio ? MicOff : VideoOff;

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate progress percentage
  const progress = (recordingTime / maxDuration) * 100;

  // Not supported state
  if (!isSupported) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 text-center">
          {isAudio ? "Audio" : "Video"} recording is not supported in your browser.
          <br />
          Please try using Chrome, Safari, or Firefox.
        </p>
      </div>
    );
  }

  // Permission denied state
  if (permissionDenied) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
          <OffIcon className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-sm text-gray-500 text-center">
          {isAudio ? "Microphone" : "Camera"} access was denied.
          <br />
          Please allow access in your browser settings.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  // Error state
  if (error && state !== "recording") {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-sm text-red-500 text-center">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Timer display (shown when recording or preview) */}
      {(state === "recording" || state === "preview") && (
        <div className="flex flex-col items-center gap-2">
          {/* Time display */}
          <div className="text-2xl font-mono font-semibold text-gray-900">
            {formatTime(recordingTime)}
            <span className="text-gray-400"> / {formatTime(maxDuration)}</span>
          </div>

          {/* Progress bar (only during recording) */}
          {state === "recording" && (
            <div className="w-full max-w-[200px] h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-indigo-500 transition-all duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Control buttons */}
      <div className="flex items-center gap-3">
        {/* Recording/Stop button */}
        {state === "idle" || state === "requesting" || state === "ready" ? (
          <button
            onClick={onStartRecording}
            disabled={state === "requesting"}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium
              bg-gradient-to-r from-pink-500 to-indigo-500 text-white
              hover:from-pink-600 hover:to-indigo-600
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200 shadow-md hover:shadow-lg
              active:scale-[0.98]"
          >
            {state === "requesting" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Icon className="w-5 h-5" />
            )}
            <span>
              {state === "requesting"
                ? "Requesting access..."
                : hasExisting
                  ? "Re-record"
                  : `Record ${isAudio ? "Voice" : "Video"}`}
            </span>
          </button>
        ) : state === "recording" ? (
          <button
            onClick={onStopRecording}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium
              bg-red-500 text-white hover:bg-red-600
              transition-all duration-200 shadow-md hover:shadow-lg
              active:scale-[0.98] animate-pulse"
          >
            <Square className="w-5 h-5 fill-current" />
            <span>Stop Recording</span>
          </button>
        ) : state === "processing" || state === "uploading" ? (
          <button
            disabled
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium
              bg-gray-100 text-gray-500 cursor-not-allowed"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{state === "processing" ? "Processing..." : "Uploading..."}</span>
          </button>
        ) : null}

        {/* Upload from file button (video only, when idle) */}
        {mediaType === "video" && (state === "idle" || state === "ready") && onUploadFile && (
          <button
            onClick={onUploadFile}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium
              bg-gray-100 text-gray-700 hover:bg-gray-200
              transition-all duration-200
              active:scale-[0.98]"
          >
            <Upload className="w-5 h-5" />
            <span>Upload File</span>
          </button>
        )}

        {/* Delete button (when has existing) */}
        {hasExisting && (state === "idle" || state === "ready" || state === "preview") && (
          <button
            onClick={onDelete}
            className="flex items-center justify-center p-2.5 rounded-xl
              text-red-500 hover:bg-red-50
              transition-all duration-200
              active:scale-[0.98]"
            title={`Delete ${isAudio ? "voice prompt" : "video intro"}`}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Helper text */}
      {state === "idle" && !hasExisting && (
        <p className="text-xs text-gray-400 text-center">
          {isAudio
            ? `Record up to ${maxDuration} seconds of audio`
            : `Record up to ${maxDuration} seconds of video`}
        </p>
      )}
    </div>
  );
}

/**
 * Timer hook for recording duration
 */
export function useRecordingTimer(
  isRecording: boolean,
  maxDuration: number,
  onMaxReached?: () => void
) {
  const [time, setTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      setTime(0);
      intervalRef.current = setInterval(() => {
        setTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            onMaxReached?.();
            return maxDuration;
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording, maxDuration, onMaxReached]);

  return time;
}

// Need to import these for the hook
import { useState, useRef, useEffect } from "react";
