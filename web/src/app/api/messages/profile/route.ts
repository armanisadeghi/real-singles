import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { z } from "zod";

const sendProfileSchema = z.object({
  conversationId: z.string().uuid("Invalid conversation ID"),
  profileUserId: z.string().uuid("Invalid profile user ID"),
  message: z.string().optional(), // Optional message to accompany the profile
});

/**
 * POST /api/messages/profile
 * Send a profile preview message to a conversation
 * Commonly used by matchmakers to share profiles with their clients
 *
 * Body:
 * - conversationId: The conversation to send to
 * - profileUserId: The user whose profile to share
 * - message: Optional text message to accompany the profile
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
    const validation = sendProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, msg: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { conversationId, profileUserId, message } = validation.data;

    // Verify sender is part of the conversation
    const { data: participation } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (!participation) {
      return NextResponse.json(
        { success: false, msg: "You are not part of this conversation" },
        { status: 403 }
      );
    }

    // Get the profile to share
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(`
        user_id,
        first_name,
        date_of_birth,
        city,
        state,
        profile_image_url,
        bio,
        occupation,
        profile_hidden
      `)
      .eq("user_id", profileUserId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, msg: "Profile not found" },
        { status: 404 }
      );
    }

    // Get display_name from users table
    const { data: profileUser } = await supabase
      .from("users")
      .select("display_name")
      .eq("id", profileUserId)
      .single();

    // Don't share hidden profiles
    if (profile.profile_hidden) {
      return NextResponse.json(
        { success: false, msg: "This profile is not available for sharing" },
        { status: 400 }
      );
    }

    // Calculate age from date of birth
    let age: number | null = null;
    if (profile.date_of_birth) {
      const today = new Date();
      const birthDate = new Date(profile.date_of_birth);
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Build location string
    const location = [profile.city, profile.state].filter(Boolean).join(", ");

    // Create the profile message
    const messageContent = message || `Check out this profile`;

    const { data: newMessage, error: insertError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: messageContent,
        message_type: "profile",
        metadata: {
          profile_id: profile.user_id,
          display_name: profileUser?.display_name || profile.first_name,
          first_name: profile.first_name,
          age: age,
          location: location || null,
          profile_image_url: profile.profile_image_url,
          bio: profile.bio?.substring(0, 150) || null, // Truncate bio for preview
          occupation: profile.occupation,
        },
        status: "sent",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating profile message:", insertError);
      return NextResponse.json(
        { success: false, msg: "Failed to send profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newMessage,
      msg: "Profile shared successfully",
    });
  } catch (error) {
    console.error("Error sending profile message:", error);
    return NextResponse.json(
      { success: false, msg: "Error sending profile message" },
      { status: 500 }
    );
  }
}
