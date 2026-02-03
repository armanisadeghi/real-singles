import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Use service role to read version (bypasses RLS)
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/version
 * Returns the current deployed version of the app
 * Used by clients to check if they need to refresh
 */
export async function GET() {
  try {
    // Get the latest version from the database
    const { data, error } = await supabaseAdmin
      .from("app_version")
      .select("version, build_number, git_commit, deployed_at")
      .order("deployed_at", { ascending: false })
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
      deployedAt: data.deployed_at,
    });
  } catch (error) {
    console.error("Error in version endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
