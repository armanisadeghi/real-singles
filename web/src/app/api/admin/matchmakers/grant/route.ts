import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const grantSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  years_experience: z.number().int().min(0).max(50).optional().default(0),
  specialties: z.array(z.string()).optional().default([]),
  bio: z.string().optional(),
});

/**
 * POST /api/admin/matchmakers/grant
 * Grant matchmaker access to a user (admin only)
 * 
 * This creates a new matchmaker record with status="approved"
 * for a user who hasn't applied through the normal process.
 */
export async function POST(request: NextRequest) {
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

  // Verify admin role
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData?.role || !["admin", "moderator"].includes(userData.role)) {
    return NextResponse.json(
      { success: false, msg: "Unauthorized - admin access required" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const validation = grantSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, msg: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { user_id, years_experience, specialties, bio } = validation.data;
    const adminSupabase = createAdminClient();

    // Check if user exists and is active
    const { data: targetUser, error: userError } = await adminSupabase
      .from("users")
      .select("id, email, status")
      .eq("id", user_id)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { success: false, msg: "User not found" },
        { status: 404 }
      );
    }

    if (targetUser.status !== "active") {
      return NextResponse.json(
        { success: false, msg: "Cannot grant matchmaker access to inactive user" },
        { status: 400 }
      );
    }

    // Check if user is already a matchmaker
    const { data: existingMatchmaker } = await adminSupabase
      .from("matchmakers")
      .select("id, status")
      .eq("user_id", user_id)
      .single();

    if (existingMatchmaker) {
      // User already has a matchmaker record
      if (existingMatchmaker.status === "approved") {
        return NextResponse.json(
          { success: false, msg: "User is already an approved matchmaker" },
          { status: 400 }
        );
      }

      // Reactivate their existing record
      const { error: updateError } = await adminSupabase
        .from("matchmakers")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          suspended_reason: null,
          years_experience,
          specialties,
          bio,
        })
        .eq("id", existingMatchmaker.id);

      if (updateError) {
        console.error("Error updating matchmaker:", updateError);
        return NextResponse.json(
          { success: false, msg: "Failed to grant matchmaker access" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        msg: "Matchmaker access reinstated",
        matchmaker_id: existingMatchmaker.id,
      });
    }

    // Create new matchmaker record
    const { data: newMatchmaker, error: createError } = await adminSupabase
      .from("matchmakers")
      .insert({
        user_id,
        status: "approved",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        years_experience,
        specialties,
        bio,
      })
      .select("id")
      .single();

    if (createError || !newMatchmaker) {
      console.error("Error creating matchmaker:", createError);
      return NextResponse.json(
        { success: false, msg: "Failed to create matchmaker record" },
        { status: 500 }
      );
    }

    // Create initial stats record
    await adminSupabase.from("matchmaker_stats").insert({
      matchmaker_id: newMatchmaker.id,
    });

    return NextResponse.json({
      success: true,
      msg: "Matchmaker access granted",
      matchmaker_id: newMatchmaker.id,
    });
  } catch (error) {
    console.error("Error in POST /api/admin/matchmakers/grant:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}
