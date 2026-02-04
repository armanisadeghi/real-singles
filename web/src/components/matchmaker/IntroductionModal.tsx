"use client";

import { useState } from "react";
import { X, Heart, Loader2 } from "lucide-react";

interface Profile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
  city?: string | null;
  state?: string | null;
}

interface IntroductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userA: Profile;
  userB: Profile;
  matchmakerId: string;
  onSuccess: () => void;
}

export function IntroductionModal({
  isOpen,
  onClose,
  userA,
  userB,
  matchmakerId,
  onSuccess,
}: IntroductionModalProps) {
  const [introMessage, setIntroMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (introMessage.length < 50) {
      setError("Introduction message must be at least 50 characters");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/matchmakers/${matchmakerId}/introductions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_a_id: userA.user_id,
            user_b_id: userB.user_id,
            intro_message: introMessage,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        setError(data.msg || "Failed to create introduction");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getDisplayName = (profile: Profile) => {
    return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "User";
  };

  const getLocation = (profile: Profile) => {
    if (profile.city && profile.state) {
      return `${profile.city}, ${profile.state}`;
    }
    return profile.city || profile.state || "";
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-border/40 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              Create Introduction
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            disabled={submitting}
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* User Previews */}
          <div className="grid grid-cols-2 gap-4">
            {[userA, userB].map((profile, index) => (
              <div
                key={profile.user_id}
                className="bg-muted/30 rounded-xl p-4 text-center"
              >
                <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 flex items-center justify-center overflow-hidden">
                  {profile.profile_image_url ? (
                    <img
                      src={profile.profile_image_url}
                      alt={getDisplayName(profile)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {profile.first_name?.charAt(0) || "?"}
                    </span>
                  )}
                </div>
                <p className="font-semibold text-foreground">
                  {getDisplayName(profile)}
                </p>
                {getLocation(profile) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {getLocation(profile)}
                  </p>
                )}
                <div className="mt-2 px-2 py-1 bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full inline-block">
                  User {index === 0 ? "A" : "B"}
                </div>
              </div>
            ))}
          </div>

          {/* Introduction Message */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Introduction Message
              <span className="text-muted-foreground ml-1">(min 50 characters)</span>
            </label>
            <textarea
              value={introMessage}
              onChange={(e) => setIntroMessage(e.target.value)}
              placeholder="Tell them why you think they'd be a great match... What do they have in common? What attracted you to introduce them?"
              className="w-full h-32 px-4 py-3 bg-background border border-border/40 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              disabled={submitting}
              maxLength={1000}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                {introMessage.length} / 1000 characters
              </p>
              <p
                className={`text-xs ${
                  introMessage.length >= 50
                    ? "text-green-600 dark:text-green-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {introMessage.length < 50
                  ? `${50 - introMessage.length} more characters needed`
                  : "Ready to send!"}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg text-sm text-red-800 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-6 py-3 border border-border/40 text-foreground font-medium rounded-xl hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || introMessage.length < 50}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5" />
                  Send Introduction
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
