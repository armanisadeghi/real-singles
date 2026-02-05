import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";

/**
 * GET /api/products/[id]
 * Get product details
 * 
 * Supports dual pricing (points and/or dollars)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;
  const supabase = await createApiClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("id, name, description, image_url, points_cost, retail_value, dollar_price, category, stock_quantity, is_public, requires_shipping, created_at")
    .eq("id", productId)
    .eq("is_active", true)
    .single();

  if (error || !product) {
    return NextResponse.json(
      { success: false, msg: "Product not found" },
      { status: 404 }
    );
  }

  const resolvedImageUrl = product.image_url
    ? await resolveStorageUrl(supabase, product.image_url, { 
        bucket: "products",
      })
    : "";

  // Web-friendly format (camelCase)
  const webProduct = {
    id: product.id,
    name: product.name,
    description: product.description || "",
    image_url: resolvedImageUrl,
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

  // Mobile-friendly format (PascalCase)
  const mobileProduct = {
    ProductID: product.id,
    ProductName: product.name,
    Description: product.description || "",
    Image: resolvedImageUrl,
    Points: product.points_cost?.toString() || "0",
    DollarPrice: product.dollar_price?.toString() || null,
    RetailValue: product.retail_value?.toString() || "0",
    Category: product.category || "other",
    CategoryID: product.category || "1",
    StockQuantity: product.stock_quantity,
    InStock: webProduct.in_stock,
    CreateDate: product.created_at,
  };

  return NextResponse.json({
    success: true,
    // Web expects "product" object
    product: webProduct,
    // Mobile expects "data" object
    data: mobileProduct,
    msg: "Product fetched successfully",
  });
}
