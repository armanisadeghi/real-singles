"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageSquare, X, Check, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";

interface IntroApprovalCardProps {
  introduction: {
    id: string;
    matchmaker_name: string;
    user_a: {
      id: string;
      display_name: string;
      first_name: string;
      profile_image_url: string;
    };
    user_b: {
      id: string;
      display_name: string;
      first_name: string;
      profile_image_url: string;
    };
    intro_message: string;
    status: string;
    conversation_id: string | null;
    created_at: string;
  };
}

export function IntroApprovalCard({ introduction }: IntroApprovalCardProps) {
  const router = useRouter();
  const [responding, setResponding] = useState(false);

  const handleResponse = async (action: "accept" | "decline") => {
    setResponding(true);

    // TODO: Get matchmaker ID from introduction
    const matchmakerId = ""; // Will need to be included in API response

    try {
      const response = await fetch(
        `/api/matchmakers/${matchmakerId}/introductions/${introduction.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );

      const data = await response.json();

      if (data.success) {
        if (data.data.conversation_id) {
          // Both accepted - go to group chat
          router.push(`/chats/${data.data.conversation_id}`);
        } else {
          // Waiting for other user or declined
          router.refresh();
        }
      } else {
        alert(data.msg || "Failed to respond");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setResponding(false);
    }
  };

  // Determine which user is the "other" user (not current user)
  // TODO: Get current user ID to determine which profile to show
  const otherUser = introduction.user_a; // Placeholder - will be determined by comparing with current user ID

  const isPending = introduction.status === "pending" || 
    (introduction.status.includes("accepted") && introduction.status !== "both_accepted");
  const isBothAccepted = introduction.status === "both_accepted";
  const isDeclined = introduction.status.includes("declined");

  return (
    <div className="bg-card rounded-xl border border-border/40 overflow-hidden">
      <div className="p-6 space-y-4">
        {/* Matchmaker Badge */}
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-purple-700 dark:text-purple-300">
              {introduction.matchmaker_name}
            </span>{" "}
            thinks you'd be a great match!
          </p>
        </div>

        {/* Other User Profile */}
        <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 flex items-center justify-center overflow-hidden ring-2 ring-purple-200 dark:ring-purple-900/50">
            {otherUser.profile_image_url ? (
              <img
                src={otherUser.profile_image_url}
                alt={otherUser.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {otherUser.first_name?.charAt(0) || "?"}
              </span>
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground text-lg">
              {otherUser.display_name}
            </p>
            <Link
              href={`/profile/${otherUser.id}`}
              className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
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

        {isBothAccepted && introduction.conversation_id && (
          <Link
            href={`/chats/${introduction.conversation_id}`}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-300 font-medium rounded-xl hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            Open Group Chat
          </Link>
        )}

        {isDeclined && (
          <div className="p-3 bg-gray-50 dark:bg-gray-950/30 border border-gray-200 dark:border-gray-900/50 text-sm text-gray-700 dark:text-gray-300 rounded-lg text-center">
            This introduction was declined
          </div>
        )}
      </div>

      {/* Date */}
      <div className="px-6 py-3 border-t border-border/40 bg-muted/20">
        <p className="text-xs text-muted-foreground text-center">
          Introduced on {new Date(introduction.created_at).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}
