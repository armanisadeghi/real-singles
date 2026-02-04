/**
 * Admin API for subscription plans management
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Verify admin access
async function verifyAdmin(): Promise<{ isAdmin: boolean }> {
  const supabase = await createApiClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { isAdmin: false };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return { 
    isAdmin: userData?.role === "admin" || userData?.role === "moderator"
  };
}

/**
 * GET /api/admin/subscription-plans
 * Get all subscription plans
 */
export async function GET() {
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: plans, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching subscription plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    plans: plans || [],
  });
}

/**
 * POST /api/admin/subscription-plans
 * Create a new subscription plan
 */
export async function POST(request: NextRequest) {
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      description,
      stripe_price_id_monthly,
      stripe_price_id_yearly,
      dollar_price_monthly,
      dollar_price_yearly,
      features,
      tier_level,
      is_active = true,
      display_order = 0,
    } = body;

    if (!name || dollar_price_monthly === undefined) {
      return NextResponse.json(
        { error: "Name and monthly price are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: plan, error } = await supabase
      .from("subscription_plans")
      .insert({
        name,
        description: description || null,
        stripe_price_id_monthly: stripe_price_id_monthly || null,
        stripe_price_id_yearly: stripe_price_id_yearly || null,
        dollar_price_monthly: parseFloat(String(dollar_price_monthly)),
        dollar_price_yearly: dollar_price_yearly ? parseFloat(String(dollar_price_yearly)) : null,
        features: features || {},
        tier_level: tier_level || 0,
        is_active,
        display_order,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating subscription plan:", error);
      return NextResponse.json(
        { error: "Failed to create plan" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, plan, message: "Plan created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/admin/subscription-plans:", error);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
