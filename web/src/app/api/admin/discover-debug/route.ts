import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdmin } from "@/lib/auth/admin-guard";

/**
 * GET /api/admin/discover-debug
 * 
 * Admin-only endpoint to diagnose why a user might not be seeing profiles
 * in the discover page. Checks all the conditions that could prevent profiles
 * from appearing.
 * 
 * Query params:
 * - user_id: UUID of the user to debug
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const checks: Record<string, { pass: boolean; value: unknown; issue?: string }> = {};

    // Check 1: User record exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, status, display_name, created_at")
      .eq("id", userId)
      .single();

    checks.user_exists = {
      pass: !!user && !userError,
      value: user ? { status: user.status, email: user.email } : null,
      issue: userError ? `User not found: ${userError.message}` : undefined,
    };

    // Check 2: User status is 'active'
    checks.user_status_active = {
      pass: user?.status === "active",
      value: user?.status,
      issue: user?.status !== "active" 
        ? `User status is '${user?.status}' (must be 'active' to see profiles due to RLS)` 
        : undefined,
    };

    // Check 3: Profile exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    checks.profile_exists = {
      pass: !!profile && !profileError,
      value: profile ? { 
        gender: profile.gender,
        looking_for: profile.looking_for,
        can_start_matching: profile.can_start_matching,
        profile_hidden: profile.profile_hidden,
      } : null,
      issue: profileError ? `Profile not found: ${profileError.message}` : undefined,
    };

    // Check 4: Gender is set
    checks.gender_set = {
      pass: !!profile?.gender,
      value: profile?.gender,
      issue: !profile?.gender ? "Gender is not set (required for bidirectional matching)" : undefined,
    };

    // Check 5: Looking for is set
    checks.looking_for_set = {
      pass: !!profile?.looking_for && profile.looking_for.length > 0,
      value: profile?.looking_for,
      issue: !profile?.looking_for || profile.looking_for.length === 0 
        ? "looking_for is empty (required for bidirectional matching)" 
        : undefined,
    };

    // Check 6: Can start matching
    checks.can_start_matching = {
      pass: profile?.can_start_matching === true,
      value: profile?.can_start_matching,
      issue: profile?.can_start_matching !== true 
        ? "can_start_matching is false (user hasn't completed profile setup)" 
        : undefined,
    };

    // Check 7: Profile not hidden
    checks.profile_not_hidden = {
      pass: profile?.profile_hidden !== true,
      value: profile?.profile_hidden,
      issue: profile?.profile_hidden === true 
        ? "profile_hidden is true (user has paused their profile)" 
        : undefined,
    };

    // Check 8: Get count of potential matches (without RLS)
    const { count: potentialMatches } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("can_start_matching", true)
      .eq("profile_hidden", false)
      .neq("user_id", userId)
      .in("gender", profile?.looking_for || [])
      .contains("looking_for", profile?.gender ? [profile.gender] : []);

    checks.potential_matches_exist = {
      pass: (potentialMatches || 0) > 0,
      value: potentialMatches,
      issue: potentialMatches === 0 
        ? "No profiles match bidirectional gender criteria" 
        : undefined,
    };

    // Check 9: Get count of profiles user has already acted on
    const { count: actedOnCount } = await supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_unmatched", false);

    checks.profiles_acted_on = {
      pass: true, // Just informational
      value: actedOnCount,
    };

    // Check 10: Get count of users who have blocked this user
    const { count: blockedByCount } = await supabase
      .from("blocks")
      .select("*", { count: "exact", head: true })
      .eq("blocked_id", userId);

    checks.blocked_by_count = {
      pass: true, // Just informational
      value: blockedByCount,
    };

    // Check 11: User filters
    const { data: userFilters } = await supabase
      .from("user_filters")
      .select("*")
      .eq("user_id", userId)
      .single();

    checks.user_filters = {
      pass: true, // Just informational
      value: userFilters ? {
        min_age: userFilters.min_age,
        max_age: userFilters.max_age,
        max_distance_miles: userFilters.max_distance_miles,
        body_types: userFilters.body_types,
        ethnicities: userFilters.ethnicities,
        religions: userFilters.religions,
      } : null,
    };

    // Determine overall status
    const criticalChecks = [
      checks.user_exists,
      checks.user_status_active,
      checks.profile_exists,
      checks.gender_set,
      checks.looking_for_set,
    ];

    const hasBlockingIssue = criticalChecks.some(c => !c.pass);
    const issues = Object.entries(checks)
      .filter(([, c]) => c.issue)
      .map(([key, c]) => ({ check: key, issue: c.issue }));

    return NextResponse.json({
      success: true,
      userId,
      overallStatus: hasBlockingIssue ? "BLOCKED" : "OK",
      summary: {
        canSeeProfiles: !hasBlockingIssue,
        blockingIssues: issues.length,
        potentialMatches: potentialMatches || 0,
      },
      checks,
      issues,
      recommendation: hasBlockingIssue 
        ? issues[0]?.issue 
        : "User should be able to see profiles. Check browser console for client-side errors.",
    });
  } catch (error) {
    console.error("Discover debug error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
