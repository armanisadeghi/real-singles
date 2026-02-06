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

/**
 * GET /api/admin/reports
 * List reports with pagination and status filtering
 */
export async function GET(request: NextRequest) {
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json(
      { success: false, msg: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "pending";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = (page - 1) * limit;

  // Validate status parameter
  const validStatuses = ["pending", "resolved", "dismissed"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { success: false, msg: "Invalid status. Must be: pending, resolved, or dismissed" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Get paginated reports with joins
  const { data: reports, error } = await supabase
    .from("reports")
    .select(
      `
      id,
      reason,
      description,
      status,
      created_at,
      reviewed_at,
      resolution_notes,
      reporter_id,
      reported_user_id,
      reviewed_by,
      reporter:reporter_id(id, email, display_name),
      reported:reported_user_id(id, email, display_name),
      reviewer:reviewed_by(id, email, display_name)
    `
    )
    .eq("status", status)
    .order(
      status === "pending" ? "created_at" : "reviewed_at",
      { ascending: false }
    )
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching admin reports:", error);
    return NextResponse.json(
      { success: false, msg: "Error fetching reports" },
      { status: 500 }
    );
  }

  // Get total count for pagination
  const { count, error: countError } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("status", status);

  if (countError) {
    console.error("Error counting reports:", countError);
  }

  // ── Batch-fetch metrics for all users in this page ──
  // Collect unique user IDs to avoid N+1 queries
  const reporterIds = [
    ...new Set(
      (reports || [])
        .map((r) => r.reporter_id)
        .filter((id): id is string => id !== null)
    ),
  ];
  const reportedIds = [
    ...new Set(
      (reports || [])
        .map((r) => r.reported_user_id)
        .filter((id): id is string => id !== null)
    ),
  ];

  // Count how many times each reported user has been reported (all time)
  const timesReportedMap: Record<string, number> = {};
  if (reportedIds.length > 0) {
    const { data: reportedCounts } = await supabase.rpc("count_reports_by_reported_user", {
      user_ids: reportedIds,
    });
    // Fallback: if RPC doesn't exist, query individually (batch)
    if (!reportedCounts) {
      await Promise.all(
        reportedIds.map(async (id) => {
          const { count: c } = await supabase
            .from("reports")
            .select("id", { count: "exact", head: true })
            .eq("reported_user_id", id);
          timesReportedMap[id] = c || 0;
        })
      );
    } else {
      for (const row of reportedCounts as { user_id: string; count: number }[]) {
        timesReportedMap[row.user_id] = row.count;
      }
    }
  }

  // Count how many times each reporter has filed reports (all time)
  const timesReportedByMap: Record<string, number> = {};
  if (reporterIds.length > 0) {
    const { data: reporterCounts } = await supabase.rpc("count_reports_by_reporter", {
      user_ids: reporterIds,
    });
    if (!reporterCounts) {
      await Promise.all(
        reporterIds.map(async (id) => {
          const { count: c } = await supabase
            .from("reports")
            .select("id", { count: "exact", head: true })
            .eq("reporter_id", id);
          timesReportedByMap[id] = c || 0;
        })
      );
    } else {
      for (const row of reporterCounts as { user_id: string; count: number }[]) {
        timesReportedByMap[row.user_id] = row.count;
      }
    }
  }

  // Attach metrics to each report
  const reportsWithMetrics = (reports || []).map((report) => ({
    ...report,
    metrics: {
      times_reported: report.reported_user_id
        ? timesReportedMap[report.reported_user_id] || 0
        : 0,
      times_reporter_has_reported: report.reporter_id
        ? timesReportedByMap[report.reporter_id] || 0
        : 0,
    },
  }));

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return NextResponse.json({
    success: true,
    data: {
      reports: reportsWithMetrics,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    },
    msg: "Reports fetched successfully",
  });
}
