"use client";

/**
 * OnboardingProgress
 *
 * Displays progress bar and percentage at the top of the onboarding wizard.
 * 
 * Two modes:
 * - Steps 1-6 (required): Minimal header - just progress dots, no percentage/close
 * - Steps 7+: Full header with close button, percentage, step count
 */

import { X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TOTAL_STEPS } from "@/lib/onboarding/steps-config";
import {
  formatCompletionPercentage,
  getCompletionGradient,
} from "@/lib/onboarding/completion";

// Number of required steps before showing full UI
const REQUIRED_STEPS = 6;

interface OnboardingProgressProps {
  currentStep: number;
  completionPercentage: number;
  onClose?: () => void;
  className?: string;
}

export function OnboardingProgress({
  currentStep,
  completionPercentage,
  onClose,
  className,
}: OnboardingProgressProps) {
  // Determine if we're in the initial required steps
  const isInitialPhase = currentStep <= REQUIRED_STEPS;
  
  // For initial phase, show progress through required steps only
  const initialProgress = Math.round((currentStep / REQUIRED_STEPS) * 100);
  
  // For full phase, show progress through all steps
  const fullProgress = Math.round((currentStep / TOTAL_STEPS) * 100);

  // Minimal header for initial required steps (new users)
  if (isInitialPhase) {
    return (
      <header
        className={cn(
          "flex-none pt-safe px-5 pb-4",
          "sm:rounded-t-2xl",
          className
        )}
      >
        <div className="max-w-md mx-auto">
          {/* Simple progress dots for initial phase */}
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: REQUIRED_STEPS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i < currentStep
                    ? "w-8 bg-gradient-to-r from-pink-500 to-purple-500"
                    : i === currentStep - 1
                    ? "w-8 bg-gradient-to-r from-pink-500 to-purple-500"
                    : "w-1.5 bg-gray-300 dark:bg-neutral-600"
                )}
              />
            ))}
          </div>
        </div>
      </header>
    );
  }

  // Full header for optional steps (returning users or after required steps)
  return (
    <header
      className={cn(
        "flex-none pt-safe px-5 pb-3 sm:pb-4",
        "bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl",
        "border-b border-white/20 dark:border-white/10",
        "sm:rounded-t-2xl",
        className
      )}
    >
      <div className="max-w-md mx-auto">
        {/* Top row: close button and percentage */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          {/* Close/Exit button */}
          {onClose ? (
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 -ml-1.5 sm:-ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Exit onboarding"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
            </button>
          ) : (
            <Link
              href="/profile"
              className="p-1.5 sm:p-2 -ml-1.5 sm:-ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Exit onboarding"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
            </Link>
          )}

          {/* Completion percentage */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Profile
            </span>
            <span
              className={cn(
                "text-xs sm:text-sm font-semibold",
                completionPercentage < 50
                  ? "text-orange-500 dark:text-orange-400"
                  : completionPercentage < 100
                  ? "text-green-500 dark:text-green-400"
                  : "text-pink-500 dark:text-pink-400"
              )}
            >
              {formatCompletionPercentage(completionPercentage)}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-1 sm:h-1.5 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          {/* Animated progress fill */}
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out",
              getCompletionGradient(fullProgress)
            )}
            style={{ width: `${fullProgress}%` }}
          />
        </div>

        {/* Step indicator text */}
        <div className="mt-1.5 sm:mt-2 flex items-center justify-between text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
          <span>
            Step {currentStep} of {TOTAL_STEPS}
          </span>
          <span className="text-gray-400 dark:text-gray-500">
            Optional
          </span>
        </div>
      </div>
    </header>
  );
}
