import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/version
 * Returns the current deployed version of the app
 * Used by clients to check if they need to refresh
 */
export async function GET() {
  try {
    const supabaseAdmin = createAdminClient();
    
    // Get the latest version from the database (order by build_number for correct ordering)
    const { data, error } = await supabaseAdmin
      .from("app_version")
      .select("version, build_number, git_commit, commit_message, lines_added, lines_deleted, files_changed, deployed_at, deployment_status, vercel_deployment_url, deployment_error")
      .order("build_number", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching app version:", error);
      return NextResponse.json(
        { error: "Failed to fetch version" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "No version found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      version: data.version,
      buildNumber: data.build_number,
      gitCommit: data.git_commit,
      commitMessage: data.commit_message,
      linesAdded: data.lines_added,
      linesDeleted: data.lines_deleted,
      filesChanged: data.files_changed,
      deployedAt: data.deployed_at,
      deploymentStatus: data.deployment_status,
      vercelDeploymentUrl: data.vercel_deployment_url,
      deploymentError: data.deployment_error,
    });
  } catch (error) {
    console.error("Error in version endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
