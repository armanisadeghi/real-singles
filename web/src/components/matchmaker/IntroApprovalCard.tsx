"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  MessageSquare,
  X,
  Check,
  Loader2,
  Sparkles,
  User,
  MapPin,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface OtherUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
  city: string | null;
  state: string | null;
  age: number | null;
  bio: string | null;
  occupation: string | null;
}

interface Matchmaker {
  id: string;
  name: string;
  profile_image_url: string | null;
}

interface Introduction {
  id: string;
  status: string;
  my_response: string | null;
  intro_message: string;
  conversation_id: string | null;
  created_at: string;
  expires_at: string | null;
  other_user: OtherUser;
  matchmaker: Matchmaker;
}

interface IntroApprovalCardProps {
  introduction: Introduction;
  onUpdate?: () => void;
}

export function IntroApprovalCard({
  introduction,
  onUpdate,
}: IntroApprovalCardProps) {
  const router = useRouter();
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResponse = async (action: "accept" | "decline") => {
    setResponding(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/matchmakers/${introduction.matchmaker.id}/introductions/${introduction.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );

      const data = await response.json();

      if (data.success) {
        if (data.data?.conversation_id) {
          // Both accepted - go to group chat
          router.push(`/messages/${data.data.conversation_id}`);
        } else {
          // Waiting for other user or declined - refresh list
          onUpdate?.();
        }
      } else {
        setError(data.msg || "Failed to respond");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setResponding(false);
    }
  };

  const { other_user, matchmaker } = introduction;

  // Determine display state
  const isPending =
    introduction.my_response === null &&
    !introduction.status.includes("declined") &&
    introduction.status !== "active" &&
    introduction.status !== "both_accepted";

  const isWaitingForOther =
    introduction.my_response === "accepted" &&
    introduction.status !== "active" &&
    introduction.status !== "both_accepted";

  const isBothAccepted =
    introduction.status === "both_accepted" ||
    introduction.status === "active";

  const isDeclined =
    introduction.status.includes("declined") ||
    introduction.my_response === "declined";

  return (
    <div className="bg-card rounded-xl border border-border/40 overflow-hidden">
      <div className="p-6 space-y-4">
        {/* Matchmaker Badge */}
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
            {matchmaker.profile_image_url ? (
              <img
                src={matchmaker.profile_image_url}
                alt={matchmaker.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Sparkles className="w-4 h-4 text-white" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-purple-700 dark:text-purple-300">
              {matchmaker.name}
            </span>{" "}
            thinks you'd be a great match!
          </p>
        </div>

        {/* Other User Profile */}
        <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 flex items-center justify-center overflow-hidden ring-2 ring-purple-200 dark:ring-purple-900/50 flex-shrink-0">
            {other_user.profile_image_url ? (
              <img
                src={other_user.profile_image_url}
                alt={other_user.first_name || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-lg">
              {other_user.first_name || "Someone special"}
              {other_user.age && (
                <span className="text-muted-foreground font-normal">
                  , {other_user.age}
                </span>
              )}
            </p>
            {(other_user.city || other_user.occupation) && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                {other_user.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {other_user.city}
                    {other_user.state && `, ${other_user.state}`}
                  </span>
                )}
                {other_user.occupation && (
                  <span>• {other_user.occupation}</span>
                )}
              </p>
            )}
            <Link
              href={`/p/${other_user.id}`}
              className="inline-block mt-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
            >
              View Full Profile →
            </Link>
          </div>
        </div>

        {/* Introduction Message */}
        <div>
          <p className="text-sm font-medium text-foreground mb-2">
            Why you'd be a great match:
          </p>
          <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
            {introduction.intro_message}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg text-sm text-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Status/Actions */}
        {isPending && (
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => handleResponse("decline")}
              disabled={responding}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-border/40 text-foreground font-medium rounded-xl hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {responding ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <X className="w-5 h-5" />
                  Decline
                </>
              )}
            </button>
            <button
              onClick={() => handleResponse("accept")}
              disabled={responding}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
            >
              {responding ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Accept
                </>
              )}
            </button>
          </div>
        )}

        {isWaitingForOther && (
          <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300 rounded-lg">
            <Clock className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">
              You accepted! Waiting for {other_user.first_name || "them"} to
              respond...
            </p>
          </div>
        )}

        {isBothAccepted && introduction.conversation_id && (
          <Link
            href={`/messages/${introduction.conversation_id}`}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-300 font-medium rounded-xl hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            Open Chat
          </Link>
        )}

        {isDeclined && (
          <div className="p-3 bg-gray-50 dark:bg-gray-950/30 border border-gray-200 dark:border-gray-900/50 text-sm text-gray-700 dark:text-gray-300 rounded-lg text-center">
            {introduction.my_response === "declined"
              ? "You declined this introduction"
              : "This introduction was declined"}
          </div>
        )}
      </div>

      {/* Date */}
      <div className="px-6 py-3 border-t border-border/40 bg-muted/20">
        <p className="text-xs text-muted-foreground text-center">
          Introduced on{" "}
          {new Date(introduction.created_at).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}
