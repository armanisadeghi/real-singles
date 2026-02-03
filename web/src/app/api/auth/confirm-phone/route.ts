import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

const MAX_ATTEMPTS = 5;

/**
 * POST /api/auth/confirm-phone
 * Confirm phone with OTP code
 * 
 * Verifies the OTP code against stored value in database.
 * Supports demo mode when Twilio is not configured.
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
    const isDemoMode = !twilioSid;

    // Get stored OTP from database
    const { data: otpRecord } = await supabase
      .from("phone_verification_otps")
      .select("id, otp_code, expires_at, attempts, verified_at")
      .eq("user_id", user.id)
      .eq("phone", targetPhone)
      .single();

    // If no OTP record exists, fall back to demo mode check
    if (!otpRecord) {
      if (isDemoMode && otp === "123456") {
        // Mark phone as verified (demo mode)
        await supabase
          .from("users")
          .update({
            phone: targetPhone,
            phone_verified: true,
          })
          .eq("id", user.id);

        return NextResponse.json({
          success: true,
          demo_mode: true,
          msg: "Phone verified successfully (demo mode)",
        });
      }
      
      return NextResponse.json(
        { success: false, msg: "No verification code found. Please request a new code." },
        { status: 400 }
      );
    }

    // Check if already verified
    if (otpRecord.verified_at) {
      return NextResponse.json(
        { success: false, msg: "This code has already been used." },
        { status: 400 }
      );
    }

    // Check if too many attempts
    const attempts = otpRecord.attempts ?? 0;
    if (attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { success: false, msg: "Too many attempts. Please request a new code." },
        { status: 429 }
      );
    }

    // Check if expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, msg: "Verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // Increment attempt counter
    await supabase
      .from("phone_verification_otps")
      .update({ attempts: attempts + 1 })
      .eq("id", otpRecord.id);

    // Verify OTP
    if (otpRecord.otp_code !== otp) {
      const remainingAttempts = MAX_ATTEMPTS - attempts - 1;
      return NextResponse.json(
        { 
          success: false, 
          msg: remainingAttempts > 0 
            ? `Invalid code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`
            : "Invalid code. Please request a new code."
        },
        { status: 400 }
      );
    }

    // OTP is valid - mark as verified
    await supabase
      .from("phone_verification_otps")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", otpRecord.id);

    // Update user's phone verification status
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
      demo_mode: isDemoMode,
      msg: "Phone verified successfully",
    });
  } catch (error) {
    console.error("Error in confirm-phone:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}
