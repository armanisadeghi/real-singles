"use client";

/**
 * CompleteStep
 *
 * Step 34: Completion summary and CTA
 */

import { useRouter } from "next/navigation";
import { PartyPopper, Sparkles, ArrowRight, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatCompletionPercentage,
  getCompletionGradient,
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
    // Go back to onboarding to complete required fields
    router.push("/onboarding?resume=true");
  };

  const handleEditProfile = () => {
    router.push("/profile/edit");
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-lg mx-auto text-center">
        {/* Celebration icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 flex items-center justify-center">
              <PartyPopper className="w-12 h-12 text-pink-500 dark:text-pink-400" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-yellow-400 animate-pulse" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          You're all set{firstName ? `, ${firstName}` : ""}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {canMatch
            ? "Your profile is ready. Start meeting real people today!"
            : "Complete a few more steps to start matching."}
        </p>

        {/* Completion percentage */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Profile Completion
            </span>
          </div>
          <div className="relative h-3 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out",
                getCompletionGradient(percentage)
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {completion?.completedCount ?? 0} of {completion?.totalCount ?? 0}{" "}
              fields
            </span>
            <span
              className={cn(
                "text-lg font-bold",
                percentage === 100
                  ? "text-pink-500 dark:text-pink-400"
                  : "text-gray-700 dark:text-gray-300"
              )}
            >
              {formatCompletionPercentage(percentage)}
            </span>
          </div>
        </div>

        {/* Stats */}
        {completion && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {completion.completedFields.length}
              </div>
              <div className="text-xs text-green-700 dark:text-green-500">
                Completed
              </div>
            </div>
            <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {completion.skippedFields.length}
              </div>
              <div className="text-xs text-orange-700 dark:text-orange-500">
                Skipped
              </div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {completion.preferNotFields.length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                Private
              </div>
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="space-y-3">
          {canMatch ? (
            <button
              onClick={handleStartMatching}
              className={cn(
                "w-full flex items-center justify-center gap-2",
                "h-14 px-6 rounded-full",
                "font-medium text-lg",
                "bg-gradient-to-r from-pink-500 to-purple-500",
                "hover:from-pink-600 hover:to-purple-600",
                "text-white",
                "shadow-lg shadow-pink-500/25 dark:shadow-pink-500/15",
                "transition-all duration-200",
                "active:scale-[0.98]"
              )}
            >
              Start Matching
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleCompleteProfile}
              className={cn(
                "w-full flex items-center justify-center gap-2",
                "h-14 px-6 rounded-full",
                "font-medium text-lg",
                "bg-gradient-to-r from-pink-500 to-purple-500",
                "hover:from-pink-600 hover:to-purple-600",
                "text-white",
                "shadow-lg shadow-pink-500/25 dark:shadow-pink-500/15",
                "transition-all duration-200",
                "active:scale-[0.98]"
              )}
            >
              Complete Required Fields
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={handleEditProfile}
            className={cn(
              "w-full flex items-center justify-center gap-2",
              "h-12 px-6 rounded-full",
              "font-medium",
              "bg-gray-100 dark:bg-neutral-800",
              "text-gray-700 dark:text-gray-300",
              "hover:bg-gray-200 dark:hover:bg-neutral-700",
              "transition-colors"
            )}
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </button>
        </div>
      </div>
    </main>
  );
}
