import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";
import {
  verifyMatchmakerOwnership,
  verifyMatchmakerApproved,
  checkExistingMatch,
  checkBlockStatus,
  checkDuplicateIntro,
  verifyUsersExist,
} from "@/lib/services/matchmakers";
import { z } from "zod";

// Validation schema for creating introduction
const createIntroSchema = z.object({
  user_a_id: z.string().uuid(),
  user_b_id: z.string().uuid(),
  intro_message: z.string().min(50).max(1000),
});

/**
 * GET /api/matchmakers/[id]/introductions
 * Get list of introductions created by matchmaker
 *
 * Query params:
 * - status: filter by status
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
    .from("matchmaker_introductions")
    .select(
      `
      id,
      user_a_id,
      user_b_id,
      intro_message,
      status,
      outcome,
      conversation_id,
      created_at,
      expires_at,
      outcome_updated_at
    `
    )
    .eq("matchmaker_id", matchmakerId)
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data: intros, error, count } = await query.range(
    offset,
    offset + limit - 1
  );

  if (error) {
    console.error("Error fetching introductions:", error);
    return NextResponse.json(
      { success: false, msg: "Error fetching introductions" },
      { status: 500 }
    );
  }

  // Get user details for all participants
  const allUserIds = new Set<string>();
  intros?.forEach((intro) => {
    allUserIds.add(intro.user_a_id);
    allUserIds.add(intro.user_b_id);
  });

  const { data: users } = await supabase
    .from("users")
    .select("id, display_name")
    .in("id", Array.from(allUserIds));

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, profile_image_url")
    .in("user_id", Array.from(allUserIds));

  // Create lookup maps
  const userMap = new Map(users?.map((u) => [u.id, u]) || []);
  const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

  // Format response
  const formatted = await Promise.all(
    (intros || []).map(async (intro) => {
      const userA = userMap.get(intro.user_a_id);
      const userB = userMap.get(intro.user_b_id);
      const profileA = profileMap.get(intro.user_a_id);
      const profileB = profileMap.get(intro.user_b_id);

      const imageAUrl = profileA?.profile_image_url
        ? await resolveStorageUrl(supabase, profileA.profile_image_url)
        : "";
      const imageBUrl = profileB?.profile_image_url
        ? await resolveStorageUrl(supabase, profileB.profile_image_url)
        : "";

      return {
        id: intro.id,
        user_a: {
          id: intro.user_a_id,
          display_name: userA?.display_name || "User A",
          first_name: profileA?.first_name || "",
          last_name: profileA?.last_name || "",
          profile_image_url: imageAUrl,
        },
        user_b: {
          id: intro.user_b_id,
          display_name: userB?.display_name || "User B",
          first_name: profileB?.first_name || "",
          last_name: profileB?.last_name || "",
          profile_image_url: imageBUrl,
        },
        intro_message: intro.intro_message,
        status: intro.status,
        outcome: intro.outcome,
        conversation_id: intro.conversation_id,
        created_at: intro.created_at,
        expires_at: intro.expires_at,
        outcome_updated_at: intro.outcome_updated_at,
      };
    })
  );

  return NextResponse.json({
    success: true,
    data: formatted,
    total: count || formatted.length,
    msg: "Introductions fetched successfully",
  });
}

/**
 * POST /api/matchmakers/[id]/introductions
 * Create a new introduction (matchmaker only)
 *
 * CRITICAL: All validation logic lives here
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

  // Verify ownership and approval
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

  const approvalCheck = await verifyMatchmakerApproved(supabase, matchmakerId);
  if (!approvalCheck.success) {
    return NextResponse.json(
      { success: false, msg: approvalCheck.error },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const validation = createIntroSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, msg: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { user_a_id, user_b_id, intro_message } = validation.data;

    // Validate: Can't introduce user to themselves
    if (user_a_id === user_b_id) {
      return NextResponse.json(
        { success: false, msg: "Cannot introduce user to themselves" },
        { status: 400 }
      );
    }

    // Verify both users exist and are active
    const usersCheck = await verifyUsersExist(supabase, [user_a_id, user_b_id]);
    if (!usersCheck.success) {
      return NextResponse.json(
        { success: false, msg: usersCheck.error },
        { status: 400 }
      );
    }

    // Check if users are already matched
    const matchCheck = await checkExistingMatch(supabase, user_a_id, user_b_id);
    if (matchCheck.exists) {
      return NextResponse.json(
        { success: false, msg: "These users are already matched" },
        { status: 409 }
      );
    }

    // Check for blocks
    const blockCheck = await checkBlockStatus(supabase, user_a_id, user_b_id);
    if (blockCheck.blocked) {
      return NextResponse.json(
        { success: false, msg: "One user has blocked the other" },
        { status: 403 }
      );
    }

    // Check for duplicate pending intro
    const dupeCheck = await checkDuplicateIntro(
      supabase,
      matchmakerId,
      user_a_id,
      user_b_id
    );
    if (dupeCheck.exists) {
      return NextResponse.json(
        { success: false, msg: "You already have a pending introduction between these users" },
        { status: 409 }
      );
    }

    // All validation passed - create introduction
    const { data: intro, error: createError } = await supabase
      .from("matchmaker_introductions")
      .insert({
        matchmaker_id: matchmakerId,
        user_a_id,
        user_b_id,
        intro_message,
        status: "pending",
      })
      .select("id")
      .single();

    if (createError || !intro) {
      console.error("Error creating introduction:", createError);
      return NextResponse.json(
        { success: false, msg: "Error creating introduction" },
        { status: 500 }
      );
    }

    // Get matchmaker's display name for notification
    const { data: matchmakerUser } = await supabase
      .from("users")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const matchmakerName = matchmakerUser?.display_name || "Your matchmaker";

    // Send notifications to both users
    const notificationPromises = [user_a_id, user_b_id].map(async (userId) => {
      try {
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "matchmaker_introduction",
          title: "New Introduction!",
          body: `${matchmakerName} thinks they found someone special for you!`,
          data: {
            introduction_id: intro.id,
            matchmaker_id: matchmakerId,
          },
        });
      } catch (err) {
        console.error(`Failed to send notification to ${userId}:`, err);
      }
    });

    // Don't await - let notifications send in background
    Promise.all(notificationPromises);

    return NextResponse.json({
      success: true,
      data: { introduction_id: intro.id },
      msg: "Introduction created successfully! Both users will be notified.",
    });
  } catch (error) {
    console.error("Error in POST /api/matchmakers/[id]/introductions:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}
