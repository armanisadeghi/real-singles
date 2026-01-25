import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Cookie name for storing referral codes
export const REFERRAL_COOKIE_NAME = "referral_code";
// Cookie expiry in seconds (30 days)
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

interface JoinPageProps {
  searchParams: Promise<{ ref?: string }>;
}

/**
 * Join Page - Handles referral links
 * 
 * When someone clicks a referral link (e.g., /join?ref=ABC123):
 * 1. Extract the referral code from the URL
 * 2. Store it in a cookie for later use during registration
 * 3. Redirect to the registration page
 */
export default async function JoinPage({ searchParams }: JoinPageProps) {
  const params = await searchParams;
  const referralCode = params.ref;

  // If we have a referral code, store it in a cookie
  if (referralCode && referralCode.trim()) {
    const cookieStore = await cookies();
    cookieStore.set(REFERRAL_COOKIE_NAME, referralCode.trim().toUpperCase(), {
      maxAge: COOKIE_MAX_AGE,
      path: "/",
      httpOnly: false, // Allow client-side access for pre-filling form
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  // Redirect to the registration page
  redirect("/register");
}
