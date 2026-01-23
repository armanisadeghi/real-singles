import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { generateCallToken, getAgoraConfig } from "@/lib/agora/token";
import { z } from "zod";

const callTokenSchema = z.object({
  channel_name: z.string().min(1, "Channel name is required"),
  role: z.enum(["publisher", "subscriber"]).default("publisher"),
});

/**
 * POST /api/agora/call-token
 * Generate an Agora RTC token for video/voice calls
 * 
 * Body:
 * - channel_name: Name of the call channel (usually conversation ID)
 * - role: "publisher" (can send/receive) or "subscriber" (receive only)
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
    const body = await request.json();
    const validation = callTokenSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, msg: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { channel_name, role } = validation.data;

    // Check if Agora is configured
    const config = getAgoraConfig();
    if (!config.appId) {
      return NextResponse.json(
        { success: false, msg: "Call service not configured" },
        { status: 503 }
      );
    }

    // Verify user has access to this channel
    // Channel name is typically the conversation ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(channel_name);
    
    if (isUUID) {
      // If it's a UUID, assume it's a conversation ID and verify access
      const { data: participation } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", channel_name)
        .eq("user_id", user.id)
        .single();

      if (!participation) {
        return NextResponse.json(
          { success: false, msg: "You don't have access to this channel" },
          { status: 403 }
        );
      }
    }

    // Generate a numeric UID for Agora RTC
    // Use a hash of the user ID to get a consistent numeric value
    const uidHash = user.id.split("").reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    const uid = (uidHash % 100000000) + 1; // Keep it under 32-bit and non-zero

    // Generate call token
    const tokenData = await generateCallToken(channel_name, uid, role);

    return NextResponse.json({
      success: true,
      data: {
        token: tokenData.token,
        expiresAt: tokenData.expiresAt,
        channelName: channel_name,
        uid,
        appId: config.appId,
        role,
      },
      msg: "Call token generated successfully",
    });
  } catch (error) {
    console.error("Error generating call token:", error);
    return NextResponse.json(
      { success: false, msg: "Error generating call token" },
      { status: 500 }
    );
  }
}
