import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import {
  PROFILE_FIELDS,
  MIN_PHOTOS_REQUIRED,
  calculateCompletion,
  type ProfileData,
  type ProfileFieldDef,
} from "@/lib/onboarding/completion";

/**
 * GET /api/profile/completion
 * 
 * Returns the current user's profile completion status including:
 * - Completion percentage
 * - List of completed/incomplete fields
 * - Next field to complete
 * - Whether user can start matching
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

  // Get profile data - select all fields needed for completion calculation
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(`
      first_name, date_of_birth, gender, looking_for, bio, looking_for_description,
      height_inches, body_type, ethnicity, dating_intentions, marital_status,
      country, city, state, hometown, occupation, company, education, schools,
      religion, political_views, exercise, languages, smoking, drinking, marijuana,
      has_kids, wants_kids, pets, interests, life_goals, zodiac_sign,
      ideal_first_date, non_negotiables, way_to_heart, after_work, nightclub_or_home,
      pet_peeves, craziest_travel_story, weirdest_gift, worst_job, dream_job, past_event,
      social_link_1, social_link_2, voice_prompt_url, video_intro_url, verification_selfie_url,
      profile_completion_skipped, profile_completion_prefer_not, profile_completion_step,
      can_start_matching
    `)
    .eq("user_id", user.id)
    .single();

  if (profileError && profileError.code !== "PGRST116") {
    return NextResponse.json(
      { success: false, msg: "Error fetching profile" },
      { status: 500 }
    );
  }

  // Get gallery photo count (only images, not videos)
  const { count: photoCount } = await supabase
    .from("user_gallery")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("media_type", "image");

  // Calculate completion using shared SSOT function
  const completion = calculateCompletion(
    (profile || {}) as ProfileData,
    photoCount || 0
  );

  return NextResponse.json({
    success: true,
    data: {
      ...completion,
      // Include the database-stored can_start_matching value (source of truth)
      // This is automatically maintained by database triggers
      canStartMatchingDb: profile?.can_start_matching || false,
      // Include field definitions so clients know what to show
      fields: PROFILE_FIELDS.map(f => ({
        key: f.key,
        label: f.label,
        step: f.step,
        category: f.category,
        required: f.required,
        sensitive: f.sensitive,
      })),
    },
  });
}

/**
 * POST /api/profile/completion
 * 
 * Update profile completion tracking:
 * - Mark a field as skipped
 * - Mark a field as "prefer not to say"
 * - Save the current completion step
 * - Mark profile as complete
 * 
 * Body:
 * {
 *   action: "skip" | "prefer_not" | "unskip" | "remove_prefer_not" | "set_step" | "mark_complete",
 *   field?: string,  // Required for skip/prefer_not actions
 *   step?: number,   // Required for set_step action
 * }
 */
export async function POST(request: NextRequest) {
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

  const body = await request.json();
  const { action, field, step } = body;

  // Validate action
  const validActions = ["skip", "prefer_not", "unskip", "remove_prefer_not", "set_step", "mark_complete"];
  if (!validActions.includes(action)) {
    return NextResponse.json(
      { success: false, msg: `Invalid action. Must be one of: ${validActions.join(", ")}` },
      { status: 400 }
    );
  }

  // Get current profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("profile_completion_skipped, profile_completion_prefer_not, profile_completion_step")
    .eq("user_id", user.id)
    .single();

  if (profileError && profileError.code !== "PGRST116") {
    return NextResponse.json(
      { success: false, msg: "Error fetching profile" },
      { status: 500 }
    );
  }

  const currentSkipped = profile?.profile_completion_skipped || [];
  const currentPreferNot = profile?.profile_completion_prefer_not || [];
  const currentStep = profile?.profile_completion_step || 0;

  let updates: Record<string, unknown> = {};

  switch (action) {
    case "skip":
      if (!field) {
        return NextResponse.json(
          { success: false, msg: "Field is required for skip action" },
          { status: 400 }
        );
      }
      // Add to skipped if not already there
      if (!currentSkipped.includes(field)) {
        updates.profile_completion_skipped = [...currentSkipped, field];
      }
      // Also remove from prefer_not if it was there
      if (currentPreferNot.includes(field)) {
        updates.profile_completion_prefer_not = currentPreferNot.filter((f: string) => f !== field);
      }
      break;

    case "prefer_not":
      if (!field) {
        return NextResponse.json(
          { success: false, msg: "Field is required for prefer_not action" },
          { status: 400 }
        );
      }
      // Verify the field allows prefer_not_to_say
      const fieldDef = PROFILE_FIELDS.find(f => f.key === field);
      if (!fieldDef?.sensitive) {
        return NextResponse.json(
          { success: false, msg: `Field "${field}" does not allow prefer not to say option` },
          { status: 400 }
        );
      }
      // Add to prefer_not if not already there
      if (!currentPreferNot.includes(field)) {
        updates.profile_completion_prefer_not = [...currentPreferNot, field];
      }
      // Also remove from skipped if it was there
      if (currentSkipped.includes(field)) {
        updates.profile_completion_skipped = currentSkipped.filter((f: string) => f !== field);
      }
      break;

    case "unskip":
      if (!field) {
        return NextResponse.json(
          { success: false, msg: "Field is required for unskip action" },
          { status: 400 }
        );
      }
      // Remove from skipped
      updates.profile_completion_skipped = currentSkipped.filter((f: string) => f !== field);
      break;

    case "remove_prefer_not":
      if (!field) {
        return NextResponse.json(
          { success: false, msg: "Field is required for remove_prefer_not action" },
          { status: 400 }
        );
      }
      // Remove from prefer_not
      updates.profile_completion_prefer_not = currentPreferNot.filter((f: string) => f !== field);
      break;

    case "set_step":
      if (typeof step !== "number") {
        return NextResponse.json(
          { success: false, msg: "Step is required for set_step action" },
          { status: 400 }
        );
      }
      updates.profile_completion_step = step;
      break;

    case "mark_complete":
      updates.profile_completed_at = new Date().toISOString();
      break;
  }

  // Apply updates if any
  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json(
        { success: false, msg: "Error updating profile completion" },
        { status: 500 }
      );
    }
  }

  // Return updated completion status
  const { data: updatedProfile } = await supabase
    .from("profiles")
    .select(`
      first_name, date_of_birth, gender, looking_for, bio, looking_for_description,
      height_inches, body_type, ethnicity, dating_intentions, marital_status,
      country, city, state, hometown, occupation, company, education, schools,
      religion, political_views, exercise, languages, smoking, drinking, marijuana,
      has_kids, wants_kids, pets, interests, life_goals, zodiac_sign,
      ideal_first_date, non_negotiables, way_to_heart, after_work, nightclub_or_home,
      pet_peeves, craziest_travel_story, weirdest_gift, worst_job, dream_job, past_event,
      social_link_1, social_link_2, voice_prompt_url, video_intro_url, verification_selfie_url,
      profile_completion_skipped, profile_completion_prefer_not
    `)
    .eq("user_id", user.id)
    .single();

  // Get gallery photo count
  const { count: photoCount } = await supabase
    .from("user_gallery")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("media_type", "image");

  const completion = calculateCompletion(
    (updatedProfile || {}) as ProfileData,
    photoCount || 0
  );

  return NextResponse.json({
    success: true,
    msg: `Action "${action}" completed successfully`,
    data: completion,
  });
}
