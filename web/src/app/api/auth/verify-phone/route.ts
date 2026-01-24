import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/auth/verify-phone
 * Send phone verification OTP
 * 
 * Supports both Twilio integration and demo mode.
 * In demo mode (Twilio not configured), accepts code "123456".
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

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      phone = formData.get("phone") as string || formData.get("Phone") as string;
    } else {
      const body = await request.json();
      phone = body.phone || body.Phone;
    }

    if (!phone) {
      return NextResponse.json(
        { success: false, msg: "Phone number is required" },
        { status: 400 }
      );
    }

    // Basic phone validation (should be E.164 format)
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""))) {
      return NextResponse.json(
        { success: false, msg: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, "");

    // Check if Twilio is configured
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
    const isDemoMode = !twilioSid || !twilioToken || !twilioPhone;

    // Generate OTP
    const otp = isDemoMode ? "123456" : generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Store phone number in users table
    await supabase
      .from("users")
      .update({ phone: normalizedPhone })
      .eq("id", user.id);

    // Store OTP in database (upsert to handle resends)
    const { error: otpError } = await supabase
      .from("phone_verification_otps")
      .upsert({
        user_id: user.id,
        phone: normalizedPhone,
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
        verified_at: null,
      }, {
        onConflict: "user_id,phone",
      });

    if (otpError) {
      console.error("Error storing OTP:", otpError);
      // Continue anyway - the confirm endpoint will handle demo mode
    }

    if (isDemoMode) {
      console.log(`[DEMO MODE] OTP for ${normalizedPhone}: ${otp}`);
      
      return NextResponse.json({
        success: true,
        demo_mode: true,
        msg: "Phone verification is in demo mode. Use code 123456",
        data: {
          phone: normalizedPhone,
          expires_in: 300,
        },
      });
    }

    // Send SMS via Twilio
    try {
      const twilioClient = await import("twilio");
      const client = twilioClient.default(twilioSid, twilioToken);
      
      await client.messages.create({
        body: `Your RealSingles verification code is: ${otp}. This code expires in 5 minutes.`,
        from: twilioPhone,
        to: normalizedPhone,
      });

      return NextResponse.json({
        success: true,
        msg: "Verification code sent to your phone",
        data: {
          phone: normalizedPhone,
          expires_in: 300,
        },
      });
    } catch (twilioError) {
      console.error("Twilio error:", twilioError);
      return NextResponse.json(
        { success: false, msg: "Failed to send SMS. Please try again." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in verify-phone:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}
