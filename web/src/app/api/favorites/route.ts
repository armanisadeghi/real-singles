import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

/**
 * GET /api/favorites
 * Get current user's favorites list
 * Supports both cookie auth (web) and Bearer token auth (mobile)
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

  // Get favorites first
  const { data: favorites, error: favError } = await supabase
    .from("favorites")
    .select("id, created_at, favorite_user_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (favError) {
    console.error("Error fetching favorites:", favError);
    return NextResponse.json(
      { success: false, msg: "Error fetching favorites" },
      { status: 500 }
    );
  }

  // If no favorites, return empty array
  if (!favorites || favorites.length === 0) {
    return NextResponse.json({
      success: true,
      data: [],
      msg: "No favorites found",
    });
  }

  // Get profile data for each favorite
  const favoriteUserIds = favorites.map((f) => f.favorite_user_id).filter(Boolean);
  
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select(`
      *,
      users:user_id(id, display_name, email, status)
    `)
    .in("user_id", favoriteUserIds);

  if (profileError) {
    console.error("Error fetching profiles for favorites:", profileError);
    // Return favorites without profile data rather than failing completely
    return NextResponse.json({
      success: true,
      data: [],
      msg: "Favorites found but profile data unavailable",
    });
  }

  // Create a map of profiles by user_id
  const profileMap = new Map(
    (profiles || []).map((p: any) => [p.user_id, p])
  );

  // Merge favorites with profiles
  const favoritesWithProfiles = favorites.map((fav) => ({
    ...fav,
    profiles: profileMap.get(fav.favorite_user_id) || null,
  }));

  // Format profiles for mobile app
  const formattedFavorites = favoritesWithProfiles
    .filter((fav: any) => fav.profiles && fav.profiles.users?.status === "active")
    .map((fav: any) => {
      const profile = fav.profiles;
      return {
        ID: profile.user_id,
        id: profile.user_id,
        DisplayName: profile.users?.display_name || profile.first_name || "",
        FirstName: profile.first_name || "",
        LastName: profile.last_name || "",
        Email: profile.users?.email || "",
        DOB: profile.date_of_birth || "",
        Gender: profile.gender || "",
        Image: profile.profile_image_url || "",
        livePicture: profile.profile_image_url || "",
        About: profile.bio || "",
        City: profile.city || "",
        State: profile.state || "",
        Height: profile.height_inches?.toString() || "",
        BodyType: profile.body_type || "",
        Ethnicity: profile.ethnicity || [],
        Religion: profile.religion || "",
        HSign: profile.zodiac_sign || "",
        Interest: profile.interests?.join(", ") || "",
        is_verified: profile.is_verified || false,
        IsFavorite: 1, // Always 1 since it's in favorites
        RATINGS: 0,
        TotalRating: 0,
        favorited_at: fav.created_at,
      };
    });

  return NextResponse.json({
    success: true,
    data: formattedFavorites,
    msg: "Favorites fetched successfully",
  });
}

/**
 * POST /api/favorites
 * Add a user to favorites (toggle - add if not exists, remove if exists)
 * Supports both cookie auth (web) and Bearer token auth (mobile)
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
    // Handle FormData
    let favoriteUserId: string | null = null;

    try {
      const formData = await request.formData();
      favoriteUserId = formData.get("FavoriteUserID") as string || formData.get("favorite_user_id") as string;
    } catch {
      // Try JSON if FormData fails
      const body = await request.json();
      favoriteUserId = body.FavoriteUserID || body.favorite_user_id;
    }

    if (!favoriteUserId) {
      return NextResponse.json(
        { success: false, msg: "Favorite user ID is required" },
        { status: 400 }
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
      // Remove from favorites
      const { error: deleteError } = await supabase
        .from("favorites")
        .delete()
        .eq("id", existingFavorite.id);

      if (deleteError) {
        console.error("Error removing favorite:", deleteError);
        return NextResponse.json(
          { success: false, msg: "Error removing favorite" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        action: "removed",
        msg: "Removed from favorites",
      });
    } else {
      // Add to favorites
      const { error: insertError } = await supabase
        .from("favorites")
        .insert({
          user_id: user.id,
          favorite_user_id: favoriteUserId,
        });

      if (insertError) {
        console.error("Error adding favorite:", insertError);
        return NextResponse.json(
          { success: false, msg: "Error adding favorite" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        action: "added",
        msg: "Added to favorites",
      });
    }
  } catch (error) {
    console.error("Error in POST /api/favorites:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request" },
      { status: 400 }
    );
  }
}
