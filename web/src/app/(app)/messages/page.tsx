"use client";

/**
 * Messages Page
 * 
 * Combined view of:
 * - New Matches (horizontal carousel) - matches without conversations
 * - Messages (vertical list) - active conversations
 * 
 * Uses TanStack Query for caching and automatic request deduplication.
 * Data stays fresh with configurable stale times and optional background refetch.
 */

import { useMemo } from "react";
import Link from "next/link";
import { Heart, Camera, Mic, Video } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { useMatches, useConversations } from "@/hooks/queries";

// ============================================================================
// Types
// ============================================================================

interface Match {
  user_id: string;
  display_name?: string | null;
  first_name?: string | null;
  age?: number | null;
  is_verified: boolean;
  profile_image_url?: string | null;
  last_active_at?: string | null;
  conversation_id?: string | null;
  voice_prompt_url?: string | null;
  video_intro_url?: string | null;
}

interface ConversationParticipant {
  UserID: string;
  DisplayName: string;
  FirstName: string;
  ProfileImage: string;
  LastActiveAt?: string | null;
}

interface Conversation {
  ConversationID: string;
  Type: "direct" | "group";
  DisplayName: string;
  DisplayImage: string;
  UpdatedAt: string;
  LastReadAt?: string | null;
  Participants: ConversationParticipant[];
  // Added fields from enhanced API
  LastMessage?: string | null;
  LastMessageAt?: string | null;
  UnreadCount?: number;
}

// ============================================================================
// Helpers
// ============================================================================

// Check if user is online (active within last 5 minutes)
const isUserOnline = (lastActiveAt?: string | null): boolean => {
  if (!lastActiveAt) return false;
  const lastActive = new Date(lastActiveAt);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastActive.getTime()) / 1000 / 60;
  return diffMinutes < 5;
};

// ============================================================================
// Skeleton Components
// ============================================================================

function NewMatchesSkeleton() {
  return (
    <div className="flex gap-2.5 overflow-hidden">
      {/* Get Likes skeleton */}
      <div className="flex-shrink-0 w-[72px]">
        <div className="w-[72px] h-[72px] rounded-xl bg-gray-100 dark:bg-neutral-800 animate-pulse" />
        <div className="h-2.5 w-12 mx-auto mt-1.5 rounded bg-gray-100 dark:bg-neutral-800 animate-pulse" />
      </div>
      {/* Match card skeletons */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex-shrink-0 w-[72px]">
          <div className="w-[72px] h-[72px] rounded-xl bg-gray-100 dark:bg-neutral-800 animate-pulse" />
          <div className="h-2.5 w-10 mx-auto mt-1.5 rounded bg-gray-100 dark:bg-neutral-800 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-neutral-800 animate-pulse" />
      <div className="flex-1 min-w-0">
        <div className="h-4 w-24 rounded bg-gray-100 dark:bg-neutral-800 animate-pulse" />
        <div className="h-3 w-40 rounded bg-gray-100 dark:bg-neutral-800 animate-pulse mt-2" />
      </div>
      <div className="h-3 w-8 rounded bg-gray-100 dark:bg-neutral-800 animate-pulse" />
    </div>
  );
}

// ============================================================================
// New Match Card Component
// ============================================================================

interface NewMatchCardProps {
  match: Match;
}

function NewMatchCard({ match }: NewMatchCardProps) {
  const name = match.display_name || match.first_name || "User";
  const isOnline = isUserOnline(match.last_active_at);
  const hasMedia = match.voice_prompt_url || match.video_intro_url;

  return (
    <Link
      href={`/profile/${match.user_id}`}
      className="flex-shrink-0 w-[72px] group"
    >
      {/* Avatar with online indicator */}
      <div className="relative">
        <div className="w-[72px] h-[72px] rounded-xl overflow-hidden bg-gray-100 dark:bg-neutral-800 ring-1 ring-gray-200/50 dark:ring-neutral-700/50 group-hover:ring-pink-300 dark:group-hover:ring-pink-500 transition-all">
          {match.profile_image_url ? (
            <img
              src={match.profile_image_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
              <span className="text-white text-xl font-semibold">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        {/* Online indicator - red dot for new, green for online */}
        <span
          className={cn(
            "absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-neutral-900",
            isOnline ? "bg-green-500" : "bg-rose-500"
          )}
        />
      </div>

      {/* Name and badges */}
      <div className="mt-1 text-center">
        <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{name}</p>
        
        {/* Badges row */}
        <div className="flex items-center justify-center gap-0.5">
          {match.is_verified && (
            <Camera className="w-3 h-3 text-blue-500" />
          )}
          {hasMedia && (
            <>
              {match.voice_prompt_url && (
                <Mic className="w-3 h-3 text-pink-500" />
              )}
              {match.video_intro_url && (
                <Video className="w-3 h-3 text-indigo-500" />
              )}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

// ============================================================================
// Get Likes CTA Card
// ============================================================================

function GetLikesCard() {
  return (
    <Link
      href="/likes?tab=matches"
      className="flex-shrink-0 w-[72px] group"
    >
      <div className="w-[72px] h-[72px] rounded-xl bg-gray-50 dark:bg-neutral-900 border-2 border-dashed border-gray-200 dark:border-neutral-700 flex items-center justify-center group-hover:border-pink-300 dark:group-hover:border-pink-500 group-hover:bg-pink-50/50 dark:group-hover:bg-pink-950/30 transition-all">
        <Heart className="w-7 h-7 text-gray-300 dark:text-gray-600 group-hover:text-pink-400 transition-colors" />
      </div>
      <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400 text-center group-hover:text-pink-500 transition-colors">
        New Matches
      </p>
    </Link>
  );
}

// ============================================================================
// Conversation Row Component
// ============================================================================

interface ConversationRowProps {
  conversation: Conversation;
}

function ConversationRow({ conversation }: ConversationRowProps) {
  // Get the other participant for direct chats
  const otherParticipant = conversation.Participants[0];
  const isOnline = isUserOnline(otherParticipant?.LastActiveAt);
  const hasUnread = (conversation.UnreadCount ?? 0) > 0;
  
  const displayName = conversation.DisplayName || otherParticipant?.DisplayName || "User";
  const displayImage = conversation.DisplayImage || otherParticipant?.ProfileImage;
  
  // Message preview
  const lastMessage = conversation.LastMessage || "Start the conversation!";
  const lastMessageTime = conversation.LastMessageAt || conversation.UpdatedAt;

  return (
    <Link
      href={`/chats/${conversation.ConversationID}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-800 active:bg-gray-100 dark:active:bg-neutral-700 transition-colors"
    >
      {/* Avatar with online indicator */}
      <Avatar
        src={displayImage}
        name={displayName}
        size="lg"
        showOnlineIndicator={conversation.Type === "direct"}
        isOnline={isOnline}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3
            className={cn(
              "text-base truncate",
              hasUnread ? "font-semibold text-gray-900 dark:text-gray-100" : "font-medium text-gray-700 dark:text-gray-300"
            )}
          >
            {displayName}
          </h3>
          {/* Verified badge could go here if we had that data */}
        </div>
        <p
          className={cn(
            "text-sm truncate mt-0.5",
            hasUnread ? "text-gray-900 dark:text-gray-100 font-medium" : "text-gray-500 dark:text-gray-400"
          )}
        >
          {lastMessage}
        </p>
      </div>

      {/* Right side: time and unread badge */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        {lastMessageTime && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {formatRelativeTime(lastMessageTime)}
          </span>
        )}
        {hasUnread && (
          <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-pink-500 text-white text-xs font-bold rounded-full">
            {(conversation.UnreadCount ?? 0) > 9 ? "9+" : conversation.UnreadCount}
          </span>
        )}
      </div>
    </Link>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function MessagesPage() {
  // Use TanStack Query hooks - handles caching, deduplication, and background refetch
  const { 
    data: matchesData, 
    isLoading: matchesLoading, 
    error: matchesError,
    refetch: refetchMatches,
  } = useMatches();
  
  const { 
    data: conversationsData, 
    isLoading: conversationsLoading, 
    error: conversationsError,
    refetch: refetchConversations,
  } = useConversations();

  // Filter matches to only those without conversations
  const newMatches = useMemo(() => {
    return (matchesData?.matches || []).filter(
      (m: Match) => !m.conversation_id
    );
  }, [matchesData]);

  const conversations = conversationsData?.data || [];
  const loading = matchesLoading || conversationsLoading;
  const error = matchesError || conversationsError;

  // Refresh function for error retry
  const refreshData = () => {
    refetchMatches();
    refetchConversations();
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* New Matches Section Skeleton - Compact */}
        <div className="px-4 pt-2 pb-3">
          <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-2">
            New Matches
          </h2>
          <NewMatchesSkeleton />
        </div>

        {/* Messages Section Skeleton */}
        <div>
          <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 px-4 py-2">
            Messages
          </h2>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ConversationSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">
          {error instanceof Error ? error.message : "Failed to load messages. Please try again."}
        </p>
        <button
          onClick={refreshData}
          className="px-4 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const hasNewMatches = newMatches.length > 0;
  const hasConversations = conversations.length > 0;
  const isEmpty = !hasNewMatches && !hasConversations;

  // Empty state
  if (isEmpty) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 text-center">
        <div className="flex items-center justify-center mb-3">
          <Heart className="w-12 h-12 sm:w-14 sm:h-14 text-pink-300 dark:text-pink-400" />
        </div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
          No matches yet
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-5">
          Start exploring to find your matches!
        </p>
        <Link
          href="/discover"
          className="inline-block px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-medium rounded-xl hover:from-pink-600 hover:to-rose-600 transition-colors"
        >
          Start Discovering
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto min-h-[calc(100dvh-var(--header-height)-80px)]">
      {/* New Matches Section - Compact */}
      {hasNewMatches && (
        <section className="px-4 pt-2 pb-3">
          <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-2">
            New Matches
          </h2>
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
            <GetLikesCard />
            {newMatches.map((match) => (
              <NewMatchCard key={match.user_id} match={match} />
            ))}
          </div>
        </section>
      )}

      {/* Show Get Likes even if no new matches but have conversations */}
      {!hasNewMatches && hasConversations && (
        <section className="px-4 pt-2 pb-3">
          <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-2">
            New Matches
          </h2>
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
            <GetLikesCard />
          </div>
        </section>
      )}

      {/* Messages Section */}
      <section>
        <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 px-4 py-2">
          Messages
        </h2>
        
        {hasConversations ? (
          <div className="divide-y divide-gray-100 dark:divide-neutral-800">
            {conversations.map((conversation) => (
              <ConversationRow
                key={conversation.ConversationID}
                conversation={conversation}
              />
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No messages yet. Tap on a match to start chatting!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
