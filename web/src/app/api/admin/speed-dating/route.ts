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
 * GET /api/admin/speed-dating
 * Get all speed dating sessions (admin view)
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

  // Check if user is admin
  const isAdmin = await verifyAdmin(user.id);
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, msg: "Not authorized" },
      { status: 403 }
    );
  }

  const adminSupabase = createAdminClient();
  
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");
  const status = searchParams.get("status");

  let query = adminSupabase
    .from("virtual_speed_dating")
    .select(`
      *,
      speed_dating_registrations(count)
    `)
    .order("scheduled_datetime", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data: sessions, error } = await query;

  if (error) {
    console.error("Error fetching speed dating sessions:", error);
    return NextResponse.json(
      { success: false, msg: "Error fetching sessions", error: error.message },
      { status: 500 }
    );
  }

  // Resolve image URLs for all sessions (speed dating images use the events bucket)
  const formattedSessions = await Promise.all(
    (sessions || []).map(async (session) => {
      const imageUrl = await resolveStorageUrl(adminSupabase, session.image_url, { bucket: "events" });
      return {
        id: session.id,
        title: session.title,
        description: session.description,
        image_url: imageUrl || null,
        scheduled_datetime: session.scheduled_datetime,
        duration_minutes: session.duration_minutes,
        round_duration_seconds: session.round_duration_seconds,
        min_participants: session.min_participants,
        max_participants: session.max_participants,
        gender_preference: session.gender_preference,
        age_min: session.age_min,
        age_max: session.age_max,
        status: session.status,
        agora_channel_prefix: session.agora_channel_prefix,
        created_at: session.created_at,
        registration_count: Array.isArray(session.speed_dating_registrations)
          ? session.speed_dating_registrations.length
          : (session.speed_dating_registrations as { count: number })?.count || 0,
      };
    })
  );

  return NextResponse.json({
    success: true,
    data: formattedSessions,
    msg: "Sessions fetched successfully",
  });
}

/**
 * POST /api/admin/speed-dating
 * Create a new speed dating session (admin only)
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

    // Validate required fields
    if (!body.title || !body.scheduled_datetime) {
      return NextResponse.json(
        { success: false, msg: "Title and scheduled datetime are required" },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    const { data: session, error } = await adminSupabase
      .from("virtual_speed_dating")
      .insert({
        title: body.title,
        description: body.description || null,
        image_url: body.image_url || null,
        scheduled_datetime: body.scheduled_datetime,
        duration_minutes: body.duration_minutes || 45,
        round_duration_seconds: body.round_duration_seconds || 180, // 3 minutes default
        min_participants: body.min_participants || 6,
        max_participants: body.max_participants || 20,
        gender_preference: body.gender_preference || "mixed",
        age_min: body.age_min || null,
        age_max: body.age_max || null,
        status: "scheduled",
        agora_channel_prefix: body.agora_channel_prefix || `speed-dating-${Date.now()}`,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating speed dating session:", error);
      return NextResponse.json(
        { success: false, msg: "Error creating session", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: session,
      msg: "Session created successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/admin/speed-dating:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}
