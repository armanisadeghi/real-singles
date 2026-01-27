import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";
import type { DbConversation, DbConversationUpdate } from "@/types/db";

// Type for participant with JOIN data
interface ConversationParticipantWithDetails {
  user_id: string | null;
  role: string | null;
  joined_at: string | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    profile_image_url: string | null;
    users: {
      display_name: string | null;
    } | null;
  } | null;
}

// Type for group with participants JOIN
interface GroupWithParticipantDetails extends DbConversation {
  conversation_participants: ConversationParticipantWithDetails[];
}

/**
 * GET /api/groups/[id]
 * Get group details
 */
export async function GET(
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

  // Check if user is a member
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

  // Get group details
  const { data: group, error: groupError } = await supabase
    .from("conversations")
    .select(`
      *,
      conversation_participants(
        user_id,
        role,
        joined_at,
        profiles:user_id(first_name, last_name, profile_image_url, users:user_id(display_name))
      )
    `)
    .eq("id", groupId)
    .eq("type", "group")
    .single();

  if (groupError || !group) {
    return NextResponse.json(
      { success: false, msg: "Group not found" },
      { status: 404 }
    );
  }

  const typedGroup = group as GroupWithParticipantDetails;
  const participants = typedGroup.conversation_participants || [];

  // Resolve profile image URLs
  const groupImageUrl = await resolveStorageUrl(supabase, typedGroup.group_image_url);
  const membersWithUrls = await Promise.all(
    participants.map(async (p) => ({
      user_id: p.user_id,
      display_name: p.profiles?.users?.display_name || p.profiles?.first_name || "User",
      first_name: p.profiles?.first_name || "",
      last_name: p.profiles?.last_name || "",
      profile_image_url: await resolveStorageUrl(supabase, p.profiles?.profile_image_url),
      role: p.role,
      joined_at: p.joined_at,
    }))
  );

  const formattedGroup = {
    GroupID: typedGroup.id,
    GroupName: typedGroup.group_name || "Unnamed Group",
    GroupImage: groupImageUrl,
    MemberCount: participants.length,
    Members: membersWithUrls,
    CreatedBy: typedGroup.created_by,
    AgoraGroupID: typedGroup.agora_group_id,
    UserRole: membership.role,
    CreatedAt: typedGroup.created_at,
    UpdatedAt: typedGroup.updated_at,
  };

  return NextResponse.json({
    success: true,
    data: formattedGroup,
    msg: "Group fetched successfully",
  });
}

/**
 * PUT /api/groups/[id]
 * Update group (owner/admin only)
 */
export async function PUT(
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

  if (!membership || !membership.role || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json(
      { success: false, msg: "Not authorized to update this group" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const updates: DbConversationUpdate = {};

    if (body.GroupName !== undefined || body.group_name !== undefined) {
      updates.group_name = body.GroupName || body.group_name;
    }
    if (body.Image !== undefined || body.group_image_url !== undefined) {
      updates.group_image_url = body.Image || body.group_image_url;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, msg: "No updates provided" },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("conversations")
      .update(updates)
      .eq("id", groupId);

    if (error) {
      console.error("Error updating group:", error);
      return NextResponse.json(
        { success: false, msg: "Error updating group" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      msg: "Group updated successfully",
    });
  } catch (error) {
    console.error("Error in PUT /api/groups/[id]:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/groups/[id]
 * Delete/leave group
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

  // Check if user is owner
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

  if (membership.role === "owner") {
    // Owner deleting = delete entire group
    // First delete all participants
    await supabase
      .from("conversation_participants")
      .delete()
      .eq("conversation_id", groupId);

    // Then delete the conversation
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", groupId);

    if (error) {
      console.error("Error deleting group:", error);
      return NextResponse.json(
        { success: false, msg: "Error deleting group" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      msg: "Group deleted successfully",
    });
  } else {
    // Non-owner leaving = just remove themselves
    const { error } = await supabase
      .from("conversation_participants")
      .delete()
      .eq("conversation_id", groupId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error leaving group:", error);
      return NextResponse.json(
        { success: false, msg: "Error leaving group" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      msg: "Left group successfully",
    });
  }
}
