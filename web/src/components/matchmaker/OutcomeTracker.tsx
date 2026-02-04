"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Heart, MessageSquare, Calendar, Users, Loader2, Save, ArrowRight } from "lucide-react";
import Link from "next/link";

interface IntroductionDetail {
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
  outcome: string | null;
  conversation_id: string | null;
  created_at: string;
  expires_at: string;
}

interface OutcomeTrackerProps {
  introId: string;
}

export function OutcomeTracker({ introId }: OutcomeTrackerProps) {
  const [intro, setIntro] = useState<IntroductionDetail | null>(null);
  const [outcome, setOutcome] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch introduction details - TODO: Implement
    setLoading(false);
  }, [introId]);

  const handleSaveOutcome = async () => {
    if (!outcome) return;

    setSaving(true);
    // TODO: Save outcome via API
    setTimeout(() => {
      setSaving(false);
      // Update local state
      if (intro) {
        setIntro({ ...intro, outcome: outcome as any });
      }
    }, 1000);
  };

  const outcomeOptions = [
    { value: "no_response", label: "No Response / Expired" },
    { value: "declined", label: "One or Both Declined" },
    { value: "chatted", label: "They Chatted" },
    { value: "dated", label: "They Went on a Date" },
    { value: "relationship", label: "They're in a Relationship" },
  ];

  const getStatusBadge = (status: string) => {
    const config: { [key: string]: { label: string; color: string } } = {
      pending: { label: "Pending", color: "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300" },
      user_a_accepted: { label: "User A Accepted", color: "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300" },
      user_b_accepted: { label: "User B Accepted", color: "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300" },
      both_accepted: { label: "Both Accepted", color: "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300" },
      user_a_declined: { label: "User A Declined", color: "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300" },
      user_b_declined: { label: "User B Declined", color: "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300" },
      expired: { label: "Expired", color: "bg-gray-100 dark:bg-gray-950/30 text-gray-700 dark:text-gray-300" },
    };

    const cfg = config[status] || { label: status, color: "bg-gray-100 dark:bg-gray-950/30 text-gray-700 dark:text-gray-300" };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${cfg.color}`}>
        {cfg.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!intro) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Introduction not found</p>
        <Link
          href="/matchmaker-portal/introductions"
          className="inline-block mt-4 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
        >
          Back to Introductions
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Back Button */}
      <Link
        href="/matchmaker-portal/introductions"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Introductions
      </Link>

      {/* Introduction Card */}
      <div className="bg-card rounded-xl border border-border/40 overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Introduction Details
                </h1>
                <p className="text-sm text-muted-foreground">
                  Created {new Date(intro.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            {getStatusBadge(intro.status)}
          </div>

          {/* Users */}
          <div className="grid grid-cols-2 gap-4">
            {[intro.user_a, intro.user_b].map((user, index) => (
              <div key={user.id} className="bg-muted/30 rounded-xl p-4 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 flex items-center justify-center overflow-hidden">
                  {user.profile_image_url ? (
                    <img
                      src={user.profile_image_url}
                      alt={user.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {user.first_name?.charAt(0) || "?"}
                    </span>
                  )}
                </div>
                <p className="font-semibold text-foreground">{user.display_name}</p>
                <p className="text-xs text-muted-foreground mt-1">User {index === 0 ? "A" : "B"}</p>
              </div>
            ))}
          </div>

          {/* Introduction Message */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Your Introduction Message
            </label>
            <div className="p-4 bg-muted/30 rounded-xl text-sm text-foreground whitespace-pre-wrap">
              {intro.intro_message}
            </div>
          </div>

          {/* Conversation Link */}
          {intro.conversation_id && (
            <Link
              href={`/chats/${intro.conversation_id}`}
              className="flex items-center gap-2 px-4 py-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-950/50 transition-colors"
            >
              <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                View Group Conversation
              </span>
              <ArrowRight className="w-4 h-4 ml-auto text-purple-600 dark:text-purple-400" />
            </Link>
          )}
        </div>
      </div>

      {/* Outcome Tracking */}
      <div className="bg-card rounded-xl border border-border/40 p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Track Outcome
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Update the outcome of this introduction to help track your success rate.
        </p>

        <div className="space-y-4">
          {/* Current Outcome */}
          {intro.outcome && (
            <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-300">
                Current outcome: <strong>{intro.outcome}</strong>
              </p>
            </div>
          )}

          {/* Outcome Selector */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Update Outcome
            </label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border/40 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select outcome...</option>
              {outcomeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSaveOutcome}
            disabled={!outcome || saving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Outcome
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
