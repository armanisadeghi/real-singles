import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/products/[id]
 * Get product details
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("is_active", true)
    .single();

  if (error || !product) {
    return NextResponse.json(
      { success: false, msg: "Product not found" },
      { status: 404 }
    );
  }

  const formattedProduct = {
    ProductID: product.id,
    ProductName: product.name,
    Description: product.description || "",
    Image: product.image_url || "",
    Points: product.points_cost.toString(),
    RetailValue: product.retail_value?.toString() || "0",
    Category: product.category || "other",
    CategoryID: product.category || "1",
    StockQuantity: product.stock_quantity,
    InStock: product.stock_quantity === null || product.stock_quantity > 0,
    CreateDate: product.created_at,
  };

  return NextResponse.json({
    success: true,
    data: formattedProduct,
    msg: "Product fetched successfully",
  });
}
