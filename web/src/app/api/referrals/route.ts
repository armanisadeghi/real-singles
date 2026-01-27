import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";
import { getReferralLink } from "@/lib/config";
import type { DbReferral } from "@/types/db";

// Type for referral with JOIN data
interface ReferralWithUser extends DbReferral {
  referred_user: {
    id: string;
    display_name: string | null;
    created_at: string | null;
    profiles: {
      first_name: string | null;
      profile_image_url: string | null;
    } | null;
  } | null;
}

/**
 * GET /api/referrals
 * Get user's referrals and referral stats
 */
export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  // Get user's referral code
  const { data: userData } = await supabase
    .from("users")
    .select("referral_code, points_balance")
    .eq("id", user.id)
    .single();

  // Get referrals made by user
  const { data: referrals, error: referralsError } = await supabase
    .from("referrals")
    .select(`
      *,
      referred_user:referred_user_id(
        id,
        display_name,
        created_at,
        profiles:id(first_name, profile_image_url)
      )
    `)
    .eq("referrer_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (referralsError) {
    console.error("Error fetching referrals:", referralsError);
    return NextResponse.json(
      { success: false, msg: "Error fetching referrals" },
      { status: 500 }
    );
  }

  // Get referral stats
  const { count: totalReferrals } = await supabase
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("referrer_id", user.id);

  const { count: completedReferrals } = await supabase
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("referrer_id", user.id)
    .in("status", ["completed", "rewarded"]);

  const { data: pointsEarned } = await supabase
    .from("referrals")
    .select("points_awarded")
    .eq("referrer_id", user.id)
    .eq("status", "rewarded");

  const totalPointsEarned = pointsEarned?.reduce((sum, r) => sum + (r.points_awarded || 0), 0) || 0;

  // Format referrals with resolved profile image URLs
  // Cast through unknown due to Supabase's complex JOIN type inference
  const typedReferrals = (referrals || []) as unknown as ReferralWithUser[];
  const formattedReferrals = await Promise.all(
    typedReferrals.map(async (ref) => ({
      ReferralID: ref.id,
      ReferredUserID: ref.referred_user_id,
      ReferredUserName: ref.referred_user?.display_name || 
                        ref.referred_user?.profiles?.first_name || "User",
      ReferredUserImage: await resolveStorageUrl(supabase, ref.referred_user?.profiles?.profile_image_url),
      Status: ref.status,
      PointsAwarded: ref.points_awarded,
      CreatedAt: ref.created_at,
      CompletedAt: ref.completed_at,
    }))
  );

  return NextResponse.json({
    success: true,
    data: {
      referral_code: userData?.referral_code || "",
      referral_link: userData?.referral_code ? getReferralLink(userData.referral_code) : "",
      stats: {
        total_referrals: totalReferrals || 0,
        completed_referrals: completedReferrals || 0,
        pending_referrals: (totalReferrals || 0) - (completedReferrals || 0),
        total_points_earned: totalPointsEarned,
      },
      referrals: formattedReferrals,
    },
    msg: "Referrals fetched successfully",
  });
}

/**
 * POST /api/referrals
 * Track a referral (called when referred user signs up)
 * This is typically called internally during registration
 */
export async function POST(request: Request) {
  const supabase = await createApiClient();

  try {
    let referralCode: string | null = null;
    let referredUserId: string | null = null;

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      referralCode = formData.get("referral_code") as string || formData.get("ReferralCode") as string;
      referredUserId = formData.get("referred_user_id") as string || formData.get("user_id") as string;
    } else {
      const body = await request.json();
      referralCode = body.referral_code || body.ReferralCode;
      referredUserId = body.referred_user_id || body.user_id;
    }

    if (!referralCode || !referredUserId) {
      return NextResponse.json(
        { success: false, msg: "Referral code and user ID are required" },
        { status: 400 }
      );
    }

    // Find the referrer by referral code
    const { data: referrer } = await supabase
      .from("users")
      .select("id")
      .eq("referral_code", referralCode)
      .single();

    if (!referrer) {
      return NextResponse.json(
        { success: false, msg: "Invalid referral code" },
        { status: 400 }
      );
    }

    // Can't refer yourself
    if (referrer.id === referredUserId) {
      return NextResponse.json(
        { success: false, msg: "Cannot use your own referral code" },
        { status: 400 }
      );
    }

    // Check if referral already exists
    const { data: existingReferral } = await supabase
      .from("referrals")
      .select("id")
      .eq("referred_user_id", referredUserId)
      .single();

    if (existingReferral) {
      return NextResponse.json({
        success: true,
        msg: "Referral already tracked",
      });
    }

    // Create referral record
    const { error: createError } = await supabase
      .from("referrals")
      .insert({
        referrer_id: referrer.id,
        referred_user_id: referredUserId,
        status: "pending",
        points_awarded: 0,
      });

    if (createError) {
      console.error("Error creating referral:", createError);
      return NextResponse.json(
        { success: false, msg: "Error tracking referral" },
        { status: 500 }
      );
    }

    // Update referred user's record
    await supabase
      .from("users")
      .update({ referred_by: referrer.id })
      .eq("id", referredUserId);

    return NextResponse.json({
      success: true,
      msg: "Referral tracked successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/referrals:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}
