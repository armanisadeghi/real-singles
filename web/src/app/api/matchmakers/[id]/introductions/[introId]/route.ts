import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";
import {
  calculateIntroStatusUpdate,
  createIntroductionConversation,
} from "@/lib/services/matchmakers";
import { z } from "zod";

// Validation schema for responding to intro
const responseSchema = z.object({
  action: z.enum(["accept", "decline"]),
});

// Validation schema for outcome updates
const outcomeSchema = z.object({
  outcome: z.enum(["no_response", "declined", "chatted", "dated", "relationship"]),
});

/**
 * GET /api/matchmakers/[id]/introductions/[introId]
 * Get single introduction details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; introId: string }> }
) {
  const supabase = await createApiClient();
  const { id: matchmakerId, introId } = await params;

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

  // Get introduction
  const { data: intro, error } = await supabase
    .from("matchmaker_introductions")
    .select(
      `
      *,
      matchmakers!inner (
        user_id
      )
    `
    )
    .eq("id", introId)
    .single();

  if (error || !intro) {
    return NextResponse.json(
      { success: false, msg: "Introduction not found" },
      { status: 404 }
    );
  }

  // Verify user is involved (matchmaker or one of the users)
  const isMatchmaker = (intro.matchmakers as any)?.user_id === user.id;
  const isParticipant = intro.user_a_id === user.id || intro.user_b_id === user.id;

  if (!isMatchmaker && !isParticipant) {
    return NextResponse.json(
      { success: false, msg: "Not authorized" },
      { status: 403 }
    );
  }

  // Get matchmaker name
  const { data: matchmakerUser } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", (intro.matchmakers as any)?.user_id)
    .single();

  // Get user details
  const { data: users } = await supabase
    .from("users")
    .select("id, display_name")
    .in("id", [intro.user_a_id, intro.user_b_id]);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, profile_image_url")
    .in("user_id", [intro.user_a_id, intro.user_b_id]);

  const userMap = new Map(users?.map((u) => [u.id, u]) || []);
  const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

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

  return NextResponse.json({
    success: true,
    data: {
      id: intro.id,
      matchmaker_name: matchmakerUser?.display_name || "Matchmaker",
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
      user_a_response_at: intro.user_a_response_at,
      user_b_response_at: intro.user_b_response_at,
      outcome_updated_at: intro.outcome_updated_at,
    },
    msg: "Introduction fetched successfully",
  });
}

/**
 * PATCH /api/matchmakers/[id]/introductions/[introId]
 * Update introduction status or outcome
 * 
 * Users can accept/decline (action field)
 * Matchmakers can update outcome (outcome field)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; introId: string }> }
) {
  const supabase = await createApiClient();
  const { id: matchmakerId, introId } = await params;

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

  try {
    const body = await request.json();

    // Determine if this is a user response or matchmaker outcome update
    const isResponseUpdate = "action" in body;
    const isOutcomeUpdate = "outcome" in body;

    if (isResponseUpdate) {
      return await handleUserResponse(supabase, introId, user.id, body);
    } else if (isOutcomeUpdate) {
      return await handleOutcomeUpdate(supabase, matchmakerId, introId, user.id, body);
    } else {
      return NextResponse.json(
        { success: false, msg: "Invalid request - must provide 'action' or 'outcome'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in PATCH /api/matchmakers/[id]/introductions/[introId]:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}

/**
 * Handle user accepting/declining introduction
 * CRITICAL: Creates group conversation when both users accept
 */
async function handleUserResponse(
  supabase: any,
  introId: string,
  userId: string,
  body: any
) {
  const validation = responseSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { success: false, msg: validation.error.issues[0].message },
      { status: 400 }
    );
  }

  const { action } = validation.data;

  // Get introduction
  const { data: intro, error: fetchError } = await supabase
    .from("matchmaker_introductions")
    .select("*")
    .eq("id", introId)
    .single();

  if (fetchError || !intro) {
    return NextResponse.json(
      { success: false, msg: "Introduction not found" },
      { status: 404 }
    );
  }

  // Verify user is a participant
  if (intro.user_a_id !== userId && intro.user_b_id !== userId) {
    return NextResponse.json(
      { success: false, msg: "Not authorized" },
      { status: 403 }
    );
  }

  // Check if already responded
  const isUserA = intro.user_a_id === userId;
  const hasResponded = isUserA ? intro.user_a_response_at : intro.user_b_response_at;

  if (hasResponded) {
    return NextResponse.json(
      { success: false, msg: "You have already responded to this introduction" },
      { status: 409 }
    );
  }

  // Calculate new status
  const { newStatus, shouldCreateConversation, responseField } =
    calculateIntroStatusUpdate(
      intro.status,
      userId,
      intro.user_a_id,
      intro.user_b_id,
      action
    );

  // Update introduction status
  const updates: any = {
    status: newStatus,
    [responseField]: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from("matchmaker_introductions")
    .update(updates)
    .eq("id", introId);

  if (updateError) {
    console.error("Error updating introduction:", updateError);
    return NextResponse.json(
      { success: false, msg: "Error updating introduction" },
      { status: 500 }
    );
  }

  // If both accepted, create group conversation
  let conversationId = null;
  if (shouldCreateConversation) {
    const result = await createIntroductionConversation(
      supabase,
      introId,
      intro.matchmaker_id,
      intro.user_a_id,
      intro.user_b_id,
      intro.intro_message
    );

    if (result.success) {
      conversationId = result.conversationId;
      // TODO: Notify all 3 participants that group chat is ready
    } else {
      console.error("Failed to create conversation:", result.error);
      // Don't fail the whole operation - user response is recorded
    }
  } else if (action === "accept") {
    // First user accepted - notify other user
    const otherUserId = isUserA ? intro.user_b_id : intro.user_a_id;
    // TODO: Send notification to other user
  }

  const messages: { [key: string]: string } = {
    user_a_accepted: "You accepted! Waiting for the other person to respond.",
    user_b_accepted: "You accepted! Waiting for the other person to respond.",
    both_accepted: "Both of you accepted! A group chat has been created.",
    user_a_declined: "You declined this introduction.",
    user_b_declined: "You declined this introduction.",
  };

  return NextResponse.json({
    success: true,
    data: {
      new_status: newStatus,
      conversation_id: conversationId,
    },
    msg: messages[newStatus] || "Response recorded",
  });
}

/**
 * Handle matchmaker updating outcome
 */
async function handleOutcomeUpdate(
  supabase: any,
  matchmakerId: string,
  introId: string,
  userId: string,
  body: any
) {
  const validation = outcomeSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { success: false, msg: validation.error.issues[0].message },
      { status: 400 }
    );
  }

  const { outcome } = validation.data;

  // Verify matchmaker ownership
  const { data: matchmaker } = await supabase
    .from("matchmakers")
    .select("user_id")
    .eq("id", matchmakerId)
    .single();

  if (!matchmaker || matchmaker.user_id !== userId) {
    return NextResponse.json(
      { success: false, msg: "Not authorized" },
      { status: 403 }
    );
  }

  // Update outcome
  const { error: updateError } = await supabase
    .from("matchmaker_introductions")
    .update({
      outcome,
      outcome_updated_at: new Date().toISOString(),
    })
    .eq("id", introId)
    .eq("matchmaker_id", matchmakerId);

  if (updateError) {
    console.error("Error updating outcome:", updateError);
    return NextResponse.json(
      { success: false, msg: "Error updating outcome" },
      { status: 500 }
    );
  }

  // Stats will be recalculated automatically by trigger

  return NextResponse.json({
    success: true,
    msg: "Outcome updated successfully",
  });
}
