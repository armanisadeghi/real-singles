import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MatchmakerNav } from "@/components/matchmaker/MatchmakerNav";
import { MatchmakerProvider } from "@/contexts/MatchmakerContext";

/**
 * Matchmaker Portal Layout
 * 
 * Auth guard: Only approved matchmakers can access this portal
 */
export default async function MatchmakerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is an approved matchmaker
  const { data: matchmaker } = await supabase
    .from("matchmakers")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!matchmaker) {
    // User hasn't applied yet - redirect to info page
    redirect("/matchmakers?apply=true");
  }

  if (matchmaker.status === "pending") {
    // Show pending approval page
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/30 dark:to-orange-950/30 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-amber-600 dark:text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Application Under Review
          </h1>
          <p className="text-muted-foreground mb-6">
            Thank you for applying to become a matchmaker! Our team is reviewing
            your application. We'll notify you once a decision is made.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:from-purple-600 hover:to-pink-600 transition-colors"
          >
            Return to App
          </a>
        </div>
      </div>
    );
  }

  if (matchmaker.status === "suspended") {
    // Show suspended page
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Account Suspended
          </h1>
          <p className="text-muted-foreground mb-6">
            Your matchmaker account has been suspended. Please contact support
            for more information.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2.5 bg-gray-600 text-white font-medium rounded-xl hover:bg-gray-700 transition-colors"
          >
            Return to App
          </a>
        </div>
      </div>
    );
  }

  // Approved matchmaker - show portal
  return (
    <MatchmakerProvider matchmakerId={matchmaker.id}>
      <div className="min-h-dvh bg-background">
        <MatchmakerNav matchmakerId={matchmaker.id} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </MatchmakerProvider>
  );
}
