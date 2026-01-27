import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { DiscoverGrid, DiscoverGridSkeleton } from "@/components/discovery";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";

async function getDiscoverProfiles() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { profiles: [], isProfilePaused: false };

  // Get current user's profile to check if paused
  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("profile_hidden")
    .eq("user_id", user.id)
    .single();

  const isProfilePaused = currentUserProfile?.profile_hidden || false;

  // Get blocked user IDs to exclude
  const { data: blockedUsers } = await supabase
    .from("blocks")
    .select("blocked_id")
    .eq("blocker_id", user.id);

  const blockedIds = blockedUsers?.map(b => b.blocked_id).filter((id): id is string => id !== null) || [];

  // Get profiles already liked/passed to exclude
  const { data: matchedUsers } = await supabase
    .from("matches")
    .select("target_user_id")
    .eq("user_id", user.id);

  const matchedIds = matchedUsers?.map(m => m.target_user_id).filter((id): id is string => id !== null) || [];

  // Get profiles excluding current user, blocked users, and already matched
  const excludeIds = [user.id, ...blockedIds, ...matchedIds];

  // Note: Removed strict status="active" filter to include new users (null status)
  // The join to users table ensures the user exists
  const { data: profiles } = await supabase
    .from("profiles")
    .select(`
      id,
      user_id,
      first_name,
      last_name,
      date_of_birth,
      city,
      state,
      occupation,
      bio,
      profile_image_url,
      is_verified,
      height_inches,
      interests,
      user:user_id(display_name, status)
    `)
    .not("user_id", "in", `(${excludeIds.join(",")})`)
    .order("created_at", { ascending: false })
    .limit(40);

  // Transform user array to single object and resolve storage URLs
  // This ensures profile_image_url is a proper signed URL, not a storage path
  const transformedProfiles = await Promise.all(
    (profiles || []).map(async (p) => ({
      ...p,
      user: Array.isArray(p.user) ? p.user[0] ?? null : p.user,
      profile_image_url: await resolveStorageUrl(supabase, p.profile_image_url),
    }))
  );

  return { profiles: transformedProfiles, isProfilePaused };
}

async function DiscoverContent() {
  const { profiles, isProfilePaused } = await getDiscoverProfiles();
  return <DiscoverGrid initialProfiles={profiles} isProfilePaused={isProfilePaused} />;
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<DiscoverGridSkeleton />}>
      <DiscoverContent />
    </Suspense>
  );
}
