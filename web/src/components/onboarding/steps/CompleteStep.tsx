"use client";

/**
 * CompleteStep
 *
 * Step 34: Completion summary and CTA
 * Clean, professional design for luxury dating app
 */

import { useRouter } from "next/navigation";
import { CheckCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatCompletionPercentage,
  type CompletionStatus,
} from "@/lib/onboarding/completion";

interface CompleteStepProps {
  completion: CompletionStatus | null;
  firstName: string;
}

export function CompleteStep({ completion, firstName }: CompleteStepProps) {
  const router = useRouter();
  const percentage = completion?.percentage ?? 0;
  const canMatch = completion?.canStartMatching ?? false;

  const handleStartMatching = () => {
    router.push("/explore");
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
        {/* Success icon */}
        <div className="mb-5 flex justify-center">
          <div className="w-14 h-14 rounded-full bg-brand-primary/10 dark:bg-brand-primary/20 flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-brand-primary" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {canMatch
            ? `Welcome${firstName ? `, ${firstName}` : ""}`
            : "Almost there"}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {canMatch
            ? "Your profile is ready to go."
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
