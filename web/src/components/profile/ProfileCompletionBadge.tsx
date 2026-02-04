"use client";

/**
 * ProfileCompletionBadge
 *
 * Displays the profile completion percentage with a link to continue onboarding.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatCompletionPercentage,
  getCompletionGradient,
} from "@/lib/onboarding/completion";

interface ProfileCompletionBadgeProps {
  className?: string;
  variant?: "compact" | "expanded";
}

interface CompletionData {
  percentage: number;
  completedCount: number;
  totalCount: number;
  canStartMatching: boolean;
  isComplete: boolean;
  skippedFields: string[];
}

export function ProfileCompletionBadge({
  className,
  variant = "compact",
}: ProfileCompletionBadgeProps) {
  const [completion, setCompletion] = useState<CompletionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile/completion")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setCompletion({
            percentage: data.data.percentage,
            completedCount: data.data.completedCount,
            totalCount: data.data.totalCount,
            canStartMatching: data.data.canStartMatching,
            isComplete: data.data.isComplete,
            skippedFields: data.data.skippedFields || [],
          });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // Show skeleton while loading to prevent layout shift
  if (isLoading) {
    if (variant === "compact") {
      return (
        <div
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
            "bg-gray-100 dark:bg-neutral-800",
            "animate-pulse min-w-[140px]",
            className
          )}
        >
          <div className="w-3.5 h-3.5 bg-gray-200 dark:bg-neutral-700 rounded" />
          <div className="h-4 w-20 bg-gray-200 dark:bg-neutral-700 rounded" />
        </div>
      );
    }
    // Expanded variant skeleton
    return (
      <div
        className={cn(
          "block p-4 rounded-2xl",
          "bg-gray-100 dark:bg-neutral-800",
          "animate-pulse",
          className
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 dark:bg-neutral-700 rounded" />
            <div className="h-4 w-28 bg-gray-200 dark:bg-neutral-700 rounded" />
          </div>
          <div className="h-6 w-12 bg-gray-200 dark:bg-neutral-700 rounded" />
        </div>
        <div className="h-2 bg-gray-200 dark:bg-neutral-700 rounded-full mb-3" />
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 bg-gray-200 dark:bg-neutral-700 rounded" />
          <div className="h-4 w-20 bg-gray-200 dark:bg-neutral-700 rounded" />
        </div>
      </div>
    );
  }

  if (!completion) {
    return null;
  }

  const { percentage, isComplete, skippedFields } = completion;

  // Don't show if 100% complete
  if (isComplete) {
    return null;
  }

  if (variant === "compact") {
    return (
      <Link
        href={`/onboarding?resume=true`}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
          "bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/30 dark:to-purple-900/30",
          "border border-pink-200 dark:border-pink-800/50",
          "text-sm font-medium text-pink-700 dark:text-pink-300",
          "hover:from-pink-100 hover:to-purple-100 dark:hover:from-pink-900/40 dark:hover:to-purple-900/40",
          "transition-all duration-200",
          "group",
          className
        )}
      >
        <TrendingUp className="w-3.5 h-3.5" />
        <span>{formatCompletionPercentage(percentage)} complete</span>
        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    );
  }

  // Expanded variant
  return (
    <Link
      href={`/onboarding?resume=true`}
      className={cn(
        "block p-4 rounded-2xl",
        "bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20",
        "border border-pink-100 dark:border-pink-800/30",
        "hover:from-pink-100 hover:to-purple-100 dark:hover:from-pink-900/30 dark:hover:to-purple-900/30",
        "transition-all duration-200",
        "group",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-pink-500 dark:text-pink-400" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Profile Completion
          </span>
        </div>
        <span
          className={cn(
            "text-lg font-bold",
            percentage < 50
              ? "text-orange-500 dark:text-orange-400"
              : "text-pink-500 dark:text-pink-400"
          )}
        >
          {formatCompletionPercentage(percentage)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-white dark:bg-neutral-700 rounded-full overflow-hidden mb-3">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out",
            getCompletionGradient(percentage)
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* CTA */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          {skippedFields.length > 0
            ? `${skippedFields.length} skipped fields`
            : "Complete your profile"}
        </span>
        <span className="text-pink-600 dark:text-pink-400 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
          Continue
          <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}
