import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/public/profile/[id]
 * Get limited public profile data - NO AUTH REQUIRED
 * Returns sanitized data suitable for share preview
 * 
 * Limited fields returned:
 * - First name only (no last name)
 * - Age (calculated from DOB)
 * - City, State
 * - Primary photo only
 * - Verification status
 * - Bio (truncated to 100 chars)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;
  
  // Use admin client to bypass RLS for public access
  const supabase = createAdminClient();

  // Check if user exists and is active
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, status")
    .eq("id", userId)
    .single();

  if (userError || !userData) {
    return NextResponse.json(
      { success: false, msg: "Profile not found" },
      { status: 404 }
    );
  }

  // Don't show suspended or deleted users
  if (userData.status === "suspended" || userData.status === "deleted") {
    return NextResponse.json(
      { success: false, msg: "Profile not found" },
      { status: 404 }
    );
  }

  // Get profile data
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(`
      first_name,
      date_of_birth,
      city,
      state,
      bio,
      profile_image_url,
      is_verified,
      profile_hidden
    `)
    .eq("user_id", userId)
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
      { success: false, msg: "Profile unavailable" },
      { status: 404 }
    );
  }

  // Calculate age from DOB
  let age: number | null = null;
  if (profile.date_of_birth) {
    const birthDate = new Date(profile.date_of_birth);
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }

  // Truncate bio to 100 characters
  const truncatedBio = profile.bio 
    ? profile.bio.length > 100 
      ? profile.bio.substring(0, 100) + "..."
      : profile.bio
    : null;

  // Resolve profile image URL
  let profileImageUrl: string | null = null;
  if (profile.profile_image_url) {
    if (profile.profile_image_url.startsWith("http")) {
      profileImageUrl = profile.profile_image_url;
    } else {
      // Generate signed URL for private storage
      const bucket = profile.profile_image_url.includes("/avatar") ? "avatars" : "gallery";
      const { data: signedData } = await supabase.storage
        .from(bucket)
        .createSignedUrl(profile.profile_image_url, 3600); // 1 hour expiry
      profileImageUrl = signedData?.signedUrl || null;
    }
  }

  // Build location string
  const location = [profile.city, profile.state].filter(Boolean).join(", ");

  const responseData = {
    id: userId,
    first_name: profile.first_name || "Someone",
    age,
    location: location || null,
    bio: truncatedBio,
    profile_image_url: profileImageUrl,
    is_verified: profile.is_verified || false,
  };

  return NextResponse.json({
    success: true,
    data: responseData,
    msg: "Public profile fetched successfully",
  });
}
