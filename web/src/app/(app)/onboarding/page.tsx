"use client";

/**
 * Onboarding Page
 *
 * Step-by-step profile setup wizard for new and returning users.
 */

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { Loader2 } from "lucide-react";

function OnboardingContent() {
  const searchParams = useSearchParams();
  const resume = searchParams.get("resume") === "true";

  return <OnboardingWizard resume={resume} />;
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
