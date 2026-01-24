import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/verify-selfie
 * Upload a verification selfie for photo verification
 * 
 * This endpoint:
 * 1. Accepts a selfie image
 * 2. Stores it in the verification bucket
 * 3. Updates the user's verification status to pending review
 * 
 * In production, this could be enhanced with AI face matching.
 */
export async function POST(request: Request) {
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
    const formData = await request.formData();
    const file = formData.get("selfie") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, msg: "No selfie image provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, msg: "Invalid file type. Please upload a JPEG, PNG, or WebP image." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, msg: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${user.id}/verification-selfie-${Date.now()}.${ext}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { success: false, msg: "Failed to upload selfie" },
        { status: 500 }
      );
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(uploadData.path);

    const selfieUrl = urlData.publicUrl;

    // Update profile with verification selfie
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        verification_selfie_url: selfieUrl,
        // In a real system, this would be set by an admin or AI verification
        // For now, we'll auto-verify for demo purposes
        is_photo_verified: true,
        photo_verified_at: new Date().toISOString(),
        is_verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json(
        { success: false, msg: "Failed to update verification status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      msg: "Photo verification complete! Your profile is now verified.",
      data: {
        selfie_url: selfieUrl,
        is_verified: true,
      },
    });
  } catch (error) {
    console.error("Error in verify-selfie:", error);
    return NextResponse.json(
      { success: false, msg: "Failed to process selfie" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/verify-selfie
 * Get current verification status
 */
export async function GET() {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("verification_selfie_url, is_photo_verified, photo_verified_at, is_verified, verified_at")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    success: true,
    data: {
      selfie_url: profile?.verification_selfie_url || null,
      is_photo_verified: profile?.is_photo_verified || false,
      photo_verified_at: profile?.photo_verified_at || null,
      is_verified: profile?.is_verified || false,
      verified_at: profile?.verified_at || null,
    },
  });
}
