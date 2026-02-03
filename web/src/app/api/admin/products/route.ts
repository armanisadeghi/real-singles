import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
 * POST /api/admin/products
 * Create a new product
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
      image_url,
      points_cost,
      retail_value,
      category,
      stock_quantity,
      is_active = true
    } = body;

    // Validation
    if (!name || !points_cost) {
      return NextResponse.json(
        { error: "Name and points cost are required" },
        { status: 400 }
      );
    }

    if (typeof points_cost !== "number" || points_cost < 0) {
      return NextResponse.json(
        { error: "Points cost must be a positive number" },
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

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        name,
        description: description || null,
        image_url: image_url || null,
        points_cost,
        retail_value: retail_value ? parseFloat(retail_value) : null,
        category: category || null,
        stock_quantity: stock_quantity !== undefined ? parseInt(stock_quantity) : null,
        is_active
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating product:", error);
      return NextResponse.json(
        { error: "Failed to create product" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, product, message: "Product created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/admin/products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/products
 * Get all products (including inactive) for admin management
 */
export async function GET(request: NextRequest) {
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");
  const category = searchParams.get("category");
  const activeOnly = searchParams.get("active") === "true";

  const supabase = createAdminClient();

  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) {
    query = query.eq("category", category);
  }

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data: products, error } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }

  // Get total count
  let countQuery = supabase
    .from("products")
    .select("id", { count: "exact", head: true });

  if (category) {
    countQuery = countQuery.eq("category", category);
  }

  if (activeOnly) {
    countQuery = countQuery.eq("is_active", true);
  }

  const { count } = await countQuery;

  return NextResponse.json({
    success: true,
    products: products || [],
    total: count || 0
  });
}
