"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Play, Pause, Loader2 } from "lucide-react";
import { useMediaPermissions, getSupportedAudioMimeType, getExtensionFromMimeType } from "@/hooks/useMediaPermissions";
import { AudioWaveform } from "./AudioWaveform";
import { MediaRecordingControls, type RecordingState } from "./MediaRecordingControls";

interface VoiceRecorderProps {
  /** Existing voice prompt URL (for preview) */
  existingUrl?: string | null;
  /** Existing duration in seconds */
  existingDuration?: number | null;
  /** Called when a new recording is saved */
  onSave: (file: Blob, duration: number) => Promise<void>;
  /** Called when the recording is deleted */
  onDelete: () => Promise<void>;
  /** Maximum recording duration in seconds */
  maxDuration?: number;
}

/**
 * Voice prompt recorder component.
 * Handles permission requests, recording, playback preview, and upload.
 */
export function VoiceRecorder({
  existingUrl,
  existingDuration,
  onSave,
  onDelete,
  maxDuration = 30,
}: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    audioPermission,
    isSupported,
    requestAudioPermission,
    audioStream,
    stopAudioStream,
    error: permissionError,
  } = useMediaPermissions();

  // Get supported MIME type
  const mimeType = getSupportedAudioMimeType();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudioStream();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
    };
  }, [stopAudioStream, recordedUrl]);

  // Start recording
  const startRecording = useCallback(async () => {
    setError(null);
    setState("requesting");

    try {
      // Request permission - returns stream directly to avoid state timing issues
      const stream = await requestAudioPermission();
      if (!stream) {
        setState("idle");
        return;
      }

      setState("ready");

      // Small delay for UX
      await new Promise((resolve) => setTimeout(resolve, 300));

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
        stopAudioStream();
      };

      recorder.onerror = () => {
        setError("Recording failed. Please try again.");
        setState("idle");
        stopAudioStream();
      };

      // Start recording
      recorder.start(100); // Collect data every 100ms
      setState("recording");
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
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
  }, [requestAudioPermission, audioStream, mimeType, maxDuration, stopAudioStream]);

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

  // Handle save
  const handleSave = useCallback(async () => {
    if (!recordedBlob) return;

    setIsSaving(true);
    setError(null);

    try {
      await onSave(recordedBlob, recordingTime);
      
      // Clean up
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
      setRecordedBlob(null);
      setRecordedUrl(null);
      setState("idle");
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save recording. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [recordedBlob, recordingTime, recordedUrl, onSave]);

  // Handle delete
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
      setState("idle");
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete recording. Please try again.");
      setState("idle");
    }
  }, [recordedUrl, onDelete]);

  // Handle discard and re-record
  const handleDiscard = useCallback(() => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordingTime(0);
    setState("idle");
    setIsPlaying(false);
  }, [recordedUrl]);

  // Toggle playback
  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Handle audio ended
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, []);

  // Preview URL (either recorded or existing)
  const previewUrl = recordedUrl || existingUrl;
  const previewDuration = recordedUrl ? recordingTime : existingDuration;
  const hasExisting = !!existingUrl;

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Waveform visualization */}
      <div className="w-full max-w-[200px] h-[60px] flex items-center justify-center">
        {state === "recording" ? (
          <AudioWaveform
            stream={audioStream}
            isActive={true}
            width={200}
            height={60}
            color="#ec4899"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-indigo-100 dark:from-pink-950/50 dark:to-indigo-950/50 flex items-center justify-center">
            <Mic className="w-8 h-8 text-indigo-400" />
          </div>
        )}
      </div>

      {/* Recording controls */}
      {state !== "preview" && (
        <MediaRecordingControls
          state={state}
          mediaType="audio"
          recordingTime={recordingTime}
          maxDuration={maxDuration}
          hasExisting={hasExisting}
          error={error || permissionError}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onDelete={handleDelete}
          onRetry={() => setState("idle")}
          isSupported={isSupported}
          permissionDenied={audioPermission === "denied"}
        />
      )}

      {/* Preview section */}
      {state === "preview" && recordedUrl && (
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Hidden audio element */}
          <audio
            ref={audioRef}
            src={recordedUrl}
            preload="metadata"
          />

          {/* Duration display */}
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Recording: {recordingTime}s
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlayback}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700
                transition-all duration-200 active:scale-[0.98]"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Preview</span>
                </>
              )}
            </button>
          </div>

          {/* Save/Discard buttons */}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleDiscard}
              disabled={isSaving}
              className="px-3 py-1.5 rounded-lg text-sm font-medium
                text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 active:scale-[0.98]"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                bg-gradient-to-r from-pink-500 to-indigo-500 text-white
                hover:from-pink-600 hover:to-indigo-600
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 active:scale-[0.98]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Existing recording preview */}
      {state === "idle" && existingUrl && (
        <div className="flex flex-col items-center gap-2 w-full mt-2">
          <audio
            ref={audioRef}
            src={existingUrl}
            preload="metadata"
          />
          
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Current prompt</span>
            {existingDuration && (
              <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-neutral-800 rounded-full">
                {existingDuration}s
              </span>
            )}
          </div>

          <button
            onClick={togglePlayback}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
              bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700
              transition-all duration-200 active:scale-[0.98]"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Play</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
