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

// Define ALL profile fields for completion calculation
// This is the authoritative list - any field that can be shown on a profile should be here
// Step numbers updated: bio/looking-for moved to steps 7-8 (high priority)
const PROFILE_FIELDS: ProfileField[] = [
  // ============================================
  // REQUIRED FIELDS (steps 1-6)
  // ============================================
  { key: "first_name", dbColumn: "first_name", label: "First Name", required: true, sensitive: false, step: 1, category: "basic" },
  { key: "date_of_birth", dbColumn: "date_of_birth", label: "Date of Birth", required: true, sensitive: false, step: 2, category: "basic" },
  { key: "gender", dbColumn: "gender", label: "Gender", required: true, sensitive: false, step: 3, category: "basic" },
  { key: "looking_for", dbColumn: "looking_for", label: "Looking For", required: true, sensitive: false, step: 4, category: "basic" },
  // Note: profile_image_url is handled separately via photo count (step 5)
  // Verification selfie is step 6
  
  // ============================================
  // BIO & DESCRIPTIONS (steps 7-8) - HIGH PRIORITY
  // ============================================
  { key: "bio", dbColumn: "bio", label: "About Me", required: false, sensitive: false, step: 7, category: "about" },
  { key: "looking_for_description", dbColumn: "looking_for_description", label: "What I'm Looking For", required: false, sensitive: false, step: 8, category: "about" },
  
  // ============================================
  // PHYSICAL ATTRIBUTES (steps 9-10)
  // ============================================
  { key: "height_inches", dbColumn: "height_inches", label: "Height", required: false, sensitive: false, step: 9, category: "physical" },
  { key: "body_type", dbColumn: "body_type", label: "Body Type", required: false, sensitive: false, step: 9, category: "physical" },
  { key: "ethnicity", dbColumn: "ethnicity", label: "Ethnicity", required: false, sensitive: true, step: 10, category: "physical" },
  
  // ============================================
  // RELATIONSHIP PREFERENCES (step 11)
  // ============================================
  { key: "dating_intentions", dbColumn: "dating_intentions", label: "Dating Intentions", required: false, sensitive: false, step: 11, category: "relationship" },
  { key: "marital_status", dbColumn: "marital_status", label: "Marital Status", required: false, sensitive: true, step: 11, category: "relationship" },
  
  // ============================================
  // LOCATION (step 12)
  // ============================================
  { key: "country", dbColumn: "country", label: "Country", required: false, sensitive: false, step: 12, category: "location" },
  { key: "city", dbColumn: "city", label: "City", required: false, sensitive: false, step: 12, category: "location" },
  { key: "state", dbColumn: "state", label: "State", required: false, sensitive: false, step: 12, category: "location" },
  { key: "hometown", dbColumn: "hometown", label: "Hometown", required: false, sensitive: false, step: 12, category: "location" },
  
  // ============================================
  // EDUCATION & CAREER (steps 13-14)
  // ============================================
  { key: "occupation", dbColumn: "occupation", label: "Occupation", required: false, sensitive: false, step: 13, category: "career" },
  { key: "company", dbColumn: "company", label: "Company", required: false, sensitive: false, step: 13, category: "career" },
  { key: "education", dbColumn: "education", label: "Education Level", required: false, sensitive: false, step: 14, category: "education" },
  { key: "schools", dbColumn: "schools", label: "Schools", required: false, sensitive: false, step: 14, category: "education" },
  
  // ============================================
  // BELIEFS & VALUES (step 15)
  // ============================================
  { key: "religion", dbColumn: "religion", label: "Religion", required: false, sensitive: true, step: 15, category: "beliefs" },
  { key: "political_views", dbColumn: "political_views", label: "Political Views", required: false, sensitive: true, step: 15, category: "beliefs" },
  
  // ============================================
  // LIFESTYLE (steps 16-17)
  // ============================================
  { key: "exercise", dbColumn: "exercise", label: "Exercise", required: false, sensitive: false, step: 16, category: "lifestyle" },
  { key: "languages", dbColumn: "languages", label: "Languages", required: false, sensitive: false, step: 17, category: "lifestyle" },
  
  // ============================================
  // HABITS (step 18)
  // ============================================
  { key: "smoking", dbColumn: "smoking", label: "Smoking", required: false, sensitive: false, step: 18, category: "habits" },
  { key: "drinking", dbColumn: "drinking", label: "Drinking", required: false, sensitive: false, step: 18, category: "habits" },
  { key: "marijuana", dbColumn: "marijuana", label: "Marijuana", required: false, sensitive: true, step: 18, category: "habits" },
  
  // ============================================
  // FAMILY (steps 19-20)
  // ============================================
  { key: "has_kids", dbColumn: "has_kids", label: "Have Children", required: false, sensitive: true, step: 19, category: "family" },
  { key: "wants_kids", dbColumn: "wants_kids", label: "Want Children", required: false, sensitive: true, step: 19, category: "family" },
  { key: "pets", dbColumn: "pets", label: "Pets", required: false, sensitive: false, step: 20, category: "family" },
  
  // ============================================
  // INTERESTS & PERSONALITY (steps 21-22)
  // ============================================
  { key: "interests", dbColumn: "interests", label: "Interests", required: false, sensitive: false, step: 21, category: "personality" },
  { key: "life_goals", dbColumn: "life_goals", label: "Life Goals", required: false, sensitive: false, step: 22, category: "personality" },
  { key: "zodiac_sign", dbColumn: "zodiac_sign", label: "Zodiac Sign", required: false, sensitive: false, step: 2, category: "personality" }, // Auto-calculated from DOB
  
  // ============================================
  // PROFILE PROMPTS (11 total)
  // ============================================
  { key: "ideal_first_date", dbColumn: "ideal_first_date", label: "Ideal First Date", required: false, sensitive: false, step: 23, category: "prompts" },
  { key: "non_negotiables", dbColumn: "non_negotiables", label: "Non-Negotiables", required: false, sensitive: false, step: 24, category: "prompts" },
  { key: "way_to_heart", dbColumn: "way_to_heart", label: "Way to My Heart", required: false, sensitive: false, step: 25, category: "prompts" },
  { key: "after_work", dbColumn: "after_work", label: "After Work", required: false, sensitive: false, step: 26, category: "prompts" },
  { key: "nightclub_or_home", dbColumn: "nightclub_or_home", label: "Nightclub or Home", required: false, sensitive: false, step: 27, category: "prompts" },
  { key: "pet_peeves", dbColumn: "pet_peeves", label: "Pet Peeves", required: false, sensitive: false, step: 28, category: "prompts" },
  { key: "craziest_travel_story", dbColumn: "craziest_travel_story", label: "Craziest Travel Story", required: false, sensitive: false, step: 29, category: "prompts" },
  { key: "weirdest_gift", dbColumn: "weirdest_gift", label: "Weirdest Gift", required: false, sensitive: false, step: 30, category: "prompts" },
  { key: "worst_job", dbColumn: "worst_job", label: "Worst Job", required: false, sensitive: false, step: 31, category: "prompts" },
  { key: "dream_job", dbColumn: "dream_job", label: "Dream Job", required: false, sensitive: false, step: 32, category: "prompts" },
  { key: "past_event", dbColumn: "past_event", label: "Past Event", required: false, sensitive: false, step: 32, category: "prompts" },
  
  // ============================================
  // SOCIAL LINKS
  // ============================================
  { key: "social_link_1", dbColumn: "social_link_1", label: "Social Link 1", required: false, sensitive: false, step: 33, category: "social" },
  { key: "social_link_2", dbColumn: "social_link_2", label: "Social Link 2", required: false, sensitive: false, step: 33, category: "social" },
  
  // ============================================
  // MEDIA (Voice & Video)
  // ============================================
  { key: "voice_prompt_url", dbColumn: "voice_prompt_url", label: "Voice Prompt", required: false, sensitive: false, step: 34, category: "media" },
  { key: "video_intro_url", dbColumn: "video_intro_url", label: "Video Intro", required: false, sensitive: false, step: 34, category: "media" },
  
  // ============================================
  // VERIFICATION
  // ============================================
  { key: "verification_selfie_url", dbColumn: "verification_selfie_url", label: "Verification Selfie", required: false, sensitive: false, step: 6, category: "verification" },
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
  
  // Check photo requirement
  const hasMinimumPhotos = MIN_PHOTOS_REQUIRED <= 0 || photoCount >= MIN_PHOTOS_REQUIRED;
  const photoShortfall = MIN_PHOTOS_REQUIRED > 0 ? Math.max(0, MIN_PHOTOS_REQUIRED - photoCount) : 0;
  
  // Photos count as +1 in total for percentage calculation
  const photoComplete = hasMinimumPhotos ? 1 : 0;
  const totalWithPhotos = TOTAL_FIELDS + 1;
  
  // Calculate percentage (prefer_not counts as complete, photos count as +1)
  const percentage = Math.round(((completedFields.length + photoComplete) / totalWithPhotos) * 100);
  
  // Find next field to complete (first incomplete that's not "prefer not to say")
  // Skip fields that user has skipped for now, but still show them
  const nextField = incompleteFields.length > 0 
    ? PROFILE_FIELDS.find(f => incompleteFields.includes(f.key))
    : null;
  
  // Check if all required fields are complete AND photo requirement is met
  const canStartMatching = requiredIncomplete.length === 0 && hasMinimumPhotos;
  
  // Check if profile is fully complete (all fields have value or prefer_not)
  const isComplete = incompleteFields.length === 0 && hasMinimumPhotos;
  
  return {
    percentage,
    completedCount: completedFields.length + photoComplete,
    totalCount: totalWithPhotos,
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
