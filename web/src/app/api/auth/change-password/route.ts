import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/change-password
 * Change password for authenticated user
 */
export async function POST(request: Request) {
  const supabase = await createClient();

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
    let currentPassword: string | null = null;
    let newPassword: string | null = null;

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      currentPassword = formData.get("current_password") as string || 
                       formData.get("CurrentPassword") as string ||
                       formData.get("old_password") as string;
      newPassword = formData.get("new_password") as string || 
                   formData.get("NewPassword") as string ||
                   formData.get("password") as string;
    } else {
      const body = await request.json();
      currentPassword = body.current_password || body.CurrentPassword || body.old_password;
      newPassword = body.new_password || body.NewPassword || body.password;
    }

    if (!newPassword) {
      return NextResponse.json(
        { success: false, msg: "New password is required" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, msg: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // If current password provided, verify it first
    if (currentPassword) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });

      if (signInError) {
        return NextResponse.json(
          { success: false, msg: "Current password is incorrect" },
          { status: 400 }
        );
      }
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error("Password update error:", updateError);
      return NextResponse.json(
        { success: false, msg: updateError.message || "Failed to update password" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      msg: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error in change-password:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}
