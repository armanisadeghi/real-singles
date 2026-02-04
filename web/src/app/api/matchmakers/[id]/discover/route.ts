import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { verifyMatchmakerOwnership } from "@/lib/services/matchmakers";

/**
 * GET /api/matchmakers/[id]/discover
 * Profile browser for matchmakers (matchmaker only)
 * 
 * Uses the same discover algorithm as /api/discover but for matchmaker use
 * 
 * Query params: All standard discover filters
 * - gender: string[]
 * - min_age, max_age: number
 * - min_height, max_height: number
 * - max_distance: number
 * - marital_status: string[]
 * - has_kids: string[]
 * - wants_kids: string[]
 * - smoking: string[]
 * - drinking: string[]
 * - religion: string[]
 * - education: string[]
 * - body_type: string[]
 * - ethnicity: string[]
 * - interests: string[]
 * - limit: number (default 50, max 100)
 * - offset: number
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createApiClient();
  const { id: matchmakerId } = await params;

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

  // Verify ownership
  const ownershipCheck = await verifyMatchmakerOwnership(
    supabase,
    matchmakerId,
    user.id
  );
  if (!ownershipCheck.success) {
    return NextResponse.json(
      { success: false, msg: ownershipCheck.error },
      { status: 403 }
    );
  }

  // Forward to discover API with all query params
  // This reuses existing discover logic
  const { searchParams } = new URL(request.url);
  const discoverUrl = new URL("/api/discover/profiles", request.url);
  
  // Copy all query params
  searchParams.forEach((value, key) => {
    discoverUrl.searchParams.append(key, value);
  });

  // Make internal request to discover API
  const discoverResponse = await fetch(discoverUrl.toString(), {
    headers: {
      Authorization: request.headers.get("Authorization") || "",
      Cookie: request.headers.get("Cookie") || "",
    },
  });

  const discoverData = await discoverResponse.json();

  return NextResponse.json(discoverData);
}
