/**
 * Admin API for managing purchasable items (superlikes, boosts, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Verify admin access
async function verifyAdmin(): Promise<{ isAdmin: boolean; userId?: string }> {
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
    isAdmin: userData?.role === "admin" || userData?.role === "moderator",
    userId: user.id 
  };
}

const VALID_ITEM_TYPES = [
  "superlike_pack",
  "boost",
  "points_pack",
  "matchmaker_session",
  "read_receipts",
  "see_likes",
  "unlimited_likes",
  "rewind",
  "spotlight",
];

/**
 * GET /api/admin/purchasable-items
 * Get all purchasable items
 */
export async function GET(request: NextRequest) {
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const itemType = searchParams.get("type");
  const activeOnly = searchParams.get("active") === "true";

  const supabase = createAdminClient();

  let query = supabase
    .from("purchasable_items")
    .select("*")
    .order("display_order", { ascending: true });

  if (itemType) {
    query = query.eq("item_type", itemType);
  }

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data: items, error } = await query;

  if (error) {
    console.error("Error fetching purchasable items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    items: items || [],
    total: items?.length || 0,
  });
}

/**
 * POST /api/admin/purchasable-items
 * Create a new purchasable item
 */
export async function POST(request: NextRequest) {
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      item_type,
      name,
      description,
      image_url,
      quantity,
      duration_hours,
      points_cost,
      dollar_price,
      stripe_price_id,
      is_active = true,
      is_public = true,
      display_order = 0,
    } = body;

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!item_type || !VALID_ITEM_TYPES.includes(item_type)) {
      return NextResponse.json(
        { error: `Invalid item type. Must be one of: ${VALID_ITEM_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // At least one price must be set
    const hasPointsPrice = typeof points_cost === "number" && points_cost > 0;
    const hasDollarPrice = typeof dollar_price === "number" && dollar_price > 0;

    if (!hasPointsPrice && !hasDollarPrice) {
      return NextResponse.json(
        { error: "At least one price (points or dollars) is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: item, error } = await supabase
      .from("purchasable_items")
      .insert({
        item_type,
        name,
        description: description || null,
        image_url: image_url || null,
        quantity: quantity || 1,
        duration_hours: duration_hours || null,
        points_cost: points_cost || null,
        dollar_price: dollar_price ? parseFloat(String(dollar_price)) : null,
        stripe_price_id: stripe_price_id || null,
        is_active,
        is_public,
        display_order,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating purchasable item:", error);
      return NextResponse.json(
        { error: "Failed to create item" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, item, message: "Item created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/admin/purchasable-items:", error);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
