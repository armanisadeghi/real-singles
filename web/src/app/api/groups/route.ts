import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

/**
 * GET /api/groups
 * Get user's groups (groups they're a member of)
 */
export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  // Get conversations where user is a participant and type is 'group'
  const { data: participantData, error: participantError } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id);

  if (participantError) {
    console.error("Error fetching participant data:", participantError);
    return NextResponse.json(
      { success: false, msg: "Error fetching groups" },
      { status: 500 }
    );
  }

  const conversationIds = participantData
    ?.map((p) => p.conversation_id)
    .filter((id): id is string => id !== null) || [];

  if (conversationIds.length === 0) {
    return NextResponse.json({
      success: true,
      data: [],
      msg: "No groups found",
    });
  }

  // Get group conversations
  const { data: groups, error: groupsError } = await supabase
    .from("conversations")
    .select(`
      *,
      conversation_participants(
        user_id,
        role,
        profiles:user_id(first_name, profile_image_url, users:user_id(display_name))
      )
    `)
    .in("id", conversationIds)
    .eq("type", "group")
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (groupsError) {
    console.error("Error fetching groups:", groupsError);
    return NextResponse.json(
      { success: false, msg: "Error fetching groups" },
      { status: 500 }
    );
  }

  // Format groups for mobile app
  const formattedGroups = (groups || []).map((group: any) => {
    const participants = group.conversation_participants || [];
    const memberCount = participants.length;
    const userRole = participants.find((p: any) => p.user_id === user.id)?.role || "member";

    return {
      GroupID: group.id,
      GroupName: group.group_name || "Unnamed Group",
      GroupImage: group.group_image_url || "",
      MemberCount: memberCount,
      Members: participants.slice(0, 5).map((p: any) => ({
        user_id: p.user_id,
        display_name: p.profiles?.users?.display_name || p.profiles?.first_name || "User",
        profile_image_url: p.profiles?.profile_image_url || "",
        role: p.role,
      })),
      CreatedBy: group.created_by,
      AgoraGroupID: group.agora_group_id,
      UserRole: userRole,
      CreatedAt: group.created_at,
      UpdatedAt: group.updated_at,
    };
  });

  return NextResponse.json({
    success: true,
    data: formattedGroups,
    msg: "Groups fetched successfully",
  });
}

/**
 * POST /api/groups
 * Create a new group
 */
export async function POST(request: Request) {
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

  try {
    let groupName: string | null = null;
    let groupImage: string | null = null;
    let memberIds: string[] = [];

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      groupName = formData.get("GroupName") as string || formData.get("group_name") as string;
      groupImage = formData.get("Image") as string || formData.get("group_image_url") as string;
      const members = formData.get("members") as string;
      if (members) {
        memberIds = members.split(",").filter(Boolean);
      }
    } else {
      const body = await request.json();
      groupName = body.GroupName || body.group_name;
      groupImage = body.Image || body.group_image_url;
      memberIds = body.members || [];
    }

    if (!groupName) {
      return NextResponse.json(
        { success: false, msg: "Group name is required" },
        { status: 400 }
      );
    }

    // Create the conversation/group
    const { data: group, error: createError } = await supabase
      .from("conversations")
      .insert({
        type: "group",
        group_name: groupName,
        group_image_url: groupImage,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating group:", createError);
      return NextResponse.json(
        { success: false, msg: "Error creating group" },
        { status: 500 }
      );
    }

    // Add creator as owner
    const participants = [
      { conversation_id: group.id, user_id: user.id, role: "owner" },
    ];

    // Add other members
    for (const memberId of memberIds) {
      if (memberId !== user.id) {
        participants.push({
          conversation_id: group.id,
          user_id: memberId,
          role: "member",
        });
      }
    }

    const { error: participantError } = await supabase
      .from("conversation_participants")
      .insert(participants);

    if (participantError) {
      console.error("Error adding participants:", participantError);
      // Rollback: delete the group
      await supabase.from("conversations").delete().eq("id", group.id);
      return NextResponse.json(
        { success: false, msg: "Error adding group members" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        GroupID: group.id,
        GroupName: group.group_name,
        AgoraGroupID: group.agora_group_id,
      },
      msg: "Group created successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/groups:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}
