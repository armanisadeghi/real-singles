import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateSchema = z.object({
  action: z.enum(["approve", "reject", "suspend"]),
  reason: z.string().optional(),
});

/**
 * PATCH /api/admin/matchmakers/[id]
 * Admin action to approve, reject, or suspend a matchmaker
 */
export async function PATCH(
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

  // Verify admin role
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData || !userData.role || !["admin", "moderator"].includes(userData.role)) {
    return NextResponse.json(
      { success: false, msg: "Unauthorized" },
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
          approved_by: user.id,
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
