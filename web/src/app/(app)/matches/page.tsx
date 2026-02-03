"use client";

/**
 * Matches Page
 * 
 * Displays mutual matches - users who have both liked each other.
 * Calls the /api/matches endpoint to maintain SSOT with mobile.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Heart, MessageCircle, CheckCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { MediaBadge } from "@/components/profile";

interface Match {
  user_id: string;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  age?: number | null;
  gender?: string | null;
  city?: string | null;
  state?: string | null;
  occupation?: string | null;
  bio?: string | null;
  is_verified: boolean;
  profile_image_url?: string | null;
  gallery?: { media_url: string }[];
  last_active_at?: string | null;
  matched_at?: string | null;
  conversation_id?: string | null;
  // Voice & Video Prompts
  voice_prompt_url?: string | null;
  video_intro_url?: string | null;
}

interface MatchesResponse {
  matches: Match[];
  total: number;
  limit: number;
  offset: number;
  error?: string;
}

// Helper to format relative time
function formatMatchedTime(dateString: string | null | undefined): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}

// Background colors for initials
const BACKGROUND_COLORS = [
  "#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5",
  "#2196F3", "#03A9F4", "#00BCD4", "#009688", "#4CAF50",
];

function getBgColor(seed: string): string {
  const index = Math.abs(
    seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % BACKGROUND_COLORS.length
  );
  return BACKGROUND_COLORS[index];
}

function getInitials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
}

export default function MatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatches() {
      try {
        const response = await fetch("/api/matches");
        const data: MatchesResponse = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to load matches");
          return;
        }

        setMatches(data.matches || []);
      } catch (err) {
        console.error("Error fetching matches:", err);
        setError("Failed to load matches. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Matches</h1>
        <p className="text-gray-500 mb-6">People you've matched with</p>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Matches</h1>
        <p className="text-gray-500 mb-6">People you've matched with</p>
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Matches</h1>
      <p className="text-gray-500 mb-6">People you've matched with</p>

      {matches.length === 0 ? (
        <div className="text-center py-8 sm:py-12 bg-white dark:bg-neutral-900 rounded-xl shadow-sm">
          <div className="flex items-center justify-center mb-3">
            <Heart className="w-12 h-12 sm:w-14 sm:h-14 text-pink-300 dark:text-pink-400" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1.5">No matches yet</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-5 px-4">
            Start liking profiles to find your matches!
          </p>
          <Link
            href="/search"
            className="inline-block px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-amber-700 transition-colors"
          >
            Search Profiles
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => {
            const name = match.first_name || match.display_name || "Anonymous";
            const location = [match.city, match.state].filter(Boolean).join(", ");
            const bgColor = getBgColor(match.user_id);
            const initials = getInitials(name);
            const matchedTime = formatMatchedTime(match.matched_at);

            return (
              <div
                key={match.user_id}
                className="flex items-center gap-4 p-3 bg-white rounded-xl shadow-sm"
              >
                {/* Photo - Links to profile */}
                <Link
                  href={`/profile/${match.user_id}`}
                  className="relative w-[72px] h-[72px] rounded-lg overflow-hidden flex-shrink-0 hover:opacity-90 transition-opacity"
                >
                  {match.profile_image_url ? (
                    <img
                      src={match.profile_image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: bgColor }}
                    >
                      <span className="text-2xl font-bold text-white">{initials}</span>
                    </div>
                  )}
                </Link>

                {/* Info - Links to profile */}
                <Link 
                  href={`/profile/${match.user_id}`}
                  className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
                >
                  {/* Name */}
                  <h3 className="text-base font-semibold text-gray-900 truncate">
                    {name}
                  </h3>

                  {/* Location */}
                  {location && (
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {location}
                    </p>
                  )}

                  {/* Badges Row */}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {/* Verified Badge */}
                    {match.is_verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    )}

                    {/* Media Badge */}
                    <MediaBadge
                      hasVoicePrompt={!!match.voice_prompt_url}
                      hasVideoIntro={!!match.video_intro_url}
                      size="sm"
                    />

                    {/* Matched Time */}
                    {matchedTime && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-pink-50 text-pink-600 rounded-full text-xs font-medium">
                        <Heart className="w-3 h-3" />
                        Matched {matchedTime}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Message Button */}
                  {match.conversation_id ? (
                    <button
                      onClick={() => router.push(`/chats/${match.conversation_id}`)}
                      className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center justify-center hover:from-pink-600 hover:to-rose-600 transition-colors shadow-sm"
                      title="Send message"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  ) : (
                    <Link
                      href={`/profile/${match.user_id}`}
                      className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors"
                      title="View profile"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
