import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";
import { getMatchmakerStats } from "@/lib/services/matchmakers";
import { z } from "zod";

// Validation schema for matchmaker application
const applicationSchema = z.object({
  bio: z.string().min(50).max(1000),
  specialties: z.array(z.string()).min(1).max(10),
  years_experience: z.number().min(0).max(50),
  certifications: z.array(z.string()).optional(),
  application_notes: z.string().min(100).max(2000),
});

/**
 * GET /api/matchmakers
 * List approved matchmakers (public)
 *
 * Query params:
 * - limit: number of results (default 20, max 50)
 * - offset: pagination offset
 * - specialties[]: filter by specialties
 * - min_rating: filter by minimum rating
 */
export async function GET(request: NextRequest) {
  const supabase = await createApiClient();
  const { searchParams } = new URL(request.url);

  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");
  const specialtiesParam = searchParams.getAll("specialties[]");
  const minRating = parseFloat(searchParams.get("min_rating") || "0");

  // Build query for approved matchmakers
  let query = supabase
    .from("matchmakers")
    .select(
      `
      id,
      user_id,
      bio,
      specialties,
      years_experience,
      certifications,
      created_at,
      users!inner (
        display_name,
        profiles (
          first_name,
          last_name,
          profile_image_url
        )
      ),
      matchmaker_stats (
        total_introductions,
        successful_introductions,
        active_clients,
        average_rating,
        total_reviews
      )
    `
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  // Apply filters
  if (specialtiesParam.length > 0) {
    query = query.overlaps("specialties", specialtiesParam);
  }

  // Get matchmakers
  const { data: matchmakers, error, count } = await query
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching matchmakers:", error);
    return NextResponse.json(
      { success: false, msg: "Error fetching matchmakers" },
      { status: 500 }
    );
  }

  // Format response with resolved image URLs and stats
  const formatted = await Promise.all(
    (matchmakers || []).map(async (mm) => {
      const user = mm.users;
      const profile = user?.profiles?.[0];
      const stats = mm.matchmaker_stats?.[0];

      const profileImageUrl = profile?.profile_image_url
        ? await resolveStorageUrl(supabase, profile.profile_image_url)
        : "";

      // Calculate success rate
      const successRate =
        stats && stats.total_introductions > 0
          ? Math.round(
              (stats.successful_introductions / stats.total_introductions) * 100
            )
          : 0;

      // Apply rating filter
      if (minRating > 0 && (!stats?.average_rating || stats.average_rating < minRating)) {
        return null;
      }

      return {
        id: mm.id,
        user_id: mm.user_id,
        display_name: user?.display_name || "Matchmaker",
        first_name: profile?.first_name || "",
        last_name: profile?.last_name || "",
        profile_image_url: profileImageUrl,
        bio: mm.bio,
        specialties: mm.specialties || [],
        years_experience: mm.years_experience,
        certifications: mm.certifications || [],
        stats: {
          total_introductions: stats?.total_introductions || 0,
          successful_introductions: stats?.successful_introductions || 0,
          success_rate: successRate,
          active_clients: stats?.active_clients || 0,
          average_rating: stats?.average_rating || null,
          total_reviews: stats?.total_reviews || 0,
        },
      };
    })
  );

  // Filter out null entries (those that didn't meet rating filter)
  const filteredResults = formatted.filter((m) => m !== null);

  return NextResponse.json({
    success: true,
    data: filteredResults,
    total: filteredResults.length,
    msg: "Matchmakers fetched successfully",
  });
}

/**
 * POST /api/matchmakers
 * Apply to become a matchmaker
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
    const body = await request.json();
    const validation = applicationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, msg: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { bio, specialties, years_experience, certifications, application_notes } =
      validation.data;

    // Check if user already has a matchmaker profile
    const { data: existing } = await supabase
      .from("matchmakers")
      .select("id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          msg:
            existing.status === "pending"
              ? "You already have a pending application"
              : "You already have a matchmaker profile",
        },
        { status: 409 }
      );
    }

    // Create matchmaker application
    const { data: matchmaker, error: createError } = await supabase
      .from("matchmakers")
      .insert({
        user_id: user.id,
        status: "pending",
        bio,
        specialties,
        years_experience,
        certifications: certifications || [],
        application_notes,
      })
      .select("id")
      .single();

    if (createError || !matchmaker) {
      console.error("Error creating matchmaker application:", createError);
      return NextResponse.json(
        { success: false, msg: "Error creating application" },
        { status: 500 }
      );
    }

    // TODO: Send notification to admins for review

    return NextResponse.json({
      success: true,
      data: { matchmaker_id: matchmaker.id },
      msg: "Application submitted successfully. We'll review it soon!",
    });
  } catch (error) {
    console.error("Error in POST /api/matchmakers:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}
