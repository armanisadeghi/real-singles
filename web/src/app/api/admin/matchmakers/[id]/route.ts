import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const updateSchema = z.object({
  action: z.enum(["approve", "reject", "suspend", "revoke", "reinstate"]),
  reason: z.string().optional(),
});

// Verify admin access
async function verifyAdmin() {
  const supabase = await createApiClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { isAdmin: false, userId: null };
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
 * DELETE /api/admin/matchmakers/[id]
 * Permanently delete a matchmaker record (use revoke instead in most cases)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin, userId } = await verifyAdmin();
  const { id: matchmakerId } = await params;

  if (!isAdmin || !userId) {
    return NextResponse.json(
      { success: false, msg: "Unauthorized" },
      { status: 403 }
    );
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("matchmakers")
    .delete()
    .eq("id", matchmakerId);

  if (error) {
    console.error("Error deleting matchmaker:", error);
    return NextResponse.json(
      { success: false, msg: "Failed to delete matchmaker" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    msg: "Matchmaker record deleted",
  });
}

/**
 * PATCH /api/admin/matchmakers/[id]
 * Admin action to approve, reject, suspend, revoke, or reinstate a matchmaker
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin, userId } = await verifyAdmin();
  const { id: matchmakerId } = await params;

  if (!isAdmin || !userId) {
    return NextResponse.json(
      { success: false, msg: "Unauthorized" },
      { status: 403 }
    );
  }

  const supabase = createAdminClient();

  try {
    const body = await request.json();
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, msg: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { action, reason } = validation.data;

    // Get current matchmaker
    const { data: matchmaker, error: fetchError } = await supabase
      .from("matchmakers")
      .select("user_id, status")
      .eq("id", matchmakerId)
      .single();

    if (fetchError || !matchmaker) {
      return NextResponse.json(
        { success: false, msg: "Matchmaker not found" },
        { status: 404 }
      );
    }

    let updateData: any = {};

    switch (action) {
      case "approve":
        if (matchmaker.status !== "pending") {
          return NextResponse.json(
            { success: false, msg: "Can only approve pending applications" },
            { status: 400 }
          );
        }
        updateData = {
          status: "approved",
          approved_by: userId,
          approved_at: new Date().toISOString(),
          suspended_reason: null,
        };
        break;

      case "reject":
        if (matchmaker.status !== "pending") {
          return NextResponse.json(
            { success: false, msg: "Can only reject pending applications" },
            { status: 400 }
          );
        }
        updateData = {
          status: "rejected",
          suspended_reason: reason || "Application not approved",
        };
        break;

      case "suspend":
        if (matchmaker.status !== "approved") {
          return NextResponse.json(
            { success: false, msg: "Can only suspend approved matchmakers" },
            { status: 400 }
          );
        }
        if (!reason) {
          return NextResponse.json(
            { success: false, msg: "Reason required for suspension" },
            { status: 400 }
          );
        }
        updateData = {
          status: "suspended",
          suspended_reason: reason,
        };
        break;

      case "revoke":
        // Can revoke any matchmaker (removes their access completely)
        if (matchmaker.status === "inactive") {
          return NextResponse.json(
            { success: false, msg: "Matchmaker access already revoked" },
            { status: 400 }
          );
        }
        updateData = {
          status: "inactive",
          suspended_reason: reason || "Matchmaker access revoked by admin",
        };
        break;

      case "reinstate":
        // Can reinstate suspended or inactive matchmakers
        if (!["suspended", "inactive"].includes(matchmaker.status)) {
          return NextResponse.json(
            { success: false, msg: "Can only reinstate suspended or revoked matchmakers" },
            { status: 400 }
          );
        }
        updateData = {
          status: "approved",
          suspended_reason: null,
          approved_by: userId,
          approved_at: new Date().toISOString(),
        };
        break;
    }

    // Update matchmaker
    const { error: updateError } = await supabase
      .from("matchmakers")
      .update(updateData)
      .eq("id", matchmakerId);

    if (updateError) {
      console.error("Error updating matchmaker:", updateError);
      return NextResponse.json(
        { success: false, msg: "Failed to update matchmaker" },
        { status: 500 }
      );
    }

    // TODO: Send notification to matchmaker

    return NextResponse.json({
      success: true,
      msg: `Matchmaker ${action}${action === "approve" ? "d" : action === "suspend" ? "ed" : "ed"}`,
    });
  } catch (error) {
    console.error("Error in PATCH /api/admin/matchmakers/[id]:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}
