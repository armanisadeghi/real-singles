import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { verifyMatchmakerOwnership } from "@/lib/services/matchmakers";
import { z } from "zod";

// Validation schema for client updates
const updateSchema = z.object({
  status: z.enum(["active", "paused", "completed", "cancelled"]).optional(),
  notes: z.string().max(5000).optional(),
});

/**
 * PATCH /api/matchmakers/[id]/clients/[clientId]
 * Update client relationship (matchmaker only)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; clientId: string }> }
) {
  const supabase = await createApiClient();
  const { id: matchmakerId, clientId } = await params;

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

  try {
    const body = await request.json();
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, msg: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const updates = validation.data;

    // If status is changing to completed/cancelled, set ended_at
    if (updates.status && ["completed", "cancelled"].includes(updates.status)) {
      (updates as any).ended_at = new Date().toISOString();
    }

    // Update client relationship
    const { error: updateError } = await supabase
      .from("matchmaker_clients")
      .update(updates)
      .eq("id", clientId)
      .eq("matchmaker_id", matchmakerId);

    if (updateError) {
      console.error("Error updating client:", updateError);
      return NextResponse.json(
        { success: false, msg: "Error updating client" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      msg: "Client relationship updated successfully",
    });
  } catch (error) {
    console.error("Error in PATCH /api/matchmakers/[id]/clients/[clientId]:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/matchmakers/[id]/clients/[clientId]
 * End client relationship (matchmaker only)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; clientId: string }> }
) {
  const supabase = await createApiClient();
  const { id: matchmakerId, clientId } = await params;

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

  // Set status to cancelled instead of deleting
  const { error: updateError } = await supabase
    .from("matchmaker_clients")
    .update({
      status: "cancelled",
      ended_at: new Date().toISOString(),
    })
    .eq("id", clientId)
    .eq("matchmaker_id", matchmakerId);

  if (updateError) {
    console.error("Error ending client relationship:", updateError);
    return NextResponse.json(
      { success: false, msg: "Error ending relationship" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    msg: "Client relationship ended",
  });
}
