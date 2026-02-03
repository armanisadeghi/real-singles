"use client";

/**
 * FullScreenImageViewer Component (Web)
 * 
 * A full-screen image viewer with:
 * - Keyboard navigation (arrows, escape)
 * - Click outside to close
 * - Photo counter
 * - Smooth transitions
 */

import { useCallback, useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FullScreenImageViewerProps {
  images: string[];
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
}

export function FullScreenImageViewer({
  images,
  initialIndex = 0,
  visible,
  onClose,
}: FullScreenImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);

  // Reset index when opening
  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      setIsLoading(true);
    }
  }, [visible, initialIndex]);

  // Navigate to next/previous
  const goNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsLoading(true);
    }
  }, [currentIndex, images.length]);

  const goPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsLoading(true);
    }
  }, [currentIndex]);

  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < images.length) {
      setCurrentIndex(index);
      setIsLoading(true);
    }
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          goPrevious();
          break;
        case "ArrowRight":
          goNext();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, onClose, goNext, goPrevious]);

  // Prevent body scroll when open
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  if (!visible || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/95 transition-opacity"
        onClick={onClose}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Counter */}
        {images.length > 1 && (
          <div className="bg-black/50 px-4 py-2 rounded-full">
            <span className="text-white text-sm font-medium">
              {currentIndex + 1} / {images.length}
            </span>
          </div>
        )}

        {/* Spacer for alignment */}
        <div className="w-10 h-10" />
      </div>

      {/* Main image */}
      <div className="relative w-full h-full flex items-center justify-center p-16">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
        <img
          src={currentImage}
          alt=""
          className={cn(
            "max-w-full max-h-full object-contain transition-opacity duration-200",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          onLoad={() => setIsLoading(false)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Navigation buttons */}
      {images.length > 1 && (
        <>
          {/* Previous */}
          <button
            onClick={goPrevious}
            disabled={currentIndex === 0}
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full",
              "bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all",
              currentIndex === 0 && "opacity-30 cursor-not-allowed"
            )}
            aria-label="Previous image"
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </button>

          {/* Next */}
          <button
            onClick={goNext}
            disabled={currentIndex === images.length - 1}
            className={cn(
              "absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full",
              "bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all",
              currentIndex === images.length - 1 && "opacity-30 cursor-not-allowed"
            )}
            aria-label="Next image"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={cn(
                "transition-all rounded-full",
                index === currentIndex
                  ? "w-6 h-2 bg-white"
                  : "w-2 h-2 bg-white/40 hover:bg-white/60"
              )}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default FullScreenImageViewer;
