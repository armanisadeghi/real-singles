"use client";

/**
 * Likes Page
 * 
 * Modern tabbed interface for:
 * - Likes You: People who liked you (unacted)
 * - Likes Sent: People you've liked (waiting for response)
 * - Matches: All matches with 3 collapsible sections (Favorites, New Matches, All Matches)
 * 
 * Uses TanStack Query for caching - same data is shared across tabs,
 * eliminating duplicate API calls and providing instant tab switching.
 */

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Heart, Sparkles, MessageCircle, CheckCircle, Users, ChevronDown, Star } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { MediaBadge } from "@/components/profile";
import { Avatar } from "@/components/ui/Avatar";
import { GlassTabs, type Tab } from "@/components/glass";
import { 
  useLikesReceived, 
  useLikesSent, 
  useMatches, 
  useFavorites,
  useFavoriteAction,
  useUserProfile,
  useMatchAction,
} from "@/hooks/queries";

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
    <div className="flex items-center gap-4 p-3 bg-white dark:bg-neutral-900 rounded-xl">
      <div className="w-[72px] h-[72px] rounded-lg bg-gray-100 dark:bg-neutral-800 animate-pulse" />
      <div className="flex-1">
        <div className="h-4 w-24 bg-gray-100 dark:bg-neutral-800 rounded animate-pulse" />
        <div className="h-3 w-32 bg-gray-100 dark:bg-neutral-800 rounded animate-pulse mt-2" />
        <div className="h-3 w-20 bg-gray-100 dark:bg-neutral-800 rounded animate-pulse mt-2" />
      </div>
      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-800 animate-pulse" />
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
    <div className="flex flex-col items-center justify-center py-6 sm:py-10 px-4">
      {/* Animated radar/signal circles with profile photo */}
      <div className="relative w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center mb-5 sm:mb-6">
        {/* Ripple ring 1 - outermost */}
        <div 
          className="absolute inset-0 rounded-full border-2 sm:border-[3px] border-pink-300 dark:border-pink-500/50"
          style={{
            animation: 'ripple 2.5s ease-out infinite',
          }}
        />
        
        {/* Ripple ring 2 */}
        <div 
          className="absolute inset-0 rounded-full border-2 sm:border-[3px] border-pink-300 dark:border-pink-500/50"
          style={{
            animation: 'ripple 2.5s ease-out infinite 0.8s',
          }}
        />
        
        {/* Ripple ring 3 */}
        <div 
          className="absolute inset-0 rounded-full border-2 sm:border-[3px] border-pink-300 dark:border-pink-500/50"
          style={{
            animation: 'ripple 2.5s ease-out infinite 1.6s',
          }}
        />
        
        {/* Static background circles - more visible */}
        <div className="absolute inset-3 sm:inset-4 rounded-full bg-pink-100/80 dark:bg-pink-900/30" />
        <div className="absolute inset-8 sm:inset-10 rounded-full bg-pink-50 dark:bg-pink-950/40" />
        <div className="absolute inset-14 sm:inset-16 rounded-full bg-white dark:bg-neutral-900" />
        
        {/* Profile photo container */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-[3px] sm:border-4 border-white dark:border-neutral-800 shadow-xl dark:shadow-black/30 z-10">
          {userProfileImage ? (
            <img
              src={userProfileImage}
              alt="Your profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
              <Users className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
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
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1.5 text-center">
        {title}
      </h2>

      {/* Description */}
      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 text-center max-w-xs mb-5">
        {description}
      </p>

      {/* Boost CTA */}
      <Link
        href="/boost"
        className="px-6 py-2.5 sm:px-8 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl hover:from-purple-600 hover:to-pink-600 transition-all active:scale-95"
      >
        Boost me
      </Link>
    </div>
  );
}

// ================== Likes You Tab ==================

function LikesYouTab() {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Use TanStack Query hooks - automatically cached and deduplicated
  const { data: likesData, isLoading: loading, error, refetch } = useLikesReceived();
  const { data: profileData } = useUserProfile();
  const matchAction = useMatchAction();

  const likes = likesData?.likes || [];
  const userProfileImage = profileData?.ProfileImageUrl || null;

  const handleLikeBack = async (userId: string) => {
    setActionLoading(userId);
    try {
      const result = await matchAction.mutateAsync({ targetUserId: userId, action: "like" });
      if (result.is_mutual && result.conversation_id) {
        router.push(`/chats/${result.conversation_id}`);
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
      await matchAction.mutateAsync({ targetUserId: userId, action: "pass" });
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
        <p className="text-red-600 dark:text-red-400 mb-4">
          {error instanceof Error ? error.message : "Failed to load likes"}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-700"
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
        title="People who like you will appear here"
        description="Increase your visibility with a Boost. Get seen up to 10x more times!"
      />
    );
  }

  return (
    <div className="space-y-2">
      {likes.map((like) => {
        const name = like.display_name || like.first_name || "Someone";
        const location = [like.city, like.state].filter(Boolean).join(", ");
        const likedTime = formatRelativeTime(like.liked_at);
        const isLoading = actionLoading === like.user_id;

        return (
          <div
            key={like.id}
            className={cn(
              "flex items-center gap-3 p-3 bg-white dark:bg-neutral-900 rounded-xl",
              like.is_super_like && "ring-2 ring-blue-400 dark:ring-blue-500"
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
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                {name}
                {like.age && <span className="font-normal text-gray-500 dark:text-gray-400">, {like.age}</span>}
              </h3>

              {location && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{location}</p>
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
                  <span className="text-xs text-gray-400 dark:text-gray-500">{likedTime}</span>
                )}
              </div>
            </Link>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => like.user_id && handlePass(like.user_id)}
                disabled={isLoading}
                className="w-9 h-9 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-neutral-700 disabled:opacity-50"
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
  // Use TanStack Query hooks - automatically cached and deduplicated
  const { data: likesData, isLoading: loading, error, refetch } = useLikesSent();
  const { data: profileData } = useUserProfile();

  const likes = likesData?.likes || [];
  const userProfileImage = profileData?.ProfileImageUrl || null;

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
        <p className="text-red-600 dark:text-red-400 mb-4">
          {error instanceof Error ? error.message : "Failed to load sent likes"}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-700"
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
        const name = like.display_name || like.first_name || "Someone";
        const location = [like.city, like.state].filter(Boolean).join(", ");
        const likedTime = formatRelativeTime(like.liked_at);

        return (
          <Link
            key={like.id}
            href={`/search/profile/${like.user_id}`}
            className={cn(
              "flex items-center gap-3 p-3 bg-white dark:bg-neutral-900 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors",
              like.is_super_like && "ring-2 ring-blue-400 dark:ring-blue-500"
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
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                {name}
                {like.age && <span className="font-normal text-gray-500 dark:text-gray-400">, {like.age}</span>}
              </h3>

              {location && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{location}</p>
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
                  <span className="text-xs text-gray-400 dark:text-gray-500">Sent {likedTime}</span>
                )}
              </div>
            </div>

            {/* Pending indicator */}
            <div className="flex-shrink-0">
              <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full text-xs font-medium">
                Pending
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ================== Collapsible Section ==================

interface CollapsibleSectionProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  defaultExpanded?: boolean;
  emptyMessage?: string;
  emptyAction?: { label: string; href: string };
  children: React.ReactNode;
}

function CollapsibleSection({ title, count, icon, defaultExpanded = true, emptyMessage, emptyAction, children }: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="rounded-xl overflow-hidden">
      {/* Section header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 dark:bg-neutral-800/60 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors rounded-xl"
        aria-expanded={expanded}
      >
        {icon}
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </span>
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
          {count}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 ml-auto text-gray-400 dark:text-gray-500 transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>

      {/* Collapsible content */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="pt-2 space-y-2">
            {count === 0 && emptyMessage ? (
              <div className="flex flex-col items-center py-5 px-4 bg-white dark:bg-neutral-900 rounded-xl">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">{emptyMessage}</p>
                {emptyAction && (
                  <Link
                    href={emptyAction.href}
                    className="mt-3 px-4 py-2 text-xs font-medium text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30 rounded-full hover:bg-pink-100 dark:hover:bg-pink-900/50 transition-colors"
                  >
                    {emptyAction.label}
                  </Link>
                )}
              </div>
            ) : (
              children
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ================== Match Card (shared across sections) ==================

interface MatchCardProps {
  match: Match;
  isFavorite?: boolean;
  onToggleFavorite?: (userId: string) => void;
}

function MatchCard({ match, isFavorite = false, onToggleFavorite }: MatchCardProps) {
  const name = match.display_name || match.first_name || "Anonymous";
  const location = [match.city, match.state].filter(Boolean).join(", ");
  const matchedTime = formatRelativeTime(match.matched_at);
  const hasConversation = !!match.conversation_id;

  return (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-900 rounded-xl">
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
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
          {name}
        </h3>

        {location && (
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{location}</p>
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
            <span className="inline-flex items-center gap-1 text-xs text-pink-600 dark:text-pink-400">
              <Heart className="w-3 h-3" />
              {matchedTime}
            </span>
          )}
        </div>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Favorite toggle */}
        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(match.user_id)}
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
              isFavorite
                ? "bg-amber-50 dark:bg-amber-900/30 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                : "bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-neutral-700 hover:text-amber-500"
            )}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star className="w-4 h-4" fill={isFavorite ? "currentColor" : "none"} />
          </button>
        )}

        {/* Message button */}
        <Link
          href={hasConversation ? `/chats/${match.conversation_id}` : `/profile/${match.user_id}`}
          className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center justify-center hover:from-pink-600 hover:to-rose-600"
          title={hasConversation ? "Open chat" : "View profile"}
        >
          <MessageCircle className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

// ================== Matches Tab (3 collapsible sections) ==================

function MatchesTab() {
  // Fetch matches and favorites in parallel (TanStack Query deduplicates)
  const { data: matchesData, isLoading: matchesLoading, error: matchesError, refetch: refetchMatches } = useMatches();
  const { data: favoritesData, isLoading: favoritesLoading } = useFavorites();
  const { data: profileData } = useUserProfile();
  const favoriteAction = useFavoriteAction();

  const loading = matchesLoading || favoritesLoading;
  const userProfileImage = profileData?.ProfileImageUrl || null;

  // Build a Set of favorited user IDs for O(1) lookup
  const favoriteUserIds = useMemo(() => {
    const ids = new Set<string>();
    if (favoritesData?.data) {
      for (const fav of favoritesData.data) {
        if (fav.id) ids.add(fav.id);
      }
    }
    return ids;
  }, [favoritesData]);

  // Split matches into sections
  const allMatches = matchesData?.matches || [];

  const favoriteMatches = useMemo(
    () => allMatches.filter((m: Match) => favoriteUserIds.has(m.user_id)),
    [allMatches, favoriteUserIds]
  );

  const newMatches = useMemo(
    () => allMatches.filter((m: Match) => !m.conversation_id),
    [allMatches]
  );

  // Toggle favorite for a match (uses the toggle POST endpoint)
  const handleToggleFavorite = (userId: string) => {
    const isFav = favoriteUserIds.has(userId);
    favoriteAction.mutate({ targetUserId: userId, action: isFav ? "remove" : "add" });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  if (matchesError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400 mb-4">
          {matchesError instanceof Error ? matchesError.message : "Failed to load matches"}
        </p>
        <button
          onClick={() => refetchMatches()}
          className="px-4 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Favorites section - always visible */}
      <CollapsibleSection
        title="Favorites"
        count={favoriteMatches.length}
        icon={<Star className="w-4 h-4 text-amber-500" fill="currentColor" />}
        defaultExpanded
        emptyMessage="Tap the star on any match to add them to your favorites for quick access."
        emptyAction={allMatches.length > 0 ? undefined : { label: "Discover People", href: "/discover" }}
      >
        {favoriteMatches.map((match: Match) => (
          <MatchCard key={`fav-${match.user_id}`} match={match} isFavorite onToggleFavorite={handleToggleFavorite} />
        ))}
      </CollapsibleSection>

      {/* New Matches section - always visible */}
      <CollapsibleSection
        title="New Matches"
        count={newMatches.length}
        icon={<Sparkles className="w-4 h-4 text-pink-500" />}
        defaultExpanded
        emptyMessage="No new matches yet. Boost your profile to get seen by more people!"
        emptyAction={{ label: "Boost Me", href: "/boost" }}
      >
        {newMatches.map((match: Match) => (
          <MatchCard key={`new-${match.user_id}`} match={match} isFavorite={favoriteUserIds.has(match.user_id)} onToggleFavorite={handleToggleFavorite} />
        ))}
      </CollapsibleSection>

      {/* All Matches section - always visible */}
      <CollapsibleSection
        title="All Matches"
        count={allMatches.length}
        icon={<Heart className="w-4 h-4 text-rose-500" />}
        defaultExpanded
        emptyMessage="When you and someone both like each other, they'll appear here."
        emptyAction={{ label: "Discover People", href: "/discover" }}
      >
        {allMatches.map((match: Match) => (
          <MatchCard key={`all-${match.user_id}`} match={match} isFavorite={favoriteUserIds.has(match.user_id)} onToggleFavorite={handleToggleFavorite} />
        ))}
      </CollapsibleSection>
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
        ariaLabel="Likes and Matches tabs"
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
