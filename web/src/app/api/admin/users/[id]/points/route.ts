import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Verify the current user is an admin
async function verifyAdmin(): Promise<boolean> {
  const supabase = await createApiClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return userData?.role === "admin" || userData?.role === "moderator";
}

// POST /api/admin/users/[id]/points - Adjust user points
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { amount, reason } = await request.json();

  if (typeof amount !== "number" || amount === 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Get current balance
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("points_balance")
    .eq("id", id)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const newBalance = (user.points_balance || 0) + amount;

  // Update balance
  const { error: updateError } = await supabase
    .from("users")
    .update({ points_balance: newBalance })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Log the transaction
  await supabase.from("point_transactions").insert({
    user_id: id,
    amount: amount,
    balance_after: newBalance,
    transaction_type: amount > 0 ? "admin_credit" : "admin_debit",
    description: reason || "Admin adjustment",
  });

  return NextResponse.json({ success: true, new_balance: newBalance });
}
