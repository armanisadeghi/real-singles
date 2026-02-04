import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl, IMAGE_SIZES } from "@/lib/supabase/url-utils";

// Cache for 5 minutes - products change occasionally
export const revalidate = 300;

/**
 * GET /api/products
 * Get list of available products for redemption
 * 
 * Supports dual pricing (points and/or dollars)
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
    .select("id, name, description, image_url, points_cost, retail_value, dollar_price, category, stock_quantity, is_public, requires_shipping, created_at")
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

  // Format products with resolved and optimized image URLs
  // Returns both formats for compatibility:
  // - `products` array with web-friendly format (used by web frontend)
  // - `data` array with mobile format (used by mobile app)
  const formattedProducts = await Promise.all(
    (products || []).map(async (product) => {
      // Use optimized card-size images (400x400, 75% quality, WebP format)
      const imageUrl = product.image_url
        ? await resolveStorageUrl(supabase, product.image_url, { 
            bucket: "products",
            transform: IMAGE_SIZES.card,
          })
        : "";

      return {
        // Web-friendly format (camelCase)
        id: product.id,
        name: product.name,
        description: product.description || "",
        image_url: imageUrl,
        points_cost: product.points_cost,
        dollar_price: product.dollar_price ? Number(product.dollar_price) : null,
        retail_value: product.retail_value ? Number(product.retail_value) : null,
        category: product.category || "other",
        stock_quantity: product.stock_quantity,
        in_stock: product.stock_quantity === null || product.stock_quantity > 0,
        is_public: product.is_public || false,
        requires_shipping: product.requires_shipping ?? true,
        created_at: product.created_at,
      };
    })
  );

  // Mobile-friendly format (PascalCase)
  const mobileProducts = formattedProducts.map((product) => ({
    ProductID: product.id,
    ProductName: product.name,
    Description: product.description,
    Image: product.image_url,
    Points: product.points_cost?.toString() || "0",
    DollarPrice: product.dollar_price?.toString() || null,
    RetailValue: product.retail_value?.toString() || "0",
    Category: product.category,
    CategoryID: product.category,
    StockQuantity: product.stock_quantity,
    InStock: product.in_stock,
    CreateDate: product.created_at,
  }));

  return NextResponse.json({
    success: true,
    // Web expects "products" array
    products: formattedProducts,
    // Mobile expects "data" array
    data: mobileProducts,
    total: count || 0,
    msg: "Products fetched successfully",
  });
}
