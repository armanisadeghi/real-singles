import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";
import {
  verifyMatchmakerOwnership,
  verifyMatchmakerApproved,
  checkExistingClientRelationship,
} from "@/lib/services/matchmakers";

/**
 * GET /api/matchmakers/[id]/clients
 * Get list of clients for a matchmaker (matchmaker only)
 *
 * Query params:
 * - status: filter by status (active, paused, completed, cancelled)
 * - limit: number of results (default 20, max 50)
 * - offset: pagination offset
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createApiClient();
  const { id: matchmakerId } = await params;
  const { searchParams } = new URL(request.url);

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

  const statusFilter = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  // Build query
  let query = supabase
    .from("matchmaker_clients")
    .select(
      `
      id,
      client_user_id,
      status,
      started_at,
      ended_at,
      created_at,
      users!inner (
        display_name,
        profiles (
          first_name,
          last_name,
          profile_image_url,
          date_of_birth,
          city,
          state
        )
      )
    `
    )
    .eq("matchmaker_id", matchmakerId)
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data: clients, error, count } = await query.range(
    offset,
    offset + limit - 1
  );

  if (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { success: false, msg: "Error fetching clients" },
      { status: 500 }
    );
  }

  // Format response
  const formatted = await Promise.all(
    (clients || []).map(async (client) => {
      const profiles = client.users?.profiles as any;
      const profile = Array.isArray(profiles) ? profiles[0] : profiles;
      const profileImageUrl = profile?.profile_image_url
        ? await resolveStorageUrl(supabase, profile.profile_image_url)
        : "";

      // Calculate age from date_of_birth
      const age = profile?.date_of_birth
        ? new Date().getFullYear() -
          new Date(profile.date_of_birth).getFullYear()
        : null;

      return {
        id: client.id,
        client_user_id: client.client_user_id,
        status: client.status,
        started_at: client.started_at,
        ended_at: client.ended_at,
        display_name: client.users?.display_name || "Client",
        first_name: profile?.first_name || "",
        last_name: profile?.last_name || "",
        profile_image_url: profileImageUrl,
        age,
        city: profile?.city || "",
        state: profile?.state || "",
      };
    })
  );

  return NextResponse.json({
    success: true,
    data: formatted,
    total: count || formatted.length,
    msg: "Clients fetched successfully",
  });
}

/**
 * POST /api/matchmakers/[id]/clients
 * User hires/selects matchmaker (creates client relationship)
 */
export async function POST(
  request: Request,
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

  // Verify matchmaker is approved
  const approvalCheck = await verifyMatchmakerApproved(supabase, matchmakerId);
  if (!approvalCheck.success) {
    return NextResponse.json(
      { success: false, msg: approvalCheck.error },
      { status: 400 }
    );
  }

  // Check for existing active relationship
  const existingCheck = await checkExistingClientRelationship(
    supabase,
    matchmakerId,
    user.id
  );
  if (existingCheck.exists) {
    return NextResponse.json(
      { success: false, msg: "You already have an active relationship with this matchmaker" },
      { status: 409 }
    );
  }

  // Create client relationship
  const { data: relationship, error: createError } = await supabase
    .from("matchmaker_clients")
    .insert({
      matchmaker_id: matchmakerId,
      client_user_id: user.id,
      status: "active",
    })
    .select("id")
    .single();

  if (createError || !relationship) {
    console.error("Error creating client relationship:", createError);
    return NextResponse.json(
      { success: false, msg: "Error creating relationship" },
      { status: 500 }
    );
  }

  // TODO: Send notification to matchmaker

  return NextResponse.json({
    success: true,
    data: { relationship_id: relationship.id },
    msg: "Successfully hired matchmaker!",
  });
}
