import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";

// Cache for 5 minutes - products change occasionally
export const revalidate = 300;

/**
 * GET /api/products
 * Get list of available products for redemption
 * 
 * Cached for 5 minutes - product catalog changes infrequently
 */
export async function GET(request: NextRequest) {
  const supabase = await createApiClient();

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");
  const category = searchParams.get("category");

  let query = supabase
    .from("products")
    .select("id, name, description, image_url, points_cost, retail_value, category, stock_quantity, created_at")
    .eq("is_active", true)
    .order("points_cost", { ascending: true })
    .range(offset, offset + limit - 1);

  if (category) {
    query = query.eq("category", category);
  }

  const { data: products, error } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, msg: "Error fetching products" },
      { status: 500 }
    );
  }

  // Get total count
  let countQuery = supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);
  
  if (category) {
    countQuery = countQuery.eq("category", category);
  }

  const { count } = await countQuery;

  // Format products for mobile app with resolved image URLs
  const formattedProducts = await Promise.all(
    (products || []).map(async (product) => ({
      ProductID: product.id,
      ProductName: product.name,
      Description: product.description || "",
      Image: product.image_url
        ? await resolveStorageUrl(supabase, product.image_url, { bucket: "products" })
        : "",
      Points: product.points_cost.toString(),
      RetailValue: product.retail_value?.toString() || "0",
      Category: product.category || "other",
      CategoryID: product.category || "1",
      StockQuantity: product.stock_quantity,
      InStock: product.stock_quantity === null || product.stock_quantity > 0,
      CreateDate: product.created_at,
    }))
  );

  return NextResponse.json({
    success: true,
    data: formattedProducts,
    total: count || 0,
    msg: "Products fetched successfully",
  });
}
