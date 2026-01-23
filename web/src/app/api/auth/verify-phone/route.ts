import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/verify-phone
 * Send phone verification OTP
 * 
 * Note: This requires Twilio to be configured. 
 * For now, this is a stub that can be expanded with actual Twilio integration.
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

    if (!twilioSid || !twilioToken || !twilioPhone) {
      // Twilio not configured - return success for demo/testing
      console.log(`[DEMO MODE] Would send OTP to: ${normalizedPhone}`);
      
      // Store phone number temporarily (in production, generate and store OTP)
      await supabase
        .from("users")
        .update({ phone: normalizedPhone })
        .eq("id", user.id);

      return NextResponse.json({
        success: true,
        demo_mode: true,
        msg: "Phone verification is in demo mode. OTP: 123456",
        data: {
          phone: normalizedPhone,
          // In demo mode, provide a test OTP
          demo_otp: "123456",
        },
      });
    }

    // TODO: Implement actual Twilio OTP sending
    // const twilio = require('twilio')(twilioSid, twilioToken);
    // const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Store OTP in database with expiry
    // Send SMS via Twilio

    // For now, return a placeholder response
    return NextResponse.json({
      success: true,
      msg: "Verification code sent to your phone",
      data: {
        phone: normalizedPhone,
        expires_in: 300, // 5 minutes
      },
    });
  } catch (error) {
    console.error("Error in verify-phone:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}
