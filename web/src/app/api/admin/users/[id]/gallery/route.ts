import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

// GET /api/admin/users/[id]/gallery - Get user's gallery images
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: gallery, error } = await supabase
    .from("user_gallery")
    .select("*")
    .eq("user_id", id)
    .order("display_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ gallery });
}

// PATCH /api/admin/users/[id]/gallery - Update a gallery image or set primary
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gallery_id, display_order, media_url, is_primary, set_primary } = await request.json();

  if (!gallery_id && display_order === undefined) {
    return NextResponse.json({ error: "gallery_id or display_order required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Handle setting primary image with proper logic (matching client-side behavior)
  if (set_primary && gallery_id) {
    // First, unset all primary flags for this user
    const { error: unsetError } = await supabase
      .from("user_gallery")
      .update({ is_primary: false })
      .eq("user_id", id);

    if (unsetError) {
      return NextResponse.json({ error: unsetError.message }, { status: 500 });
    }

    // Set the new primary
    const { data: primaryItem, error: setPrimaryError } = await supabase
      .from("user_gallery")
      .update({ is_primary: true })
      .eq("id", gallery_id)
      .eq("user_id", id)
      .select()
      .single();

    if (setPrimaryError) {
      return NextResponse.json({ error: setPrimaryError.message }, { status: 500 });
    }

    // Update profile image URL
    if (primaryItem && primaryItem.media_type === "image") {
      await supabase
        .from("profiles")
        .update({ profile_image_url: primaryItem.media_url })
        .eq("user_id", id);
    }

    return NextResponse.json({ success: true, gallery: primaryItem });
  }

  // Standard update logic for editing image URL or other fields
  const updates: Record<string, unknown> = {};
  if (media_url) updates.media_url = media_url;
  if (is_primary !== undefined) updates.is_primary = is_primary;

  let query = supabase.from("user_gallery").update(updates);
  
  if (gallery_id) {
    query = query.eq("id", gallery_id);
  } else {
    query = query.eq("user_id", id).eq("display_order", display_order);
  }

  const { error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If updating to primary with media_url, also update the profile image
  if (is_primary && media_url) {
    await supabase
      .from("profiles")
      .update({ profile_image_url: media_url })
      .eq("user_id", id);
  }

  return NextResponse.json({ success: true });
}

// POST /api/admin/users/[id]/gallery - Add a new gallery image
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { media_url, display_order, is_primary } = await request.json();

  if (!media_url) {
    return NextResponse.json({ error: "media_url required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Get current max display_order
  const { data: existing } = await supabase
    .from("user_gallery")
    .select("display_order")
    .eq("user_id", id)
    .order("display_order", { ascending: false })
    .limit(1);

  const newOrder = display_order ?? ((existing?.[0]?.display_order ?? -1) + 1);

  const { data, error } = await supabase
    .from("user_gallery")
    .insert({
      user_id: id,
      media_type: "image",
      media_url,
      display_order: newOrder,
      is_primary: is_primary ?? false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, gallery: data });
}

// DELETE /api/admin/users/[id]/gallery - Delete a gallery image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const galleryId = searchParams.get("gallery_id");
  const displayOrder = searchParams.get("display_order");

  if (!galleryId && displayOrder === null) {
    return NextResponse.json({ error: "gallery_id or display_order required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  let query = supabase.from("user_gallery").delete();
  
  if (galleryId) {
    query = query.eq("id", galleryId);
  } else {
    query = query.eq("user_id", id).eq("display_order", Number(displayOrder));
  }

  const { error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
