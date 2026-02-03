import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

/**
 * GET /api/points
 * Get user's points balance and transaction history
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

  // Get user's current balance
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("points_balance")
    .eq("id", user.id)
    .single();

  if (userError) {
    console.error("Error fetching user:", userError);
    return NextResponse.json(
      { success: false, msg: "Error fetching points" },
      { status: 500 }
    );
  }

  // Get transaction history - select only fields needed for display
  const { data: transactions, error: txError } = await supabase
    .from("point_transactions")
    .select("id, amount, balance_after, transaction_type, description, reference_id, reference_type, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (txError) {
    console.error("Error fetching transactions:", txError);
    return NextResponse.json(
      { success: false, msg: "Error fetching transaction history" },
      { status: 500 }
    );
  }

  // Get total count for pagination
  const { count } = await supabase
    .from("point_transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Format transactions
  const formattedTransactions = (transactions || []).map((tx) => ({
    ID: tx.id,
    Amount: tx.amount,
    BalanceAfter: tx.balance_after,
    Type: tx.transaction_type,
    Description: tx.description || getDefaultDescription(tx.transaction_type, tx.amount),
    ReferenceID: tx.reference_id,
    ReferenceType: tx.reference_type,
    CreatedAt: tx.created_at,
  }));

  return NextResponse.json({
    success: true,
    data: {
      points: userData?.points_balance || 0,
      transactions: formattedTransactions,
      total: count || 0,
    },
    msg: "Points fetched successfully",
  });
}

function getDefaultDescription(type: string, amount: number): string {
  const isPositive = amount > 0;
  switch (type) {
    case "referral":
      return isPositive ? "Referral bonus" : "Referral reversed";
    case "review":
      return isPositive ? "Review bonus" : "Review removed";
    case "event_attendance":
      return isPositive ? "Event attendance reward" : "Event attendance reversed";
    case "redemption":
      return "Product redemption";
    case "admin_adjustment":
      return isPositive ? "Admin credit" : "Admin adjustment";
    default:
      return isPositive ? "Points earned" : "Points spent";
  }
}
