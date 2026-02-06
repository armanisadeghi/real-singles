"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Video, Play, Pause, Loader2, Check, AlertCircle } from "lucide-react";
import { useMediaPermissions, getSupportedVideoMimeType } from "@/hooks/useMediaPermissions";
import { MediaRecordingControls, type RecordingState } from "./MediaRecordingControls";
import { VIDEO_INTRO_MIME_TYPES, VIDEO_ACCEPT_STRING } from "@/lib/supabase/storage";

type AutoSaveStatus = "idle" | "uploading" | "saved" | "error";

interface VideoRecorderProps {
  /** Existing video intro URL (for preview) */
  existingUrl?: string | null;
  /** Existing duration in seconds */
  existingDuration?: number | null;
  /** Called when a new recording is saved (auto-called immediately after recording stops) */
  onSave: (file: Blob, duration: number) => Promise<void>;
  /** Called when the recording is deleted (used for cancel/undo after auto-save) */
  onDelete: () => Promise<void>;
  /** Maximum recording duration in seconds */
  maxDuration?: number;
}

/**
 * Video intro recorder component with auto-save.
 * Records video or accepts file uploads, automatically uploads in the background,
 * and lets users confirm (Keep) or undo (Cancel → deletes uploaded file).
 */
export function VideoRecorder({
  existingUrl,
  existingDuration,
  onSave,
  onDelete,
  maxDuration = 60,
}: VideoRecorderProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const videoPlaybackRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recordingTimeRef = useRef(0); // Track recording time for onstop callback

  const {
    videoPermission,
    isSupported,
    requestVideoPermission,
    videoStream,
    stopVideoStream,
    error: permissionError,
  } = useMediaPermissions();

  // Get supported MIME type
  const mimeType = getSupportedVideoMimeType();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVideoStream();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
    };
  }, [stopVideoStream, recordedUrl]);

  // Connect live stream to preview video element
  useEffect(() => {
    if (videoPreviewRef.current && videoStream) {
      videoPreviewRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  // Auto-save: upload immediately when blob is created
  const performAutoSave = useCallback(async (blob: Blob, duration: number) => {
    setAutoSaveStatus("uploading");
    try {
      await onSave(blob, duration);
      setAutoSaveStatus("saved");
    } catch (err) {
      console.error("Auto-save error:", err);
      setAutoSaveStatus("error");
      setError("Upload failed. You can retry or cancel.");
    }
  }, [onSave]);

  // Start recording
  const startRecording = useCallback(async () => {
    setError(null);
    setAutoSaveStatus("idle");
    setState("requesting");

    try {
      // Request permission - returns stream directly to avoid state timing issues
      const stream = await requestVideoPermission();
      if (!stream) {
        setState("idle");
        return;
      }

      setState("ready");

      // Small delay for UX and to let video preview connect
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Create MediaRecorder
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        // Create blob from chunks
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        
        // Create URL for preview
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        
        setState("preview");
        stopVideoStream();

        // Auto-save immediately in the background
        const duration = recordingTimeRef.current;
        performAutoSave(blob, duration);
      };

      recorder.onerror = () => {
        setError("Recording failed. Please try again.");
        setState("idle");
        stopVideoStream();
      };

      // Start recording
      recorder.start(100); // Collect data every 100ms
      setState("recording");
      setRecordingTime(0);
      recordingTimeRef.current = 0;

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          recordingTimeRef.current = newTime;
          if (newTime >= maxDuration) {
            // Auto-stop at max duration
            stopRecording();
            return maxDuration;
          }
          return newTime;
        });
      }, 1000);
    } catch (err) {
      console.error("Recording error:", err);
      setError("Failed to start recording. Please try again.");
      setState("idle");
    }
  }, [requestVideoPermission, videoStream, mimeType, maxDuration, stopVideoStream, performAutoSave]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Handle file upload (also auto-saves immediately)
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Validate file type (strip codec parameters for comparison)
    const baseType = file.type.split(";")[0].trim();
    if (!VIDEO_INTRO_MIME_TYPES.includes(baseType as typeof VIDEO_INTRO_MIME_TYPES[number])) {
      setError(`Invalid file type. Please upload: ${VIDEO_INTRO_MIME_TYPES.join(", ")}`);
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setError("File too large. Maximum size is 50MB.");
      return;
    }

    setError(null);
    setAutoSaveStatus("idle");
    setState("processing");

    // Get video duration
    const video = document.createElement("video");
    video.preload = "metadata";
    
    const url = URL.createObjectURL(file);
    
    video.onloadedmetadata = () => {
      const duration = Math.round(video.duration);
      URL.revokeObjectURL(url);
      
      if (duration > maxDuration) {
        setError(`Video too long. Maximum duration is ${maxDuration} seconds.`);
        setState("idle");
        return;
      }

      setRecordedBlob(file);
      const previewUrl = URL.createObjectURL(file);
      setRecordedUrl(previewUrl);
      setRecordingTime(duration);
      recordingTimeRef.current = duration;
      setState("preview");

      // Auto-save immediately in the background
      performAutoSave(file, duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      setError("Failed to process video. Please try a different file.");
      setState("idle");
    };

    video.src = url;
  }, [maxDuration, performAutoSave]);

  // Handle "Keep" (confirm auto-saved recording)
  const handleKeep = useCallback(() => {
    // Recording is already saved via auto-save — just clean up local state
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedBlob(null);
    setRecordedUrl(null);
    setState("idle");
    setAutoSaveStatus("idle");
  }, [recordedUrl]);

  // Handle retry (re-attempt failed auto-save)
  const handleRetry = useCallback(async () => {
    if (!recordedBlob) return;
    await performAutoSave(recordedBlob, recordingTime);
  }, [recordedBlob, recordingTime, performAutoSave]);

  // Handle "Cancel" (undo auto-save by deleting uploaded file)
  const handleCancel = useCallback(async () => {
    setError(null);

    // If auto-save succeeded, delete the uploaded file
    if (autoSaveStatus === "saved") {
      try {
        await onDelete();
      } catch (err) {
        console.error("Cancel/delete error:", err);
        // Still clean up locally even if delete fails
      }
    }

    // Clean up local state
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordingTime(0);
    recordingTimeRef.current = 0;
    setState("idle");
    setIsPlaying(false);
    setAutoSaveStatus("idle");
    stopVideoStream();
  }, [recordedUrl, onDelete, autoSaveStatus, stopVideoStream]);

  // Handle delete of existing recording
  const handleDelete = useCallback(async () => {
    setState("uploading");
    setError(null);

    try {
      await onDelete();
      
      // Clean up any local recording
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
      setRecordedBlob(null);
      setRecordedUrl(null);
      setRecordingTime(0);
      recordingTimeRef.current = 0;
      setState("idle");
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete video. Please try again.");
      setState("idle");
    }
  }, [recordedUrl, onDelete]);

  // Toggle playback
  const togglePlayback = useCallback(() => {
    if (!videoPlaybackRef.current) return;

    if (isPlaying) {
      videoPlaybackRef.current.pause();
      setIsPlaying(false);
    } else {
      videoPlaybackRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Handle video ended
  useEffect(() => {
    const video = videoPlaybackRef.current;
    if (!video) return;

    const handleEnded = () => setIsPlaying(false);
    video.addEventListener("ended", handleEnded);
    return () => video.removeEventListener("ended", handleEnded);
  }, []);

  // Preview URL (either recorded or existing)
  const hasExisting = !!existingUrl;

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={VIDEO_ACCEPT_STRING}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Video preview area */}
      <div className="relative w-full max-w-[280px] aspect-[9/16] bg-gray-100 dark:bg-neutral-800 rounded-2xl overflow-hidden">
        {/* Live camera preview during ready/recording */}
        {(state === "ready" || state === "recording") && videoStream && (
          <>
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Recording indicator */}
            {state === "recording" && (
              <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                REC
              </div>
            )}
            {/* Timer overlay */}
            <div className="absolute bottom-3 left-3 right-3 flex justify-center">
              <div className="px-3 py-1.5 bg-black/60 backdrop-blur-sm text-white text-lg font-mono rounded-lg">
                {Math.floor(recordingTime / 60).toString().padStart(2, "0")}:
                {(recordingTime % 60).toString().padStart(2, "0")}
                <span className="text-white/60 ml-1">/ {maxDuration}s</span>
              </div>
            </div>
          </>
        )}

        {/* Recorded video preview */}
        {state === "preview" && recordedUrl && (
          <video
            ref={videoPlaybackRef}
            src={recordedUrl}
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Existing video preview */}
        {state === "idle" && existingUrl && (
          <video
            ref={videoPlaybackRef}
            src={existingUrl}
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Placeholder when idle and no existing */}
        {state === "idle" && !existingUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-indigo-100 dark:from-pink-950/50 dark:to-indigo-950/50 flex items-center justify-center">
              <Video className="w-8 h-8 text-indigo-400" />
            </div>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No video intro</p>
          </div>
        )}

        {/* Processing/uploading overlay */}
        {(state === "processing" || state === "uploading" || state === "requesting") && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
              <span className="text-white text-sm">
                {state === "requesting" ? "Requesting access..." : 
                 state === "processing" ? "Processing..." : "Uploading..."}
              </span>
            </div>
          </div>
        )}

        {/* Play/Pause overlay for preview states */}
        {(state === "preview" || (state === "idle" && existingUrl)) && (
          <button
            onClick={togglePlayback}
            className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              {isPlaying ? (
                <Pause className="w-6 h-6 text-gray-900" />
              ) : (
                <Play className="w-6 h-6 text-gray-900 ml-1" />
              )}
            </div>
          </button>
        )}

        {/* Auto-save status overlay on preview */}
        {state === "preview" && autoSaveStatus !== "idle" && (
          <div className="absolute top-3 right-3">
            {autoSaveStatus === "uploading" && (
              <span className="flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs rounded-full">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </span>
            )}
            {autoSaveStatus === "saved" && (
              <span className="flex items-center gap-1.5 px-2 py-1 bg-green-600/80 backdrop-blur-sm text-white text-xs rounded-full">
                <Check className="w-3 h-3" />
                Saved
              </span>
            )}
            {autoSaveStatus === "error" && (
              <span className="flex items-center gap-1.5 px-2 py-1 bg-red-600/80 backdrop-blur-sm text-white text-xs rounded-full">
                <AlertCircle className="w-3 h-3" />
                Failed
              </span>
            )}
          </div>
        )}
      </div>

      {/* Recording controls */}
      {state !== "preview" && state !== "requesting" && state !== "processing" && (
        <MediaRecordingControls
          state={state}
          mediaType="video"
          recordingTime={recordingTime}
          maxDuration={maxDuration}
          hasExisting={hasExisting}
          error={error || permissionError}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onDelete={handleDelete}
          onUploadFile={() => fileInputRef.current?.click()}
          onRetry={() => setState("idle")}
          isSupported={isSupported}
          permissionDenied={videoPermission === "denied"}
        />
      )}

      {/* Preview controls (auto-save in progress or complete) */}
      {state === "preview" && (
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Duration: {recordingTime}s
          </div>
          
          {/* Keep/Cancel buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              disabled={autoSaveStatus === "uploading"}
              className="px-3 py-1.5 rounded-lg text-sm font-medium
                text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 active:scale-[0.98]"
            >
              Cancel
            </button>
            {autoSaveStatus === "error" ? (
              <button
                onClick={handleRetry}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                  bg-gradient-to-r from-pink-500 to-indigo-500 text-white
                  hover:from-pink-600 hover:to-indigo-600
                  transition-all duration-200 active:scale-[0.98]"
              >
                <span>Retry</span>
              </button>
            ) : (
              <button
                onClick={handleKeep}
                disabled={autoSaveStatus === "uploading"}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                  bg-gradient-to-r from-pink-500 to-indigo-500 text-white
                  hover:from-pink-600 hover:to-indigo-600
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200 active:scale-[0.98]"
              >
                {autoSaveStatus === "uploading" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Keep</span>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error display */}
      {error && state !== "preview" && (
        <div className="text-sm text-red-500 dark:text-red-400 text-center">{error}</div>
      )}

      {/* Existing video info */}
      {state === "idle" && existingUrl && existingDuration && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Current intro ({existingDuration}s)
        </div>
      )}
    </div>
  );
}
