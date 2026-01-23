import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/forgot-password
 * Request a password reset email (uses Supabase magic link)
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    let email: string | null = null;

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      email = formData.get("email") as string || formData.get("Email") as string;
    } else {
      const body = await request.json();
      email = body.email || body.Email;
    }

    if (!email) {
      return NextResponse.json(
        { success: false, msg: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, msg: "Invalid email format" },
        { status: 400 }
      );
    }

    // Send password reset email via Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/reset-password`,
    });

    if (error) {
      console.error("Password reset error:", error);
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        success: true,
        msg: "If an account exists with this email, you will receive a password reset link.",
      });
    }

    return NextResponse.json({
      success: true,
      msg: "If an account exists with this email, you will receive a password reset link.",
    });
  } catch (error) {
    console.error("Error in forgot-password:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}
