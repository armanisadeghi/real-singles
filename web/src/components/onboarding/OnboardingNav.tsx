"use client";

/**
 * OnboardingNav
 *
 * Bottom navigation for the onboarding wizard with Back, Skip, and Continue buttons.
 * Uses glass styling and handles safe areas.
 */

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingNavProps {
  onBack?: () => void;
  onSkip?: () => void;
  onPreferNot?: () => void;
  onContinue: () => void;
  canGoBack: boolean;
  canSkip: boolean;
  canPreferNot: boolean;
  canContinue: boolean;
  isSaving: boolean;
  isRequired: boolean;
  continueLabel?: string;
  className?: string;
}

export function OnboardingNav({
  onBack,
  onSkip,
  onPreferNot,
  onContinue,
  canGoBack,
  canSkip,
  canPreferNot,
  canContinue,
  isSaving,
  isRequired,
  continueLabel = "Continue",
  className,
}: OnboardingNavProps) {
  return (
    <footer
      className={cn(
        "flex-none px-4 pt-3 pb-safe sm:pb-4",
        "bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl",
        "border-t border-white/20 dark:border-white/10",
        "sm:rounded-b-2xl",
        className
      )}
    >
      <div className="max-w-md mx-auto">
        {/* Skip / Prefer Not Row */}
        {(canSkip || canPreferNot) && (
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-2 sm:mb-3">
            {canSkip && onSkip && (
              <button
                onClick={onSkip}
                disabled={isSaving}
                className={cn(
                  "text-xs sm:text-sm text-gray-500 dark:text-gray-400",
                  "hover:text-gray-700 dark:hover:text-gray-300",
                  "transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                Skip for now
              </button>
            )}
            {canSkip && canPreferNot && (
              <span className="text-gray-300 dark:text-gray-600">|</span>
            )}
            {canPreferNot && onPreferNot && (
              <button
                onClick={onPreferNot}
                disabled={isSaving}
                className={cn(
                  "text-xs sm:text-sm text-gray-500 dark:text-gray-400",
                  "hover:text-gray-700 dark:hover:text-gray-300",
                  "transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                Prefer not to say
              </button>
            )}
          </div>
        )}

        {/* Main navigation buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Back button */}
          <button
            onClick={onBack}
            disabled={!canGoBack || isSaving}
            className={cn(
              "flex items-center justify-center",
              "w-10 h-10 sm:w-12 sm:h-12 rounded-full",
              "bg-gray-100 dark:bg-neutral-800",
              "text-gray-600 dark:text-gray-400",
              "transition-all duration-200",
              "hover:bg-gray-200 dark:hover:bg-neutral-700",
              "active:scale-95",
              "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-100 dark:disabled:hover:bg-neutral-800"
            )}
            aria-label="Go back"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Continue button - fills remaining space */}
          <button
            onClick={onContinue}
            disabled={!canContinue || isSaving}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 sm:gap-2",
              "h-10 sm:h-12 px-4 sm:px-6 rounded-full",
              "text-sm sm:text-base font-medium",
              "transition-all duration-200",
              "active:scale-[0.98]",
              // Primary style
              isRequired
                ? cn(
                    "bg-gradient-to-r from-pink-500 to-purple-500",
                    "hover:from-pink-600 hover:to-purple-600",
                    "text-white",
                    "shadow-lg shadow-pink-500/25 dark:shadow-pink-500/15"
                  )
                : cn(
                    "bg-gray-900 dark:bg-white",
                    "hover:bg-gray-800 dark:hover:bg-gray-100",
                    "text-white dark:text-gray-900"
                  ),
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "disabled:shadow-none"
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>{continueLabel}</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
}
