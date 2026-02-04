import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { getMatchmakerStats } from "@/lib/services/matchmakers";

/**
 * GET /api/matchmakers/[id]/stats
 * Get matchmaker performance metrics (public)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createApiClient();
  const { id: matchmakerId } = await params;

  // Verify matchmaker exists and is approved
  const { data: matchmaker, error: mmError } = await supabase
    .from("matchmakers")
    .select("id, status")
    .eq("id", matchmakerId)
    .single();

  if (mmError || !matchmaker) {
    return NextResponse.json(
      { success: false, msg: "Matchmaker not found" },
      { status: 404 }
    );
  }

  if (matchmaker.status !== "approved") {
    return NextResponse.json(
      { success: false, msg: "Matchmaker not available" },
      { status: 404 }
    );
  }

  // Get stats
  const { stats, error } = await getMatchmakerStats(supabase, matchmakerId);

  if (error) {
    return NextResponse.json(
      { success: false, msg: error },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: stats,
    msg: "Stats fetched successfully",
  });
}
