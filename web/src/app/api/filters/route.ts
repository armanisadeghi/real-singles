import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

/**
 * GET /api/filters
 * Get current user's saved filters
 * Supports both cookie auth (web) and Bearer token auth (mobile)
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

  const { data: filters, error } = await supabase
    .from("user_filters")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching filters:", error);
    return NextResponse.json(
      { success: false, msg: "Error fetching filters" },
      { status: 500 }
    );
  }

  // Transform to mobile app format
  const responseData = filters
    ? {
        Gender: filters.gender?.[0] || "",
        min_age: filters.min_age || 18,
        max_age: filters.max_age || 70,
        min_height: filters.min_height ? filters.min_height / 12 : 4, // Convert inches to feet
        max_height: filters.max_height ? filters.max_height / 12 : 10,
        BodyType: filters.body_types?.[0] || "",
        Ethniticity: filters.ethnicities?.[0] || "",
        Drinks: filters.drinking || "",
        Religion: filters.religions?.[0] || "",
        Education: filters.education_levels?.[0] || "",
        HaveChild: filters.has_kids || "",
        WantChild: filters.wants_kids || "",
        Pets: false,
        Hsign: filters.zodiac_signs?.join(",") || "",
        Marijuna: filters.marijuana || "",
        min_distance: 0,
        max_distance: filters.max_distance_miles || 10000,
        exercise: "",
        marital_status: "",
        looking_for: "",
        Smoke: filters.smoking || "",
        PoliticalView: "",
      }
    : null;

  return NextResponse.json({
    success: true,
    data: responseData,
    msg: filters ? "Filters fetched successfully" : "No filters saved",
  });
}

/**
 * POST /api/filters
 * Save user's filters
 * Supports both cookie auth (web) and Bearer token auth (mobile)
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
    // Handle FormData
    const formData = await request.formData();
    
    const filters: Record<string, unknown> = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    // Map mobile field names to database field names
    const gender = formData.get("Gender") as string;
    if (gender) {
      const genderMap: Record<string, string> = {
        woman: "female",
        man: "male",
        woman2: "non-binary",
        man2: "other",
      };
      filters.gender = [genderMap[gender] || gender];
    }

    const minAge = formData.get("min_age");
    if (minAge) filters.min_age = parseInt(minAge as string, 10);

    const maxAge = formData.get("max_age");
    if (maxAge) filters.max_age = parseInt(maxAge as string, 10);

    const minHeight = formData.get("min_height");
    if (minHeight) filters.min_height = Math.round(parseFloat(minHeight as string) * 12); // Convert feet to inches

    const maxHeight = formData.get("max_height");
    if (maxHeight) filters.max_height = Math.round(parseFloat(maxHeight as string) * 12);

    const bodyType = formData.get("BodyType") as string;
    if (bodyType) filters.body_types = [bodyType.toLowerCase()];

    const ethnicity = formData.get("Ethniticity") as string;
    if (ethnicity) filters.ethnicities = [ethnicity];

    const religion = formData.get("Religion") as string;
    if (religion) filters.religions = [religion];

    const education = formData.get("Education") as string;
    if (education) filters.education_levels = [education];

    const drinks = formData.get("Drinks") as string;
    if (drinks) filters.drinking = drinks.toLowerCase();

    const smoke = formData.get("Smoke") as string;
    if (smoke) filters.smoking = smoke.toLowerCase();

    const marijuana = formData.get("Marijuna") as string;
    if (marijuana) filters.marijuana = marijuana.toLowerCase();

    const hasKids = formData.get("HaveChild") as string;
    if (hasKids) filters.has_kids = hasKids;

    const wantKids = formData.get("WantChild") as string;
    if (wantKids) filters.wants_kids = wantKids;

    const zodiac = formData.get("Hsign") as string;
    if (zodiac) filters.zodiac_signs = zodiac.split(",").filter(Boolean);

    const maxDistance = formData.get("max_distance");
    if (maxDistance) filters.max_distance_miles = parseInt(maxDistance as string, 10);

    // Upsert filters
    const { error } = await supabase
      .from("user_filters")
      .upsert(filters, { onConflict: "user_id" });

    if (error) {
      console.error("Error saving filters:", error);
      return NextResponse.json(
        { success: false, msg: "Error saving filters" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      msg: "Filters saved successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/filters:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/filters
 * Clear user's filters (reset to defaults)
 * Supports both cookie auth (web) and Bearer token auth (mobile)
 */
export async function DELETE() {
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

  // Reset filters to defaults
  const { error } = await supabase
    .from("user_filters")
    .upsert({
      user_id: user.id,
      min_age: 18,
      max_age: 99,
      min_height: null,
      max_height: null,
      max_distance_miles: 100,
      gender: null,
      body_types: null,
      ethnicities: null,
      religions: null,
      education_levels: null,
      has_kids: null,
      wants_kids: null,
      smoking: null,
      drinking: null,
      marijuana: null,
      zodiac_signs: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

  if (error) {
    console.error("Error clearing filters:", error);
    return NextResponse.json(
      { success: false, msg: "Error clearing filters" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    msg: "Filters cleared successfully",
  });
}
