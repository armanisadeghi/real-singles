import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

/**
 * GET /api/life-goals
 * Get all active life goal definitions
 */
export async function GET() {
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

  const { data: goals, error } = await supabase
    .from("life_goal_definitions")
    .select("*")
    .eq("is_active", true)
    .order("category")
    .order("display_order");

  if (error) {
    console.error("Error fetching life goals:", error);
    return NextResponse.json(
      { success: false, msg: "Error fetching life goals" },
      { status: 500 }
    );
  }

  // Group by category
  const grouped = (goals || []).reduce((acc, goal) => {
    if (!acc[goal.category]) {
      acc[goal.category] = [];
    }
    acc[goal.category].push({
      key: goal.key,
      label: goal.label,
      description: goal.description ?? undefined,
      icon: goal.icon ?? undefined,
    });
    return acc;
  }, {} as Record<string, { key: string; label: string; description?: string; icon?: string }[]>);

  return NextResponse.json({
    success: true,
    data: {
      goals: goals || [],
      grouped,
      categories: [
        { key: "career", label: "Career & Achievement" },
        { key: "adventure", label: "Adventure & Travel" },
        { key: "personal", label: "Personal & Lifestyle" },
        { key: "impact", label: "Impact & Legacy" },
      ],
    },
  });
}
