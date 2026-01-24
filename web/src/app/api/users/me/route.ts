import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";

// Helper to convert storage path to public URL
function getGalleryPublicUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/gallery/${path}`;
}

/**
 * GET /api/users/me
 * Get the current authenticated user's profile
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

  // Generate signed URLs for gallery items
  const galleryWithUrls = await Promise.all(
    (gallery || []).map(async (item) => {
      if (item.media_url.startsWith("http")) {
        return item;
      }
      
      const { data: signedData } = await supabase.storage
        .from("gallery")
        .createSignedUrl(item.media_url, 3600);
      
      return {
        ...item,
        media_url: signedData?.signedUrl || getGalleryPublicUrl(item.media_url),
        thumbnail_url: item.thumbnail_url 
          ? (await supabase.storage.from("gallery").createSignedUrl(item.thumbnail_url, 3600)).data?.signedUrl || null
          : null,
      };
    })
  );

  // Convert profile image URL to signed URL
  let profileImageUrl = "";
  if (profile?.profile_image_url) {
    if (profile.profile_image_url.startsWith("http")) {
      profileImageUrl = profile.profile_image_url;
    } else {
      const bucket = profile.profile_image_url.includes("/avatar") ? "avatars" : "gallery";
      const { data: imgData } = await supabase.storage
        .from(bucket)
        .createSignedUrl(profile.profile_image_url, 3600);
      profileImageUrl = imgData?.signedUrl || "";
    }
  }

  if (userError && userError.code !== "PGRST116") {
    return NextResponse.json(
      { success: false, msg: "Error fetching user data" },
      { status: 500 }
    );
  }

  // Transform data to match expected format
  // Arrays are returned as arrays, not comma-separated strings
  const responseData = {
    // Core user info
    ID: user.id,
    id: user.id,
    Email: user.email,
    Phone: userData?.phone || user.phone || "",
    Username: userData?.username || "",
    DisplayName: userData?.display_name || profile?.first_name || "",
    
    // Basic Info
    FirstName: profile?.first_name || "",
    LastName: profile?.last_name || "",
    DOB: profile?.date_of_birth || "",
    Gender: profile?.gender || "",
    LookingFor: profile?.looking_for || [],
    ZodiacSign: profile?.zodiac_sign || "",
    Bio: profile?.bio || "",
    LookingForDescription: profile?.looking_for_description || "",
    
    // Field aliases for mobile app compatibility
    About: profile?.bio || "",
    HSign: profile?.zodiac_sign || "",
    
    // Media
    Image: profileImageUrl,
    livePicture: profileImageUrl,
    ProfileImageUrl: profileImageUrl,
    
    // Location
    City: profile?.city || "",
    State: profile?.state || "",
    Country: profile?.country || "",
    ZipCode: profile?.zip_code || "",
    Address: profile?.city && profile?.state ? `${profile.city}, ${profile.state}` : "",
    Latitude: profile?.latitude?.toString() || "",
    Longitude: profile?.longitude?.toString() || "",
    
    // Physical attributes
    Height: profile?.height_inches?.toString() || "",
    HeightInches: profile?.height_inches || null,
    BodyType: profile?.body_type || "",
    
    // Ethnicity (multi-select for mixed heritage)
    Ethnicity: profile?.ethnicity || [],
    
    // Lifestyle
    MaritalStatus: profile?.marital_status || "",
    Religion: profile?.religion || "",
    Political: profile?.political_views || "",
    PoliticalViews: profile?.political_views || "",
    Education: profile?.education || "",
    Occupation: profile?.occupation || "",
    JobTitle: profile?.occupation || "", // Alias for mobile
    Company: profile?.company || "",
    Schools: profile?.schools || [],
    Languages: profile?.languages || [],
    
    // Habits
    Smoking: profile?.smoking || "",
    Drinking: profile?.drinking || "",
    Drinks: profile?.drinking || "", // Alias for mobile
    
    // Marijuana
    Marijuana: profile?.marijuana || "",
    
    Exercise: profile?.exercise || "",
    
    // Family
    HasKids: profile?.has_kids || "",
    HaveChild: profile?.has_kids || "", // Alias for mobile
    WantsKids: profile?.wants_kids || "",
    WantChild: profile?.wants_kids || "", // Alias for mobile
    Pets: profile?.pets || [],
    
    // Interests
    Interests: profile?.interests || [],
    Interest: profile?.interests?.join(", ") || "", // Comma-separated format for mobile
    
    // Profile Prompts (Structured Storytelling)
    IdealFirstDate: profile?.ideal_first_date || "",
    NonNegotiables: profile?.non_negotiables || "",
    WorstJob: profile?.worst_job || "",
    DreamJob: profile?.dream_job || "",
    NightclubOrHome: profile?.nightclub_or_home || "",
    PetPeeves: profile?.pet_peeves || "",
    AfterWork: profile?.after_work || "",
    WayToHeart: profile?.way_to_heart || "",
    CraziestTravelStory: profile?.craziest_travel_story || "",
    WeirdestGift: profile?.weirdest_gift || "",
    PastEvent: profile?.past_event || "",
    
    // Social Links
    SocialLink1: profile?.social_link_1 || "",
    SocialLink2: profile?.social_link_2 || "",
    
    // Verification - Basic
    is_verified: profile?.is_verified || false,
    IsVerified: profile?.is_verified || false,
    VerifiedAt: profile?.verified_at || "",
    VerificationSelfieUrl: profile?.verification_selfie_url || "",
    
    // Verification - Photo (Required for matching)
    IsPhotoVerified: profile?.is_photo_verified || false,
    PhotoVerifiedAt: profile?.photo_verified_at || "",
    
    // Verification - ID (Premium tier)
    IsIdVerified: profile?.is_id_verified || false,
    IdVerifiedAt: profile?.id_verified_at || "",
    
    // Profile Completion
    ProfileCompletionStep: profile?.profile_completion_step || 0,
    ProfileCompletionSkipped: profile?.profile_completion_skipped || [],
    ProfileCompletionPreferNot: profile?.profile_completion_prefer_not || [],
    ProfileCompletedAt: profile?.profile_completed_at || "",
    
    // Stats & Points
    RATINGS: 0, // TODO: Calculate from reviews
    TotalRating: 0,
    WalletPoint: userData?.points_balance || 0,
    RedeemPoints: userData?.points_balance || 0,
    PointsBalance: userData?.points_balance || 0,
    ReferralCode: userData?.referral_code || "",
    
    // Gallery with signed URLs
    gallery: galleryWithUrls,
    
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
 * Supports both cookie auth (web) and Bearer token auth (mobile)
 */
export async function PUT(request: Request) {
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
    const body = await request.json();

    // Update users table
    const userUpdates: Record<string, unknown> = {};
    if (body.DisplayName !== undefined) userUpdates.display_name = body.DisplayName;
    if (body.Username !== undefined) userUpdates.username = body.Username;
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
    
    // Map API field names to database field names
    const fieldMapping: Record<string, string> = {
      // Basic Info
      FirstName: "first_name",
      LastName: "last_name",
      DOB: "date_of_birth",
      Gender: "gender",
      ZodiacSign: "zodiac_sign",
      HSign: "zodiac_sign", // Alias
      Bio: "bio",
      About: "bio", // Alias
      LookingForDescription: "looking_for_description",
      
      // Media
      Image: "profile_image_url",
      livePicture: "profile_image_url",
      ProfileImageUrl: "profile_image_url",
      
      // Location
      City: "city",
      State: "state",
      Country: "country",
      ZipCode: "zip_code",
      Latitude: "latitude",
      Longitude: "longitude",
      
      // Physical
      Height: "height_inches",
      HeightInches: "height_inches",
      BodyType: "body_type",
      
      // Ethnicity (multi-select for mixed heritage)
      Ethnicity: "ethnicity",
      
      // Lifestyle
      MaritalStatus: "marital_status",
      Religion: "religion",
      Political: "political_views",
      PoliticalViews: "political_views",
      Education: "education",
      Occupation: "occupation",
      JobTitle: "occupation", // Alias
      Company: "company",
      
      // Habits
      Smoking: "smoking",
      Drinking: "drinking",
      Drinks: "drinking", // Alias
      
      // Marijuana
      Marijuana: "marijuana",
      
      Exercise: "exercise",
      
      // Family
      HasKids: "has_kids",
      WantsKids: "wants_kids",
      WantChild: "wants_kids", // Alias
      
      // Profile Prompts
      IdealFirstDate: "ideal_first_date",
      NonNegotiables: "non_negotiables",
      WorstJob: "worst_job",
      DreamJob: "dream_job",
      NightclubOrHome: "nightclub_or_home",
      PetPeeves: "pet_peeves",
      AfterWork: "after_work",
      WayToHeart: "way_to_heart",
      CraziestTravelStory: "craziest_travel_story",
      WeirdestGift: "weirdest_gift",
      PastEvent: "past_event",
      
      // Social Links
      SocialLink1: "social_link_1",
      SocialLink2: "social_link_2",
      
      // Profile Completion
      ProfileCompletionStep: "profile_completion_step",
    };

    for (const [apiField, dbField] of Object.entries(fieldMapping)) {
      if (body[apiField] !== undefined) {
        let value = body[apiField];
        
        // Handle special conversions
        if (dbField === "height_inches" && value) {
          value = parseInt(value, 10) || null;
        }
        if ((dbField === "latitude" || dbField === "longitude") && value) {
          value = parseFloat(value) || null;
        }
        if (dbField === "profile_completion_step" && value) {
          value = parseInt(value, 10) || 0;
        }
        
        profileUpdates[dbField] = value;
      }
    }

    // Handle has_kids - support both new string values and boolean
    if (body.HaveChild !== undefined) {
      const val = body.HaveChild;
      if (val === "Yes" || val === true) {
        profileUpdates.has_kids = "yes_live_at_home";
      } else if (val === "No" || val === false) {
        profileUpdates.has_kids = "no";
      } else if (typeof val === "string") {
        profileUpdates.has_kids = val; // New string value
      }
    }

    // Handle looking_for array
    if (body.LookingFor !== undefined) {
      profileUpdates.looking_for = Array.isArray(body.LookingFor) 
        ? body.LookingFor 
        : typeof body.LookingFor === "string" 
          ? body.LookingFor.split(",").map((i: string) => i.trim()).filter(Boolean)
          : null;
    }

    // Handle interests array - support both array and comma-separated string
    if (body.Interests !== undefined || body.Interest !== undefined) {
      const interestsValue = body.Interests ?? body.Interest;
      profileUpdates.interests = Array.isArray(interestsValue)
        ? interestsValue
        : typeof interestsValue === "string" 
          ? interestsValue.split(",").map((i: string) => i.trim()).filter(Boolean)
          : null;
    }

    // Handle pets array
    if (body.Pets !== undefined) {
      profileUpdates.pets = Array.isArray(body.Pets)
        ? body.Pets
        : typeof body.Pets === "string"
          ? body.Pets.split(",").map((p: string) => p.trim()).filter(Boolean)
          : null;
    }

    // Handle ethnicity array (now supports multiple for mixed heritage)
    if (body.Ethnicity !== undefined) {
      const ethnicityValue = body.Ethnicity;
      profileUpdates.ethnicity = Array.isArray(ethnicityValue)
        ? ethnicityValue
        : typeof ethnicityValue === "string"
          ? ethnicityValue.split(",").map((e: string) => e.trim()).filter(Boolean)
          : null;
    }

    // Handle languages array
    if (body.Languages !== undefined) {
      profileUpdates.languages = Array.isArray(body.Languages)
        ? body.Languages
        : typeof body.Languages === "string"
          ? body.Languages.split(",").map((l: string) => l.trim()).filter(Boolean)
          : null;
    }

    // Handle schools array
    if (body.Schools !== undefined) {
      profileUpdates.schools = Array.isArray(body.Schools)
        ? body.Schools
        : typeof body.Schools === "string"
          ? body.Schools.split(",").map((s: string) => s.trim()).filter(Boolean)
          : null;
    }

    // Handle profile completion arrays
    if (body.ProfileCompletionSkipped !== undefined) {
      profileUpdates.profile_completion_skipped = Array.isArray(body.ProfileCompletionSkipped)
        ? body.ProfileCompletionSkipped
        : null;
    }
    if (body.ProfileCompletionPreferNot !== undefined) {
      profileUpdates.profile_completion_prefer_not = Array.isArray(body.ProfileCompletionPreferNot)
        ? body.ProfileCompletionPreferNot
        : null;
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
          { success: false, msg: "Error updating profile", error: profileUpdateError.message },
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
