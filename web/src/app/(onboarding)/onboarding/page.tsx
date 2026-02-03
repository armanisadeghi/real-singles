"use client";

/**
 * Onboarding Page
 *
 * Step-by-step profile setup wizard for new and returning users.
 * 
 * Query parameters:
 * - resume=true: Go to the first incomplete step
 * - step=N: Go directly to step N (overrides resume behavior)
 */

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { Loader2 } from "lucide-react";

function OnboardingContent() {
  const searchParams = useSearchParams();
  const resume = searchParams.get("resume") === "true";
  const stepParam = searchParams.get("step");
  const targetStep = stepParam ? parseInt(stepParam, 10) : undefined;

  return <OnboardingWizard resume={resume} targetStep={targetStep} />;
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
