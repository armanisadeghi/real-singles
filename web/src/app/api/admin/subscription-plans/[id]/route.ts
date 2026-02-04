/**
 * Admin API for individual subscription plan management
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
 * GET /api/admin/subscription-plans/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: plan, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !plan) {
    return NextResponse.json(
      { error: "Plan not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    plan,
  });
}

/**
 * PATCH /api/admin/subscription-plans/[id]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

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
      is_active,
      display_order,
    } = body;

    const supabase = createAdminClient();

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (stripe_price_id_monthly !== undefined) updateData.stripe_price_id_monthly = stripe_price_id_monthly;
    if (stripe_price_id_yearly !== undefined) updateData.stripe_price_id_yearly = stripe_price_id_yearly;
    if (dollar_price_monthly !== undefined) {
      updateData.dollar_price_monthly = parseFloat(String(dollar_price_monthly));
    }
    if (dollar_price_yearly !== undefined) {
      updateData.dollar_price_yearly = dollar_price_yearly ? parseFloat(String(dollar_price_yearly)) : null;
    }
    if (features !== undefined) updateData.features = features;
    if (tier_level !== undefined) updateData.tier_level = tier_level;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (display_order !== undefined) updateData.display_order = display_order;

    const { data: plan, error } = await supabase
      .from("subscription_plans")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating subscription plan:", error);
      return NextResponse.json(
        { error: "Failed to update plan" },
        { status: 500 }
      );
    }

    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      plan,
      message: "Plan updated successfully",
    });
  } catch (error) {
    console.error("Error in PATCH /api/admin/subscription-plans/[id]:", error);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/admin/subscription-plans/[id]
 * Soft delete by setting is_active = false
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("subscription_plans")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    console.error("Error deleting subscription plan:", error);
    return NextResponse.json(
      { error: "Failed to delete plan" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Plan deleted successfully",
  });
}
