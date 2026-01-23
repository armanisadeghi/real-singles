import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

/**
 * POST /api/groups/[id]/members
 * Add members to group (owner/admin only)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params;
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

  // Check if user is owner or admin
  const { data: membership } = await supabase
    .from("conversation_participants")
    .select("role")
    .eq("conversation_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json(
      { success: false, msg: "Not authorized to add members" },
      { status: 403 }
    );
  }

  try {
    let memberIds: string[] = [];

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const members = formData.get("members") as string || formData.get("user_ids") as string;
      if (members) {
        memberIds = members.split(",").filter(Boolean);
      }
    } else {
      const body = await request.json();
      memberIds = body.members || body.user_ids || [];
      if (body.user_id) {
        memberIds = [body.user_id];
      }
    }

    if (memberIds.length === 0) {
      return NextResponse.json(
        { success: false, msg: "No members specified" },
        { status: 400 }
      );
    }

    // Get existing members to avoid duplicates
    const { data: existingMembers } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", groupId);

    const existingIds = new Set(existingMembers?.map((m) => m.user_id) || []);

    // Filter out existing members
    const newMemberIds = memberIds.filter((id) => !existingIds.has(id));

    if (newMemberIds.length === 0) {
      return NextResponse.json({
        success: true,
        msg: "All users are already members",
      });
    }

    // Add new members
    const participants = newMemberIds.map((memberId) => ({
      conversation_id: groupId,
      user_id: memberId,
      role: "member",
    }));

    const { error } = await supabase
      .from("conversation_participants")
      .insert(participants);

    if (error) {
      console.error("Error adding members:", error);
      return NextResponse.json(
        { success: false, msg: "Error adding members" },
        { status: 500 }
      );
    }

    // Update group's updated_at
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", groupId);

    return NextResponse.json({
      success: true,
      msg: `${newMemberIds.length} member(s) added successfully`,
    });
  } catch (error) {
    console.error("Error in POST /api/groups/[id]/members:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/groups/[id]/members
 * Remove member from group (owner/admin only, or member removing themselves)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params;
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

  // Get user to remove from query params or body
  const url = new URL(request.url);
  let userIdToRemove = url.searchParams.get("user_id");

  if (!userIdToRemove) {
    try {
      const body = await request.json();
      userIdToRemove = body.user_id;
    } catch {
      // No body provided
    }
  }

  if (!userIdToRemove) {
    return NextResponse.json(
      { success: false, msg: "User ID to remove is required" },
      { status: 400 }
    );
  }

  // Check current user's role
  const { data: membership } = await supabase
    .from("conversation_participants")
    .select("role")
    .eq("conversation_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json(
      { success: false, msg: "You are not a member of this group" },
      { status: 403 }
    );
  }

  // Check if user is trying to remove themselves or has permission
  const isSelfRemoval = userIdToRemove === user.id;
  const hasPermission = ["owner", "admin"].includes(membership.role);

  if (!isSelfRemoval && !hasPermission) {
    return NextResponse.json(
      { success: false, msg: "Not authorized to remove members" },
      { status: 403 }
    );
  }

  // Can't remove the owner
  const { data: targetMembership } = await supabase
    .from("conversation_participants")
    .select("role")
    .eq("conversation_id", groupId)
    .eq("user_id", userIdToRemove)
    .single();

  if (targetMembership?.role === "owner" && !isSelfRemoval) {
    return NextResponse.json(
      { success: false, msg: "Cannot remove the group owner" },
      { status: 400 }
    );
  }

  // Remove the member
  const { error } = await supabase
    .from("conversation_participants")
    .delete()
    .eq("conversation_id", groupId)
    .eq("user_id", userIdToRemove);

  if (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { success: false, msg: "Error removing member" },
      { status: 500 }
    );
  }

  // Update group's updated_at
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", groupId);

  return NextResponse.json({
    success: true,
    msg: isSelfRemoval ? "Left group successfully" : "Member removed successfully",
  });
}
