import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { 
  resolveStorageUrl, 
  resolveGalleryUrls, 
  resolveVerificationSelfieUrl,
  resolveVoicePromptUrl,
  resolveVideoIntroUrl
} from "@/lib/supabase/url-utils";

// Verify the current user is an admin
async function verifyAdmin(): Promise<{ isAdmin: boolean; userId?: string }> {
  const supabase = await createApiClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { isAdmin: false };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return { 
    isAdmin: userData?.role === "admin" || userData?.role === "moderator",
    userId: user.id 
  };
}

// GET /api/admin/users/[id] - Get user details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Fetch user
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", id)
    .single();

  // Fetch gallery images
  const { data: gallery } = await supabase
    .from("user_gallery")
    .select("*")
    .eq("user_id", id)
    .order("display_order");

  // Check if user is a matchmaker
  const { data: matchmaker } = await supabase
    .from("matchmakers")
    .select("id, status, years_experience, specialties, approved_at")
    .eq("user_id", id)
    .single();

  // Resolve storage URLs for profile image
  const resolvedProfileImageUrl = profile?.profile_image_url 
    ? await resolveStorageUrl(supabase, profile.profile_image_url)
    : null;

  // Resolve storage URLs for verification selfie
  const resolvedVerificationSelfieUrl = profile?.verification_selfie_url 
    ? await resolveVerificationSelfieUrl(supabase, profile.verification_selfie_url)
    : null;

  // Resolve storage URLs for voice prompt
  const resolvedVoicePromptUrl = profile?.voice_prompt_url 
    ? await resolveVoicePromptUrl(supabase, profile.voice_prompt_url)
    : null;

  // Resolve storage URLs for video intro
  const resolvedVideoIntroUrl = profile?.video_intro_url 
    ? await resolveVideoIntroUrl(supabase, profile.video_intro_url)
    : null;

  // Resolve storage URLs for gallery images
  const resolvedGallery = gallery 
    ? await resolveGalleryUrls(supabase, gallery)
    : [];

  return NextResponse.json({ 
    user, 
    matchmaker: matchmaker || null,
    profile: profile ? { 
      ...profile, 
      profile_image_url: resolvedProfileImageUrl,
      verification_selfie_url: resolvedVerificationSelfieUrl,
      voice_prompt_url: resolvedVoicePromptUrl,
      video_intro_url: resolvedVideoIntroUrl,
    } : null, 
    gallery: resolvedGallery 
  });
}

// PATCH /api/admin/users/[id] - Update user or profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const supabase = createAdminClient();

  // Separate user fields from profile fields
  const userFields = ["status", "role", "display_name", "username", "phone"];
  
  // All profile fields that can be updated
  // Arrays: looking_for, ethnicity, languages, interests, pets, life_goals, schools
  // Strings: all other fields
  const profileFields = [
    // Basic Info
    "first_name", "last_name", "date_of_birth", "gender", "looking_for", 
    "zodiac_sign", "bio", "looking_for_description", "dating_intentions",
    // Physical
    "height_inches", "body_type", "ethnicity",
    // Location
    "country", "state", "city", "zip_code", "street_address", "hometown", "latitude", "longitude",
    // Lifestyle
    "marital_status", "religion", "political_views", "education", "occupation", 
    "company", "schools", "smoking", "drinking", "marijuana", "exercise", "languages",
    // Family
    "has_kids", "wants_kids", "pets",
    // Interests & Goals
    "interests", "life_goals",
    // Profile Prompts
    "ideal_first_date", "non_negotiables", "worst_job", "dream_job", 
    "nightclub_or_home", "pet_peeves", "after_work", "way_to_heart",
    "craziest_travel_story", "weirdest_gift", "past_event",
    // Social
    "social_link_1", "social_link_2",
    // Media
    "profile_image_url", "voice_prompt_url", "video_intro_url",
    "voice_prompt_duration_seconds", "video_intro_duration_seconds",
    "verification_selfie_url",
    // Verification & Status
    "is_verified", "is_photo_verified", "is_id_verified",
    "verified_at", "photo_verified_at", "id_verified_at",
    "can_start_matching", "profile_hidden",
    // Profile Completion
    "profile_completion_step", "profile_completion_skipped", 
    "profile_completion_prefer_not", "profile_completed_at"
  ];

  const userUpdates: Record<string, unknown> = {};
  const profileUpdates: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    if (userFields.includes(key)) {
      userUpdates[key] = value;
    } else if (profileFields.includes(key)) {
      // Handle array fields - ensure they're properly formatted
      const arrayFields = ["looking_for", "ethnicity", "languages", "interests", "pets", "life_goals", "schools", "profile_completion_skipped", "profile_completion_prefer_not"];
      if (arrayFields.includes(key)) {
        // Convert string to array if needed, or ensure it's an array
        if (typeof value === "string" && value.trim() !== "") {
          profileUpdates[key] = value.split(",").map((item: string) => item.trim()).filter(Boolean);
        } else if (Array.isArray(value)) {
          profileUpdates[key] = value.filter(Boolean);
        } else if (value === null || value === "") {
          profileUpdates[key] = null;
        } else {
          profileUpdates[key] = value;
        }
      } else {
        // Handle numeric fields
        if (key === "height_inches" && value !== null && value !== undefined && value !== "") {
          profileUpdates[key] = parseInt(String(value), 10) || null;
        } else if ((key === "latitude" || key === "longitude") && value !== null && value !== undefined && value !== "") {
          profileUpdates[key] = parseFloat(String(value)) || null;
        } else if (key === "voice_prompt_duration_seconds" || key === "video_intro_duration_seconds") {
          profileUpdates[key] = value !== null && value !== undefined && value !== "" ? parseFloat(String(value)) : null;
        } else if (key === "profile_completion_step") {
          profileUpdates[key] = value !== null && value !== undefined && value !== "" ? parseInt(String(value), 10) : null;
        } else {
          // String fields - convert empty strings to null
          profileUpdates[key] = value === "" ? null : value;
        }
      }
    }
  }

  // Update user table if needed
  if (Object.keys(userUpdates).length > 0) {
    const { error: userError } = await supabase
      .from("users")
      .update(userUpdates)
      .eq("id", id);

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }
  }

  // Update profile table if needed
  if (Object.keys(profileUpdates).length > 0) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update(profileUpdates)
      .eq("user_id", id);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { isAdmin, userId } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Prevent self-deletion
  if (userId === id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Delete the user (cascades to related tables)
  const { error } = await supabase.auth.admin.deleteUser(id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
