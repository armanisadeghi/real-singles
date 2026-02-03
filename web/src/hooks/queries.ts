/**
 * TanStack Query Hooks
 * 
 * Reusable query hooks for common data fetching patterns.
 * These hooks provide automatic caching, deduplication, and background refetching.
 * 
 * Benefits:
 * - Same data isn't fetched multiple times across components
 * - Data stays fresh with configurable stale times
 * - Loading/error states are handled consistently
 * - Data persists across page navigations within the app
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// =============================================================================
// QUERY KEYS
// =============================================================================

export const queryKeys = {
  currentUser: ["currentUser"] as const,
  conversations: ["conversations"] as const,
  matches: ["matches"] as const,
  likesReceived: ["likes", "received"] as const,
  likesSent: ["likes", "sent"] as const,
  unreadCount: ["conversations", "unread"] as const,
} as const;

// =============================================================================
// TYPES
// =============================================================================

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
  voice_prompt_duration_seconds?: number | null;
  video_intro_duration_seconds?: number | null;
}

interface Conversation {
  ConversationID: string;
  Type: "direct" | "group";
  DisplayName: string;
  DisplayImage: string;
  UpdatedAt: string;
  LastReadAt?: string | null;
  Participants: ConversationParticipant[];
  LastMessage?: string | null;
  LastMessageAt?: string | null;
  UnreadCount?: number;
}

interface ConversationParticipant {
  UserID: string;
  DisplayName: string;
  FirstName: string;
  LastName: string;
  ProfileImage: string;
  LastActiveAt?: string | null;
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
  voice_prompt_duration_seconds?: number | null;
  video_intro_duration_seconds?: number | null;
}

interface UserProfile {
  UserID: string;
  Email: string;
  DisplayName: string;
  FirstName: string;
  LastName: string;
  ProfileImageUrl: string;
  Points: number;
  IsVerified: boolean;
  CanStartMatching: boolean;
  // Add other fields as needed
}

// =============================================================================
// CURRENT USER QUERY
// =============================================================================

/**
 * Fetch current user's profile data
 * 
 * Stale time: 5 minutes (user data changes infrequently)
 */
export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: async (): Promise<UserProfile> => {
      const res = await fetch("/api/users/me");
      if (!res.ok) {
        throw new Error("Failed to fetch user profile");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// =============================================================================
// CONVERSATIONS QUERY
// =============================================================================

/**
 * Fetch all conversations for the current user
 * 
 * Stale time: 30 seconds (messages change frequently)
 */
export function useConversations() {
  return useQuery({
    queryKey: queryKeys.conversations,
    queryFn: async (): Promise<{ data: Conversation[]; total: number }> => {
      const res = await fetch("/api/conversations");
      if (!res.ok) {
        throw new Error("Failed to fetch conversations");
      }
      return res.json();
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

// =============================================================================
// MATCHES QUERY
// =============================================================================

/**
 * Fetch mutual matches for the current user
 * 
 * Stale time: 1 minute
 */
export function useMatches() {
  return useQuery({
    queryKey: queryKeys.matches,
    queryFn: async (): Promise<{ matches: Match[]; total: number }> => {
      const res = await fetch("/api/matches");
      if (!res.ok) {
        throw new Error("Failed to fetch matches");
      }
      return res.json();
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

// =============================================================================
// LIKES QUERIES
// =============================================================================

/**
 * Fetch likes received by the current user
 * 
 * Stale time: 1 minute
 */
export function useLikesReceived() {
  return useQuery({
    queryKey: queryKeys.likesReceived,
    queryFn: async (): Promise<{ likes: Like[]; total: number }> => {
      const res = await fetch("/api/matches/likes-received");
      if (!res.ok) {
        throw new Error("Failed to fetch likes received");
      }
      return res.json();
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Fetch likes sent by the current user
 * 
 * Stale time: 1 minute
 */
export function useLikesSent() {
  return useQuery({
    queryKey: queryKeys.likesSent,
    queryFn: async (): Promise<{ likes: Like[]; total: number }> => {
      const res = await fetch("/api/matches/likes-sent");
      if (!res.ok) {
        throw new Error("Failed to fetch likes sent");
      }
      return res.json();
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

// =============================================================================
// UNREAD COUNT QUERY
// =============================================================================

/**
 * Fetch total unread message count
 * 
 * Stale time: 30 seconds (frequently polled)
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.unreadCount,
    queryFn: async (): Promise<{ count: number }> => {
      const res = await fetch("/api/conversations/unread-count");
      if (!res.ok) {
        throw new Error("Failed to fetch unread count");
      }
      return res.json();
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Poll every minute
  });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

/**
 * Hook to invalidate queries after mutations
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateConversations: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
    },
    invalidateMatches: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matches });
      queryClient.invalidateQueries({ queryKey: queryKeys.likesReceived });
      queryClient.invalidateQueries({ queryKey: queryKeys.likesSent });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries();
    },
  };
}

/**
 * Hook for like/pass/superlike actions
 */
export function useMatchAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      targetUserId,
      action,
    }: {
      targetUserId: string;
      action: "like" | "pass" | "super_like";
    }) => {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: targetUserId, action }),
      });
      if (!res.ok) {
        throw new Error("Failed to perform action");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate related queries after a match action
      queryClient.invalidateQueries({ queryKey: queryKeys.matches });
      queryClient.invalidateQueries({ queryKey: queryKeys.likesReceived });
      queryClient.invalidateQueries({ queryKey: queryKeys.likesSent });
    },
  });
}
