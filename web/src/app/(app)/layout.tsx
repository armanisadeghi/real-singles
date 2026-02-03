import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNavigation } from "@/components/navigation";
import { AppHeader } from "@/components/layout";
import { AppProviders } from "@/components/providers/AppProviders";
import {
  getDiscoverableCandidates,
  getUserProfileContext,
  type DiscoveryEmptyReason,
} from "@/lib/services/discovery";
import { resolveStorageUrl, resolveVoicePromptUrl, resolveVideoIntroUrl } from "@/lib/supabase/url-utils";
import type { DiscoverProfile } from "@/contexts/DiscoverProfilesContext";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, profile_image_url")
    .eq("user_id", user.id)
    .single();
    
  const { data: userData } = await supabase
    .from("users")
    .select("display_name, points_balance")
    .eq("id", user.id)
    .single();
  
  // Convert storage path to signed URL if needed
  let profileImageUrl = "";
  if (profile?.profile_image_url) {
    if (profile.profile_image_url.startsWith("http")) {
      // Already a full URL
      profileImageUrl = profile.profile_image_url;
    } else {
      // It's a storage path - generate a signed URL
      const bucket = profile.profile_image_url.includes("/avatar") ? "avatars" : "gallery";
      const { data: signedData } = await supabase.storage
        .from(bucket)
        .createSignedUrl(profile.profile_image_url, 3600); // 1 hour expiry
      profileImageUrl = signedData?.signedUrl || "";
    }
  }
  
  return {
    id: user.id,
    email: user.email,
    displayName: userData?.display_name || profile?.first_name || user.email?.split("@")[0],
    profileImage: profileImageUrl,
    points: userData?.points_balance || 0,
  };
}

/**
 * Fetch the first discover profile for SSR initialization.
 * This ensures the first profile loads instantly when user visits /discover.
 */
async function getFirstDiscoverProfile(userId: string): Promise<{
  profile: DiscoverProfile | null;
  emptyReason: DiscoveryEmptyReason;
}> {
  try {
    const supabase = await createClient();
    
    // Get user's profile context for discovery filtering
    const userProfile = await getUserProfileContext(supabase, userId);
    
    if (!userProfile) {
      return { profile: null, emptyReason: "profile_not_found" };
    }
    
    // Check if user has required fields for matching
    if (!userProfile.gender || !userProfile.lookingFor || userProfile.lookingFor.length === 0) {
      return { profile: null, emptyReason: "incomplete_profile" };
    }
    
    // Fetch just 1 profile for instant first load
    const result = await getDiscoverableCandidates(supabase, {
      userProfile,
      filters: {},
      pagination: { limit: 1, offset: 0 },
      sortBy: "recent",
    });
    
    if (result.profiles.length === 0) {
      return { profile: null, emptyReason: result.emptyReason || "no_matches" };
    }
    
    // Transform the first profile with resolved URLs
    const p = result.profiles[0];
    const transformedProfile: DiscoverProfile = {
      id: p.id,
      user_id: p.user_id,
      first_name: p.first_name,
      last_name: p.last_name,
      date_of_birth: p.date_of_birth,
      gender: p.gender,
      city: p.city,
      state: p.state,
      occupation: p.occupation,
      bio: p.bio,
      profile_image_url: await resolveStorageUrl(supabase, p.profile_image_url),
      is_verified: p.is_verified,
      height_inches: p.height_inches,
      body_type: p.body_type,
      zodiac_sign: p.zodiac_sign,
      interests: p.interests,
      education: p.education,
      religion: p.religion,
      ethnicity: p.ethnicity,
      languages: p.languages,
      has_kids: p.has_kids,
      wants_kids: p.wants_kids,
      pets: p.pets,
      smoking: p.smoking,
      drinking: p.drinking,
      marijuana: p.marijuana,
      distance_km: p.distance_km,
      ideal_first_date: p.ideal_first_date,
      non_negotiables: p.non_negotiables,
      way_to_heart: p.way_to_heart,
      craziest_travel_story: p.craziest_travel_story,
      worst_job: p.worst_job,
      dream_job: p.dream_job,
      after_work: p.after_work,
      weirdest_gift: p.weirdest_gift,
      pet_peeves: p.pet_peeves,
      nightclub_or_home: p.nightclub_or_home,
      past_event: p.past_event,
      voice_prompt_url: await resolveVoicePromptUrl(supabase, p.voice_prompt_url),
      voice_prompt_duration_seconds: p.voice_prompt_duration_seconds,
      video_intro_url: await resolveVideoIntroUrl(supabase, p.video_intro_url),
      video_intro_duration_seconds: p.video_intro_duration_seconds,
      user: p.user ? {
        display_name: p.user.display_name,
        status: p.user.status,
      } : null,
    };
    
    return { profile: transformedProfile, emptyReason: null };
  } catch (error) {
    console.error("Failed to fetch first discover profile:", error);
    return { profile: null, emptyReason: "no_matches" };
  }
}

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  
  if (!user) {
    redirect("/login");
  }
  
  // Fetch first discover profile in parallel (non-blocking for other pages)
  const { profile: firstDiscoverProfile, emptyReason } = await getFirstDiscoverProfile(user.id);

  return (
    <AppProviders
      currentUser={{
        id: user.id,
        displayName: user.displayName || "User",
        profileImage: user.profileImage,
        points: user.points,
      }}
      initialDiscoverProfile={firstDiscoverProfile}
      initialDiscoverEmptyReason={emptyReason}
    >
      <div className="min-h-dvh bg-gray-50">
        {/* Header - Hidden on home page (matches mobile app behavior) */}
        <AppHeader 
          user={{
            displayName: user.displayName || "User",
            profileImage: user.profileImage,
          }}
          signOutAction={signOut}
        />

        {/* Mobile Bottom Navigation */}
        <BottomNavigation />

        {/* Main Content */}
        <main id="main-content" className="pb-20 md:pb-0" tabIndex={-1}>
          {children}
        </main>
      </div>
    </AppProviders>
  );
}
