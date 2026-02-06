import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Verify the current user is an admin
async function verifyAdmin(): Promise<{ isAdmin: boolean; userId?: string }> {
  const supabase = await createApiClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isAdmin: false };
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
 * PATCH /api/admin/reports/[id]
 * Update a report's status (resolve or dismiss)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;
  const { isAdmin, userId } = await verifyAdmin();

  if (!isAdmin || !userId) {
    return NextResponse.json(
      { success: false, msg: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const action = body.action || body.status;
    const resolutionNotes =
      body.resolution_notes || body.resolutionNotes || null;

    // Validate action
    const validActions = ["resolved", "dismissed"];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        {
          success: false,
          msg: "Invalid action. Must be: resolved or dismissed",
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify report exists and is pending
    const { data: existingReport, error: fetchError } = await supabase
      .from("reports")
      .select("id, status")
      .eq("id", reportId)
      .single();

    if (fetchError || !existingReport) {
      return NextResponse.json(
        { success: false, msg: "Report not found" },
        { status: 404 }
      );
    }

    if (existingReport.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          msg: `Report has already been ${existingReport.status}`,
        },
        { status: 409 }
      );
    }

    // Update the report — idempotent via status check above
    const { data: updatedReport, error: updateError } = await supabase
      .from("reports")
      .update({
        status: action,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        resolution_notes: resolutionNotes,
      })
      .eq("id", reportId)
      .eq("status", "pending") // Extra safety: only update if still pending
      .select(
        `
        id,
        reason,
        description,
        status,
        created_at,
        reviewed_at,
        resolution_notes,
        reviewed_by
      `
      )
      .single();

    if (updateError) {
      console.error("Error updating report:", updateError);
      return NextResponse.json(
        { success: false, msg: "Error updating report" },
        { status: 500 }
      );
    }

    if (!updatedReport) {
      return NextResponse.json(
        { success: false, msg: "Report was already processed by another admin" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedReport,
      msg: `Report ${action} successfully`,
    });
  } catch (error) {
    console.error("Error in PATCH /api/admin/reports/[id]:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}

/**
 * GET /api/admin/reports/[id]
 * Get a single report's details
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json(
      { success: false, msg: "Unauthorized" },
      { status: 401 }
    );
  }

  const supabase = createAdminClient();

  const { data: report, error } = await supabase
    .from("reports")
    .select(
      `
      id,
      reason,
      description,
      status,
      created_at,
      reviewed_at,
      resolution_notes,
      reporter_id,
      reported_user_id,
      reviewed_by,
      reporter:reporter_id(id, email, display_name),
      reported:reported_user_id(id, email, display_name),
      reviewer:reviewed_by(id, email, display_name)
    `
    )
    .eq("id", reportId)
    .single();

  if (error || !report) {
    return NextResponse.json(
      { success: false, msg: "Report not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: report,
    msg: "Report fetched successfully",
  });
}
