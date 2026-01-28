import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { z } from "zod";

const checkEmailSchema = z.object({
  email: z.string().email("Invalid email format"),
});

/**
 * Check if an email is already registered in the system
 * 
 * POST /api/auth/check-email
 * Body: { email: string }
 * 
 * Returns: { exists: boolean, message: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = checkEmailSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = validation.data;
    const supabase = await createApiClient();

    // Check if email exists in users table
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error("Error checking email:", error);
      return NextResponse.json(
        { error: "Failed to check email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exists: !!data,
      message: data ? "Email is already registered" : "Email is available",
    });
  } catch (error) {
    console.error("Check email error:", error);
    return NextResponse.json(
      { error: "An error occurred while checking email" },
      { status: 500 }
    );
  }
}
