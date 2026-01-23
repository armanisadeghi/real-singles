import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/blocks
 * Get list of users blocked by current user
 */
export async function GET() {
  const supabase = await createClient();

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

  const { data: blocks, error } = await supabase
    .from("blocks")
    .select(`
      id,
      blocked_id,
      created_at,
      profiles:blocked_id(
        user_id,
        first_name,
        last_name,
        profile_image_url,
        users:user_id(display_name)
      )
    `)
    .eq("blocker_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching blocks:", error);
    return NextResponse.json(
      { success: false, msg: "Error fetching blocked users" },
      { status: 500 }
    );
  }

  const formattedBlocks = (blocks || []).map((block: any) => ({
    id: block.id,
    blocked_user_id: block.blocked_id,
    display_name: block.profiles?.users?.display_name || block.profiles?.first_name || "User",
    first_name: block.profiles?.first_name || "",
    last_name: block.profiles?.last_name || "",
    profile_image_url: block.profiles?.profile_image_url || "",
    blocked_at: block.created_at,
  }));

  return NextResponse.json({
    success: true,
    data: formattedBlocks,
    msg: "Blocked users fetched successfully",
  });
}

/**
 * POST /api/blocks
 * Block a user
 */
export async function POST(request: Request) {
  const supabase = await createClient();

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
    let blockedUserId: string | null = null;

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      blockedUserId = formData.get("BlockedUserID") as string || formData.get("blocked_user_id") as string;
    } else {
      const body = await request.json();
      blockedUserId = body.BlockedUserID || body.blocked_user_id;
    }

    if (!blockedUserId) {
      return NextResponse.json(
        { success: false, msg: "Blocked user ID is required" },
        { status: 400 }
      );
    }

    // Can't block yourself
    if (blockedUserId === user.id) {
      return NextResponse.json(
        { success: false, msg: "Cannot block yourself" },
        { status: 400 }
      );
    }

    // Check if already blocked
    const { data: existing } = await supabase
      .from("blocks")
      .select("id")
      .eq("blocker_id", user.id)
      .eq("blocked_id", blockedUserId)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        msg: "User is already blocked",
      });
    }

    // Create block
    const { error } = await supabase
      .from("blocks")
      .insert({
        blocker_id: user.id,
        blocked_id: blockedUserId,
      });

    if (error) {
      console.error("Error blocking user:", error);
      return NextResponse.json(
        { success: false, msg: "Error blocking user" },
        { status: 500 }
      );
    }

    // Remove from favorites (both directions)
    await supabase
      .from("favorites")
      .delete()
      .or(`and(user_id.eq.${user.id},favorite_user_id.eq.${blockedUserId}),and(user_id.eq.${blockedUserId},favorite_user_id.eq.${user.id})`);

    // Remove any existing matches
    await supabase
      .from("matches")
      .delete()
      .or(`and(user_id.eq.${user.id},target_user_id.eq.${blockedUserId}),and(user_id.eq.${blockedUserId},target_user_id.eq.${user.id})`);

    return NextResponse.json({
      success: true,
      msg: "User blocked successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/blocks:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}
