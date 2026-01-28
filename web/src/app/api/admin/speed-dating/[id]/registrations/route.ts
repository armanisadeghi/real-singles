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
 * GET /api/admin/speed-dating/[id]/registrations
 * Get all registrations for a speed dating session
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

  // Fetch registrations with user info
  const { data: registrations, error } = await adminSupabase
    .from("speed_dating_registrations")
    .select(`
      id,
      user_id,
      status,
      registered_at,
      users!speed_dating_registrations_user_id_fkey(
        id,
        email,
        display_name
      )
    `)
    .eq("session_id", sessionId)
    .order("registered_at", { ascending: false });

  if (error) {
    console.error("Error fetching registrations:", error);
    return NextResponse.json(
      { success: false, msg: "Error fetching registrations" },
      { status: 500 }
    );
  }

  // Fetch profiles for all registered users
  const userIds = (registrations || []).map((reg) => reg.user_id);
  const { data: profiles } = userIds.length > 0
    ? await adminSupabase
        .from("profiles")
        .select("user_id, first_name, last_name, profile_image_url")
        .in("user_id", userIds)
    : { data: [] };

  // Create a map for quick profile lookup
  const profileMap = new Map(
    (profiles || []).map((p) => [p.user_id, p])
  );

  // Format registrations with resolved image URLs
  const formattedRegistrations = await Promise.all(
    (registrations || []).map(async (reg) => {
      const userInfo = reg.users as { id: string; email: string; display_name: string | null } | null;
      const profileInfo = profileMap.get(reg.user_id);
      
      return {
        id: reg.id,
        userId: reg.user_id,
        email: userInfo?.email || "",
        displayName: userInfo?.display_name || `${profileInfo?.first_name || ""} ${profileInfo?.last_name || ""}`.trim() || "Unknown",
        firstName: profileInfo?.first_name || "",
        lastName: profileInfo?.last_name || "",
        profileImageUrl: await resolveStorageUrl(adminSupabase, profileInfo?.profile_image_url ?? null),
        status: reg.status,
        registeredAt: reg.registered_at,
      };
    })
  );

  // Calculate summary
  const summary = {
    total: formattedRegistrations.length,
    registered: formattedRegistrations.filter((r) => r.status === "registered").length,
    cancelled: formattedRegistrations.filter((r) => r.status === "cancelled").length,
  };

  return NextResponse.json({
    success: true,
    registrations: formattedRegistrations,
    summary,
    msg: "Registrations fetched successfully",
  });
}

/**
 * DELETE /api/admin/speed-dating/[id]/registrations
 * Remove a registration from a speed dating session
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

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, msg: "User ID is required" },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    const { error } = await adminSupabase
      .from("speed_dating_registrations")
      .delete()
      .eq("session_id", sessionId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error removing registration:", error);
      return NextResponse.json(
        { success: false, msg: "Error removing registration" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      msg: "Registration removed successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/admin/speed-dating/[id]/registrations:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}
