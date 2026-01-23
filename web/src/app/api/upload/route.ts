import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  STORAGE_BUCKETS,
  FILE_SIZE_LIMITS,
  ALLOWED_MIME_TYPES,
  getAvatarPath,
  getGalleryPath,
  type StorageBucket,
} from "@/lib/supabase/storage";

// Helper to create authenticated Supabase client
async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

/**
 * POST /api/upload
 * Upload a file to Supabase Storage
 * 
 * Form data:
 * - file: File to upload
 * - bucket: "avatars" | "gallery" | "events"
 * - filename: (optional) Custom filename, defaults to original
 * - eventId: (required for events bucket) Event ID
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucketName = formData.get("bucket") as string | null;
    const customFilename = formData.get("filename") as string | null;
    const eventId = formData.get("eventId") as string | null;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!bucketName) {
      return NextResponse.json(
        { error: "Bucket name required" },
        { status: 400 }
      );
    }

    // Validate bucket name
    const validBuckets = Object.values(STORAGE_BUCKETS);
    if (!validBuckets.includes(bucketName as StorageBucket)) {
      return NextResponse.json(
        { error: `Invalid bucket. Must be one of: ${validBuckets.join(", ")}` },
        { status: 400 }
      );
    }

    const bucket = bucketName as StorageBucket;

    // Validate file size
    const maxSize = FILE_SIZE_LIMITS[bucket];
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate MIME type
    const allowedTypes = ALLOWED_MIME_TYPES[bucket] as readonly string[];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: `File type ${file.type} not allowed. Allowed: ${allowedTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Generate file path based on bucket type
    let filePath: string;
    const fileExtension = file.name.split(".").pop() || "jpg";
    const timestamp = Date.now();

    switch (bucket) {
      case STORAGE_BUCKETS.AVATARS:
        // Avatar path: {userId}/avatar.{ext}
        filePath = getAvatarPath(user.id, fileExtension);
        break;

      case STORAGE_BUCKETS.GALLERY:
        // Gallery path: {userId}/{timestamp}_{filename}
        const galleryFilename = customFilename || `${timestamp}_${file.name}`;
        filePath = getGalleryPath(user.id, galleryFilename);
        break;

      case STORAGE_BUCKETS.EVENTS:
        // Events bucket requires eventId
        if (!eventId) {
          return NextResponse.json(
            { error: "Event ID required for events bucket" },
            { status: 400 }
          );
        }
        // Verify user is admin or event creator
        const { data: eventData } = await supabase
          .from("events")
          .select("created_by")
          .eq("id", eventId)
          .single();

        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        const isAdmin = userData?.role === "admin";
        const isCreator = eventData?.created_by === user.id;

        if (!isAdmin && !isCreator) {
          return NextResponse.json(
            { error: "Only admins or event creators can upload event images" },
            { status: 403 }
          );
        }

        filePath = `${eventId}/${timestamp}_${file.name}`;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid bucket" },
          { status: 400 }
        );
    }

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: bucket === STORAGE_BUCKETS.AVATARS, // Upsert only for avatars
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // Get the public URL (for public buckets) or path (for private)
    let publicUrl: string | null = null;
    if (bucket === STORAGE_BUCKETS.AVATARS || bucket === STORAGE_BUCKETS.EVENTS) {
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(uploadData.path);
      publicUrl = urlData.publicUrl;
    }

    // If uploading avatar, update the profile
    if (bucket === STORAGE_BUCKETS.AVATARS && publicUrl) {
      await supabase
        .from("profiles")
        .update({ profile_photo_url: publicUrl })
        .eq("user_id", user.id);
    }

    // If uploading to gallery, create gallery entry
    if (bucket === STORAGE_BUCKETS.GALLERY) {
      const isVideo = file.type.startsWith("video/");
      await supabase.from("user_gallery").insert({
        user_id: user.id,
        media_url: uploadData.path,
        media_type: isVideo ? "video" : "photo",
        display_order: 999, // Will be reordered by user
      });
    }

    return NextResponse.json({
      success: true,
      path: uploadData.path,
      publicUrl,
      bucket,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload
 * Delete a file from Supabase Storage
 * 
 * Query params:
 * - bucket: Storage bucket name
 * - path: File path to delete
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get("bucket") as StorageBucket | null;
    const path = searchParams.get("path");

    if (!bucket || !path) {
      return NextResponse.json(
        { error: "Bucket and path required" },
        { status: 400 }
      );
    }

    // Validate bucket
    const validBuckets = Object.values(STORAGE_BUCKETS);
    if (!validBuckets.includes(bucket)) {
      return NextResponse.json(
        { error: "Invalid bucket" },
        { status: 400 }
      );
    }

    // Verify ownership (path should start with user ID for avatars/gallery)
    if (bucket === STORAGE_BUCKETS.AVATARS || bucket === STORAGE_BUCKETS.GALLERY) {
      if (!path.startsWith(user.id)) {
        return NextResponse.json(
          { error: "Cannot delete files owned by other users" },
          { status: 403 }
        );
      }
    }

    // For events, verify admin or creator
    if (bucket === STORAGE_BUCKETS.EVENTS) {
      const eventId = path.split("/")[0];
      const { data: eventData } = await supabase
        .from("events")
        .select("created_by")
        .eq("id", eventId)
        .single();

      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      const isAdmin = userData?.role === "admin";
      const isCreator = eventData?.created_by === user.id;

      if (!isAdmin && !isCreator) {
        return NextResponse.json(
          { error: "Only admins or event creators can delete event images" },
          { status: 403 }
        );
      }
    }

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    // If gallery item, also delete from user_gallery table
    if (bucket === STORAGE_BUCKETS.GALLERY) {
      await supabase
        .from("user_gallery")
        .delete()
        .eq("user_id", user.id)
        .eq("media_url", path);
    }

    return NextResponse.json({
      success: true,
      deleted: path,
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
