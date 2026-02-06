import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import {
  STORAGE_BUCKETS,
  FILE_SIZE_LIMITS,
  VIDEO_INTRO_MIME_TYPES,
  getVideoIntroPath,
} from "@/lib/supabase/storage";
import { resolveVideoIntroUrl } from "@/lib/supabase/url-utils";

// Max video intro duration in seconds
const MAX_VIDEO_INTRO_DURATION = 60;

/**
 * GET /api/users/me/video-intro
 * Get the current user's video intro with a signed URL
 */
export async function GET() {
  try {
    const supabase = await createApiClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, msg: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get profile with video intro data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("video_intro_url, video_intro_duration_seconds")
      .eq("user_id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { success: false, msg: "Error fetching profile" },
        { status: 500 }
      );
    }

    if (!profile?.video_intro_url) {
      return NextResponse.json({
        success: true,
        data: {
          videoIntroUrl: null,
          durationSeconds: null,
        },
        msg: "No video intro found",
      });
    }

    // Generate signed URL for the video intro
    const signedUrl = await resolveVideoIntroUrl(
      supabase,
      profile.video_intro_url,
      { expiresIn: 3600 }
    );

    return NextResponse.json({
      success: true,
      data: {
        videoIntroUrl: signedUrl,
        storagePath: profile.video_intro_url,
        durationSeconds: profile.video_intro_duration_seconds,
      },
      msg: "Video intro fetched successfully",
    });
  } catch (error) {
    console.error("Error in GET /api/users/me/video-intro:", error);
    return NextResponse.json(
      { success: false, msg: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/me/video-intro
 * Upload a new video intro
 * 
 * Form data:
 * - file: Video file (mp4, quicktime, webm)
 * - duration: Duration in seconds (1-60)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, msg: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const durationStr = formData.get("duration") as string | null;

    // Validate file
    if (!file) {
      return NextResponse.json(
        { success: false, msg: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (use gallery limits since stored in gallery bucket)
    const maxSize = FILE_SIZE_LIMITS[STORAGE_BUCKETS.GALLERY];
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, msg: `File size exceeds maximum of ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate MIME type (strip codec parameters like ";codecs=vp9,opus" from browser MediaRecorder)
    const baseMimeType = file.type.split(";")[0].trim();
    if (!VIDEO_INTRO_MIME_TYPES.includes(baseMimeType as typeof VIDEO_INTRO_MIME_TYPES[number])) {
      return NextResponse.json(
        {
          success: false,
          msg: `File type ${file.type} not allowed. Allowed: ${VIDEO_INTRO_MIME_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate duration
    const duration = durationStr ? parseInt(durationStr, 10) : null;
    if (duration !== null) {
      if (isNaN(duration) || duration < 1 || duration > MAX_VIDEO_INTRO_DURATION) {
        return NextResponse.json(
          { success: false, msg: `Duration must be between 1 and ${MAX_VIDEO_INTRO_DURATION} seconds` },
          { status: 400 }
        );
      }
    }

    // Get existing video intro to delete later
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("video_intro_url")
      .eq("user_id", user.id)
      .single();

    const oldVideoIntroPath = existingProfile?.video_intro_url;

    // Generate file path
    const fileExtension = file.name.split(".").pop() || getExtensionFromMimeType(baseMimeType);
    const filePath = getVideoIntroPath(user.id, fileExtension);

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage (gallery bucket)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.GALLERY)
      .upload(filePath, fileBuffer, {
        contentType: baseMimeType,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { success: false, msg: uploadError.message },
        { status: 500 }
      );
    }

    // Update profile with new video intro
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: user.id,
          video_intro_url: uploadData.path,
          video_intro_duration_seconds: duration,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (profileError) {
      console.error("Profile update error:", profileError);
      // Try to clean up uploaded file
      await supabase.storage.from(STORAGE_BUCKETS.GALLERY).remove([uploadData.path]);
      return NextResponse.json(
        { success: false, msg: "Failed to update profile" },
        { status: 500 }
      );
    }

    // Delete old video intro file if it exists
    if (oldVideoIntroPath && !oldVideoIntroPath.startsWith("http")) {
      await supabase.storage.from(STORAGE_BUCKETS.GALLERY).remove([oldVideoIntroPath]);
    }

    // Generate signed URL for response
    const signedUrl = await resolveVideoIntroUrl(supabase, uploadData.path, { expiresIn: 3600 });

    return NextResponse.json({
      success: true,
      data: {
        videoIntroUrl: signedUrl,
        storagePath: uploadData.path,
        durationSeconds: duration,
      },
      msg: "Video intro uploaded successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/users/me/video-intro:", error);
    return NextResponse.json(
      { success: false, msg: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/me/video-intro
 * Delete the current user's video intro
 */
export async function DELETE() {
  try {
    const supabase = await createApiClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, msg: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get existing video intro path
    const { data: profile } = await supabase
      .from("profiles")
      .select("video_intro_url")
      .eq("user_id", user.id)
      .single();

    if (!profile?.video_intro_url) {
      return NextResponse.json({
        success: true,
        msg: "No video intro to delete",
      });
    }

    const videoIntroPath = profile.video_intro_url;

    // Clear video intro from profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        video_intro_url: null,
        video_intro_duration_seconds: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
      return NextResponse.json(
        { success: false, msg: "Failed to update profile" },
        { status: 500 }
      );
    }

    // Delete file from storage (if it's a storage path, not a URL)
    if (!videoIntroPath.startsWith("http")) {
      const { error: deleteError } = await supabase.storage
        .from(STORAGE_BUCKETS.GALLERY)
        .remove([videoIntroPath]);

      if (deleteError) {
        console.error("Storage delete error:", deleteError);
        // Don't fail the request, file cleanup can be done later
      }
    }

    return NextResponse.json({
      success: true,
      msg: "Video intro deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/users/me/video-intro:", error);
    return NextResponse.json(
      { success: false, msg: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
  };
  return mimeToExt[mimeType] || "mp4";
}
