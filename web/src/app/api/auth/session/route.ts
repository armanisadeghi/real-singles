import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createApiClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { data: null, error: "Not authenticated" },
      { status: 401 }
    );
  }

  // Get user profile data - minimal fields for session
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, profile_image_url, gender, date_of_birth, can_start_matching")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    data: {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        ...profile,
      },
    },
  });
}
