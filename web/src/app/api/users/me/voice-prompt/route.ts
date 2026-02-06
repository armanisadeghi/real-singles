import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import {
  STORAGE_BUCKETS,
  FILE_SIZE_LIMITS,
  VOICE_PROMPT_MIME_TYPES,
  getVoicePromptPath,
} from "@/lib/supabase/storage";
import { resolveVoicePromptUrl } from "@/lib/supabase/url-utils";

// Max voice prompt duration in seconds
const MAX_VOICE_PROMPT_DURATION = 30;

/**
 * GET /api/users/me/voice-prompt
 * Get the current user's voice prompt with a signed URL
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

    // Get profile with voice prompt data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("voice_prompt_url, voice_prompt_duration_seconds")
      .eq("user_id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { success: false, msg: "Error fetching profile" },
        { status: 500 }
      );
    }

    if (!profile?.voice_prompt_url) {
      return NextResponse.json({
        success: true,
        data: {
          voicePromptUrl: null,
          durationSeconds: null,
        },
        msg: "No voice prompt found",
      });
    }

    // Generate signed URL for the voice prompt
    const signedUrl = await resolveVoicePromptUrl(
      supabase,
      profile.voice_prompt_url,
      { expiresIn: 3600 }
    );

    return NextResponse.json({
      success: true,
      data: {
        voicePromptUrl: signedUrl,
        storagePath: profile.voice_prompt_url,
        durationSeconds: profile.voice_prompt_duration_seconds,
      },
      msg: "Voice prompt fetched successfully",
    });
  } catch (error) {
    console.error("Error in GET /api/users/me/voice-prompt:", error);
    return NextResponse.json(
      { success: false, msg: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/me/voice-prompt
 * Upload a new voice prompt
 * 
 * Form data:
 * - file: Audio file (webm, mp4, mpeg, ogg, wav)
 * - duration: Duration in seconds (1-30)
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

    // Validate MIME type (strip codec parameters like ";codecs=opus" from browser MediaRecorder)
    const baseMimeType = file.type.split(";")[0].trim();
    if (!VOICE_PROMPT_MIME_TYPES.includes(baseMimeType as typeof VOICE_PROMPT_MIME_TYPES[number])) {
      return NextResponse.json(
        {
          success: false,
          msg: `File type ${file.type} not allowed. Allowed: ${VOICE_PROMPT_MIME_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate duration
    const duration = durationStr ? parseInt(durationStr, 10) : null;
    if (duration !== null) {
      if (isNaN(duration) || duration < 1 || duration > MAX_VOICE_PROMPT_DURATION) {
        return NextResponse.json(
          { success: false, msg: `Duration must be between 1 and ${MAX_VOICE_PROMPT_DURATION} seconds` },
          { status: 400 }
        );
      }
    }

    // Get existing voice prompt to delete later
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("voice_prompt_url")
      .eq("user_id", user.id)
      .single();

    const oldVoicePromptPath = existingProfile?.voice_prompt_url;

    // Generate file path
    const fileExtension = file.name.split(".").pop() || getExtensionFromMimeType(baseMimeType);
    const filePath = getVoicePromptPath(user.id, fileExtension);

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

    // Update profile with new voice prompt
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: user.id,
          voice_prompt_url: uploadData.path,
          voice_prompt_duration_seconds: duration,
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

    // Delete old voice prompt file if it exists
    if (oldVoicePromptPath && !oldVoicePromptPath.startsWith("http")) {
      await supabase.storage.from(STORAGE_BUCKETS.GALLERY).remove([oldVoicePromptPath]);
    }

    // Generate signed URL for response
    const signedUrl = await resolveVoicePromptUrl(supabase, uploadData.path, { expiresIn: 3600 });

    return NextResponse.json({
      success: true,
      data: {
        voicePromptUrl: signedUrl,
        storagePath: uploadData.path,
        durationSeconds: duration,
      },
      msg: "Voice prompt uploaded successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/users/me/voice-prompt:", error);
    return NextResponse.json(
      { success: false, msg: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/me/voice-prompt
 * Delete the current user's voice prompt
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

    // Get existing voice prompt path
    const { data: profile } = await supabase
      .from("profiles")
      .select("voice_prompt_url")
      .eq("user_id", user.id)
      .single();

    if (!profile?.voice_prompt_url) {
      return NextResponse.json({
        success: true,
        msg: "No voice prompt to delete",
      });
    }

    const voicePromptPath = profile.voice_prompt_url;

    // Clear voice prompt from profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        voice_prompt_url: null,
        voice_prompt_duration_seconds: null,
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
    if (!voicePromptPath.startsWith("http")) {
      const { error: deleteError } = await supabase.storage
        .from(STORAGE_BUCKETS.GALLERY)
        .remove([voicePromptPath]);

      if (deleteError) {
        console.error("Storage delete error:", deleteError);
        // Don't fail the request, file cleanup can be done later
      }
    }

    return NextResponse.json({
      success: true,
      msg: "Voice prompt deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/users/me/voice-prompt:", error);
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
    "audio/webm": "webm",
    "audio/mp4": "m4a",
    "audio/mpeg": "mp3",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
  };
  return mimeToExt[mimeType] || "webm";
}
