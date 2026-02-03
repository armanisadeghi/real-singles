"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  /** Current rating value (1-5) */
  value: number;
  /** Callback when rating changes (only for interactive mode) */
  onChange?: (value: number) => void;
  /** Size of stars */
  size?: "sm" | "md" | "lg";
  /** Read-only mode */
  readonly?: boolean;
  /** Show the rating number */
  showValue?: boolean;
  /** Number of reviews (shown when showValue is true) */
  reviewCount?: number;
  /** Custom class name */
  className?: string;
}

const sizes = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

export function StarRating({
  value,
  onChange,
  size = "md",
  readonly = false,
  showValue = false,
  reviewCount,
  className,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);
  const displayValue = hoverValue || value;
  const isInteractive = !readonly && onChange;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div
        className={cn("flex", isInteractive && "cursor-pointer")}
        onMouseLeave={() => isInteractive && setHoverValue(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => isInteractive && onChange(star)}
            onMouseEnter={() => isInteractive && setHoverValue(star)}
            className={cn(
              "transition-transform",
              isInteractive && "hover:scale-110 active:scale-95",
              !isInteractive && "cursor-default"
            )}
          >
            <Star
              className={cn(
                sizes[size],
                "transition-colors",
                star <= displayValue
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-gray-200 text-gray-200 dark:fill-neutral-700 dark:text-neutral-700"
              )}
            />
          </button>
        ))}
      </div>
      {showValue && (
        <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
          {value.toFixed(1)}
          {typeof reviewCount === "number" && (
            <span className="text-gray-400 dark:text-gray-500"> ({reviewCount})</span>
          )}
        </span>
      )}
    </div>
  );
}

interface RatingSummaryProps {
  averageRating: number;
  totalReviews: number;
  distribution?: Record<1 | 2 | 3 | 4 | 5, number>;
  className?: string;
}

export function RatingSummary({
  averageRating,
  totalReviews,
  distribution,
  className,
}: RatingSummaryProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row gap-6", className)}>
      {/* Average */}
      <div className="flex flex-col items-center">
        <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          {averageRating.toFixed(1)}
        </span>
        <StarRating value={averageRating} readonly size="md" />
        <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {totalReviews} review{totalReviews !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Distribution */}
      {distribution && (
        <div className="flex-1 space-y-1">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = distribution[star] || 0;
            const percentage =
              totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-3 text-gray-600 dark:text-gray-400">{star}</span>
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <div className="flex-1 h-2 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right text-gray-500 dark:text-gray-400">{count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
