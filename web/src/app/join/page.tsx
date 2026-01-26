import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { REFERRAL_COOKIE_NAME, REFERRAL_COOKIE_MAX_AGE } from "@/lib/config";

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
      maxAge: REFERRAL_COOKIE_MAX_AGE,
      path: "/",
      httpOnly: false, // Allow client-side access for pre-filling form
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  // Redirect to the registration page
  redirect("/register");
}
