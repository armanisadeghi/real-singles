import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveStorageUrl, resolveGalleryUrls, resolveVerificationSelfieUrl } from "@/lib/supabase/url-utils";

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

  // Resolve storage URLs for profile image
  const resolvedProfileImageUrl = profile?.profile_image_url 
    ? await resolveStorageUrl(supabase, profile.profile_image_url)
    : null;

  // Resolve storage URLs for verification selfie
  const resolvedVerificationSelfieUrl = profile?.verification_selfie_url 
    ? await resolveVerificationSelfieUrl(supabase, profile.verification_selfie_url)
    : null;

  // Resolve storage URLs for gallery images
  const resolvedGallery = gallery 
    ? await resolveGalleryUrls(supabase, gallery)
    : [];

  return NextResponse.json({ 
    user, 
    profile: profile ? { 
      ...profile, 
      profile_image_url: resolvedProfileImageUrl,
      verification_selfie_url: resolvedVerificationSelfieUrl,
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
  const userFields = ["status", "role", "display_name"];
  const profileFields = [
    "first_name", "last_name", "gender", "date_of_birth", "bio",
    "profile_image_url", "city", "state", "occupation", "company",
    "is_verified", "is_photo_verified"
  ];

  const userUpdates: Record<string, unknown> = {};
  const profileUpdates: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    if (userFields.includes(key)) {
      userUpdates[key] = value;
    } else if (profileFields.includes(key)) {
      profileUpdates[key] = value;
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
