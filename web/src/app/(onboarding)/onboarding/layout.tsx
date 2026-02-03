/**
 * Onboarding Layout
 *
 * Full-screen, no-scroll layout for onboarding wizard.
 * No header or footer - just the wizard with its own close button.
 * Desktop: Centered card with max-width
 * Mobile: Full-screen experience
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReactNode } from "react";

export const metadata = {
  title: "Complete Your Profile | RealSingles",
  description: "Set up your dating profile to start meeting real people",
};

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  // Check authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top right gradient blob */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-pink-200/30 dark:bg-pink-900/20 rounded-full blur-3xl" />
        {/* Bottom left gradient blob */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-3xl" />
        {/* Center subtle glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/50 dark:bg-neutral-800/30 rounded-full blur-3xl opacity-50" />
      </div>

      {/* Main container - centered on desktop, full on mobile */}
      <div className="relative h-full w-full flex flex-col items-center justify-center p-0 sm:p-4 md:p-6">
        {/* Card container - full height on mobile, constrained on desktop */}
        <div className="w-full sm:max-w-md md:max-w-lg h-full sm:h-auto sm:max-h-[min(700px,calc(100dvh-3rem))] flex flex-col bg-white/50 dark:bg-neutral-900/50 sm:rounded-2xl sm:shadow-2xl sm:border sm:border-white/20 dark:sm:border-white/10 backdrop-blur-sm overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
