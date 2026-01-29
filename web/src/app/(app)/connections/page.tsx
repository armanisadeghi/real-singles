"use client";

/**
 * Connections Page
 * 
 * Hub for managing dating connections:
 * - Likes You: People who liked you (premium feature)
 * - Matches: Mutual connections (can message)
 */

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Heart, Sparkles, MessageCircle, CheckCircle, ChevronRight, Crown, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { MediaBadge } from "@/components/profile";

// ================== Interfaces ==================

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

interface Like {
  id: string;
  user_id: string | null;
  action: string;
  is_super_like: boolean;
  liked_at: string | null;
  display_name?: string | null;
  first_name?: string | null;
  age?: number | null;
  gender?: string | null;
  city?: string | null;
  state?: string | null;
  occupation?: string | null;
  bio?: string | null;
  is_verified: boolean;
  profile_image_url?: string | null;
  last_active_at?: string | null;
  // Voice & Video Prompts
  voice_prompt_url?: string | null;
  video_intro_url?: string | null;
}

// ================== Helpers ==================

function formatRelativeTime(dateString: string | null | undefined): string {
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

// ================== Likes You Tab ==================

function LikesYouTab() {
  const router = useRouter();
  const [likes, setLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLikes() {
      try {
        const response = await fetch("/api/matches/likes-received");
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to load likes");
          return;
        }

        setLikes(data.likes || []);
      } catch (err) {
        console.error("Error fetching likes:", err);
        setError("Failed to load likes. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchLikes();
  }, []);

  const handleLikeBack = async (userId: string) => {
    setActionLoading(userId);
    try {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: userId, action: "like" }),
      });
      const data = await response.json();

      if (data.success) {
        // Remove from likes list (now it's a match)
        setLikes((prev) => prev.filter((l) => l.user_id !== userId));
        
        // If mutual (always should be since they liked us), navigate to chat
        if (data.is_mutual && data.conversation_id) {
          router.push(`/chats/${data.conversation_id}`);
        }
      }
    } catch (err) {
      console.error("Error liking back:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePass = async (userId: string) => {
    setActionLoading(userId);
    try {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: userId, action: "pass" }),
      });
      const data = await response.json();

      if (data.success) {
        // Remove from likes list
        setLikes((prev) => prev.filter((l) => l.user_id !== userId));
      }
    } catch (err) {
      console.error("Error passing:", err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-sm">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (likes.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-center mb-4">
          <ThumbsUp className="w-16 h-16 text-amber-300" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No new likes</h2>
        <p className="text-gray-600 mb-6">
          When someone likes you, they'll appear here
        </p>
        <Link
          href="/discover"
          className="inline-block px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-colors"
        >
          Discover Profiles
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {likes.map((like) => {
        const name = like.first_name || like.display_name || "Someone";
        const location = [like.city, like.state].filter(Boolean).join(", ");
        const bgColor = getBgColor(like.user_id || like.id);
        const initials = getInitials(name);
        const likedTime = formatRelativeTime(like.liked_at);
        const isLoading = actionLoading === like.user_id;

        return (
          <div
            key={like.id}
            className={cn(
              "flex items-center gap-4 p-3 bg-white rounded-xl shadow-sm",
              like.is_super_like && "ring-2 ring-blue-400 ring-offset-2"
            )}
          >
            {/* Photo */}
            <Link
              href={`/discover/profile/${like.user_id}`}
              className="relative w-[72px] h-[72px] rounded-lg overflow-hidden flex-shrink-0 hover:opacity-90 transition-opacity"
            >
              {like.profile_image_url ? (
                <img
                  src={like.profile_image_url}
                  alt={`Photo of ${name}`}
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
              {/* Super Like indicator */}
              {like.is_super_like && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </Link>

            {/* Info */}
            <Link 
              href={`/discover/profile/${like.user_id}`}
              className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
            >
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {name}
                {like.age && <span className="font-normal text-gray-500">, {like.age}</span>}
              </h3>

              {location && (
                <p className="text-sm text-gray-500 truncate mt-0.5">
                  {location}
                </p>
              )}

              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {like.is_verified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </span>
                )}
                <MediaBadge
                  hasVoicePrompt={!!like.voice_prompt_url}
                  hasVideoIntro={!!like.video_intro_url}
                  size="sm"
                />
                {like.is_super_like && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                    <Sparkles className="w-3 h-3" />
                    Super Like
                  </span>
                )}
                {likedTime && (
                  <span className="text-xs text-gray-400">
                    Liked you {likedTime}
                  </span>
                )}
              </div>
            </Link>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Pass */}
              <button
                onClick={() => like.user_id && handlePass(like.user_id)}
                disabled={isLoading}
                className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
                title="Pass"
              >
                <span className="text-lg">✕</span>
              </button>
              
              {/* Like Back */}
              <button
                onClick={() => like.user_id && handleLikeBack(like.user_id)}
                disabled={isLoading}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center justify-center hover:from-pink-600 hover:to-rose-600 transition-colors shadow-sm disabled:opacity-50"
                title="Like back"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Heart className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ================== Matches Tab ==================

function MatchesTab() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatches() {
      try {
        const response = await fetch("/api/matches");
        const data = await response.json();

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
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-sm">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-center mb-4">
          <Heart className="w-16 h-16 text-pink-300" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No matches yet</h2>
        <p className="text-gray-600 mb-6">
          When you and someone else like each other, you'll match!
        </p>
        <Link
          href="/discover"
          className="inline-block px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-colors"
        >
          Discover Profiles
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => {
        const name = match.first_name || match.display_name || "Anonymous";
        const location = [match.city, match.state].filter(Boolean).join(", ");
        const bgColor = getBgColor(match.user_id);
        const initials = getInitials(name);
        const matchedTime = formatRelativeTime(match.matched_at);

        return (
          <div
            key={match.user_id}
            className="flex items-center gap-4 p-3 bg-white rounded-xl shadow-sm"
          >
            {/* Photo */}
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

            {/* Info */}
            <Link 
              href={`/profile/${match.user_id}`}
              className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
            >
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {name}
              </h3>

              {location && (
                <p className="text-sm text-gray-500 truncate mt-0.5">
                  {location}
                </p>
              )}

              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {match.is_verified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </span>
                )}
                <MediaBadge
                  hasVoicePrompt={!!match.voice_prompt_url}
                  hasVideoIntro={!!match.video_intro_url}
                  size="sm"
                />
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
  );
}

// ================== Main Page ==================

type TabType = "likes" | "matches";

export default function ConnectionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get tab from URL or default to "likes"
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TabType>(
    tabParam === "matches" ? "matches" : "likes"
  );

  // Update URL when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    router.replace(`/connections?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Connections</h1>
      <p className="text-gray-500 mb-6">Your likes and matches</p>

      {/* Tab Navigation */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => handleTabChange("likes")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-all",
            activeTab === "likes"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <ThumbsUp className="w-4 h-4" />
          Likes You
        </button>
        <button
          onClick={() => handleTabChange("matches")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-all",
            activeTab === "matches"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <Heart className="w-4 h-4" />
          Matches
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "likes" ? <LikesYouTab /> : <MatchesTab />}
    </div>
  );
}
