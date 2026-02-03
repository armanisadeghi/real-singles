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
 * PATCH /api/admin/products/[id]/toggle
 * Toggle product active status
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;
  const { isAdmin } = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Get current status
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("is_active")
    .eq("id", productId)
    .single();

  if (fetchError || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Toggle status
  const { data: updated, error: updateError } = await supabase
    .from("products")
    .update({ is_active: !product.is_active })
    .eq("id", productId)
    .select()
    .single();

  if (updateError) {
    console.error("Error toggling product status:", updateError);
    return NextResponse.json(
      { error: "Failed to toggle product status" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    product: updated,
    message: `Product ${updated.is_active ? "activated" : "deactivated"} successfully`
  });
}
