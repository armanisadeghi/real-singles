import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * DELETE /api/blocks/[id]
 * Unblock a user
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: blockedUserId } = await params;
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

  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", blockedUserId);

  if (error) {
    console.error("Error unblocking user:", error);
    return NextResponse.json(
      { success: false, msg: "Error unblocking user" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    msg: "User unblocked successfully",
  });
}
