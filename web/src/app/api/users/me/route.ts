import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/users/me
 * Get the current authenticated user's profile
 */
export async function GET() {
  const supabase = await createClient();

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

  // Get user record
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get profile data
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Get gallery images
  const { data: gallery } = await supabase
    .from("user_gallery")
    .select("*")
    .eq("user_id", user.id)
    .order("display_order", { ascending: true });

  if (userError && userError.code !== "PGRST116") {
    return NextResponse.json(
      { success: false, msg: "Error fetching user data" },
      { status: 500 }
    );
  }

  // Transform data to match mobile app format
  const responseData = {
    // Core user info
    ID: user.id,
    id: user.id,
    Email: user.email,
    Phone: userData?.phone || user.phone,
    DisplayName: userData?.display_name || profile?.first_name || "",
    FirstName: profile?.first_name || "",
    LastName: profile?.last_name || "",
    
    // Profile details
    DOB: profile?.date_of_birth || "",
    Gender: profile?.gender || "",
    Image: profile?.profile_image_url || "",
    livePicture: profile?.profile_image_url || "",
    About: profile?.bio || "",
    
    // Location
    City: profile?.city || "",
    State: profile?.state || "",
    Country: profile?.country || "",
    Address: profile?.city && profile?.state ? `${profile.city}, ${profile.state}` : "",
    Latitude: profile?.latitude?.toString() || "",
    Longitude: profile?.longitude?.toString() || "",
    
    // Physical attributes
    Height: profile?.height_inches?.toString() || "",
    BodyType: profile?.body_type || "",
    Ethniticity: profile?.ethnicity || "",
    
    // Lifestyle
    Religion: profile?.religion || "",
    Political: profile?.political_views || "",
    Education: profile?.education || "",
    JobTitle: profile?.occupation || "",
    Smoking: profile?.smoking || "",
    Drinks: profile?.drinking || "",
    Marijuna: profile?.marijuana || "",
    
    // Family
    HaveChild: profile?.has_kids ? "Yes" : "No",
    WantChild: profile?.wants_kids || "",
    Pets: profile?.pets?.join(", ") || "",
    
    // Interests & Personality
    HSign: profile?.zodiac_sign || "",
    Interest: profile?.interests?.join(", ") || "",
    
    // Verification & Stats
    is_verified: profile?.is_verified || false,
    RATINGS: 0, // TODO: Calculate from reviews
    TotalRating: 0,
    
    // Points
    WalletPoint: userData?.points_balance || 0,
    ReedemPoints: userData?.points_balance || 0,
    RefferalCode: userData?.referral_code || "",
    
    // Gallery
    gallery: gallery || [],
    
    // Status
    status: userData?.status || "active",
    role: userData?.role || "user",
  };

  return NextResponse.json({
    success: true,
    data: responseData,
    msg: "Profile fetched successfully",
  });
}

/**
 * PUT /api/users/me
 * Update the current authenticated user's profile
 */
export async function PUT(request: Request) {
  const supabase = await createClient();

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
    const body = await request.json();

    // Update users table
    const userUpdates: Record<string, unknown> = {};
    if (body.DisplayName !== undefined) userUpdates.display_name = body.DisplayName;
    if (body.Phone !== undefined) userUpdates.phone = body.Phone;

    if (Object.keys(userUpdates).length > 0) {
      userUpdates.updated_at = new Date().toISOString();
      const { error: userUpdateError } = await supabase
        .from("users")
        .update(userUpdates)
        .eq("id", user.id);

      if (userUpdateError) {
        console.error("Error updating user:", userUpdateError);
      }
    }

    // Update profiles table
    const profileUpdates: Record<string, unknown> = {};
    
    // Map mobile field names to database field names
    const fieldMapping: Record<string, string> = {
      FirstName: "first_name",
      LastName: "last_name",
      DOB: "date_of_birth",
      Gender: "gender",
      Image: "profile_image_url",
      livePicture: "profile_image_url",
      About: "bio",
      City: "city",
      State: "state",
      Country: "country",
      Height: "height_inches",
      BodyType: "body_type",
      Ethniticity: "ethnicity",
      Religion: "religion",
      Political: "political_views",
      Education: "education",
      JobTitle: "occupation",
      Smoking: "smoking",
      Drinks: "drinking",
      Marijuna: "marijuana",
      HSign: "zodiac_sign",
      Latitude: "latitude",
      Longitude: "longitude",
    };

    for (const [mobileField, dbField] of Object.entries(fieldMapping)) {
      if (body[mobileField] !== undefined) {
        let value = body[mobileField];
        
        // Handle special conversions
        if (dbField === "height_inches" && value) {
          value = parseInt(value, 10) || null;
        }
        if ((dbField === "latitude" || dbField === "longitude") && value) {
          value = parseFloat(value) || null;
        }
        
        profileUpdates[dbField] = value;
      }
    }

    // Handle has_kids conversion
    if (body.HaveChild !== undefined) {
      profileUpdates.has_kids = body.HaveChild === "Yes" || body.HaveChild === true;
    }
    
    // Handle wants_kids
    if (body.WantChild !== undefined) {
      profileUpdates.wants_kids = body.WantChild;
    }

    // Handle interests array
    if (body.Interest !== undefined) {
      profileUpdates.interests = typeof body.Interest === "string" 
        ? body.Interest.split(",").map((i: string) => i.trim()).filter(Boolean)
        : body.Interest;
    }

    // Handle pets array
    if (body.Pets !== undefined) {
      profileUpdates.pets = typeof body.Pets === "string"
        ? body.Pets.split(",").map((p: string) => p.trim()).filter(Boolean)
        : body.Pets;
    }

    if (Object.keys(profileUpdates).length > 0) {
      profileUpdates.updated_at = new Date().toISOString();
      
      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          ...profileUpdates,
        }, {
          onConflict: "user_id",
        });

      if (profileUpdateError) {
        console.error("Error updating profile:", profileUpdateError);
        return NextResponse.json(
          { success: false, msg: "Error updating profile" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      msg: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error in PUT /api/users/me:", error);
    return NextResponse.json(
      { success: false, msg: "Invalid request body" },
      { status: 400 }
    );
  }
}
