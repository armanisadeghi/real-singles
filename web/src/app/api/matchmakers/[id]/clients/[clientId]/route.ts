import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";
import { verifyMatchmakerOwnership } from "@/lib/services/matchmakers";
import { z } from "zod";

// Validation schema for client updates
const updateSchema = z.object({
  status: z.enum(["active", "paused", "completed", "cancelled"]).optional(),
  notes: z.string().max(5000).optional(),
});

/**
 * GET /api/matchmakers/[id]/clients/[clientId]
 * Get detailed client information including profile (matchmaker only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; clientId: string }> }
) {
  const supabase = await createApiClient();
  const { id: matchmakerId, clientId } = await params;

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

  // Verify ownership
  const ownershipCheck = await verifyMatchmakerOwnership(
    supabase,
    matchmakerId,
    user.id
  );
  if (!ownershipCheck.success) {
    return NextResponse.json(
      { success: false, msg: ownershipCheck.error },
      { status: 403 }
    );
  }

  // Fetch the client relationship
  const { data: clientRecord, error: clientError } = await supabase
    .from("matchmaker_clients")
    .select("*")
    .eq("id", clientId)
    .eq("matchmaker_id", matchmakerId)
    .single();

  if (clientError || !clientRecord) {
    return NextResponse.json(
      { success: false, msg: "Client not found" },
      { status: 404 }
    );
  }

  // Fetch the user record (for email)
  const { data: userRecord } = await supabase
    .from("users")
    .select("id, email, display_name, status, last_active_at")
    .eq("id", clientRecord.client_user_id)
    .single();

  // Fetch the user's profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(`
      user_id,
      first_name,
      last_name,
      date_of_birth,
      gender,
      city,
      state,
      country,
      zip_code,
      latitude,
      longitude,
      occupation,
      bio,
      profile_image_url,
      is_verified,
      is_photo_verified,
      height_inches,
      body_type,
      zodiac_sign,
      interests,
      education,
      religion,
      ethnicity,
      languages,
      has_kids,
      wants_kids,
      pets,
      smoking,
      drinking,
      marijuana,
      ideal_first_date,
      non_negotiables,
      way_to_heart,
      looking_for,
      dating_intentions,
      can_start_matching,
      profile_hidden,
      voice_prompt_url,
      voice_prompt_duration_seconds,
      video_intro_url,
      video_intro_duration_seconds
    `)
    .eq("user_id", clientRecord.client_user_id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { success: false, msg: "Profile not found" },
      { status: 404 }
    );
  }

  // Resolve profile image URL
  const profileImageUrl = profile.profile_image_url
    ? await resolveStorageUrl(supabase, profile.profile_image_url)
    : null;

  // Fetch gallery images
  const { data: gallery } = await supabase
    .from("user_gallery")
    .select("id, media_url, is_primary, display_order")
    .eq("user_id", clientRecord.client_user_id)
    .order("display_order", { ascending: true });

  // Resolve gallery URLs
  const galleryWithUrls = await Promise.all(
    (gallery || []).map(async (img) => ({
      id: img.id,
      image_url: await resolveStorageUrl(supabase, img.media_url),
      is_primary: img.is_primary,
      position: img.display_order,
    }))
  );

  // Fetch user's search filters (for algorithm simulation)
  const { data: userFilters } = await supabase
    .from("user_filters")
    .select(`
      min_age, max_age, min_height, max_height, max_distance_miles,
      body_types, ethnicities, religions, education_levels, zodiac_signs,
      smoking, drinking, marijuana, has_kids, wants_kids
    `)
    .eq("user_id", clientRecord.client_user_id)
    .single();

  // Fetch introductions involving this client
  const { data: introductions } = await supabase
    .from("matchmaker_introductions")
    .select(`
      id,
      user_a_id,
      user_b_id,
      status,
      outcome,
      created_at
    `)
    .eq("matchmaker_id", matchmakerId)
    .or(`user_a_id.eq.${clientRecord.client_user_id},user_b_id.eq.${clientRecord.client_user_id}`)
    .order("created_at", { ascending: false })
    .limit(10);

  // Resolve voice/video URLs if they exist
  const voicePromptUrl = profile.voice_prompt_url
    ? await resolveStorageUrl(supabase, profile.voice_prompt_url)
    : null;
  const videoIntroUrl = profile.video_intro_url
    ? await resolveStorageUrl(supabase, profile.video_intro_url)
    : null;

  return NextResponse.json({
    success: true,
    data: {
      // Client relationship info
      client: {
        id: clientRecord.id,
        status: clientRecord.status,
        notes: clientRecord.notes,
        started_at: clientRecord.created_at,
        ended_at: clientRecord.ended_at,
      },
      // User info (for email/messaging)
      user: {
        id: userRecord?.id,
        email: userRecord?.email,
        display_name: userRecord?.display_name,
        status: userRecord?.status,
        last_active_at: userRecord?.last_active_at,
      },
      // Profile info (safe for matchmaker to see)
      profile: {
        ...profile,
        profile_image_url: profileImageUrl,
        voice_prompt_url: voicePromptUrl,
        video_intro_url: videoIntroUrl,
      },
      // Gallery images
      gallery: galleryWithUrls,
      // User's search filters
      filters: userFilters,
      // Recent introductions
      introductions: introductions || [],
    },
    msg: "Client details fetched successfully",
  });
}

/**
 * PATCH /api/matchmakers/[id]/clients/[clientId]
 * Update client relationship (matchmaker only)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; clientId: string }> }
) {
  const supabase = await createApiClient();
  const { id: matchmakerId, clientId } = await params;

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

  // Verify ownership
  const ownershipCheck = await verifyMatchmakerOwnership(
    supabase,
    matchmakerId,
    user.id
  );
  if (!ownershipCheck.success) {
    return NextResponse.json(
      { success: false, msg: ownershipCheck.error },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, msg: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const updates = validation.data;

    // If status is changing to completed/cancelled, set ended_at
    if (updates.status && ["completed", "cancelled"].includes(updates.status)) {
      (updates as any).ended_at = new Date().toISOString();
    }

    // Update client relationship
    const { error: updateError } = await supabase
      .from("matchmaker_clients")
      .update(updates)
      .eq("id", clientId)
      .eq("matchmaker_id", matchmakerId);

    if (updateError) {
      console.error("Error updating client:", updateError);
      return NextResponse.json(
        { success: false, msg: "Error updating client" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      msg: "Client relationship updated successfully",
    });
  } catch (error) {
    console.error("Error in PATCH /api/matchmakers/[id]/clients/[clientId]:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/matchmakers/[id]/clients/[clientId]
 * End client relationship (matchmaker only)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; clientId: string }> }
) {
  const supabase = await createApiClient();
  const { id: matchmakerId, clientId } = await params;

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

  // Verify ownership
  const ownershipCheck = await verifyMatchmakerOwnership(
    supabase,
    matchmakerId,
    user.id
  );
  if (!ownershipCheck.success) {
    return NextResponse.json(
      { success: false, msg: ownershipCheck.error },
      { status: 403 }
    );
  }

  // Set status to cancelled instead of deleting
  const { error: updateError } = await supabase
    .from("matchmaker_clients")
    .update({
      status: "cancelled",
      ended_at: new Date().toISOString(),
    })
    .eq("id", clientId)
    .eq("matchmaker_id", matchmakerId);

  if (updateError) {
    console.error("Error ending client relationship:", updateError);
    return NextResponse.json(
      { success: false, msg: "Error ending relationship" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    msg: "Client relationship ended",
  });
}
