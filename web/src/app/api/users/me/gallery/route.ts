import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

// Helper to convert storage path to public URL
function getGalleryPublicUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/gallery/${path}`;
}

/**
 * GET /api/users/me/gallery
 * Get current user's gallery items
 */
export async function GET(request: NextRequest) {
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

  const { data: gallery, error } = await supabase
    .from("user_gallery")
    .select("id, media_url, media_type, thumbnail_url, is_live_photo, is_primary, display_order, created_at")
    .eq("user_id", user.id)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching gallery:", error);
    return NextResponse.json(
      { success: false, msg: "Error fetching gallery" },
      { status: 500 }
    );
  }

  // Generate signed URLs for gallery items
  const formattedGallery = await Promise.all(
    (gallery || []).map(async (item) => {
      let mediaUrl = item.media_url;
      let thumbnailUrl = item.thumbnail_url;
      
      // Create signed URL for media
      if (!item.media_url.startsWith("http")) {
        const { data: signedData } = await supabase.storage
          .from("gallery")
          .createSignedUrl(item.media_url, 3600);
        mediaUrl = signedData?.signedUrl || getGalleryPublicUrl(item.media_url);
      }
      
      // Create signed URL for thumbnail if exists
      if (item.thumbnail_url && !item.thumbnail_url.startsWith("http")) {
        const { data: thumbData } = await supabase.storage
          .from("gallery")
          .createSignedUrl(item.thumbnail_url, 3600);
        thumbnailUrl = thumbData?.signedUrl || null;
      }
      
      return {
        GalleryID: item.id,
        MediaType: item.media_type,
        MediaURL: mediaUrl,
        ThumbnailURL: thumbnailUrl,
        IsLivePhoto: item.is_live_photo,
        IsPrimary: item.is_primary,
        DisplayOrder: item.display_order,
        CreatedAt: item.created_at,
      };
    })
  );

  return NextResponse.json({
    success: true,
    data: formattedGallery,
    msg: "Gallery fetched successfully",
  });
}

/**
 * PUT /api/users/me/gallery
 * Reorder gallery items or set primary photo
 */
export async function PUT(request: Request) {
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

  try {
    const body = await request.json();
    const { order, primary_id } = body;

    // Handle reordering
    if (order && Array.isArray(order)) {
      // order should be an array of { id: string, display_order: number }
      for (const item of order) {
        if (item.id && typeof item.display_order === "number") {
          await supabase
            .from("user_gallery")
            .update({ display_order: item.display_order })
            .eq("id", item.id)
            .eq("user_id", user.id);
        }
      }
    }

    // Handle setting primary photo
    if (primary_id) {
      // First, unset all primary flags
      await supabase
        .from("user_gallery")
        .update({ is_primary: false })
        .eq("user_id", user.id);

      // Then set the new primary
      const { data: primaryItem, error: primaryError } = await supabase
        .from("user_gallery")
        .update({ is_primary: true })
        .eq("id", primary_id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (primaryError) {
        console.error("Error setting primary photo:", primaryError);
        return NextResponse.json(
          { success: false, msg: "Error setting primary photo" },
          { status: 500 }
        );
      }

      // Update profile photo URL if it's an image
      if (primaryItem && primaryItem.media_type === "image") {
        // Store the storage path (not full URL) so /api/users/me can generate signed URLs
        // The gallery bucket is private, so we need signed URLs for access
        // If media_url is already a full URL, extract the path or use as-is
        let profileImagePath = primaryItem.media_url;
        
        // If it's already a full URL with the storage path, extract just the path
        if (profileImagePath.startsWith("http")) {
          // Try to extract path from URL like: .../storage/v1/object/public/gallery/userId/file.jpg
          const match = profileImagePath.match(/\/gallery\/(.+?)(?:\?|$)/);
          if (match) {
            profileImagePath = match[1];
          }
        }
        
        await supabase
          .from("profiles")
          .update({ profile_image_url: profileImagePath })
          .eq("user_id", user.id);
      }
    }

    return NextResponse.json({
      success: true,
      msg: "Gallery updated successfully",
    });
  } catch (error) {
    console.error("Error updating gallery:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/users/me/gallery
 * Delete a gallery item (by query param)
 */
export async function DELETE(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const galleryId = searchParams.get("id") || searchParams.get("gallery_id");

  if (!galleryId) {
    return NextResponse.json(
      { success: false, msg: "Gallery item ID is required" },
      { status: 400 }
    );
  }

  // Get the item first to check ownership and get URL
  const { data: item } = await supabase
    .from("user_gallery")
    .select("id, media_url, is_primary")
    .eq("id", galleryId)
    .eq("user_id", user.id)
    .single();

  if (!item) {
    return NextResponse.json(
      { success: false, msg: "Gallery item not found" },
      { status: 404 }
    );
  }

  // Delete from database
  const { error } = await supabase
    .from("user_gallery")
    .delete()
    .eq("id", galleryId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting gallery item:", error);
    return NextResponse.json(
      { success: false, msg: "Error deleting gallery item" },
      { status: 500 }
    );
  }

  // If this was the primary, set next item as primary
  if (item.is_primary) {
    const { data: nextItem } = await supabase
      .from("user_gallery")
      .select("id, media_url, media_type")
      .eq("user_id", user.id)
      .eq("media_type", "image")
      .order("display_order", { ascending: true })
      .limit(1)
      .single();

    if (nextItem) {
      await supabase
        .from("user_gallery")
        .update({ is_primary: true })
        .eq("id", nextItem.id);

      // Store the storage path (not full URL) so /api/users/me can generate signed URLs
      let profileImagePath = nextItem.media_url;
      if (profileImagePath.startsWith("http")) {
        const match = profileImagePath.match(/\/gallery\/(.+?)(?:\?|$)/);
        if (match) {
          profileImagePath = match[1];
        }
      }
      await supabase
        .from("profiles")
        .update({ profile_image_url: profileImagePath })
        .eq("user_id", user.id);
    } else {
      // No more photos, clear profile image
      await supabase
        .from("profiles")
        .update({ profile_image_url: null })
        .eq("user_id", user.id);
    }
  }

  // TODO: Also delete from Supabase Storage if needed
  // This would require knowing the storage path

  return NextResponse.json({
    success: true,
    msg: "Gallery item deleted successfully",
  });
}
