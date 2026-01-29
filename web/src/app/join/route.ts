import { NextRequest, NextResponse } from "next/server";
import { REFERRAL_COOKIE_NAME, REFERRAL_COOKIE_MAX_AGE } from "@/lib/config";

/**
 * Join Route Handler - Handles referral links
 * 
 * When someone clicks a referral link (e.g., /join?ref=ABC123):
 * 1. Extract the referral code from the URL
 * 2. Store it in a cookie for later use during registration
 * 3. Redirect to the registration page
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const referralCode = searchParams.get("ref");

  // Build the redirect URL
  const redirectUrl = new URL("/register", request.url);

  // Create the redirect response
  const response = NextResponse.redirect(redirectUrl);

  // If we have a referral code, store it in a cookie
  if (referralCode && referralCode.trim()) {
    response.cookies.set(REFERRAL_COOKIE_NAME, referralCode.trim().toUpperCase(), {
      maxAge: REFERRAL_COOKIE_MAX_AGE,
      path: "/",
      httpOnly: false, // Allow client-side access for pre-filling form
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  return response;
}
