import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

/**
 * GET /api/profiles/[id]/preview
 * Get a compact profile preview for displaying in chat messages
 * Returns minimal data needed for profile cards
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: profileUserId } = await params;
  const supabase = await createApiClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, msg: "Not authenticated" },
      { status: 401 }
    );
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(profileUserId)) {
    return NextResponse.json(
      { success: false, msg: "Invalid profile ID" },
      { status: 400 }
    );
  }

  // Get the profile preview data
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(`
      user_id,
      first_name,
      date_of_birth,
      city,
      state,
      profile_image_url,
      bio,
      occupation,
      profile_hidden
    `)
    .eq("user_id", profileUserId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { success: false, msg: "Profile not found" },
      { status: 404 }
    );
  }

  // Don't show hidden profiles
  if (profile.profile_hidden) {
    return NextResponse.json(
      { 
        success: true, 
        data: {
          profile_id: profileUserId,
          is_hidden: true,
          first_name: null,
          age: null,
          location: null,
          profile_image_url: null,
          bio: null,
          occupation: null,
        }
      },
      { status: 200 }
    );
  }

  // Calculate age from date of birth
  let age: number | null = null;
  if (profile.date_of_birth) {
    const today = new Date();
    const birthDate = new Date(profile.date_of_birth);
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }

  // Build location string
  const location = [profile.city, profile.state].filter(Boolean).join(", ");

  // Get user status and display_name
  const { data: userData } = await supabase
    .from("users")
    .select("status, display_name")
    .eq("id", profileUserId)
    .not("status", "in", "(suspended,deleted)")
    .single();

  if (!userData) {
    return NextResponse.json(
      { success: false, msg: "User not available" },
      { status: 404 }
    );
  }

  // Get primary gallery image if no profile image
  let imageUrl = profile.profile_image_url;
  if (!imageUrl) {
    const { data: gallery } = await supabase
      .from("user_gallery")
      .select("media_url")
      .eq("user_id", profileUserId)
      .eq("is_primary", true)
      .limit(1)
      .single();

    if (gallery?.media_url) {
      // Convert storage path to public URL
      if (!gallery.media_url.startsWith("http")) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        imageUrl = `${supabaseUrl}/storage/v1/object/public/gallery/${gallery.media_url}`;
      } else {
        imageUrl = gallery.media_url;
      }
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      profile_id: profile.user_id,
      is_hidden: false,
      display_name: userData?.display_name || profile.first_name,
      first_name: profile.first_name,
      age: age,
      location: location || null,
      profile_image_url: imageUrl,
      bio: profile.bio?.substring(0, 200) || null, // Truncate bio for preview
      occupation: profile.occupation,
    },
  });
}
