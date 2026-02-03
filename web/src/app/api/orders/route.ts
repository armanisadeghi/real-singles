import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import type { DbOrder } from "@/types/db";

// Type for order with JOIN data
interface OrderWithProduct extends DbOrder {
  products: {
    name: string;
    image_url: string | null;
    points_cost: number;
  } | null;
}

/**
 * GET /api/orders
 * Get user's order history
 */
export async function GET(request: NextRequest) {
  const supabase = await createApiClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, msg: "Not authenticated" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id, points_spent, status,
      shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country,
      tracking_number, created_at, updated_at,
      products(name, image_url, points_cost)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, msg: "Error fetching orders" },
      { status: 500 }
    );
  }

  // Get total count
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Format orders
  const typedOrders = (orders || []) as OrderWithProduct[];
  const formattedOrders = typedOrders.map((order) => ({
    OrderID: order.id,
    ProductName: order.products?.name || "Unknown Product",
    ProductImage: order.products?.image_url || "",
    PointsSpent: order.points_spent,
    Status: order.status,
    ShippingName: order.shipping_name,
    ShippingAddress: order.shipping_address,
    ShippingCity: order.shipping_city,
    ShippingState: order.shipping_state,
    ShippingZip: order.shipping_zip,
    ShippingCountry: order.shipping_country,
    TrackingNumber: order.tracking_number,
    CreatedAt: order.created_at,
    UpdatedAt: order.updated_at,
  }));

  return NextResponse.json({
    success: true,
    data: formattedOrders,
    total: count || 0,
    msg: "Orders fetched successfully",
  });
}

/**
 * POST /api/orders
 * Create a new redemption order
 */
export async function POST(request: Request) {
  const supabase = await createApiClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, msg: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    let productId: string | null = null;
    let shippingInfo: Record<string, string> = {};

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      productId = formData.get("productid") as string || formData.get("product_id") as string;
      shippingInfo = {
        shipping_name: formData.get("ShippingName") as string || formData.get("shipping_name") as string || "",
        shipping_address: formData.get("ShippingAddress") as string || formData.get("shipping_address") as string || "",
        shipping_city: formData.get("ShippingCity") as string || formData.get("shipping_city") as string || "",
        shipping_state: formData.get("ShippingState") as string || formData.get("shipping_state") as string || "",
        shipping_zip: formData.get("ShippingZip") as string || formData.get("shipping_zip") as string || "",
        shipping_country: formData.get("ShippingCountry") as string || formData.get("shipping_country") as string || "US",
      };
    } else {
      const body = await request.json();
      productId = body.productid || body.product_id;
      shippingInfo = {
        shipping_name: body.ShippingName || body.shipping_name || "",
        shipping_address: body.ShippingAddress || body.shipping_address || "",
        shipping_city: body.ShippingCity || body.shipping_city || "",
        shipping_state: body.ShippingState || body.shipping_state || "",
        shipping_zip: body.ShippingZip || body.shipping_zip || "",
        shipping_country: body.ShippingCountry || body.shipping_country || "US",
      };
    }

    if (!productId) {
      return NextResponse.json(
        { success: false, msg: "Product ID is required" },
        { status: 400 }
      );
    }

    // Get product details - only fields needed for order creation
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, points_cost, stock_quantity")
      .eq("id", productId)
      .eq("is_active", true)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { success: false, msg: "Product not found or unavailable" },
        { status: 404 }
      );
    }

    // Check stock
    if (product.stock_quantity !== null && product.stock_quantity <= 0) {
      return NextResponse.json(
        { success: false, msg: "Product is out of stock" },
        { status: 400 }
      );
    }

    // Get user's current points
    const { data: userData } = await supabase
      .from("users")
      .select("points_balance")
      .eq("id", user.id)
      .single();

    const currentPoints = userData?.points_balance || 0;

    if (currentPoints < product.points_cost) {
      return NextResponse.json(
        { success: false, msg: "Insufficient points for this redemption" },
        { status: 400 }
      );
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        product_id: productId,
        points_spent: product.points_cost,
        status: "pending",
        ...shippingInfo,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      return NextResponse.json(
        { success: false, msg: "Error creating order" },
        { status: 500 }
      );
    }

    // Deduct points
    const newBalance = currentPoints - product.points_cost;
    await supabase
      .from("users")
      .update({ points_balance: newBalance })
      .eq("id", user.id);

    // Create point transaction record
    await supabase.from("point_transactions").insert({
      user_id: user.id,
      amount: -product.points_cost,
      balance_after: newBalance,
      transaction_type: "redemption",
      description: `Redeemed: ${product.name}`,
      reference_id: order.id,
      reference_type: "orders",
    });

    // Update stock
    if (product.stock_quantity !== null) {
      await supabase
        .from("products")
        .update({ stock_quantity: product.stock_quantity - 1 })
        .eq("id", productId);
    }

    return NextResponse.json({
      success: true,
      data: {
        OrderID: order.id,
        PointsSpent: product.points_cost,
        NewBalance: newBalance,
      },
      msg: "Order placed successfully! We'll process it soon.",
    });
  } catch (error) {
    console.error("Error in POST /api/orders:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}
