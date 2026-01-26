"use client";

/**
 * PhotoCarousel Component (Web)
 * 
 * A photo carousel with:
 * - Click to view full-screen
 * - Arrow navigation
 * - Dot indicators
 * - Hover effects
 */

import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { FullScreenImageViewer } from "./FullScreenImageViewer";

interface PhotoCarouselProps {
  /** Array of image URLs */
  images: string[];
  /** Height of the carousel */
  height?: string;
  /** Show gradient overlay at bottom */
  showGradient?: boolean;
  /** Optional callback when photo index changes */
  onIndexChange?: (index: number) => void;
  /** Custom class name */
  className?: string;
}

export function PhotoCarousel({
  images,
  height = "60vh",
  showGradient = true,
  onIndexChange,
  className,
}: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const goNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      onIndexChange?.(newIndex);
    }
  }, [currentIndex, images.length, onIndexChange]);

  const goPrevious = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onIndexChange?.(newIndex);
    }
  }, [currentIndex, onIndexChange]);

  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < images.length) {
      setCurrentIndex(index);
      onIndexChange?.(index);
    }
  }, [images.length, onIndexChange]);

  const openFullScreen = useCallback(() => {
    setIsViewerOpen(true);
  }, []);

  if (images.length === 0) {
    return (
      <div
        className={cn(
          "bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center",
          className
        )}
        style={{ height }}
      >
        <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center">
          <span className="text-4xl text-gray-400">👤</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn("relative overflow-hidden", className)}
        style={{ height }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Main image */}
        <button
          onClick={openFullScreen}
          className="w-full h-full cursor-pointer"
          aria-label="View full-screen"
        >
          <img
            src={images[currentIndex]}
            alt=""
            className="w-full h-full object-cover transition-transform duration-300"
          />
        </button>

        {/* Gradient overlay */}
        {showGradient && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        )}

        {/* Navigation arrows - show on hover */}
        {images.length > 1 && (
          <>
            {/* Previous */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrevious();
              }}
              disabled={currentIndex === 0}
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full",
                "bg-white/80 hover:bg-white flex items-center justify-center transition-all",
                "opacity-0 group-hover:opacity-100",
                isHovered ? "opacity-100" : "opacity-0",
                currentIndex === 0 && "opacity-30 cursor-not-allowed"
              )}
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6 text-gray-800" />
            </button>

            {/* Next */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              disabled={currentIndex === images.length - 1}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full",
                "bg-white/80 hover:bg-white flex items-center justify-center transition-all",
                isHovered ? "opacity-100" : "opacity-0",
                currentIndex === images.length - 1 && "opacity-30 cursor-not-allowed"
              )}
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6 text-gray-800" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  goToIndex(index);
                }}
                className={cn(
                  "transition-all rounded-full",
                  index === currentIndex
                    ? "w-6 h-2 bg-white"
                    : "w-2 h-2 bg-white/50 hover:bg-white/70"
                )}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Full screen viewer */}
      <FullScreenImageViewer
        images={images}
        initialIndex={currentIndex}
        visible={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
      />
    </>
  );
}

export default PhotoCarousel;
