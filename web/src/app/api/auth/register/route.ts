import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  first_name: z.string().min(1, "First name is required").max(50),
  last_name: z.string().min(1, "Last name is required").max(50),
  referral_code: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, first_name, last_name, referral_code } = validation.data;
    const supabase = await createApiClient();
    const adminClient = createAdminClient();

    // Sign up the user — pass first/last name through metadata for the DB trigger
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          last_name,
        },
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Note: User record is created automatically by database trigger (handle_new_user)
    // Create the profiles record with the legal name collected at registration
    await adminClient.from("profiles").upsert(
      {
        user_id: authData.user.id,
        first_name,
        last_name,
      },
      { onConflict: "user_id" }
    );

    // Handle referral tracking using admin client (bypasses RLS)
    if (referral_code) {
      const { data: referrer } = await adminClient
        .from("users")
        .select("id")
        .eq("referral_code", referral_code)
        .single();

      if (referrer) {
        await adminClient.from("referrals").insert({
          referrer_id: referrer.id,
          referred_user_id: authData.user.id,
          status: "pending",
        });
      }
    }

    return NextResponse.json({
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
        message: "Registration successful. Please check your email to verify your account.",
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
