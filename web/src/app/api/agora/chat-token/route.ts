/**
 * @deprecated This endpoint is being phased out.
 * 
 * Chat messaging has been migrated to Supabase Realtime.
 * This endpoint is temporarily kept for:
 * - Group chat (pending migration)
 * - Call signaling via Agora Chat custom messages (pending migration to Supabase Broadcast)
 * 
 * TODO: Remove this endpoint once group chat and call signaling are migrated.
 */

import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { ChatTokenBuilder } from "agora-token";

const AGORA_APP_ID = process.env.AGORA_APP_ID!;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE!;

// Token expiration time (24 hours in seconds)
const TOKEN_EXPIRATION_SECONDS = 86400;

/**
 * POST /api/agora/chat-token
 * Generate an Agora Chat token for a user
 * 
 * @deprecated Use Supabase Realtime for new messaging implementations
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
    const userId = body.user_id || user.id;

    // Check if Agora is configured
    if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
      return NextResponse.json(
        { success: false, msg: "Chat service not configured" },
        { status: 503 }
      );
    }

    // Get or create the user's Agora user ID
    // Agora requires alphanumeric IDs, so we sanitize the UUID
    let agoraUserId: string;

    const { data: userData } = await supabase
      .from("users")
      .select("agora_user_id")
      .eq("id", userId)
      .single();

    if (userData?.agora_user_id) {
      agoraUserId = userData.agora_user_id;
    } else {
      // Create a new Agora user ID (remove dashes from UUID)
      agoraUserId = userId.replace(/-/g, "");

      // Store it for future use
      await supabase
        .from("users")
        .update({ agora_user_id: agoraUserId })
        .eq("id", userId);
    }

    // Generate token
    const timestamp = Math.floor(Date.now() / 1000);
    const expiresAt = timestamp + TOKEN_EXPIRATION_SECONDS;

    const token = ChatTokenBuilder.buildUserToken(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      agoraUserId,
      expiresAt
    );

    return NextResponse.json({
      success: true,
      data: {
        userToken: token,
        agoraUserId,
        expiresAt,
        appKey: process.env.AGORA_CHAT_APP_KEY,
      },
      msg: "Chat token generated successfully",
    });
  } catch (error) {
    console.error("Error generating chat token:", error);
    return NextResponse.json(
      { success: false, msg: "Error generating chat token" },
      { status: 500 }
    );
  }
}
