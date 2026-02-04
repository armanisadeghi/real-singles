/**
 * GET /api/store/items
 * Get all store items (products + purchasable items)
 * 
 * This endpoint combines physical products and digital purchasable items
 * for a unified store experience.
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";

export async function GET(request: NextRequest) {
  const supabase = await createApiClient();

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const itemType = searchParams.get("type"); // "product", "digital", "boost", "superlike_pack", etc.
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  
  // Check if filtering for a specific purchasable item type
  const specificItemTypes = ["boost", "superlike_pack", "points_pack", "see_likes"];
  const isSpecificItemType = itemType && specificItemTypes.includes(itemType);

  const results: Array<{
    id: string;
    type: "product" | "purchasable_item";
    name: string;
    description: string | null;
    image_url: string | null;
    points_cost: number | null;
    dollar_price: number | null;
    category: string | null;
    item_type: string | null;
    quantity: number;
    in_stock: boolean;
    display_order: number;
  }> = [];

  // Fetch products if not filtering for digital only or specific item types
  if (!itemType || itemType === "product") {
    // Skip products if filtering for specific purchasable item types
    if (!isSpecificItemType) {
    let productQuery = supabase
      .from("products")
      .select("id, name, description, image_url, points_cost, dollar_price, category, stock_quantity, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (category) {
      productQuery = productQuery.eq("category", category);
    }

    const { data: products } = await productQuery;

    if (products) {
      for (const product of products) {
        const imageUrl = product.image_url
          ? await resolveStorageUrl(supabase, product.image_url, { bucket: "products" })
          : null;

        results.push({
          id: product.id,
          type: "product",
          name: product.name,
          description: product.description,
          image_url: imageUrl,
          points_cost: product.points_cost,
          dollar_price: product.dollar_price ? Number(product.dollar_price) : null,
          category: product.category,
          item_type: null,
          quantity: 1,
          in_stock: product.stock_quantity === null || product.stock_quantity > 0,
          display_order: 100, // Products appear after featured items
        });
      }
    }
    }
  }

  // Fetch purchasable items if not filtering for products only
  if (!itemType || itemType === "digital" || isSpecificItemType) {
    let itemQuery = supabase
      .from("purchasable_items")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(limit);

    // Filter by specific item type if requested
    if (isSpecificItemType) {
      itemQuery = itemQuery.eq("item_type", itemType);
    }

    const { data: items } = await itemQuery;

    if (items) {
      for (const item of items) {
        const imageUrl = item.image_url
          ? await resolveStorageUrl(supabase, item.image_url, { bucket: "products" })
          : null;

        results.push({
          id: item.id,
          type: "purchasable_item",
          name: item.name,
          description: item.description,
          image_url: imageUrl,
          points_cost: item.points_cost,
          dollar_price: item.dollar_price ? Number(item.dollar_price) : null,
          category: null,
          item_type: item.item_type,
          quantity: item.quantity || 1,
          in_stock: true, // Digital items are always in stock
          display_order: item.display_order || 0,
        });
      }
    }
  }

  // Sort by display_order
  results.sort((a, b) => a.display_order - b.display_order);

  return NextResponse.json({
    success: true,
    items: results,
    data: results, // Alias for compatibility
    total: results.length,
  });
}
