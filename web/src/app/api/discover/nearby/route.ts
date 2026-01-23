import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

/**
 * GET /api/discover/nearby
 * POST /api/discover/nearby
 * Get profiles near the user's location
 * Supports both cookie auth (web) and Bearer token auth (mobile)
 */
export async function GET(request: Request) {
  return handleNearbyRequest(request);
}

export async function POST(request: Request) {
  return handleNearbyRequest(request);
}

async function handleNearbyRequest(request: Request) {
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

  // Get location from request body (POST) or query params (GET)
  let userLat: number | null = null;
  let userLon: number | null = null;
  let maxDistance = 100; // Default 100 km

  if (request.method === "POST") {
    try {
      const formData = await request.formData();
      userLat = formData.get("Latitude") ? parseFloat(formData.get("Latitude") as string) : null;
      userLon = formData.get("Longitude") ? parseFloat(formData.get("Longitude") as string) : null;
      if (formData.get("max_distance")) {
        maxDistance = parseFloat(formData.get("max_distance") as string);
      }
    } catch {
      // If formData fails, try JSON
      try {
        const body = await request.json();
        userLat = body.Latitude ? parseFloat(body.Latitude) : null;
        userLon = body.Longitude ? parseFloat(body.Longitude) : null;
        if (body.max_distance) maxDistance = parseFloat(body.max_distance);
      } catch {
        // No body provided
      }
    }
  } else {
    const { searchParams } = new URL(request.url);
    userLat = searchParams.get("Latitude") ? parseFloat(searchParams.get("Latitude")!) : null;
    userLon = searchParams.get("Longitude") ? parseFloat(searchParams.get("Longitude")!) : null;
    if (searchParams.get("max_distance")) {
      maxDistance = parseFloat(searchParams.get("max_distance")!);
    }
  }

  // If no location provided in request, use user's profile location
  if (!userLat || !userLon) {
    const { data: currentUserProfile } = await supabase
      .from("profiles")
      .select("latitude, longitude")
      .eq("user_id", user.id)
      .single();

    if (currentUserProfile?.latitude && currentUserProfile?.longitude) {
      userLat = currentUserProfile.latitude;
      userLon = currentUserProfile.longitude;
    }
  }

  if (!userLat || !userLon) {
    return NextResponse.json({
      success: true,
      data: [],
      msg: "No location available. Please enable location services.",
    });
  }

  // Get blocked users
  const { data: blockedUsers } = await supabase
    .from("blocks")
    .select("blocker_id, blocked_id")
    .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);

  const blockedIds = new Set<string>();
  blockedUsers?.forEach((block) => {
    if (block.blocker_id === user.id) {
      blockedIds.add(block.blocked_id);
    } else {
      blockedIds.add(block.blocker_id);
    }
  });
  blockedIds.add(user.id);

  // Get user's favorites
  const { data: favorites } = await supabase
    .from("favorites")
    .select("favorite_user_id")
    .eq("user_id", user.id);

  const favoriteIds = new Set(favorites?.map((f) => f.favorite_user_id) || []);

  // Get profiles with location
  let query = supabase
    .from("profiles")
    .select(`
      *,
      users!inner(id, display_name, status, email)
    `)
    .eq("users.status", "active")
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (blockedIds.size > 0) {
    query = query.not("user_id", "in", `(${Array.from(blockedIds).join(",")})`);
  }

  const { data: profiles, error } = await query.limit(100);

  if (error) {
    console.error("Error fetching nearby profiles:", error);
    return NextResponse.json(
      { success: false, msg: "Error fetching profiles" },
      { status: 500 }
    );
  }

  // Calculate distances and filter
  const profilesWithDistance = (profiles || [])
    .map((profile: any) => {
      const R = 6371; // Earth's radius in km
      const dLat = ((profile.latitude - userLat!) * Math.PI) / 180;
      const dLon = ((profile.longitude - userLon!) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((userLat! * Math.PI) / 180) *
          Math.cos((profile.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

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
        Ethniticity: profile.ethnicity || "",
        Religion: profile.religion || "",
        HSign: profile.zodiac_sign || "",
        Interest: profile.interests?.join(", ") || "",
        is_verified: profile.is_verified || false,
        IsFavourite: favoriteIds.has(profile.user_id) ? 1 : 0,
        RATINGS: 0,
        TotalRating: 0,
        distance_in_km: Math.round(distance * 10) / 10,
      };
    })
    .filter((p: any) => p.distance_in_km <= maxDistance)
    .sort((a: any, b: any) => a.distance_in_km - b.distance_in_km);

  return NextResponse.json({
    success: true,
    data: profilesWithDistance,
    msg: "Nearby profiles fetched successfully",
  });
}
