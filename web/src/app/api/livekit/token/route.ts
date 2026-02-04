import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { AccessToken } from "livekit-server-sdk";
import { z } from "zod";

const tokenSchema = z.object({
  roomName: z.string().min(1, "Room name is required"),
  participantName: z.string().optional(),
});

/**
 * POST /api/livekit/token
 * Generate a LiveKit access token for video/voice calls
 *
 * Body:
 * - roomName: Name of the room to join (conversation ID, speed-dating session ID, etc.)
 * - participantName: Optional display name for the participant
 *
 * Returns:
 * - token: JWT token for LiveKit connection
 * - serverUrl: LiveKit WebSocket URL
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

  // Check if LiveKit is configured
  const livekitUrl = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!livekitUrl || !apiKey || !apiSecret) {
    const missing: string[] = [];
    if (!livekitUrl) missing.push("LIVEKIT_URL");
    if (!apiKey) missing.push("LIVEKIT_API_KEY");
    if (!apiSecret) missing.push("LIVEKIT_API_SECRET");
    
    console.error(`LiveKit environment variables not configured. Missing: ${missing.join(", ")}`);
    return NextResponse.json(
      { 
        success: false, 
        msg: "Video call service not configured",
        // Only include missing vars in development for debugging
        ...(process.env.NODE_ENV === "development" && { missing }),
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const validation = tokenSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, msg: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { roomName, participantName } = validation.data;

    // Verify user has access to this room
    // Room name can be a conversation ID (UUID) or speed-dating session ID
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        roomName
      );
    const isSpeedDating = roomName.startsWith("speed-dating-");

    if (isUUID) {
      // If it's a UUID, assume it's a conversation ID and verify access
      const { data: participation } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", roomName)
        .eq("user_id", user.id)
        .single();

      if (!participation) {
        return NextResponse.json(
          { success: false, msg: "You don't have access to this room" },
          { status: 403 }
        );
      }
    } else if (isSpeedDating) {
      // Extract session ID from room name (speed-dating-{sessionId})
      const sessionId = roomName.replace("speed-dating-", "");

      // Verify user is registered for this speed-dating session
      const { data: registration } = await supabase
        .from("speed_dating_registrations")
        .select("id")
        .eq("session_id", sessionId)
        .eq("user_id", user.id)
        .eq("status", "registered")
        .single();

      if (!registration) {
        return NextResponse.json(
          {
            success: false,
            msg: "You are not registered for this speed-dating session",
          },
          { status: 403 }
        );
      }

      // Also verify the session is in progress
      const { data: session } = await supabase
        .from("virtual_speed_dating")
        .select("status")
        .eq("id", sessionId)
        .single();

      if (!session || session.status !== "in_progress") {
        return NextResponse.json(
          { success: false, msg: "This speed-dating session is not active" },
          { status: 403 }
        );
      }
    }

    // Get user profile for display name
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("user_id", user.id)
      .single();

    // Use provided name, profile name, email prefix, or user ID as fallback
    const displayName =
      participantName ||
      profile?.first_name ||
      user.email?.split("@")[0] ||
      user.id.slice(0, 8);

    // Create access token
    // Use user.id as identity for uniqueness (prevents DUPLICATE_IDENTITY errors)
    const at = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      name: displayName,
      ttl: "2h", // Token valid for 2 hours
    });

    // Grant room join permission
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    // Generate JWT token (v2 SDK - toJwt() is async)
    const token = await at.toJwt();

    return NextResponse.json({
      success: true,
      data: {
        token,
        serverUrl: livekitUrl,
        roomName,
        identity: user.id,
        displayName,
      },
      msg: "Token generated successfully",
    });
  } catch (error) {
    console.error("Error generating LiveKit token:", error);
    return NextResponse.json(
      { success: false, msg: "Error generating video call token" },
      { status: 500 }
    );
  }
}
