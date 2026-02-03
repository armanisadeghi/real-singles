"use client";

/**
 * PhotoCarousel Component (Web)
 * 
 * A photo carousel with:
 * - Smooth sliding swipe animation
 * - Click to view full-screen
 * - Arrow navigation (only when relevant)
 * - Dot indicators
 * - Hover effects
 */

import { useCallback, useState, useRef } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Touch/swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  // Minimum swipe distance threshold (in pixels)
  const minSwipeDistance = 50;

  // Touch handlers for swipe navigation
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (isTransitioning) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setSwipeOffset(0);
  }, [isTransitioning]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (isTransitioning || touchStart === null) return;
    const currentX = e.targetTouches[0].clientX;
    setTouchEnd(currentX);
    // Calculate swipe offset with resistance at edges
    const rawOffset = currentX - touchStart;
    const isAtStart = currentIndex === 0 && rawOffset > 0;
    const isAtEnd = currentIndex === images.length - 1 && rawOffset < 0;
    const resistance = isAtStart || isAtEnd ? 0.3 : 1;
    setSwipeOffset(rawOffset * resistance);
  }, [isTransitioning, touchStart, currentIndex, images.length]);

  const onTouchEnd = useCallback(() => {
    if (isTransitioning || touchStart === null) return;

    const distance = touchStart - (touchEnd ?? touchStart);
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    // Only trigger navigation if we actually swiped, not just tapped
    const didSwipe = Math.abs(distance) > 10;

    setIsTransitioning(true);

    if (isLeftSwipe && currentIndex < images.length - 1) {
      goNext();
    } else if (isRightSwipe && currentIndex > 0) {
      goPrevious();
    } else if (!didSwipe) {
      // If it was a tap (not a swipe), open full screen
      openFullScreen();
    }

    // Reset swipe offset with animation
    setSwipeOffset(0);

    // Reset touch state after transition
    setTimeout(() => {
      setTouchStart(null);
      setTouchEnd(null);
      setIsTransitioning(false);
    }, 350);
  }, [isTransitioning, touchStart, touchEnd, goNext, goPrevious, currentIndex, images.length, openFullScreen]);

  // Use CSS variable for height to allow className overrides
  const heightStyle = { "--carousel-height": height } as React.CSSProperties;

  // Calculate slide position: each image is 100% width, offset by swipe gesture
  const getSlideTransform = () => {
    const containerWidth = containerRef.current?.offsetWidth || 0;
    const baseOffset = -currentIndex * 100; // percentage
    const pixelOffset = containerWidth > 0 ? (swipeOffset / containerWidth) * 100 : 0;
    return `translateX(${baseOffset + pixelOffset}%)`;
  };

  // Check if we can navigate
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < images.length - 1;

  if (images.length === 0) {
    return (
      <div
        className={cn(
          "bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center h-[var(--carousel-height)]",
          className
        )}
        style={heightStyle}
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
        ref={containerRef}
        className={cn("relative overflow-hidden h-[var(--carousel-height)] touch-pan-y select-none", className)}
        style={heightStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Sliding image strip - all images in a row */}
        <div
          className="flex h-full cursor-pointer"
          style={{
            width: `${images.length * 100}%`,
            transform: getSlideTransform(),
            transition: isTransitioning ? 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
          }}
          aria-label="View full-screen"
        >
          {images.map((src, index) => (
            <div
              key={index}
              className="h-full flex-shrink-0"
              style={{ width: `${100 / images.length}%` }}
            >
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Gradient overlay */}
        {showGradient && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        )}

        {/* Navigation arrows - only show when relevant direction is available */}
        {images.length > 1 && (
          <>
            {/* Previous - only show if we can go back */}
            {canGoPrevious && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goPrevious();
                }}
                className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full",
                  "bg-white/80 hover:bg-white flex items-center justify-center",
                  "transition-opacity duration-200",
                  isHovered ? "opacity-100" : "opacity-0"
                )}
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6 text-gray-800" />
              </button>
            )}

            {/* Next - only show if we can go forward */}
            {canGoNext && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full",
                  "bg-white/80 hover:bg-white flex items-center justify-center",
                  "transition-opacity duration-200",
                  isHovered ? "opacity-100" : "opacity-0"
                )}
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6 text-gray-800" />
              </button>
            )}
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
