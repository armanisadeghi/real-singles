import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

/**
 * Profile Completion System
 * 
 * This API handles all profile completion logic server-side so it's consistent
 * across web, iOS, and Android. All clients should use this API rather than
 * implementing their own completion logic.
 * 
 * Key concepts:
 * - Required fields: Must be filled to start matching
 * - Optional fields: Can be skipped or marked "prefer not to say"
 * - Skipped: User clicked "Skip" - we'll ask again later
 * - Prefer Not To Say: User explicitly chose not to share - we won't ask again
 */

// ============================================
// PROFILE FIELD DEFINITIONS
// ============================================

interface ProfileField {
  key: string;           // API/database field name
  dbColumn: string;      // Actual database column name
  label: string;         // Human-readable label
  required: boolean;     // Required to start matching
  sensitive: boolean;    // Allows "prefer not to say" option
  step: number;          // Order in the signup flow
  category: string;      // Grouping for UI
}

// Define all profile fields in order
const PROFILE_FIELDS: ProfileField[] = [
  // Step 1: Basic Info (Required)
  { key: "first_name", dbColumn: "first_name", label: "First Name", required: true, sensitive: false, step: 1, category: "basic" },
  { key: "date_of_birth", dbColumn: "date_of_birth", label: "Date of Birth", required: true, sensitive: false, step: 2, category: "basic" },
  { key: "gender", dbColumn: "gender", label: "Gender", required: true, sensitive: false, step: 3, category: "basic" },
  { key: "looking_for", dbColumn: "looking_for", label: "Looking For", required: true, sensitive: false, step: 4, category: "basic" },
  { key: "profile_image_url", dbColumn: "profile_image_url", label: "Profile Photo", required: true, sensitive: false, step: 5, category: "media" },
  
  // Step 6-10: Location & Physical
  { key: "city", dbColumn: "city", label: "City", required: false, sensitive: false, step: 6, category: "location" },
  { key: "state", dbColumn: "state", label: "State", required: false, sensitive: false, step: 7, category: "location" },
  { key: "height_inches", dbColumn: "height_inches", label: "Height", required: false, sensitive: false, step: 8, category: "physical" },
  { key: "body_type", dbColumn: "body_type", label: "Body Type", required: false, sensitive: false, step: 9, category: "physical" },
  { key: "ethnicity", dbColumn: "ethnicity", label: "Ethnicity", required: false, sensitive: true, step: 10, category: "physical" },
  
  // Step 11-15: Background
  { key: "religion", dbColumn: "religion", label: "Religion", required: false, sensitive: true, step: 11, category: "background" },
  { key: "political_views", dbColumn: "political_views", label: "Political Views", required: false, sensitive: true, step: 12, category: "background" },
  { key: "education", dbColumn: "education", label: "Education", required: false, sensitive: false, step: 13, category: "background" },
  { key: "occupation", dbColumn: "occupation", label: "Occupation", required: false, sensitive: false, step: 14, category: "background" },
  { key: "marital_status", dbColumn: "marital_status", label: "Marital Status", required: false, sensitive: true, step: 15, category: "background" },
  
  // Step 16-20: Family & Lifestyle
  { key: "has_kids", dbColumn: "has_kids", label: "Have Children", required: false, sensitive: true, step: 16, category: "family" },
  { key: "wants_kids", dbColumn: "wants_kids", label: "Want Children", required: false, sensitive: true, step: 17, category: "family" },
  { key: "smoking", dbColumn: "smoking", label: "Smoking", required: false, sensitive: false, step: 18, category: "lifestyle" },
  { key: "drinking", dbColumn: "drinking", label: "Drinking", required: false, sensitive: false, step: 19, category: "lifestyle" },
  { key: "marijuana", dbColumn: "marijuana", label: "Marijuana", required: false, sensitive: true, step: 20, category: "lifestyle" },
  
  // Step 21-25: Interests & Prompts
  { key: "interests", dbColumn: "interests", label: "Interests", required: false, sensitive: false, step: 21, category: "interests" },
  { key: "bio", dbColumn: "bio", label: "About Me", required: false, sensitive: false, step: 22, category: "prompts" },
  { key: "ideal_first_date", dbColumn: "ideal_first_date", label: "Ideal First Date", required: false, sensitive: false, step: 23, category: "prompts" },
  { key: "way_to_heart", dbColumn: "way_to_heart", label: "Way to My Heart", required: false, sensitive: false, step: 24, category: "prompts" },
  { key: "craziest_travel_story", dbColumn: "craziest_travel_story", label: "Craziest Thing", required: false, sensitive: false, step: 25, category: "prompts" },
  
  // Step 26-30: Additional (Optional)
  { key: "languages", dbColumn: "languages", label: "Languages", required: false, sensitive: false, step: 26, category: "additional" },
  { key: "pets", dbColumn: "pets", label: "Pets", required: false, sensitive: false, step: 27, category: "additional" },
  { key: "exercise", dbColumn: "exercise", label: "Exercise", required: false, sensitive: false, step: 28, category: "additional" },
  { key: "zodiac_sign", dbColumn: "zodiac_sign", label: "Zodiac Sign", required: false, sensitive: false, step: 29, category: "additional" },
  { key: "schools", dbColumn: "schools", label: "Schools", required: false, sensitive: false, step: 30, category: "additional" },
];

// Required fields that must be completed before matching
const REQUIRED_FIELDS = PROFILE_FIELDS.filter(f => f.required).map(f => f.key);

// Total number of fields for percentage calculation
const TOTAL_FIELDS = PROFILE_FIELDS.length;

// Minimum photo requirement configuration
// Set to 0 to disable, or a positive number (e.g., 3, 6) to require minimum photos
// RealSingles decision: 1 photo minimum (lower barrier to entry)
// Industry standard from The League, Hinge: 6 photos required
const MIN_PHOTOS_REQUIRED = parseInt(process.env.MIN_PHOTOS_REQUIRED || "1", 10);

/**
 * Check if a field has a value (not empty/null/undefined)
 */
function fieldHasValue(profile: Record<string, unknown>, fieldKey: string): boolean {
  const value = profile[fieldKey];
  
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  
  return true;
}

/**
 * Calculate profile completion status
 */
function calculateCompletion(
  profile: Record<string, unknown>,
  skippedFields: string[],
  preferNotFields: string[],
  photoCount: number = 0
) {
  const completedFields: string[] = [];
  const incompleteFields: string[] = [];
  const requiredIncomplete: string[] = [];
  
  for (const field of PROFILE_FIELDS) {
    const hasValue = fieldHasValue(profile, field.dbColumn);
    const isSkipped = skippedFields.includes(field.key);
    const isPreferNot = preferNotFields.includes(field.key);
    
    if (hasValue || isPreferNot) {
      // Field is "complete" if it has a value OR user chose "prefer not to say"
      completedFields.push(field.key);
    } else if (isSkipped) {
      // Skipped fields count as incomplete but we'll ask again later
      incompleteFields.push(field.key);
      if (field.required) {
        requiredIncomplete.push(field.key);
      }
    } else {
      // No value, not skipped, not prefer_not
      incompleteFields.push(field.key);
      if (field.required) {
        requiredIncomplete.push(field.key);
      }
    }
  }
  
  // Calculate percentage (prefer_not counts as complete for percentage)
  const percentage = Math.round((completedFields.length / TOTAL_FIELDS) * 100);
  
  // Find next field to complete (first incomplete that's not "prefer not to say")
  // Skip fields that user has skipped for now, but still show them
  const nextField = incompleteFields.length > 0 
    ? PROFILE_FIELDS.find(f => incompleteFields.includes(f.key))
    : null;
  
  // Check photo requirement
  const hasMinimumPhotos = MIN_PHOTOS_REQUIRED <= 0 || photoCount >= MIN_PHOTOS_REQUIRED;
  const photoShortfall = MIN_PHOTOS_REQUIRED > 0 ? Math.max(0, MIN_PHOTOS_REQUIRED - photoCount) : 0;
  
  // Check if all required fields are complete AND photo requirement is met
  const canStartMatching = requiredIncomplete.length === 0 && hasMinimumPhotos;
  
  // Check if profile is fully complete (all fields have value or prefer_not)
  const isComplete = incompleteFields.length === 0 && hasMinimumPhotos;
  
  return {
    percentage,
    completedCount: completedFields.length,
    totalCount: TOTAL_FIELDS,
    completedFields,
    incompleteFields,
    requiredIncomplete,
    skippedFields,
    preferNotFields,
    nextField: nextField ? {
      key: nextField.key,
      label: nextField.label,
      step: nextField.step,
      category: nextField.category,
      required: nextField.required,
      sensitive: nextField.sensitive,
    } : null,
    canStartMatching,
    isComplete,
    // Photo requirement info
    photoCount,
    minPhotosRequired: MIN_PHOTOS_REQUIRED,
    hasMinimumPhotos,
    photoShortfall,
  };
}

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

  // Get profile data
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
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
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("media_type", "image");

  // Calculate completion
  const completion = calculateCompletion(
    profile || {},
    profile?.profile_completion_skipped || [],
    profile?.profile_completion_prefer_not || [],
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
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Get gallery photo count
  const { count: photoCount } = await supabase
    .from("user_gallery")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("media_type", "image");

  const completion = calculateCompletion(
    updatedProfile || {},
    updatedProfile?.profile_completion_skipped || [],
    updatedProfile?.profile_completion_prefer_not || [],
    photoCount || 0
  );

  return NextResponse.json({
    success: true,
    msg: `Action "${action}" completed successfully`,
    data: completion,
  });
}
