"use client";

/**
 * Likes Page
 * 
 * Modern tabbed interface for:
 * - Likes You: People who liked you
 * - Likes Sent: People you've liked (waiting for response)
 * - Matches: New matches without conversations yet
 */

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Heart, Sparkles, MessageCircle, CheckCircle, Users } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { MediaBadge } from "@/components/profile";
import { Avatar } from "@/components/ui/Avatar";
import { GlassTabs, type Tab } from "@/components/glass";

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

// ================== Loading Skeleton ==================

function CardSkeleton() {
  return (
    <div className="flex items-center gap-4 p-3 bg-white rounded-xl">
      <div className="w-[72px] h-[72px] rounded-lg bg-gray-100 animate-pulse" />
      <div className="flex-1">
        <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
        <div className="h-3 w-32 bg-gray-100 rounded animate-pulse mt-2" />
        <div className="h-3 w-20 bg-gray-100 rounded animate-pulse mt-2" />
      </div>
      <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
    </div>
  );
}

// ================== Empty State with Animated Signal/Radar Effect ==================

interface EmptyStateBoostProps {
  userProfileImage?: string | null;
  title: string;
  description: string;
}

function EmptyStateBoost({ userProfileImage, title, description }: EmptyStateBoostProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Animated radar/signal circles with profile photo */}
      <div className="relative w-64 h-64 flex items-center justify-center mb-8">
        {/* Ripple ring 1 - outermost */}
        <div 
          className="absolute inset-0 rounded-full border-[3px] border-pink-300"
          style={{
            animation: 'ripple 2.5s ease-out infinite',
          }}
        />
        
        {/* Ripple ring 2 */}
        <div 
          className="absolute inset-0 rounded-full border-[3px] border-pink-300"
          style={{
            animation: 'ripple 2.5s ease-out infinite 0.8s',
          }}
        />
        
        {/* Ripple ring 3 */}
        <div 
          className="absolute inset-0 rounded-full border-[3px] border-pink-300"
          style={{
            animation: 'ripple 2.5s ease-out infinite 1.6s',
          }}
        />
        
        {/* Static background circles - more visible */}
        <div className="absolute inset-4 rounded-full bg-pink-100/80" />
        <div className="absolute inset-12 rounded-full bg-pink-50" />
        <div className="absolute inset-20 rounded-full bg-white" />
        
        {/* Profile photo container */}
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl z-10">
          {userProfileImage ? (
            <img
              src={userProfileImage}
              alt="Your profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
              <Users className="w-10 h-10 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Custom keyframes style */}
      <style jsx>{`
        @keyframes ripple {
          0% {
            transform: scale(0.35);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>

      {/* Title */}
      <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">
        {title}
      </h2>

      {/* Description */}
      <p className="text-gray-500 text-center max-w-xs mb-6">
        {description}
      </p>

      {/* Boost CTA */}
      <Link
        href="/boost"
        className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold shadow-lg hover:shadow-xl hover:from-purple-600 hover:to-pink-600 transition-all active:scale-95"
      >
        Boost me
      </Link>
    </div>
  );
}

// ================== Likes You Tab ==================

function LikesYouTab() {
  const router = useRouter();
  const [likes, setLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [likesRes, profileRes] = await Promise.all([
          fetch("/api/matches/likes-received"),
          fetch("/api/users/me"),
        ]);
        
        const likesData = await likesRes.json();
        const profileData = await profileRes.json();

        if (!likesRes.ok) {
          setError(likesData.error || "Failed to load likes");
          return;
        }

        setLikes(likesData.likes || []);
        // API returns ProfileImageUrl at top level
        setUserProfileImage(profileData.ProfileImageUrl || profileData.Image || null);
      } catch (err) {
        console.error("Error fetching likes:", err);
        setError("Failed to load likes. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
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
        setLikes((prev) => prev.filter((l) => l.user_id !== userId));
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
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
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
      <EmptyStateBoost
        userProfileImage={userProfileImage}
        title="New likes will appear here"
        description="Increase your chances with a Boost. Get seen up to 10x more times!"
      />
    );
  }

  return (
    <div className="space-y-2">
      {likes.map((like) => {
        const name = like.first_name || like.display_name || "Someone";
        const location = [like.city, like.state].filter(Boolean).join(", ");
        const likedTime = formatRelativeTime(like.liked_at);
        const isLoading = actionLoading === like.user_id;

        return (
          <div
            key={like.id}
            className={cn(
              "flex items-center gap-3 p-3 bg-white rounded-xl",
              like.is_super_like && "ring-2 ring-blue-400"
            )}
          >
            {/* Photo */}
            <Link
              href={`/search/profile/${like.user_id}`}
              className="relative flex-shrink-0"
            >
              <Avatar
                src={like.profile_image_url}
                name={name}
                size="lg"
              />
              {like.is_super_like && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              )}
            </Link>

            {/* Info */}
            <Link 
              href={`/search/profile/${like.user_id}`}
              className="flex-1 min-w-0"
            >
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {name}
                {like.age && <span className="font-normal text-gray-500">, {like.age}</span>}
              </h3>

              {location && (
                <p className="text-sm text-gray-500 truncate">{location}</p>
              )}

              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {like.is_verified && (
                  <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                )}
                <MediaBadge
                  hasVoicePrompt={!!like.voice_prompt_url}
                  hasVideoIntro={!!like.video_intro_url}
                  size="sm"
                />
                {likedTime && (
                  <span className="text-xs text-gray-400">{likedTime}</span>
                )}
              </div>
            </Link>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => like.user_id && handlePass(like.user_id)}
                disabled={isLoading}
                className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 disabled:opacity-50"
              >
                <span className="text-lg">✕</span>
              </button>
              <button
                onClick={() => like.user_id && handleLikeBack(like.user_id)}
                disabled={isLoading}
                className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center justify-center hover:from-pink-600 hover:to-rose-600 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Heart className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ================== Likes Sent Tab ==================

function LikesSentTab() {
  const [likes, setLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [likesRes, profileRes] = await Promise.all([
          fetch("/api/matches/likes-sent"),
          fetch("/api/users/me"),
        ]);
        
        const likesData = await likesRes.json();
        const profileData = await profileRes.json();

        if (!likesRes.ok) {
          setError(likesData.error || "Failed to load sent likes");
          return;
        }

        setLikes(likesData.likes || []);
        setUserProfileImage(profileData.ProfileImageUrl || profileData.Image || null);
      } catch (err) {
        console.error("Error fetching sent likes:", err);
        setError("Failed to load sent likes. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
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
      <EmptyStateBoost
        userProfileImage={userProfileImage}
        title="No pending likes"
        description="Profiles you like will appear here until they respond. Keep discovering!"
      />
    );
  }

  return (
    <div className="space-y-2">
      {likes.map((like) => {
        const name = like.first_name || like.display_name || "Someone";
        const location = [like.city, like.state].filter(Boolean).join(", ");
        const likedTime = formatRelativeTime(like.liked_at);

        return (
          <Link
            key={like.id}
            href={`/search/profile/${like.user_id}`}
            className={cn(
              "flex items-center gap-3 p-3 bg-white rounded-xl hover:bg-gray-50 transition-colors",
              like.is_super_like && "ring-2 ring-blue-400"
            )}
          >
            {/* Photo */}
            <div className="relative flex-shrink-0">
              <Avatar
                src={like.profile_image_url}
                name={name}
                size="lg"
              />
              {like.is_super_like && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {name}
                {like.age && <span className="font-normal text-gray-500">, {like.age}</span>}
              </h3>

              {location && (
                <p className="text-sm text-gray-500 truncate">{location}</p>
              )}

              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {like.is_verified && (
                  <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                )}
                <MediaBadge
                  hasVoicePrompt={!!like.voice_prompt_url}
                  hasVideoIntro={!!like.video_intro_url}
                  size="sm"
                />
                {likedTime && (
                  <span className="text-xs text-gray-400">Sent {likedTime}</span>
                )}
              </div>
            </div>

            {/* Pending indicator */}
            <div className="flex-shrink-0">
              <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-medium">
                Pending
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ================== Matches Tab (New matches without conversations) ==================

function MatchesTab() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [matchesRes, profileRes] = await Promise.all([
          fetch("/api/matches"),
          fetch("/api/users/me"),
        ]);
        
        const matchesData = await matchesRes.json();
        const profileData = await profileRes.json();

        if (!matchesRes.ok) {
          setError(matchesData.error || "Failed to load matches");
          return;
        }

        // Filter to only new matches (no conversation yet)
        const newMatches = (matchesData.matches || []).filter(
          (m: Match) => !m.conversation_id
        );
        
        setMatches(newMatches);
        setUserProfileImage(profileData.ProfileImageUrl || profileData.Image || null);
      } catch (err) {
        console.error("Error fetching matches:", err);
        setError("Failed to load matches. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
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
      <EmptyStateBoost
        userProfileImage={userProfileImage}
        title="New matches will appear here"
        description="Increase your chances with a Boost. Get seen up to 10x more times!"
      />
    );
  }

  return (
    <div className="space-y-2">
      {matches.map((match) => {
        const name = match.first_name || match.display_name || "Anonymous";
        const location = [match.city, match.state].filter(Boolean).join(", ");
        const matchedTime = formatRelativeTime(match.matched_at);

        return (
          <div
            key={match.user_id}
            className="flex items-center gap-3 p-3 bg-white rounded-xl"
          >
            {/* Photo */}
            <Link
              href={`/profile/${match.user_id}`}
              className="flex-shrink-0"
            >
              <Avatar
                src={match.profile_image_url}
                name={name}
                size="lg"
              />
            </Link>

            {/* Info */}
            <Link 
              href={`/profile/${match.user_id}`}
              className="flex-1 min-w-0"
            >
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {name}
              </h3>

              {location && (
                <p className="text-sm text-gray-500 truncate">{location}</p>
              )}

              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {match.is_verified && (
                  <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                )}
                <MediaBadge
                  hasVoicePrompt={!!match.voice_prompt_url}
                  hasVideoIntro={!!match.video_intro_url}
                  size="sm"
                />
                {matchedTime && (
                  <span className="inline-flex items-center gap-1 text-xs text-pink-600">
                    <Heart className="w-3 h-3" />
                    {matchedTime}
                  </span>
                )}
              </div>
            </Link>

            {/* Message button */}
            <Link
              href={`/profile/${match.user_id}`}
              className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center justify-center hover:from-pink-600 hover:to-rose-600 flex-shrink-0"
            >
              <MessageCircle className="w-4 h-4" />
            </Link>
          </div>
        );
      })}
    </div>
  );
}

// ================== Main Page ==================

type TabType = "likes" | "sent" | "matches";

export default function LikesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get tab from URL or default to "likes"
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TabType>(
    tabParam === "sent" ? "sent" : tabParam === "matches" ? "matches" : "likes"
  );

  // Update URL when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    router.replace(`/likes?tab=${tab}`, { scroll: false });
  };

  // Tab definitions for GlassTabs
  const tabs: Tab[] = [
    { id: "likes", label: "Likes You" },
    { id: "sent", label: "Likes Sent" },
    { id: "matches", label: "Matches" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 pt-4">
      {/* Tab Navigation - Glass Pills */}
      <GlassTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(id) => handleTabChange(id as TabType)}
        ariaLabel="Likes tabs"
        className="mb-4"
      />

      {/* Tab Content */}
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
      >
        {activeTab === "likes" && <LikesYouTab />}
        {activeTab === "sent" && <LikesSentTab />}
        {activeTab === "matches" && <MatchesTab />}
      </div>
    </div>
  );
}
