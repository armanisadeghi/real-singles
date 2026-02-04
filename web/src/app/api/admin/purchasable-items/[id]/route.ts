/**
 * Admin API for managing individual purchasable items
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

/**
 * GET /api/admin/purchasable-items/[id]
 * Get a single purchasable item
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

  const { data: item, error } = await supabase
    .from("purchasable_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !item) {
    return NextResponse.json(
      { error: "Item not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    item,
  });
}

/**
 * PATCH /api/admin/purchasable-items/[id]
 * Update a purchasable item
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
      image_url,
      quantity,
      duration_hours,
      points_cost,
      dollar_price,
      stripe_price_id,
      is_active,
      is_public,
      display_order,
    } = body;

    const supabase = createAdminClient();

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (duration_hours !== undefined) updateData.duration_hours = duration_hours;
    if (points_cost !== undefined) updateData.points_cost = points_cost;
    if (dollar_price !== undefined) {
      updateData.dollar_price = dollar_price ? parseFloat(String(dollar_price)) : null;
    }
    if (stripe_price_id !== undefined) updateData.stripe_price_id = stripe_price_id;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_public !== undefined) updateData.is_public = is_public;
    if (display_order !== undefined) updateData.display_order = display_order;

    const { data: item, error } = await supabase
      .from("purchasable_items")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating purchasable item:", error);
      return NextResponse.json(
        { error: "Failed to update item" },
        { status: 500 }
      );
    }

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      item,
      message: "Item updated successfully",
    });
  } catch (error) {
    console.error("Error in PATCH /api/admin/purchasable-items/[id]:", error);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/admin/purchasable-items/[id]
 * Delete a purchasable item (soft delete by setting is_active = false)
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

  // Soft delete by setting is_active to false
  const { error } = await supabase
    .from("purchasable_items")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    console.error("Error deleting purchasable item:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Item deleted successfully",
  });
}
