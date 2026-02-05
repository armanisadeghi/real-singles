import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncPendingDeployments } from "@/lib/services/vercel-sync";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/version/history?limit=20&offset=0
 * Returns version history from the app_version table.
 *
 * Before returning data, any records still in a non-terminal state
 * ("pending" / "building") are synced with the Vercel API so the
 * caller always receives the true deployment status.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Validate pagination params
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Limit must be between 1 and 100" },
        { status: 400 }
      );
    }

    if (offset < 0) {
      return NextResponse.json(
        { error: "Offset must be non-negative" },
        { status: 400 }
      );
    }

    // Sync any pending/building records with Vercel before reading.
    // This is a no-op when there's nothing to sync or when Vercel
    // credentials are not configured.
    await syncPendingDeployments();

    const supabaseAdmin = createAdminClient();

    // Get total count
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from("app_version")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Error counting versions:", countError);
      return NextResponse.json(
        { error: "Failed to count versions" },
        { status: 500 }
      );
    }

    // Get paginated versions (order by build_number DESC for correct ordering)
    const { data, error } = await supabaseAdmin
      .from("app_version")
      .select("id, version, build_number, git_commit, commit_message, lines_added, lines_deleted, files_changed, deployed_at, created_at, deployment_status, vercel_deployment_id, vercel_deployment_url, deployment_error")
      .order("build_number", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching version history:", error);
      return NextResponse.json(
        { error: "Failed to fetch version history" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      versions: data || [],
      total: totalCount || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error in version history endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
