"use client";

/**
 * CompleteStep
 *
 * Step 37: Completion summary with ripple animation
 * Shows a radar/ripple animation to convey "we're finding your matches"
 */

import { useRouter } from "next/navigation";
import { ArrowRight, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatCompletionPercentage,
  type CompletionStatus,
} from "@/lib/onboarding/completion";

interface CompleteStepProps {
  completion: CompletionStatus | null;
  firstName: string;
  profileImageUrl?: string;
}

export function CompleteStep({ completion, firstName, profileImageUrl }: CompleteStepProps) {
  const router = useRouter();
  const percentage = completion?.percentage ?? 0;
  const canMatch = completion?.canStartMatching ?? false;

  const handleStartMatching = () => {
    router.push("/discover");
  };

  const handleCompleteProfile = () => {
    router.push("/onboarding?resume=true");
  };

  const handleEditProfile = () => {
    router.push("/profile/edit");
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md mx-auto text-center">
        {/* Animated radar/signal circles */}
        <div className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto flex items-center justify-center mb-6">
          {/* Ripple ring 1 — outermost */}
          <div
            className="absolute inset-0 rounded-full border-2 sm:border-[3px] border-pink-300 dark:border-pink-500/50"
            style={{ animation: "onboarding-ripple 2.5s ease-out infinite" }}
          />
          {/* Ripple ring 2 */}
          <div
            className="absolute inset-0 rounded-full border-2 sm:border-[3px] border-pink-300 dark:border-pink-500/50"
            style={{ animation: "onboarding-ripple 2.5s ease-out infinite 0.8s" }}
          />
          {/* Ripple ring 3 */}
          <div
            className="absolute inset-0 rounded-full border-2 sm:border-[3px] border-pink-300 dark:border-pink-500/50"
            style={{ animation: "onboarding-ripple 2.5s ease-out infinite 1.6s" }}
          />

          {/* Static background circles */}
          <div className="absolute inset-3 sm:inset-4 rounded-full bg-pink-100/80 dark:bg-pink-900/30" />
          <div className="absolute inset-8 sm:inset-10 rounded-full bg-pink-50 dark:bg-pink-950/40" />
          <div className="absolute inset-12 sm:inset-14 rounded-full bg-white dark:bg-neutral-900" />

          {/* Profile photo or heart icon */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-[3px] sm:border-4 border-white dark:border-neutral-800 shadow-xl dark:shadow-black/30 z-10">
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt="Your profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="white" />
              </div>
            )}
          </div>
        </div>

        {/* Keyframes for ripple animation */}
        <style jsx>{`
          @keyframes onboarding-ripple {
            0% {
              transform: scale(0.35);
              opacity: 1;
            }
            100% {
              transform: scale(1);
              opacity: 0;
            }
          }
        `}</style>

        {/* Heading */}
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {canMatch
            ? `Welcome${firstName ? `, ${firstName}` : ""}!`
            : "Almost there!"}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {canMatch
            ? "We're finding your perfectly curated matches..."
            : "Complete a few more details to start matching."}
        </p>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Profile
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {formatCompletionPercentage(percentage)}
            </span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-primary rounded-full transition-all duration-700 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Primary CTA */}
        {canMatch ? (
          <button
            onClick={handleStartMatching}
            className={cn(
              "w-full flex items-center justify-center gap-2",
              "h-12 px-6 rounded-lg",
              "font-medium",
              "bg-gradient-to-r from-brand-primary to-brand-primary-dark",
              "hover:from-brand-primary-light hover:to-brand-primary",
              "text-white",
              "shadow-sm",
              "transition-all duration-200",
              "active:scale-[0.98]"
            )}
          >
            Start Matching
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleCompleteProfile}
            className={cn(
              "w-full flex items-center justify-center gap-2",
              "h-12 px-6 rounded-lg",
              "font-medium",
              "bg-gradient-to-r from-brand-primary to-brand-primary-dark",
              "hover:from-brand-primary-light hover:to-brand-primary",
              "text-white",
              "shadow-sm",
              "transition-all duration-200",
              "active:scale-[0.98]"
            )}
          >
            Continue Setup
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {/* Secondary link */}
        <button
          onClick={handleEditProfile}
          className="mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-primary dark:hover:text-brand-primary transition-colors"
        >
          Edit profile details
        </button>
      </div>
    </main>
  );
}
