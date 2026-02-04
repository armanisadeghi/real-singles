import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Verify the current user is an admin
async function verifyAdmin(): Promise<{ isAdmin: boolean; userId?: string }> {
  const supabase = await createApiClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isAdmin: false };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return {
    isAdmin: userData?.role === "admin" || userData?.role === "moderator",
    userId: user.id,
  };
}

export interface SystemIssue {
  id: string;
  issue_type: string;
  severity: "low" | "medium" | "high" | "critical";
  user_id: string | null;
  target_user_id: string | null;
  context: Record<string, any> | null;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  created_at: string;
  // Joined data
  user?: { email: string; display_name: string | null } | null;
  target_user?: { email: string; display_name: string | null } | null;
}

/**
 * GET /api/admin/system-issues
 *
 * Get system issues with optional filters
 * Query params:
 * - resolved: "true" | "false" (optional)
 * - severity: "low" | "medium" | "high" | "critical" (optional)
 * - type: issue_type filter (optional)
 * - limit: number (default 50)
 * - offset: number (default 0)
 */
export async function GET(request: NextRequest) {
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const resolved = searchParams.get("resolved");
  const severity = searchParams.get("severity");
  const issueType = searchParams.get("type");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  const supabase = createAdminClient();

  try {
    let query = supabase
      .from("system_issues")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (resolved !== null) {
      query = query.eq("resolved", resolved === "true");
    }

    if (severity) {
      query = query.eq("severity", severity);
    }

    if (issueType) {
      query = query.eq("issue_type", issueType);
    }

    const { data: issues, error, count } = await query;

    if (error) {
      throw error;
    }

    // Get user info for issues
    const userIds = new Set<string>();
    issues?.forEach((issue) => {
      if (issue.user_id) userIds.add(issue.user_id);
      if (issue.target_user_id) userIds.add(issue.target_user_id);
    });

    let userMap = new Map<string, { email: string; display_name: string | null }>();
    if (userIds.size > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, email, display_name")
        .in("id", Array.from(userIds));

      users?.forEach((u) => {
        userMap.set(u.id, { email: u.email, display_name: u.display_name });
      });
    }

    // Enrich issues with user data
    const enrichedIssues = issues?.map((issue) => ({
      ...issue,
      user: issue.user_id ? userMap.get(issue.user_id) || null : null,
      target_user: issue.target_user_id ? userMap.get(issue.target_user_id) || null : null,
    }));

    // Get summary counts
    const { data: summaryData } = await supabase
      .from("system_issues")
      .select("severity, resolved")
      .eq("resolved", false);

    const summary = {
      unresolved: summaryData?.length || 0,
      critical: summaryData?.filter((i) => i.severity === "critical").length || 0,
      high: summaryData?.filter((i) => i.severity === "high").length || 0,
      medium: summaryData?.filter((i) => i.severity === "medium").length || 0,
      low: summaryData?.filter((i) => i.severity === "low").length || 0,
    };

    return NextResponse.json({
      issues: enrichedIssues,
      total: count,
      limit,
      offset,
      summary,
    });
  } catch (error) {
    console.error("Failed to fetch system issues:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch system issues",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/system-issues
 *
 * Resolve or update system issues
 * Body:
 * - action: "resolve" | "bulk_resolve"
 * - issueId?: string (for single resolve)
 * - issueIds?: string[] (for bulk resolve)
 * - resolution_notes?: string
 */
export async function POST(request: NextRequest) {
  const { isAdmin, userId } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action, issueId, issueIds, resolution_notes } = body;

  const supabase = createAdminClient();

  try {
    switch (action) {
      case "resolve": {
        if (!issueId) {
          return NextResponse.json(
            { error: "Missing issueId" },
            { status: 400 }
          );
        }

        const { error } = await supabase
          .from("system_issues")
          .update({
            resolved: true,
            resolved_at: new Date().toISOString(),
            resolved_by: userId,
            resolution_notes: resolution_notes || null,
          })
          .eq("id", issueId);

        if (error) throw error;

        return NextResponse.json({
          success: true,
          message: "Issue resolved",
        });
      }

      case "bulk_resolve": {
        if (!issueIds || !Array.isArray(issueIds) || issueIds.length === 0) {
          return NextResponse.json(
            { error: "Missing or invalid issueIds" },
            { status: 400 }
          );
        }

        const { error } = await supabase
          .from("system_issues")
          .update({
            resolved: true,
            resolved_at: new Date().toISOString(),
            resolved_by: userId,
            resolution_notes: resolution_notes || "Bulk resolved by admin",
          })
          .in("id", issueIds);

        if (error) throw error;

        return NextResponse.json({
          success: true,
          message: `${issueIds.length} issues resolved`,
        });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Failed to update system issue:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update issue",
      },
      { status: 500 }
    );
  }
}
