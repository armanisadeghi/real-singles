"use client";

import { useState, useCallback, useEffect } from "react";

export type PermissionState = "granted" | "denied" | "prompt";

export interface MediaPermissions {
  // Current permission states
  audioPermission: PermissionState | null;
  videoPermission: PermissionState | null;
  
  // Whether the browser supports media recording
  isSupported: boolean;
  
  // Request permission functions (should only be called after user interaction)
  requestAudioPermission: () => Promise<boolean>;
  requestVideoPermission: () => Promise<boolean>;
  
  // Active media streams (for cleanup)
  audioStream: MediaStream | null;
  videoStream: MediaStream | null;
  
  // Cleanup functions
  stopAudioStream: () => void;
  stopVideoStream: () => void;
  stopAllStreams: () => void;
  
  // Error state
  error: string | null;
}

/**
 * Hook for handling browser media permissions following best practices:
 * - Request only on user interaction (not on page load)
 * - Check existing permission state via navigator.permissions.query()
 * - Handle denied/blocked gracefully
 * - Support both Chrome and Safari
 */
export function useMediaPermissions(): MediaPermissions {
  const [audioPermission, setAudioPermission] = useState<PermissionState | null>(null);
  const [videoPermission, setVideoPermission] = useState<PermissionState | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  // Check browser support on mount
  useEffect(() => {
    const supported = typeof window !== "undefined" &&
      typeof navigator !== "undefined" &&
      typeof navigator.mediaDevices !== "undefined" &&
      typeof navigator.mediaDevices.getUserMedia !== "undefined";
    
    setIsSupported(supported);

    // Check existing permission states (if Permissions API is supported)
    if (supported && navigator.permissions) {
      // Check microphone permission
      navigator.permissions.query({ name: "microphone" as PermissionName })
        .then((result) => {
          setAudioPermission(result.state as PermissionState);
          // Listen for permission changes
          result.onchange = () => {
            setAudioPermission(result.state as PermissionState);
          };
        })
        .catch(() => {
          // Permissions API not fully supported (e.g., Safari)
          // Permission state will be determined when requesting
        });

      // Check camera permission
      navigator.permissions.query({ name: "camera" as PermissionName })
        .then((result) => {
          setVideoPermission(result.state as PermissionState);
          // Listen for permission changes
          result.onchange = () => {
            setVideoPermission(result.state as PermissionState);
          };
        })
        .catch(() => {
          // Permissions API not fully supported
        });
    }
  }, []);

  // Stop audio stream
  const stopAudioStream = useCallback(() => {
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
      setAudioStream(null);
    }
  }, [audioStream]);

  // Stop video stream
  const stopVideoStream = useCallback(() => {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
    }
  }, [videoStream]);

  // Stop all streams
  const stopAllStreams = useCallback(() => {
    stopAudioStream();
    stopVideoStream();
  }, [stopAudioStream, stopVideoStream]);

  // Request audio permission (microphone)
  // Should only be called after user interaction (e.g., button click)
  const requestAudioPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("Media recording is not supported in this browser");
      return false;
    }

    setError(null);

    try {
      // Stop existing stream if any
      stopAudioStream();

      // Request microphone access with echo cancellation for better quality
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setAudioStream(stream);
      setAudioPermission("granted");
      return true;
    } catch (err) {
      const error = err as Error;
      
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setAudioPermission("denied");
        setError("Microphone access was denied. Please allow microphone access in your browser settings.");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        setError("No microphone found. Please connect a microphone and try again.");
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        setError("Your microphone is being used by another application.");
      } else {
        setError(`Failed to access microphone: ${error.message}`);
      }
      
      return false;
    }
  }, [isSupported, stopAudioStream]);

  // Request video permission (camera + microphone)
  // Should only be called after user interaction (e.g., button click)
  const requestVideoPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("Media recording is not supported in this browser");
      return false;
    }

    setError(null);

    try {
      // Stop existing stream if any
      stopVideoStream();

      // Request camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user", // Front camera
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setVideoStream(stream);
      setVideoPermission("granted");
      setAudioPermission("granted"); // Video also gets audio
      return true;
    } catch (err) {
      const error = err as Error;
      
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setVideoPermission("denied");
        setError("Camera access was denied. Please allow camera access in your browser settings.");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        setError("No camera found. Please connect a camera and try again.");
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        setError("Your camera is being used by another application.");
      } else if (error.name === "OverconstrainedError") {
        // Try with less constraints
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          setVideoStream(stream);
          setVideoPermission("granted");
          setAudioPermission("granted");
          return true;
        } catch {
          setError("Failed to access camera with the requested settings.");
        }
      } else {
        setError(`Failed to access camera: ${error.message}`);
      }
      
      return false;
    }
  }, [isSupported, stopVideoStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
      }
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [audioStream, videoStream]);

  return {
    audioPermission,
    videoPermission,
    isSupported,
    requestAudioPermission,
    requestVideoPermission,
    audioStream,
    videoStream,
    stopAudioStream,
    stopVideoStream,
    stopAllStreams,
    error,
  };
}

/**
 * Get the best supported MIME type for audio recording
 * Prefers WebM for Chrome/Firefox, falls back to MP4 for Safari
 */
export function getSupportedAudioMimeType(): string {
  if (typeof MediaRecorder === "undefined") {
    return "audio/webm";
  }

  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/wav",
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return "audio/webm"; // Default fallback
}

/**
 * Get the best supported MIME type for video recording
 * Prefers WebM for Chrome/Firefox, falls back to MP4 for Safari
 */
export function getSupportedVideoMimeType(): string {
  if (typeof MediaRecorder === "undefined") {
    return "video/webm";
  }

  const types = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return "video/webm"; // Default fallback
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  if (mimeType.startsWith("audio/webm") || mimeType.startsWith("video/webm")) {
    return "webm";
  }
  if (mimeType.startsWith("audio/mp4") || mimeType.startsWith("video/mp4")) {
    return "mp4";
  }
  if (mimeType.startsWith("audio/ogg")) {
    return "ogg";
  }
  if (mimeType.startsWith("audio/wav")) {
    return "wav";
  }
  return "webm";
}
