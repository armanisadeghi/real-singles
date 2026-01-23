import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/confirm-phone
 * Confirm phone with OTP code
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
    let phone: string | null = null;
    let otp: string | null = null;

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      phone = formData.get("phone") as string || formData.get("Phone") as string;
      otp = formData.get("otp") as string || formData.get("OTP") as string || formData.get("code") as string;
    } else {
      const body = await request.json();
      phone = body.phone || body.Phone;
      otp = body.otp || body.OTP || body.code;
    }

    if (!otp) {
      return NextResponse.json(
        { success: false, msg: "OTP code is required" },
        { status: 400 }
      );
    }

    // Get user's current phone from database
    const { data: userData } = await supabase
      .from("users")
      .select("phone")
      .eq("id", user.id)
      .single();

    const targetPhone = phone || userData?.phone;

    if (!targetPhone) {
      return NextResponse.json(
        { success: false, msg: "No phone number to verify. Please request a new code." },
        { status: 400 }
      );
    }

    // Check if Twilio is configured
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;

    if (!twilioSid) {
      // Demo mode - accept "123456" as valid OTP
      if (otp === "123456") {
        // Mark phone as verified
        const { error: updateError } = await supabase
          .from("users")
          .update({
            phone: targetPhone,
            phone_verified: true,
          })
          .eq("id", user.id);

        if (updateError) {
          console.error("Error updating phone verification:", updateError);
          return NextResponse.json(
            { success: false, msg: "Failed to verify phone" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          demo_mode: true,
          msg: "Phone verified successfully (demo mode)",
        });
      } else {
        return NextResponse.json(
          { success: false, msg: "Invalid verification code" },
          { status: 400 }
        );
      }
    }

    // TODO: Implement actual OTP verification
    // 1. Retrieve stored OTP from database
    // 2. Check if OTP matches and hasn't expired
    // 3. Mark phone as verified

    // Placeholder for real implementation
    return NextResponse.json(
      { success: false, msg: "Phone verification not fully configured" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error in confirm-phone:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}
