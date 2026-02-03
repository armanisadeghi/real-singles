import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import {
  STORAGE_BUCKETS,
  FILE_SIZE_LIMITS,
  ALLOWED_IMAGE_MIME_TYPES,
  getVerificationSelfiePath,
} from "@/lib/supabase/storage";
import { resolveVerificationSelfieUrl } from "@/lib/supabase/url-utils";

/**
 * GET /api/users/me/verification-selfie
 * Get the current user's verification selfie with a signed URL
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

    // Get profile with verification selfie data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("verification_selfie_url")
      .eq("user_id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { success: false, msg: "Error fetching profile" },
        { status: 500 }
      );
    }

    if (!profile?.verification_selfie_url) {
      return NextResponse.json({
        success: true,
        data: {
          verificationSelfieUrl: null,
          storagePath: null,
        },
        msg: "No verification selfie found",
      });
    }

    // Generate signed URL for the verification selfie
    const signedUrl = await resolveVerificationSelfieUrl(
      supabase,
      profile.verification_selfie_url,
      { expiresIn: 3600 }
    );

    return NextResponse.json({
      success: true,
      data: {
        verificationSelfieUrl: signedUrl,
        storagePath: profile.verification_selfie_url,
      },
      msg: "Verification selfie fetched successfully",
    });
  } catch (error) {
    console.error("Error in GET /api/users/me/verification-selfie:", error);
    return NextResponse.json(
      { success: false, msg: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/me/verification-selfie
 * Upload a new verification selfie
 * 
 * Form data:
 * - file: Image file (jpeg, png, webp, etc.)
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

    // Validate file
    if (!file) {
      return NextResponse.json(
        { success: false, msg: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit for verification selfies)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, msg: `File size exceeds maximum of 5MB` },
        { status: 400 }
      );
    }

    // Validate MIME type - only images allowed
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as typeof ALLOWED_IMAGE_MIME_TYPES[number])) {
      return NextResponse.json(
        {
          success: false,
          msg: `File type ${file.type} not allowed. Allowed: ${ALLOWED_IMAGE_MIME_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Get existing verification selfie to delete later
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("verification_selfie_url")
      .eq("user_id", user.id)
      .single();

    const oldSelfiePath = existingProfile?.verification_selfie_url;

    // Generate file path
    const fileExtension = file.name.split(".").pop() || getExtensionFromMimeType(file.type);
    const filePath = getVerificationSelfiePath(user.id, fileExtension);

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage (gallery bucket - private)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.GALLERY)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
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

    // Update profile with new verification selfie
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: user.id,
          verification_selfie_url: uploadData.path,
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

    // Delete old verification selfie file if it exists
    if (oldSelfiePath && !oldSelfiePath.startsWith("http")) {
      await supabase.storage.from(STORAGE_BUCKETS.GALLERY).remove([oldSelfiePath]);
    }

    // Generate signed URL for response
    const signedUrl = await resolveVerificationSelfieUrl(supabase, uploadData.path, { expiresIn: 3600 });

    return NextResponse.json({
      success: true,
      data: {
        verificationSelfieUrl: signedUrl,
        storagePath: uploadData.path,
      },
      msg: "Verification selfie uploaded successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/users/me/verification-selfie:", error);
    return NextResponse.json(
      { success: false, msg: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/me/verification-selfie
 * Delete the current user's verification selfie
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

    // Get existing verification selfie path
    const { data: profile } = await supabase
      .from("profiles")
      .select("verification_selfie_url")
      .eq("user_id", user.id)
      .single();

    if (!profile?.verification_selfie_url) {
      return NextResponse.json({
        success: true,
        msg: "No verification selfie to delete",
      });
    }

    const selfiePath = profile.verification_selfie_url;

    // Clear verification selfie from profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        verification_selfie_url: null,
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
    if (!selfiePath.startsWith("http")) {
      const { error: deleteError } = await supabase.storage
        .from(STORAGE_BUCKETS.GALLERY)
        .remove([selfiePath]);

      if (deleteError) {
        console.error("Storage delete error:", deleteError);
        // Don't fail the request, file cleanup can be done later
      }
    }

    return NextResponse.json({
      success: true,
      msg: "Verification selfie deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/users/me/verification-selfie:", error);
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
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/avif": "avif",
    "image/heic": "heic",
    "image/heif": "heif",
  };
  return mimeToExt[mimeType] || "jpg";
}
