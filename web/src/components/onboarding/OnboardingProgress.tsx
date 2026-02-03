"use client";

/**
 * OnboardingProgress
 *
 * Displays progress bar and percentage at the top of the onboarding wizard.
 * Uses glass styling and animates smoothly.
 */

import { X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TOTAL_STEPS } from "@/lib/onboarding/steps-config";
import {
  formatCompletionPercentage,
  getCompletionGradient,
} from "@/lib/onboarding/completion";

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
  // Calculate progress as step-based (not completion-based)
  const stepProgress = Math.round((currentStep / TOTAL_STEPS) * 100);

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
              getCompletionGradient(stepProgress)
            )}
            style={{ width: `${stepProgress}%` }}
          />
        </div>

        {/* Step indicator text */}
        <div className="mt-1.5 sm:mt-2 flex items-center justify-between text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
          <span>
            Step {currentStep} of {TOTAL_STEPS}
          </span>
          <span className="text-gray-400 dark:text-gray-500">
            {currentStep <= 6 ? "Required" : "Optional"}
          </span>
        </div>
      </div>
    </header>
  );
}
