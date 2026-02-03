"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, CheckCircle, Trash2, Loader2, AlertCircle, RefreshCw, X } from "lucide-react";
import { useMediaPermissions } from "@/hooks/useMediaPermissions";

interface VerificationSelfieCaptureProps {
  existingUrl: string | null;
  onSave: (blob: Blob) => Promise<void>;
  onDelete: () => Promise<void>;
}

type CaptureState = "idle" | "preview" | "capturing" | "saving" | "error";

export function VerificationSelfieCapture({
  existingUrl,
  onSave,
  onDelete,
}: VerificationSelfieCaptureProps) {
  const [state, setState] = useState<CaptureState>("idle");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const {
    isSupported,
    error: permissionError,
  } = useMediaPermissions();

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Connect stream to video element when camera view is shown
  useEffect(() => {
    if (showCamera && streamRef.current && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      
      const handleLoadedMetadata = () => {
        console.log("Video metadata loaded, dimensions:", video.videoWidth, "x", video.videoHeight);
        video.play()
          .then(() => {
            console.log("Video playing successfully");
            setIsVideoReady(true);
          })
          .catch((err) => {
            console.error("Failed to play video:", err);
            setError("Failed to start video preview");
          });
      };

      video.addEventListener("loadedmetadata", handleLoadedMetadata);
      
      // Also try to play immediately in case metadata is already loaded
      if (video.readyState >= 1) {
        handleLoadedMetadata();
      }

      return () => {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      };
    }
  }, [showCamera]);

  // Start camera preview
  const startCamera = useCallback(async () => {
    setError(null);
    setState("capturing");
    setIsVideoReady(false);

    if (!isSupported) {
      setError("Camera access is not supported in this browser");
      setState("error");
      return;
    }

    try {
      // First, enumerate devices to find available cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === "videoinput");
      console.log("Available video devices:", videoDevices.map(d => ({ id: d.deviceId, label: d.label })));

      // Request camera permission and get stream
      // Try to get the front-facing camera first
      let stream: MediaStream;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 720 },
            height: { ideal: 720 },
            facingMode: { ideal: "user" }, // Use 'ideal' instead of exact for flexibility
          },
          audio: false,
        });
      } catch {
        // If front camera fails, try any camera
        console.log("Front camera not available, trying any camera");
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 720 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      }

      console.log("Got stream:", stream.getVideoTracks().map(t => ({ 
        label: t.label, 
        settings: t.getSettings() 
      })));

      streamRef.current = stream;
      
      // Show camera UI - the useEffect will connect the stream to video
      setShowCamera(true);
    } catch (err) {
      const error = err as Error;
      console.error("Camera error:", error);
      
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setError("Camera access was denied. Please allow camera access in your browser settings and try again.");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        setError("No camera found. Please connect a camera and try again.");
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        setError("Your camera is being used by another application. Please close other apps using the camera.");
      } else if (error.name === "OverconstrainedError") {
        setError("Camera constraints not supported. Trying with basic settings...");
        // Try with minimal constraints
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = basicStream;
          setShowCamera(true);
          setError(null);
          return;
        } catch {
          setError("Failed to access any camera.");
        }
      } else {
        setError(`Failed to access camera: ${error.message}`);
      }
      
      setState("error");
    }
  }, [isSupported]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
    setIsVideoReady(false);
    setState("idle");
  }, []);

  // Capture photo from video
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      console.error("Video or canvas ref not available");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Check if video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error("Video dimensions not ready:", video.videoWidth, video.videoHeight);
      setError("Video not ready. Please wait a moment and try again.");
      return;
    }
    
    console.log("Capturing photo, video dimensions:", video.videoWidth, "x", video.videoHeight);
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Could not get canvas context");
      return;
    }

    // Mirror the image (since front camera is mirrored)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          console.log("Photo captured, blob size:", blob.size);
          setCapturedBlob(blob);
          setCapturedImage(canvas.toDataURL("image/jpeg", 0.9));
          stopCamera();
          setState("preview");
        } else {
          console.error("Failed to create blob from canvas");
          setError("Failed to capture photo. Please try again.");
        }
      },
      "image/jpeg",
      0.9
    );
  }, [stopCamera]);

  // Retake photo
  const retake = useCallback(() => {
    setCapturedImage(null);
    setCapturedBlob(null);
    setState("idle");
  }, []);

  // Save captured photo
  const handleSave = useCallback(async () => {
    if (!capturedBlob) return;

    setState("saving");
    setError(null);

    try {
      await onSave(capturedBlob);
      setCapturedImage(null);
      setCapturedBlob(null);
      setState("idle");
    } catch (err) {
      setError((err as Error).message || "Failed to save verification selfie");
      setState("error");
    }
  }, [capturedBlob, onSave]);

  // Delete existing selfie
  const handleDelete = useCallback(async () => {
    if (!existingUrl) return;

    setIsDeleting(true);
    setError(null);

    try {
      await onDelete();
    } catch (err) {
      setError((err as Error).message || "Failed to delete verification selfie");
    } finally {
      setIsDeleting(false);
    }
  }, [existingUrl, onDelete]);

  // Cancel camera/capture
  const handleCancel = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    setCapturedBlob(null);
    setState("idle");
  }, [stopCamera]);

  // Render existing selfie
  if (existingUrl && state === "idle") {
    return (
      <div className="p-4">
        <div className="relative w-full max-w-xs mx-auto">
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-neutral-800">
            <img
              src={existingUrl}
              alt="Verification selfie"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Uploaded
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={startCamera}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-primary text-white rounded-lg font-medium hover:bg-brand-primary-dark transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retake
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-red-300 text-red-600 dark:border-red-700 dark:text-red-400 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>
    );
  }

  // Render camera view
  if (showCamera) {
    return (
      <div className="p-4">
        <div className="relative w-full max-w-xs mx-auto">
          <div className="aspect-square rounded-xl overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
            
            {/* Loading overlay while video initializes */}
            {!isVideoReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-2" />
                  <p className="text-white text-sm">Starting camera...</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Camera overlay with face guide */}
          {isVideoReady && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-4 border-2 border-white/50 rounded-full" />
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3">
          {isVideoReady ? "Position your face in the circle" : "Initializing camera..."}
        </p>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleCancel}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            onClick={capturePhoto}
            disabled={!isVideoReady}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-primary text-white rounded-lg font-medium hover:bg-brand-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera className="w-4 h-4" />
            Capture
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Hidden canvas for capturing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // Render preview of captured photo (also show during saving)
  if ((state === "preview" || state === "saving") && capturedImage) {
    return (
      <div className="p-4">
        <div className="relative w-full max-w-xs mx-auto">
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-neutral-800">
            <img
              src={capturedImage}
              alt="Captured selfie preview"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3">
          Review your selfie before saving
        </p>

        <div className="flex gap-2 mt-4">
          <button
            onClick={retake}
            disabled={state === "saving"}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            Retake
          </button>
          <button
            onClick={handleSave}
            disabled={state === "saving"}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {state === "saving" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Save
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Hidden canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // Render idle state (start capture button)
  return (
    <div className="p-4">
      <div className="w-full max-w-xs mx-auto">
        <div className="aspect-square rounded-xl bg-gray-100 dark:bg-neutral-800 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 dark:border-neutral-600">
          <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center">
            <Camera className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center px-4">
            Take a selfie to verify your identity
          </p>
        </div>

        <button
          onClick={startCamera}
          disabled={state === "capturing"}
          className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-primary text-white rounded-lg font-medium hover:bg-brand-primary-dark transition-colors disabled:opacity-50"
        >
          {state === "capturing" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Starting camera...
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              Take Selfie
            </>
          )}
        </button>

        {(error || permissionError) && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p>{error || permissionError}</p>
              {(error?.includes("denied") || permissionError?.includes("denied")) && (
                <p className="mt-1 text-xs opacity-80">
                  To enable camera access, go to your browser settings and allow camera permissions for this site.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
