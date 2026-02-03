"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface DualRangeSliderProps {
  min: number;
  max: number;
  minValue: number;
  maxValue: number;
  step?: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  formatLabel?: (value: number) => string;
  className?: string;
}

export function DualRangeSlider({
  min,
  max,
  minValue,
  maxValue,
  step = 1,
  onMinChange,
  onMaxChange,
  formatLabel,
  className,
}: DualRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<"min" | "max" | null>(null);

  // Calculate percentages for positioning
  const minPercent = ((minValue - min) / (max - min)) * 100;
  const maxPercent = ((maxValue - min) / (max - min)) * 100;

  // Convert pixel position to value
  const positionToValue = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return min;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const rawValue = min + (percent / 100) * (max - min);
      return Math.round(rawValue / step) * step;
    },
    [min, max, step]
  );

  // Handle mouse/touch move
  const handleMove = useCallback(
    (clientX: number) => {
      const value = positionToValue(clientX);
      
      if (isDragging === "min") {
        // Don't let min exceed max - 1 step
        const newMin = Math.min(value, maxValue - step);
        onMinChange(Math.max(min, newMin));
      } else if (isDragging === "max") {
        // Don't let max go below min + 1 step
        const newMax = Math.max(value, minValue + step);
        onMaxChange(Math.min(max, newMax));
      }
    },
    [isDragging, maxValue, minValue, onMinChange, onMaxChange, positionToValue, min, max, step]
  );

  // Mouse events
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleMove(e.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMove]);

  // Touch events
  useEffect(() => {
    if (!isDragging) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(null);
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, handleMove]);

  // Click on track to move nearest thumb
  const handleTrackClick = (e: React.MouseEvent) => {
    const value = positionToValue(e.clientX);
    const distToMin = Math.abs(value - minValue);
    const distToMax = Math.abs(value - maxValue);

    if (distToMin <= distToMax) {
      onMinChange(Math.max(min, Math.min(value, maxValue - step)));
    } else {
      onMaxChange(Math.min(max, Math.max(value, minValue + step)));
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Labels above the slider */}
      {formatLabel && (
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 tabular-nums">
            {formatLabel(minValue)}
          </span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 tabular-nums">
            {formatLabel(maxValue)}
          </span>
        </div>
      )}

      {/* Slider track */}
      <div
        ref={trackRef}
        className="relative h-1.5 cursor-pointer py-2 -my-2"
        onClick={handleTrackClick}
      >
        {/* Background track */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-gray-200 dark:bg-neutral-700" />

        {/* Active range */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-pink-500"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />

        {/* Min thumb */}
        <button
          type="button"
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white dark:bg-neutral-900 border-[1.5px] border-pink-500 shadow-sm dark:shadow-black/20 focus:outline-none focus-visible:ring-1 focus-visible:ring-pink-500 focus-visible:ring-offset-1 touch-none cursor-grab active:cursor-grabbing"
          style={{ left: `${minPercent}%` }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsDragging("min");
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            setIsDragging("min");
          }}
          aria-label="Minimum value"
          aria-valuenow={minValue}
          aria-valuemin={min}
          aria-valuemax={maxValue - step}
        />

        {/* Max thumb */}
        <button
          type="button"
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white dark:bg-neutral-900 border-[1.5px] border-pink-500 shadow-sm dark:shadow-black/20 focus:outline-none focus-visible:ring-1 focus-visible:ring-pink-500 focus-visible:ring-offset-1 touch-none cursor-grab active:cursor-grabbing"
          style={{ left: `${maxPercent}%` }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsDragging("max");
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            setIsDragging("max");
          }}
          aria-label="Maximum value"
          aria-valuenow={maxValue}
          aria-valuemin={minValue + step}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}
