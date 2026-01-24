import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

/**
 * POST /api/favorites/[id]
 * Add a user to favorites
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: favoriteUserId } = await params;
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

  // Check if already favorited
  const { data: existingFavorite } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("favorite_user_id", favoriteUserId)
    .single();

  if (existingFavorite) {
    return NextResponse.json({
      success: true,
      msg: "Already in favorites",
    });
  }

  // Add to favorites
  const { error } = await supabase.from("favorites").insert({
    user_id: user.id,
    favorite_user_id: favoriteUserId,
  });

  if (error) {
    console.error("Error adding favorite:", error);
    return NextResponse.json(
      { success: false, msg: "Error adding favorite" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    msg: "Added to favorites",
  });
}

/**
 * DELETE /api/favorites/[id]
 * Remove a user from favorites
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: favoriteUserId } = await params;
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

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("favorite_user_id", favoriteUserId);

  if (error) {
    console.error("Error removing favorite:", error);
    return NextResponse.json(
      { success: false, msg: "Error removing favorite" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    msg: "Removed from favorites",
  });
}
