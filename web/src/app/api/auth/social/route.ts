import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/social
 * Initiate social login (Apple/Google) via Supabase OAuth
 * 
 * Note: This endpoint returns a URL for the client to redirect to.
 * The actual OAuth flow is handled by Supabase.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    let provider: string | null = null;
    let redirectTo: string | null = null;

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      provider = formData.get("provider") as string || formData.get("Provider") as string;
      redirectTo = formData.get("redirect_to") as string || formData.get("redirectTo") as string;
    } else {
      const body = await request.json();
      provider = body.provider || body.Provider;
      redirectTo = body.redirect_to || body.redirectTo;
    }

    if (!provider) {
      return NextResponse.json(
        { success: false, msg: "Provider is required (apple or google)" },
        { status: 400 }
      );
    }

    const validProviders = ["apple", "google"];
    if (!validProviders.includes(provider.toLowerCase())) {
      return NextResponse.json(
        { success: false, msg: "Invalid provider. Must be 'apple' or 'google'" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const callbackUrl = redirectTo || `${baseUrl}/auth/callback`;

    // Initiate OAuth flow
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider.toLowerCase() as "apple" | "google",
      options: {
        redirectTo: callbackUrl,
        queryParams: provider.toLowerCase() === "apple" ? {
          // Apple-specific parameters
          response_mode: "form_post",
        } : undefined,
      },
    });

    if (error) {
      console.error("OAuth error:", error);
      return NextResponse.json(
        { success: false, msg: error.message || "Failed to initiate social login" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        url: data.url,
        provider: provider.toLowerCase(),
      },
      msg: "Redirect to the URL to complete authentication",
    });
  } catch (error) {
    console.error("Error in social login:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}

/**
 * GET /api/auth/social
 * Get available social login providers and their configuration
 */
export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return NextResponse.json({
    success: true,
    data: {
      providers: [
        {
          id: "google",
          name: "Google",
          enabled: true,
          icon: "google",
        },
        {
          id: "apple",
          name: "Apple",
          enabled: true,
          icon: "apple",
        },
      ],
      callback_url: `${baseUrl}/auth/callback`,
    },
    msg: "Social providers fetched successfully",
  });
}
