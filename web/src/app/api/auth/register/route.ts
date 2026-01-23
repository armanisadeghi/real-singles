import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  display_name: z.string().min(2).optional(),
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

    const { email, password, display_name, referral_code } = validation.data;
    const supabase = await createClient();

    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name,
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

    // Create user record in users table
    const { error: userError } = await supabase.from("users").insert({
      id: authData.user.id,
      email: authData.user.email,
      display_name,
      referral_code: generateReferralCode(),
    });

    if (userError) {
      console.error("Error creating user record:", userError);
    }

    // Handle referral if provided
    if (referral_code) {
      const { data: referrer } = await supabase
        .from("users")
        .select("id")
        .eq("referral_code", referral_code)
        .single();

      if (referrer) {
        await supabase.from("referrals").insert({
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

function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
