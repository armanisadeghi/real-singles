import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { z } from "zod";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;
    const supabase = await createApiClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Update last_active_at
    await supabase
      .from("users")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", data.user.id);

    // Get user profile - minimal fields for login response
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, profile_image_url, gender, date_of_birth, can_start_matching")
      .eq("user_id", data.user.id)
      .single();

    return NextResponse.json({
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          ...profile,
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        },
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
