"use client";

/**
 * VerificationSelfieStep
 *
 * Step 6: Capture verification selfie
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { Camera, RefreshCw, Check, X, ShieldCheck } from "lucide-react";
import { OnboardingStepWrapper } from "../OnboardingStepWrapper";
import { cn } from "@/lib/utils";

interface VerificationSelfieStepProps {
  hasVerificationSelfie: boolean;
  onSelfieChange: () => void;
}

type CaptureState = "idle" | "capturing" | "preview" | "saving" | "done" | "permission-denied";

export function VerificationSelfieStep({
  hasVerificationSelfie,
  onSelfieChange,
}: VerificationSelfieStepProps) {
  const [state, setState] = useState<CaptureState>(
    hasVerificationSelfie ? "done" : "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingSelfieUrl, setExistingSelfieUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch existing selfie
  useEffect(() => {
    if (hasVerificationSelfie) {
      setImageLoaded(false); // Reset loading state
      fetch("/api/users/me/verification-selfie")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.verificationSelfieUrl) {
            setExistingSelfieUrl(data.data.verificationSelfieUrl);
          }
        })
        .catch(() => {});
    }
  }, [hasVerificationSelfie]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setState("capturing");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 720, height: 720 },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setState("permission-denied");
      
      // Determine if permanently denied or just denied
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("Camera access was denied. Please click below to allow camera access.");
        } else if (err.name === "NotFoundError") {
          setError("No camera found on this device.");
        } else {
          setError("Could not access camera. Please check your browser settings.");
        }
      }
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Set canvas size
    canvas.width = 720;
    canvas.height = 720;

    // Mirror the image (selfie style)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get data URL
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setPreviewUrl(dataUrl);

    // Stop camera
    stopCamera();
    setState("preview");
  }, [stopCamera]);

  // Retake photo
  const retake = useCallback(() => {
    setPreviewUrl(null);
    startCamera();
  }, [startCamera]);

  // Save selfie
  const saveSelfie = useCallback(async () => {
    if (!previewUrl) return;

    try {
      setState("saving");
      setError(null);

      // Convert data URL to blob
      const response = await fetch(previewUrl);
      const blob = await response.blob();

      // Create form data
      const formData = new FormData();
      formData.append("file", blob, "verification-selfie.jpg");

      // Upload
      const res = await fetch("/api/users/me/verification-selfie", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.msg || "Failed to save selfie");
      }

      setState("done");
      setExistingSelfieUrl(previewUrl);
      setImageLoaded(true); // Data URL loads instantly
      onSelfieChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save selfie");
      setState("preview");
    }
  }, [previewUrl, onSelfieChange]);

  // Cancel capture
  const cancel = useCallback(() => {
    stopCamera();
    setPreviewUrl(null);
    setState(hasVerificationSelfie ? "done" : "idle");
  }, [stopCamera, hasVerificationSelfie]);

  // Delete existing selfie
  const deleteSelfie = useCallback(async () => {
    try {
      const res = await fetch("/api/users/me/verification-selfie", {
        method: "DELETE",
      });

      if (res.ok) {
        setExistingSelfieUrl(null);
        setState("idle");
        onSelfieChange();
      }
    } catch {
      setError("Failed to delete selfie");
    }
  }, [onSelfieChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <OnboardingStepWrapper
      title="Verify it's you"
      subtitle="Take a quick selfie to get verified"
    >
      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* State: Idle - Show start button */}
      {state === "idle" && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-48 h-48 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
            <ShieldCheck className="w-16 h-16 text-gray-300 dark:text-neutral-600" />
          </div>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
            A verification selfie helps others know you're real
          </p>
          <button
            onClick={startCamera}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-full",
              "bg-pink-500 hover:bg-pink-600 text-white",
              "font-medium transition-colors"
            )}
          >
            <Camera className="w-5 h-5" />
            Take Selfie
          </button>
        </div>
      )}

      {/* State: Permission Denied - Show clear prompt to allow access */}
      {state === "permission-denied" && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-48 h-48 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <Camera className="w-16 h-16 text-red-400 dark:text-red-500" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-gray-900 dark:text-gray-100 font-medium">
              Camera Access Required
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {error || "We need access to your camera to take a verification selfie."}
            </p>
          </div>
          <button
            onClick={startCamera}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-full",
              "bg-pink-500 hover:bg-pink-600 text-white",
              "font-medium transition-colors shadow-lg"
            )}
          >
            <Camera className="w-5 h-5" />
            Allow Camera Access
          </button>
          <button
            onClick={() => setState(hasVerificationSelfie ? "done" : "idle")}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
          >
            Go back
          </button>
        </div>
      )}

      {/* State: Capturing - Show camera */}
      {state === "capturing" && (
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-64 h-64 rounded-full overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            {/* Face guide overlay */}
            <div className="absolute inset-0 border-4 border-white/30 rounded-full" />
          </div>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
            Position your face in the circle
          </p>
          <div className="flex gap-3">
            <button
              onClick={cancel}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full",
                "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400",
                "hover:bg-gray-200 dark:hover:bg-neutral-700",
                "transition-colors"
              )}
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={capturePhoto}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-full",
                "bg-pink-500 hover:bg-pink-600 text-white",
                "font-medium transition-colors"
              )}
            >
              <Camera className="w-4 h-4" />
              Capture
            </button>
          </div>
        </div>
      )}

      {/* State: Preview - Show captured photo */}
      {state === "preview" && previewUrl && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-64 h-64 rounded-full overflow-hidden bg-black">
            <img
              src={previewUrl}
              alt="Selfie preview"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
            Happy with this photo?
          </p>
          <div className="flex gap-3">
            <button
              onClick={retake}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full",
                "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400",
                "hover:bg-gray-200 dark:hover:bg-neutral-700",
                "transition-colors"
              )}
            >
              <RefreshCw className="w-4 h-4" />
              Retake
            </button>
            <button
              onClick={saveSelfie}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-full",
                "bg-pink-500 hover:bg-pink-600 text-white",
                "font-medium transition-colors"
              )}
            >
              <Check className="w-4 h-4" />
              Use This
            </button>
          </div>
        </div>
      )}

      {/* State: Saving */}
      {state === "saving" && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-64 h-64 rounded-full overflow-hidden bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
            Saving your selfie...
          </p>
        </div>
      )}

      {/* State: Done - Show existing selfie */}
      {state === "done" && (
        <div className="flex flex-col items-center gap-4">
          {/* Wrapper for image + badge (badge positioned outside overflow) */}
          <div className="relative">
            {/* Circular image container with overflow hidden */}
            <div className="w-64 h-64 rounded-full overflow-hidden bg-gray-100 dark:bg-neutral-800">
              {existingSelfieUrl ? (
                <img
                  src={existingSelfieUrl}
                  alt="Verification selfie"
                  className={cn(
                    "w-full h-full object-cover transition-opacity duration-300",
                    imageLoaded ? "opacity-100" : "opacity-0"
                  )}
                  onLoad={() => setImageLoaded(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShieldCheck className="w-16 h-16 text-green-500" />
                </div>
              )}
              {/* Loading placeholder while image loads */}
              {existingSelfieUrl && !imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {/* Verified badge - positioned outside overflow container, only shown when loaded */}
            {(imageLoaded || !existingSelfieUrl) && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500 text-white text-xs font-medium shadow-lg">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified
              </div>
            )}
          </div>
          <p className="text-center text-green-600 dark:text-green-400 text-sm font-medium">
            Your selfie has been saved!
          </p>
          <div className="flex gap-3">
            <button
              onClick={deleteSelfie}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full",
                "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400",
                "hover:bg-gray-200 dark:hover:bg-neutral-700",
                "transition-colors text-sm"
              )}
            >
              Remove
            </button>
            <button
              onClick={startCamera}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full",
                "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400",
                "hover:bg-gray-200 dark:hover:bg-neutral-700",
                "transition-colors text-sm"
              )}
            >
              <RefreshCw className="w-4 h-4" />
              Retake
            </button>
          </div>
        </div>
      )}

      {/* Error message (for non-permission errors) */}
      {error && state !== "permission-denied" && (
        <p className="text-sm text-red-500 dark:text-red-400 text-center">
          {error}
        </p>
      )}
    </OnboardingStepWrapper>
  );
}
