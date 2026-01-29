import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";
import { Database } from "@/types/database.types";

type User = Database["public"]["Tables"]["users"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Match = Database["public"]["Tables"]["matches"]["Row"];

interface UserWithProfile {
  id: string;
  email: string;
  display_name: string | null;
  status: string | null;
  profile_image_url: string | null;
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  city: string | null;
  state: string | null;
  date_of_birth: string | null;
  is_verified: boolean | null;
  is_photo_verified: boolean | null;
}

interface LikeReceived {
  id: string;
  user: UserWithProfile;
  action: string;
  created_at: string;
  is_mutual: boolean;
}

interface LikeGiven {
  id: string;
  target_user: UserWithProfile;
  action: string;
  created_at: string;
  is_mutual: boolean;
}

interface MutualMatch {
  id: string;
  user: UserWithProfile;
  matched_at: string;
  conversation_id: string | null;
  message_count: number;
  is_archived: boolean;
}

interface Block {
  id: string;
  user: UserWithProfile;
  created_at: string;
}

interface MatchEligibility {
  can_match: boolean;
  reasons: string[];
  profile_complete: boolean;
  has_photos: boolean;
  is_verified: boolean;
  is_photo_verified: boolean;
  account_status: string;
  profile_hidden: boolean;
}

interface InteractionsResponse {
  success: true;
  data: {
    likes_received: LikeReceived[];
    likes_given: LikeGiven[];
    mutual_matches: MutualMatch[];
    passes_received: LikeReceived[];
    passes_given: LikeGiven[];
    blocks: {
      blocked_by_user: Block[];
      blocked_this_user: Block[];
    };
    match_eligibility: MatchEligibility;
    stats: {
      likes_received_count: number;
      likes_given_count: number;
      mutual_matches_count: number;
      super_likes_received: number;
      super_likes_given: number;
    };
  };
}

// Verify the current user is an admin
async function verifyAdmin(): Promise<boolean> {
  const supabase = await createApiClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return userData?.role === "admin" || userData?.role === "moderator";
}

// Helper to format user with profile data
async function formatUserWithProfile(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  usersCache: Map<string, UserWithProfile>
): Promise<UserWithProfile | null> {
  // Check cache first
  if (usersCache.has(userId)) {
    return usersCache.get(userId)!;
  }

  const { data: user } = await supabase
    .from("users")
    .select("id, email, display_name, status")
    .eq("id", userId)
    .single();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, gender, city, state, date_of_birth, profile_image_url, is_verified, is_photo_verified")
    .eq("user_id", userId)
    .single();

  const resolvedImageUrl = profile?.profile_image_url
    ? await resolveStorageUrl(supabase, profile.profile_image_url)
    : null;

  const formatted: UserWithProfile = {
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    status: user.status,
    profile_image_url: resolvedImageUrl,
    first_name: profile?.first_name || null,
    last_name: profile?.last_name || null,
    gender: profile?.gender || null,
    city: profile?.city || null,
    state: profile?.state || null,
    date_of_birth: profile?.date_of_birth || null,
    is_verified: profile?.is_verified || false,
    is_photo_verified: profile?.is_photo_verified || false,
  };

  usersCache.set(userId, formatted);
  return formatted;
}

// GET /api/admin/users/[id]/interactions - Get all interaction data for a user
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<InteractionsResponse | { error: string }>> {
  const { id: userId } = await params;
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const usersCache = new Map<string, UserWithProfile>();

  // Verify user exists
  const { data: targetUser, error: userError } = await supabase
    .from("users")
    .select("id, status")
    .eq("id", userId)
    .single();

  if (userError || !targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Fetch target user's profile for eligibility check
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  // Fetch gallery count
  const { count: galleryCount } = await supabase
    .from("user_gallery")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  // Parallel fetch all interaction data
  const [
    likesReceivedResult,
    likesGivenResult,
    blockedByUserResult,
    blockedThisUserResult,
  ] = await Promise.all([
    // Likes/super-likes received (other users who liked this user)
    supabase
      .from("matches")
      .select("*")
      .eq("target_user_id", userId)
      .in("action", ["like", "super_like"])
      .is("is_unmatched", false)
      .order("created_at", { ascending: false }),

    // Likes/super-likes/passes given (this user's actions on others)
    supabase
      .from("matches")
      .select("*")
      .eq("user_id", userId)
      .is("is_unmatched", false)
      .order("created_at", { ascending: false }),

    // Users blocked by this user
    supabase
      .from("blocks")
      .select("*")
      .eq("blocker_id", userId)
      .order("created_at", { ascending: false }),

    // Users who blocked this user
    supabase
      .from("blocks")
      .select("*")
      .eq("blocked_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const likesReceived = likesReceivedResult.data || [];
  const allActionsGiven = likesGivenResult.data || [];
  const blockedByUser = blockedByUserResult.data || [];
  const blockedThisUser = blockedThisUserResult.data || [];

  // Separate likes/super-likes from passes in actions given
  const likesGiven = allActionsGiven.filter(m => m.action === "like" || m.action === "super_like");
  const passesGiven = allActionsGiven.filter(m => m.action === "pass");

  // Also get passes received (users who passed on this user)
  const { data: passesReceived } = await supabase
    .from("matches")
    .select("*")
    .eq("target_user_id", userId)
    .eq("action", "pass")
    .is("is_unmatched", false)
    .order("created_at", { ascending: false });

  // Create sets for quick mutual match lookup
  const userLikedTargets = new Set(likesGiven.map(m => m.target_user_id));
  const usersWhoLikedUser = new Set(likesReceived.map(m => m.user_id));

  // Format likes received
  const formattedLikesReceived: LikeReceived[] = [];
  for (const match of likesReceived) {
    if (!match.user_id) continue;
    const user = await formatUserWithProfile(supabase, match.user_id, usersCache);
    if (user) {
      formattedLikesReceived.push({
        id: match.id,
        user,
        action: match.action,
        created_at: match.created_at || new Date().toISOString(),
        is_mutual: userLikedTargets.has(match.user_id),
      });
    }
  }

  // Format likes given
  const formattedLikesGiven: LikeGiven[] = [];
  for (const match of likesGiven) {
    if (!match.target_user_id) continue;
    const targetUser = await formatUserWithProfile(supabase, match.target_user_id, usersCache);
    if (targetUser) {
      formattedLikesGiven.push({
        id: match.id,
        target_user: targetUser,
        action: match.action,
        created_at: match.created_at || new Date().toISOString(),
        is_mutual: usersWhoLikedUser.has(match.target_user_id),
      });
    }
  }

  // Format passes received
  const formattedPassesReceived: LikeReceived[] = [];
  for (const match of passesReceived || []) {
    if (!match.user_id) continue;
    const user = await formatUserWithProfile(supabase, match.user_id, usersCache);
    if (user) {
      formattedPassesReceived.push({
        id: match.id,
        user,
        action: match.action,
        created_at: match.created_at || new Date().toISOString(),
        is_mutual: false,
      });
    }
  }

  // Format passes given
  const formattedPassesGiven: LikeGiven[] = [];
  for (const match of passesGiven) {
    if (!match.target_user_id) continue;
    const targetUser = await formatUserWithProfile(supabase, match.target_user_id, usersCache);
    if (targetUser) {
      formattedPassesGiven.push({
        id: match.id,
        target_user: targetUser,
        action: match.action,
        created_at: match.created_at || new Date().toISOString(),
        is_mutual: false,
      });
    }
  }

  // Get mutual matches with conversation info
  const mutualMatchUserIds = formattedLikesReceived
    .filter(l => l.is_mutual)
    .map(l => l.user.id);

  const mutualMatches: MutualMatch[] = [];
  for (const matchUserId of mutualMatchUserIds) {
    const user = usersCache.get(matchUserId);
    if (!user) continue;

    // Find conversation between these two users
    const { data: conversations } = await supabase
      .from("conversation_participants")
      .select("conversation_id, is_archived")
      .eq("user_id", userId);

    let conversationId: string | null = null;
    let isArchived = false;
    let messageCount = 0;

    if (conversations) {
      for (const conv of conversations) {
        if (!conv.conversation_id) continue;
        
        // Check if the other user is also in this conversation
        const { data: otherParticipant } = await supabase
          .from("conversation_participants")
          .select("user_id, is_archived")
          .eq("conversation_id", conv.conversation_id)
          .eq("user_id", matchUserId)
          .single();

        if (otherParticipant) {
          conversationId = conv.conversation_id;
          isArchived = conv.is_archived || otherParticipant.is_archived || false;
          
          // Get message count
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.conversation_id);
          
          messageCount = count || 0;
          break;
        }
      }
    }

    // Find when they matched (the later of the two likes)
    const theirLike = likesReceived.find(l => l.user_id === matchUserId);
    const ourLike = likesGiven.find(l => l.target_user_id === matchUserId);
    const matchedAt = theirLike?.created_at && ourLike?.created_at
      ? new Date(theirLike.created_at) > new Date(ourLike.created_at)
        ? theirLike.created_at
        : ourLike.created_at
      : theirLike?.created_at || ourLike?.created_at || new Date().toISOString();

    mutualMatches.push({
      id: matchUserId,
      user,
      matched_at: matchedAt,
      conversation_id: conversationId,
      message_count: messageCount,
      is_archived: isArchived,
    });
  }

  // Format blocks
  const formattedBlockedByUser: Block[] = [];
  for (const block of blockedByUser) {
    if (!block.blocked_id) continue;
    const user = await formatUserWithProfile(supabase, block.blocked_id, usersCache);
    if (user) {
      formattedBlockedByUser.push({
        id: block.id,
        user,
        created_at: block.created_at || new Date().toISOString(),
      });
    }
  }

  const formattedBlockedThisUser: Block[] = [];
  for (const block of blockedThisUser) {
    if (!block.blocker_id) continue;
    const user = await formatUserWithProfile(supabase, block.blocker_id, usersCache);
    if (user) {
      formattedBlockedThisUser.push({
        id: block.id,
        user,
        created_at: block.created_at || new Date().toISOString(),
      });
    }
  }

  // Calculate match eligibility
  const profileComplete = Boolean(
    targetProfile?.first_name &&
    targetProfile?.last_name &&
    targetProfile?.gender &&
    targetProfile?.date_of_birth &&
    targetProfile?.looking_for?.length
  );

  const hasPhotos = (galleryCount || 0) > 0;
  const canStartMatching = targetProfile?.can_start_matching ?? false;
  const profileHidden = targetProfile?.profile_hidden ?? false;

  const eligibilityReasons: string[] = [];
  if (!profileComplete) eligibilityReasons.push("Profile is incomplete");
  if (!hasPhotos) eligibilityReasons.push("No photos uploaded");
  if (targetUser.status !== "active") eligibilityReasons.push(`Account status is ${targetUser.status}`);
  if (profileHidden) eligibilityReasons.push("Profile is hidden (paused)");
  if (!canStartMatching) eligibilityReasons.push("can_start_matching flag is false");

  const matchEligibility: MatchEligibility = {
    can_match: canStartMatching && !profileHidden && targetUser.status === "active",
    reasons: eligibilityReasons,
    profile_complete: profileComplete,
    has_photos: hasPhotos,
    is_verified: targetProfile?.is_verified ?? false,
    is_photo_verified: targetProfile?.is_photo_verified ?? false,
    account_status: targetUser.status || "unknown",
    profile_hidden: profileHidden,
  };

  // Calculate stats
  const stats = {
    likes_received_count: formattedLikesReceived.length,
    likes_given_count: formattedLikesGiven.length,
    mutual_matches_count: mutualMatches.length,
    super_likes_received: formattedLikesReceived.filter(l => l.action === "super_like").length,
    super_likes_given: formattedLikesGiven.filter(l => l.action === "super_like").length,
  };

  return NextResponse.json({
    success: true,
    data: {
      likes_received: formattedLikesReceived,
      likes_given: formattedLikesGiven,
      mutual_matches: mutualMatches,
      passes_received: formattedPassesReceived,
      passes_given: formattedPassesGiven,
      blocks: {
        blocked_by_user: formattedBlockedByUser,
        blocked_this_user: formattedBlockedThisUser,
      },
      match_eligibility: matchEligibility,
      stats,
    },
  });
}
