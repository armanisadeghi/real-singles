"use client";

import { useState, useRef, useCallback } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { X, RotateCw, Check } from "lucide-react";

interface PhotoCropperProps {
  imageUrl: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export function PhotoCropper({ imageUrl, onCropComplete, onCancel }: PhotoCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [processing, setProcessing] = useState(false);

  // Initialize crop when image loads
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    // Create a centered square crop
    const newCrop = centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 90,
        },
        1, // aspect ratio (square)
        width,
        height
      ),
      width,
      height
    );
    
    setCrop(newCrop);
    
    // Calculate the pixel crop for the initial state
    const pixelCrop: PixelCrop = {
      unit: "px",
      x: (newCrop.x / 100) * width,
      y: (newCrop.y / 100) * height,
      width: (newCrop.width / 100) * width,
      height: (newCrop.height / 100) * height,
    };
    setCompletedCrop(pixelCrop);
  }, []);

  const handleCropComplete = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return;

    setProcessing(true);
    try {
      const canvas = document.createElement("canvas");
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Failed to get canvas context");
      }

      ctx.drawImage(
        imgRef.current,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      );

      canvas.toBlob(
        (blob) => {
          if (blob) {
            onCropComplete(blob);
          }
          setProcessing(false);
        },
        "image/jpeg",
        0.9
      );
    } catch (error) {
      console.error("Error cropping image:", error);
      setProcessing(false);
    }
  }, [completedCrop, onCropComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header - fixed height */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-black/50 shrink-0">
        <h2 className="text-lg font-bold text-white">Crop Photo</h2>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Crop Area - fills available space, no scrolling */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <ReactCrop
          crop={crop}
          onChange={(c: Crop) => setCrop(c)}
          onComplete={(c: PixelCrop) => setCompletedCrop(c)}
          aspect={1}
          circularCrop={false}
          className="max-h-full"
        >
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Crop preview"
            onLoad={onImageLoad}
            style={{
              maxWidth: "100%",
              maxHeight: "calc(100dvh - 140px)", // Account for header and footer
              objectFit: "contain",
            }}
          />
        </ReactCrop>
      </div>

      {/* Actions - fixed at bottom */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-black/50 shrink-0">
        <p className="text-xs sm:text-sm text-white/70 hidden sm:block">
          Drag to adjust the crop area
        </p>
        <div className="flex gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-white/30 rounded-lg text-white font-medium hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCropComplete}
            disabled={processing || !completedCrop}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {processing ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
