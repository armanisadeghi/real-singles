import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

// Helper to convert profile image URL to a proper URL
async function getProfileImageUrl(
  supabase: Awaited<ReturnType<typeof createApiClient>>,
  imageUrl: string | null | undefined
): Promise<string> {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("http")) return imageUrl;
  
  // It's a storage path - generate a signed URL
  const bucket = imageUrl.includes("/avatar") ? "avatars" : "gallery";
  const { data } = await supabase.storage
    .from(bucket)
    .createSignedUrl(imageUrl, 3600);
  
  return data?.signedUrl || "";
}

/**
 * GET /api/discover/top-matches
 * Get all top matches with optional filter parameters
 * Supports both cookie auth (web) and Bearer token auth (mobile)
 */
export async function GET(request: Request) {
  const supabase = await createApiClient();
  const { searchParams } = new URL(request.url);

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

  // Get filter parameters from query string
  const filters = {
    Gender: searchParams.get("Gender"),
    min_age: searchParams.get("min_age"),
    max_age: searchParams.get("max_age"),
    min_height: searchParams.get("min_height"),
    max_height: searchParams.get("max_height"),
    BodyType: searchParams.get("BodyType"),
    Ethnicity: searchParams.get("Ethnicity"),
    Drinks: searchParams.get("Drinks"),
    Religion: searchParams.get("Religion"),
    Education: searchParams.get("Education"),
    HaveChild: searchParams.get("HaveChild"),
    WantChild: searchParams.get("WantChild"),
    Hsign: searchParams.get("Hsign"),
    Marijuana: searchParams.get("Marijuana"),
    Smoke: searchParams.get("Smoke"),
    marital_status: searchParams.get("marital_status"),
    looking_for: searchParams.get("looking_for"),
    PoliticalView: searchParams.get("PoliticalView"),
    min_distance: searchParams.get("min_distance"),
    max_distance: searchParams.get("max_distance"),
  };

  // Get current user's profile for location and looking_for preference
  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("latitude, longitude, looking_for")
    .eq("user_id", user.id)
    .single();

  // Get blocked users
  const { data: blockedUsers } = await supabase
    .from("blocks")
    .select("blocker_id, blocked_id")
    .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);

  const blockedIds = new Set<string>();
  blockedUsers?.forEach((block) => {
    if (block.blocker_id === user.id && block.blocked_id) {
      blockedIds.add(block.blocked_id);
    } else if (block.blocker_id) {
      blockedIds.add(block.blocker_id);
    }
  });
  blockedIds.add(user.id);

  // Get user's favorites
  const { data: favorites } = await supabase
    .from("favorites")
    .select("favorite_user_id")
    .eq("user_id", user.id);

  const favoriteIds = new Set(favorites?.map((f) => f.favorite_user_id).filter((id): id is string => id !== null) || []);

  // Build query with filters
  // Note: Removed strict status="active" filter to include new users (null status)
  let query = supabase
    .from("profiles")
    .select(`
      *,
      users!inner(id, display_name, status, email)
    `);

  // Exclude blocked users (only if there are blocked users)
  if (blockedIds.size > 0) {
    query = query.not("user_id", "in", `(${Array.from(blockedIds).join(",")})`);
  }

  // ALWAYS apply user's "looking_for" preference from their profile
  // This is the core gender preference that determines who the user wants to see
  // It takes precedence over any filter parameters
  if (currentUserProfile?.looking_for && currentUserProfile.looking_for.length > 0) {
    query = query.in("gender", currentUserProfile.looking_for);
  }
  // Note: The Gender filter parameter is intentionally ignored
  // Gender preference comes ONLY from the user's profile looking_for field

  if (filters.min_age || filters.max_age) {
    const today = new Date();
    if (filters.max_age) {
      const minDate = new Date(today.getFullYear() - parseInt(filters.max_age), today.getMonth(), today.getDate());
      query = query.gte("date_of_birth", minDate.toISOString().split("T")[0]);
    }
    if (filters.min_age) {
      const maxDate = new Date(today.getFullYear() - parseInt(filters.min_age), today.getMonth(), today.getDate());
      query = query.lte("date_of_birth", maxDate.toISOString().split("T")[0]);
    }
  }

  if (filters.min_height) {
    // Convert feet to inches (assuming input is in feet)
    const minHeightInches = Math.round(parseFloat(filters.min_height) * 12);
    query = query.gte("height_inches", minHeightInches);
  }

  if (filters.max_height) {
    const maxHeightInches = Math.round(parseFloat(filters.max_height) * 12);
    query = query.lte("height_inches", maxHeightInches);
  }

  if (filters.BodyType) {
    query = query.eq("body_type", filters.BodyType.toLowerCase());
  }

  if (filters.Ethnicity) {
    query = query.contains("ethnicity", [filters.Ethnicity]);
  }

  if (filters.Religion) {
    query = query.eq("religion", filters.Religion);
  }

  if (filters.Education) {
    query = query.eq("education", filters.Education);
  }

  if (filters.Drinks) {
    query = query.eq("drinking", filters.Drinks.toLowerCase());
  }

  if (filters.Smoke) {
    query = query.eq("smoking", filters.Smoke.toLowerCase());
  }

  if (filters.Marijuana) {
    query = query.eq("marijuana", filters.Marijuana.toLowerCase());
  }

  if (filters.HaveChild && filters.HaveChild !== "any") {
    const hasKidsValue = filters.HaveChild === "Yes" || filters.HaveChild === "true" ? "Yes" : "No";
    query = query.eq("has_kids", hasKidsValue);
  }

  if (filters.WantChild && filters.WantChild !== "any") {
    query = query.eq("wants_kids", filters.WantChild);
  }

  if (filters.Hsign) {
    const zodiacSigns = filters.Hsign.split(",").filter(Boolean);
    if (zodiacSigns.length > 0) {
      query = query.in("zodiac_sign", zodiacSigns);
    }
  }

  if (filters.PoliticalView) {
    query = query.eq("political_views", filters.PoliticalView);
  }

  // Execute query
  const { data: profiles, error } = await query
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching profiles:", error);
    return NextResponse.json(
      { success: false, msg: "Error fetching profiles" },
      { status: 500 }
    );
  }

  // Format profiles and calculate distances
  const formattedProfiles = await Promise.all(
    (profiles || []).map(async (profile: any) => {
      const imageUrl = await getProfileImageUrl(supabase, profile.profile_image_url);
      const formatted: any = {
        ID: profile.user_id,
        id: profile.user_id,
        DisplayName: profile.users?.display_name || profile.first_name || "",
        FirstName: profile.first_name || "",
        LastName: profile.last_name || "",
        Email: profile.users?.email || "",
        DOB: profile.date_of_birth || "",
        Gender: profile.gender || "",
        Image: imageUrl,
        livePicture: imageUrl,
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
        IsFavorite: favoriteIds.has(profile.user_id) ? 1 : 0,
        RATINGS: 0,
        TotalRating: 0,
      };

      // Calculate distance if both users have location
      if (
        currentUserProfile?.latitude &&
        currentUserProfile?.longitude &&
        profile.latitude &&
        profile.longitude
      ) {
        const R = 6371; // Earth's radius in km
        const dLat = ((profile.latitude - currentUserProfile.latitude) * Math.PI) / 180;
        const dLon = ((profile.longitude - currentUserProfile.longitude) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((currentUserProfile.latitude * Math.PI) / 180) *
            Math.cos((profile.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        formatted.distance_in_km = Math.round(R * c * 10) / 10;
      }

      return formatted;
    })
  );

  // Apply distance filter if specified
  let filteredProfiles = formattedProfiles;
  if (filters.max_distance) {
    const maxDistanceKm = parseFloat(filters.max_distance) * 1.60934; // Convert miles to km
    filteredProfiles = formattedProfiles.filter(
      (p: any) => !p.distance_in_km || p.distance_in_km <= maxDistanceKm
    );
  }

  return NextResponse.json({
    success: true,
    data: filteredProfiles,
    msg: "Top matches fetched successfully",
  });
}
