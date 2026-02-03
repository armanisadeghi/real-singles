"use client";

/**
 * FullScreenImageViewer Component (Web)
 * 
 * A full-screen image viewer with:
 * - Full-width images on mobile
 * - Tap zones: left 30% = prev, center 40% = nothing, right 30% = next
 * - Swipe gesture navigation
 * - Keyboard navigation (arrows, escape)
 * - Photo counter
 * - Smooth sliding transitions
 */

import { useCallback, useEffect, useState, useRef } from "react";
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Touch/swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [bounceDirection, setBounceDirection] = useState<'left' | 'right' | null>(null);

  // Reset index when opening
  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      setSwipeOffset(0);
    }
  }, [visible, initialIndex]);

  // Navigate to next/previous
  const goNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, images.length]);

  const goPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < images.length) {
      setCurrentIndex(index);
    }
  }, [images.length]);

  // Trigger haptic feedback on mobile
  const triggerHaptic = useCallback((type: 'light' | 'error' = 'light') => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(type === 'error' ? [10, 30, 10] : 10);
      } catch {
        // Silently fail
      }
    }
  }, []);

  // Trigger bounce animation when at edge
  const triggerBounce = useCallback((direction: 'left' | 'right') => {
    setBounceDirection(direction);
    triggerHaptic('error');
    setTimeout(() => setBounceDirection(null), 300);
  }, [triggerHaptic]);

  // Minimum swipe distance threshold
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

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isTransitioning || touchStart === null) return;

    const distance = touchStart - (touchEnd ?? touchStart);
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    const didSwipe = Math.abs(distance) > 10;

    setIsTransitioning(true);

    if (isLeftSwipe && currentIndex < images.length - 1) {
      goNext();
      // Prevent synthetic click event from also firing
      e.preventDefault();
    } else if (isRightSwipe && currentIndex > 0) {
      goPrevious();
      // Prevent synthetic click event from also firing
      e.preventDefault();
    } else if (!didSwipe) {
      // It was a tap - use tap zones
      // Left 30% = previous, Center 40% = nothing (already fullscreen), Right 30% = next
      const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
      const tapX = e.changedTouches[0]?.clientX ?? touchStart;
      const tapPosition = tapX / containerWidth;

      if (tapPosition < 0.3) {
        if (currentIndex > 0) {
          goPrevious();
        } else {
          triggerBounce('left');
        }
      } else if (tapPosition > 0.7) {
        if (currentIndex < images.length - 1) {
          goNext();
        } else {
          triggerBounce('right');
        }
      }
      // Center 40% does nothing - already in fullscreen
      // Prevent synthetic click event from also firing (tap was handled here)
      e.preventDefault();
    }

    setSwipeOffset(0);

    setTimeout(() => {
      setTouchStart(null);
      setTouchEnd(null);
      setIsTransitioning(false);
    }, 350);
  }, [isTransitioning, touchStart, touchEnd, goNext, goPrevious, currentIndex, images.length, triggerBounce]);

  // Handle click with tap zones (for desktop)
  const handleClick = useCallback((e: React.MouseEvent) => {
    const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
    const clickPosition = e.clientX / containerWidth;

    if (clickPosition < 0.3) {
      if (currentIndex > 0) {
        goPrevious();
      } else {
        triggerBounce('left');
      }
    } else if (clickPosition > 0.7) {
      if (currentIndex < images.length - 1) {
        goNext();
      } else {
        triggerBounce('right');
      }
    }
    // Center 40% does nothing - already in fullscreen
  }, [currentIndex, images.length, goPrevious, goNext, triggerBounce]);

  // Calculate slide position: container is images.length * 100% wide,
  // so each image takes up (100 / images.length)% of the container.
  // translateX percentage is relative to the element's own width.
  const getSlideTransform = () => {
    const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
    // Each image is (100 / images.length)% of the container width
    // To show image N, we need to offset by N * (100 / images.length)%
    const imageWidthPercent = images.length > 0 ? 100 / images.length : 100;
    const baseOffset = -currentIndex * imageWidthPercent;
    
    // Swipe offset in percentage of container width
    const containerTotalWidth = containerWidth * images.length;
    const pixelOffset = containerTotalWidth > 0 ? (swipeOffset / containerTotalWidth) * 100 : 0;
    
    // Add bounce offset when at edge (scale down for multi-image containers)
    let bounceOffset = 0;
    if (bounceDirection === 'left') {
      bounceOffset = imageWidthPercent * 0.03; // 3% of one image width
    } else if (bounceDirection === 'right') {
      bounceOffset = -imageWidthPercent * 0.03;
    }
    
    return `translateX(${baseOffset + pixelOffset + bounceOffset}%)`;
  };
  
  const isBouncing = bounceDirection !== null;

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

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header - floating over images */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        {/* Close button - no background, just shadow for visibility */}
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center transition-opacity hover:opacity-80"
          aria-label="Close"
        >
          <X className="w-7 h-7 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
        </button>

        {/* Counter */}
        {images.length > 1 && (
          <div className="bg-black/40 px-3 py-1.5 rounded-full">
            <span className="text-white text-sm font-medium">
              {currentIndex + 1} / {images.length}
            </span>
          </div>
        )}

        {/* Spacer for alignment */}
        <div className="w-10 h-10" />
      </div>

      {/* Full-screen sliding image container */}
      <div
        ref={containerRef}
        className="absolute inset-0 touch-pan-y select-none overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Sliding strip of all images */}
        <div
          className="flex h-full"
          style={{
            width: `${images.length * 100}%`,
            transform: getSlideTransform(),
            // Use spring-like bounce for edge feedback, smooth ease for navigation
            transition: isBouncing 
              ? 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' 
              : isTransitioning 
                ? 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)' 
                : 'none',
          }}
        >
          {images.map((src, index) => (
            <div
              key={index}
              className="h-full flex-shrink-0 flex items-center justify-center"
              style={{ width: `${100 / images.length}%` }}
            >
              <img
                src={src}
                alt=""
                className="w-full h-full object-contain"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows - only show when relevant */}
      {images.length > 1 && (
        <>
          {/* Previous arrow - only show if we can go back */}
          {currentIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrevious();
              }}
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full",
                "bg-black/40 hover:bg-black/60 flex items-center justify-center",
                "transition-opacity duration-200",
                isHovered ? "opacity-100" : "opacity-0 md:opacity-0"
              )}
              aria-label="Previous image"
            >
              <ChevronLeft className="w-7 h-7 text-white" />
            </button>
          )}

          {/* Next arrow - only show if we can go forward */}
          {currentIndex < images.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full",
                "bg-black/40 hover:bg-black/60 flex items-center justify-center",
                "transition-opacity duration-200",
                isHovered ? "opacity-100" : "opacity-0 md:opacity-0"
              )}
              aria-label="Next image"
            >
              <ChevronRight className="w-7 h-7 text-white" />
            </button>
          )}
        </>
      )}

      {/* Dot indicators - at bottom */}
      {images.length > 1 && (
        <div className="absolute bottom-8 pb-[env(safe-area-inset-bottom)] left-0 right-0 z-20 flex justify-center gap-2">
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
