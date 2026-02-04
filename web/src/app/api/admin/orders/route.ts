/**
 * Admin API for order management
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";

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
 * GET /api/admin/orders
 * Get all orders with filters
 */
export async function GET(request: NextRequest) {
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");
  const status = searchParams.get("status");
  const paymentMethod = searchParams.get("payment_method");

  const supabase = createAdminClient();

  let query = supabase
    .from("orders")
    .select(`
      *,
      users:user_id(id, email, display_name),
      products:product_id(id, name, image_url),
      purchasable_items:purchasable_item_id(id, name, image_url),
      payments:payment_id(id, amount_cents, status, stripe_payment_intent_id)
    `)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  if (paymentMethod) {
    query = query.eq("payment_method", paymentMethod);
  }

  const { data: orders, error } = await query;

  if (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }

  // Get total count
  let countQuery = supabase
    .from("orders")
    .select("id", { count: "exact", head: true });

  if (status) {
    countQuery = countQuery.eq("status", status);
  }

  if (paymentMethod) {
    countQuery = countQuery.eq("payment_method", paymentMethod);
  }

  const { count } = await countQuery;

  // Resolve image URLs
  const ordersWithUrls = await Promise.all(
    (orders || []).map(async (order) => {
      const product = order.products as { id: string; name: string; image_url: string | null } | null;
      const item = order.purchasable_items as { id: string; name: string; image_url: string | null } | null;
      const imageUrl = product?.image_url || item?.image_url;

      return {
        ...order,
        product_image_url: imageUrl
          ? await resolveStorageUrl(supabase, imageUrl, { bucket: "products" })
          : null,
      };
    })
  );

  return NextResponse.json({
    success: true,
    orders: ordersWithUrls,
    total: count || 0,
  });
}
