import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { generateChatToken, getAgoraConfig } from "@/lib/agora/token";

/**
 * POST /api/agora/chat-token
 * Generate an Agora Chat token for the current user
 */
export async function POST() {
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
    // Check if Agora is configured
    const config = getAgoraConfig();
    if (!config.appId) {
      return NextResponse.json(
        { success: false, msg: "Chat service not configured" },
        { status: 503 }
      );
    }

    // Get or create Agora user ID for this user
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("agora_user_id")
      .eq("id", user.id)
      .single();

    if (userError) {
      console.error("Error fetching user:", userError);
      return NextResponse.json(
        { success: false, msg: "Error fetching user data" },
        { status: 500 }
      );
    }

    // If no Agora user ID, create one (using the Supabase user ID)
    let agoraUserId = userData?.agora_user_id;
    if (!agoraUserId) {
      // Use a sanitized version of the UUID for Agora
      agoraUserId = user.id.replace(/-/g, "");
      
      // Update user with Agora ID
      await supabase
        .from("users")
        .update({ agora_user_id: agoraUserId })
        .eq("id", user.id);
    }

    // Generate chat token
    const tokenData = await generateChatToken(agoraUserId);

    return NextResponse.json({
      success: true,
      data: {
        token: tokenData.token,
        expiresAt: tokenData.expiresAt,
        agoraUserId,
        appId: config.appId,
        chatAppKey: config.chatAppKey,
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
