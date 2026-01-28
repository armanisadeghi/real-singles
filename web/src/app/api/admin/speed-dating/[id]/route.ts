import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";

/**
 * Verify the current user is an admin or moderator
 */
async function verifyAdmin(userId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  return userData?.role === "admin" || userData?.role === "moderator";
}

/**
 * GET /api/admin/speed-dating/[id]
 * Get speed dating session details (admin view)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const supabase = await createApiClient();

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

  // Check if user is admin
  const isAdmin = await verifyAdmin(user.id);
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, msg: "Not authorized" },
      { status: 403 }
    );
  }

  const adminSupabase = createAdminClient();

  const { data: session, error } = await adminSupabase
    .from("virtual_speed_dating")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    return NextResponse.json(
      { success: false, msg: "Session not found" },
      { status: 404 }
    );
  }

  // Resolve image URL (speed dating images use the events bucket)
  const imageUrl = await resolveStorageUrl(adminSupabase, session.image_url, { bucket: "events" });

  return NextResponse.json({
    success: true,
    session: {
      ...session,
      image_url: imageUrl,
    },
    msg: "Session fetched successfully",
  });
}

/**
 * PUT /api/admin/speed-dating/[id]
 * Update speed dating session (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const supabase = await createApiClient();

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

  // Check if user is admin
  const isAdmin = await verifyAdmin(user.id);
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, msg: "Not authorized" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const adminSupabase = createAdminClient();

    // Only allow specific fields to be updated
    const allowedFields = [
      "title",
      "description",
      "image_url",
      "scheduled_datetime",
      "duration_minutes",
      "round_duration_seconds",
      "min_participants",
      "max_participants",
      "gender_preference",
      "age_min",
      "age_max",
      "status",
      "agora_channel_prefix",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, msg: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data: session, error } = await adminSupabase
      .from("virtual_speed_dating")
      .update(updates)
      .eq("id", sessionId)
      .select()
      .single();

    if (error) {
      console.error("Error updating speed dating session:", error);
      return NextResponse.json(
        { success: false, msg: "Error updating session", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: session,
      msg: "Session updated successfully",
    });
  } catch (error) {
    console.error("Error in PUT /api/admin/speed-dating/[id]:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/admin/speed-dating/[id]
 * Cancel/delete speed dating session (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const supabase = await createApiClient();

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

  // Check if user is admin
  const isAdmin = await verifyAdmin(user.id);
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, msg: "Not authorized" },
      { status: 403 }
    );
  }

  const adminSupabase = createAdminClient();

  // Soft delete by setting status to cancelled
  const { error } = await adminSupabase
    .from("virtual_speed_dating")
    .update({ status: "cancelled" })
    .eq("id", sessionId);

  if (error) {
    console.error("Error cancelling speed dating session:", error);
    return NextResponse.json(
      { success: false, msg: "Error cancelling session" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    msg: "Session cancelled successfully",
  });
}
