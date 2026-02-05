import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";

// Verify the current user is an admin
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
 * GET /api/admin/products/[id]
 * Get product details for editing
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (error || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Store the raw image path
  const rawImageUrl = product.image_url;
  
  const resolvedImageUrl = product.image_url
    ? await resolveStorageUrl(supabase, product.image_url, { 
        bucket: "products",
      })
    : null;

  // Get order count for this product
  const { count: orderCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId);

  return NextResponse.json({
    success: true,
    product: {
      ...product,
      display_image_url: resolvedImageUrl,
      raw_image_url: rawImageUrl
    },
    stats: {
      total_orders: orderCount || 0
    }
  });
}

/**
 * PUT /api/admin/products/[id]
 * Update an existing product
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      description,
      image_url,
      points_cost,
      dollar_price,
      retail_value,
      category,
      stock_quantity,
      is_active,
      is_public,
      requires_shipping,
    } = body;

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // At least one price (points or dollars) is required
    const hasPointsPrice = typeof points_cost === "number" && points_cost > 0;
    const hasDollarPrice = typeof dollar_price === "number" && dollar_price > 0;

    if (!hasPointsPrice && !hasDollarPrice) {
      return NextResponse.json(
        { error: "At least one price (points or dollars) is required" },
        { status: 400 }
      );
    }

    if (points_cost !== undefined && points_cost !== null && (typeof points_cost !== "number" || points_cost < 0)) {
      return NextResponse.json(
        { error: "Points cost must be a non-negative number" },
        { status: 400 }
      );
    }

    if (category && !["gift_card", "merchandise", "experience", "subscription"].includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if product exists
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const { data: product, error } = await supabase
      .from("products")
      .update({
        name,
        description: description || null,
        image_url: image_url || null,
        points_cost: points_cost ?? 0,
        dollar_price: dollar_price !== undefined && dollar_price !== null ? parseFloat(String(dollar_price)) : null,
        retail_value: retail_value ? parseFloat(String(retail_value)) : null,
        category: category || null,
        stock_quantity: stock_quantity !== undefined && stock_quantity !== null ? parseInt(String(stock_quantity)) : null,
        is_active: is_active !== undefined ? is_active : true,
        is_public: is_public !== undefined ? is_public : false,
        requires_shipping: requires_shipping !== undefined ? requires_shipping : true,
      })
      .eq("id", productId)
      .select()
      .single();

    if (error) {
      console.error("Error updating product:", error);
      return NextResponse.json(
        { error: "Failed to update product" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
      message: "Product updated successfully"
    });
  } catch (error) {
    console.error("Error in PUT /api/admin/products/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/products/[id]
 * Soft delete a product (set is_active to false)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Check if product exists
  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Soft delete by setting is_active to false
  const { error } = await supabase
    .from("products")
    .update({ is_active: false })
    .eq("id", productId);

  if (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Product deleted successfully"
  });
}
