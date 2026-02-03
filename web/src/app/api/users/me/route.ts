import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server";
import { validateProfileUpdate } from "@/lib/validation/profile";

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

  // Parallelize all queries for better performance
  const [userResult, profileResult, galleryResult] = await Promise.all([
    // Get user record - select only needed fields
    supabase
      .from("users")
      .select("id, phone, username, display_name, points_balance, referral_code, status, role")
      .eq("id", user.id)
      .single(),

    // Get profile data - select only needed fields
    supabase
      .from("profiles")
      .select(`
        first_name, last_name, date_of_birth, gender, looking_for, zodiac_sign, bio,
        looking_for_description, dating_intentions, profile_image_url,
        city, state, country, zip_code, latitude, longitude, hometown,
        height_inches, body_type, ethnicity,
        marital_status, religion, political_views, education, occupation, company, schools, languages,
        smoking, drinking, marijuana, exercise,
        has_kids, wants_kids, pets,
        interests, life_goals,
        ideal_first_date, non_negotiables, worst_job, dream_job, nightclub_or_home, pet_peeves,
        after_work, way_to_heart, craziest_travel_story, weirdest_gift, past_event,
        voice_prompt_url, video_intro_url, voice_prompt_duration_seconds, video_intro_duration_seconds,
        social_link_1, social_link_2,
        is_verified, verified_at, verification_selfie_url,
        is_photo_verified, photo_verified_at, is_id_verified, id_verified_at,
        profile_completion_step, profile_completion_skipped, profile_completion_prefer_not, profile_completed_at,
        can_start_matching, profile_hidden
      `)
      .eq("user_id", user.id)
      .single(),

    // Get gallery images - select only needed fields
    supabase
      .from("user_gallery")
      .select("id, media_url, media_type, thumbnail_url, is_primary, display_order, caption")
      .eq("user_id", user.id)
      .order("display_order", { ascending: true }),
  ]);

  const userData = userResult.data;
  const userError = userResult.error;
  const profile = profileResult.data;
  const gallery = galleryResult.data;

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
  // Gallery bucket is private, so we need signed URLs for gallery images
  let profileImageUrl = "";
  if (profile?.profile_image_url) {
    let storagePath = profile.profile_image_url;
    let bucket: "avatars" | "gallery" = "gallery";
    
    // If it's a full URL, check if it's a Supabase storage URL and extract the path
    if (storagePath.startsWith("http")) {
      // Check if it's a gallery URL that needs signed URL conversion
      const galleryMatch = storagePath.match(/\/storage\/v1\/object\/(?:public|sign)\/gallery\/(.+?)(?:\?|$)/);
      const avatarMatch = storagePath.match(/\/storage\/v1\/object\/(?:public|sign)\/avatars\/(.+?)(?:\?|$)/);
      
      if (galleryMatch) {
        // It's a gallery URL - extract path and create signed URL
        storagePath = decodeURIComponent(galleryMatch[1]);
        bucket = "gallery";
      } else if (avatarMatch) {
        // It's an avatar URL - avatars are public, can use as-is
        profileImageUrl = storagePath;
        storagePath = ""; // Skip signed URL generation
      } else {
        // External URL or already valid signed URL - use as-is
        profileImageUrl = storagePath;
        storagePath = ""; // Skip signed URL generation
      }
    } else {
      // It's a storage path, determine bucket
      bucket = storagePath.includes("/avatar") ? "avatars" : "gallery";
    }
    
    // Generate signed URL if needed
    if (storagePath) {
      const { data: imgData } = await supabase.storage
        .from(bucket)
        .createSignedUrl(storagePath, 3600);
      profileImageUrl = imgData?.signedUrl || "";
    }
  }

  // Convert verification selfie URL to signed URL
  let verificationSelfieUrl = "";
  if (profile?.verification_selfie_url) {
    const selfiePath = profile.verification_selfie_url;
    
    if (selfiePath.startsWith("http")) {
      // Check if it's a gallery URL that needs signed URL conversion
      const galleryMatch = selfiePath.match(/\/storage\/v1\/object\/(?:public|sign)\/gallery\/(.+?)(?:\?|$)/);
      if (galleryMatch) {
        const extractedPath = decodeURIComponent(galleryMatch[1]);
        const { data: selfieData } = await supabase.storage
          .from("gallery")
          .createSignedUrl(extractedPath, 3600);
        verificationSelfieUrl = selfieData?.signedUrl || "";
      } else {
        verificationSelfieUrl = selfiePath;
      }
    } else {
      // It's a storage path
      const { data: selfieData } = await supabase.storage
        .from("gallery")
        .createSignedUrl(selfiePath, 3600);
      verificationSelfieUrl = selfieData?.signedUrl || "";
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
    DatingIntentions: profile?.dating_intentions || "",
    
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
    School: profile?.schools || [], // Mobile alias
    Languages: profile?.languages || [],
    Language: profile?.languages || [], // Mobile alias
    
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
    
    // Life Goals (The League model)
    LifeGoals: profile?.life_goals || [],
    life_goals: profile?.life_goals || [], // Alias
    
    // Profile Prompts (Structured Storytelling)
    IdealFirstDate: profile?.ideal_first_date || "",
    IdeaDate: profile?.ideal_first_date || "", // Mobile alias
    NonNegotiables: profile?.non_negotiables || "",
    NonNegotiable: profile?.non_negotiables || "", // Mobile alias (singular)
    WorstJob: profile?.worst_job || "",
    DreamJob: profile?.dream_job || "",
    NightclubOrHome: profile?.nightclub_or_home || "",
    NightAtHome: profile?.nightclub_or_home || "", // Mobile alias
    PetPeeves: profile?.pet_peeves || "",
    AfterWork: profile?.after_work || "",
    FindMe: profile?.after_work || "", // Mobile alias
    WayToHeart: profile?.way_to_heart || "",
    CraziestTravelStory: profile?.craziest_travel_story || "",
    craziestTravelStory: profile?.craziest_travel_story || "", // Mobile alias (camelCase)
    WeirdestGift: profile?.weirdest_gift || "",
    weirdestGift: profile?.weirdest_gift || "", // Mobile alias (camelCase)
    PastEvent: profile?.past_event || "",
    
    // Voice & Video Prompts
    VoicePromptUrl: profile?.voice_prompt_url || "",
    VideoIntroUrl: profile?.video_intro_url || "",
    VoicePromptDurationSeconds: profile?.voice_prompt_duration_seconds || null,
    VideoIntroDurationSeconds: profile?.video_intro_duration_seconds || null,
    
    // Social Links
    SocialLink1: profile?.social_link_1 || "",
    SocialLink2: profile?.social_link_2 || "",
    
    // Verification - Basic
    is_verified: profile?.is_verified || false,
    IsVerified: profile?.is_verified || false,
    VerifiedAt: profile?.verified_at || "",
    VerificationSelfieUrl: verificationSelfieUrl,
    
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
    CanStartMatching: profile?.can_start_matching || false,
    can_start_matching: profile?.can_start_matching || false, // Alias
    
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
    
    // Account Visibility
    ProfileHidden: profile?.profile_hidden || false,
    profile_hidden: profile?.profile_hidden || false,
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

    // Validate constrained fields before database update
    const validation = validateProfileUpdate(body);
    if (!validation.success) {
      console.error("Profile validation failed:", validation.error);
      return NextResponse.json(
        { 
          success: false, 
          msg: validation.error,
          validationErrors: validation.details.issues.map(e => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

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
    // Includes both standard names and mobile app aliases for backward compatibility
    const fieldMapping: Record<string, string> = {
      // Basic Info
      FirstName: "first_name",
      LastName: "last_name",
      DOB: "date_of_birth",
      DateOfBirth: "date_of_birth", // Web onboarding alias
      Gender: "gender",
      ZodiacSign: "zodiac_sign",
      HSign: "zodiac_sign", // Mobile alias
      Bio: "bio",
      About: "bio", // Mobile alias
      LookingForDescription: "looking_for_description",
      DatingIntentions: "dating_intentions",
      
      // Media
      Image: "profile_image_url",
      livePicture: "profile_image_url",
      ProfileImageUrl: "profile_image_url",
      
      // Location
      City: "city",
      State: "state",
      Country: "country",
      ZipCode: "zip_code",
      Zipcode: "zip_code", // Mobile alias (lowercase c)
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
      JobTitle: "occupation", // Mobile alias
      Company: "company",
      
      // Habits
      Smoking: "smoking",
      Drinking: "drinking",
      Drinks: "drinking", // Mobile alias
      
      // Marijuana
      Marijuana: "marijuana",
      
      Exercise: "exercise",
      
      // Family
      HasKids: "has_kids",
      WantsKids: "wants_kids",
      WantChild: "wants_kids", // Mobile alias
      
      // Profile Prompts - Standard names
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
      
      // Profile Prompts - Mobile aliases (critical for mobile app compatibility)
      IdeaDate: "ideal_first_date", // Mobile uses IdeaDate
      NonNegotiable: "non_negotiables", // Mobile uses singular
      FindMe: "after_work", // Mobile uses FindMe
      NightAtHome: "nightclub_or_home", // Mobile uses NightAtHome
      craziestTravelStory: "craziest_travel_story", // Mobile uses camelCase
      weirdestGift: "weirdest_gift", // Mobile uses camelCase
      
      // Social Links
      SocialLink1: "social_link_1",
      SocialLink2: "social_link_2",
      social_link1: "social_link_1", // Mobile alias
      social_link2: "social_link_2", // Mobile alias
      
      // Voice & Video Prompts
      VoicePromptUrl: "voice_prompt_url",
      VideoIntroUrl: "video_intro_url",
      VoicePromptDurationSeconds: "voice_prompt_duration_seconds",
      VideoIntroDurationSeconds: "video_intro_duration_seconds",
      
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

    // Handle languages array (supports both "Languages" and "Language" from mobile)
    if (body.Languages !== undefined || body.Language !== undefined) {
      const langValue = body.Languages ?? body.Language;
      profileUpdates.languages = Array.isArray(langValue)
        ? langValue.filter(Boolean)
        : typeof langValue === "string"
          ? langValue.split(",").map((l: string) => l.trim()).filter(Boolean)
          : null;
    }

    // Handle schools array (supports both "Schools" and "School" from mobile)
    if (body.Schools !== undefined || body.School !== undefined) {
      const schoolsValue = body.Schools ?? body.School;
      profileUpdates.schools = Array.isArray(schoolsValue)
        ? schoolsValue.filter(Boolean)
        : typeof schoolsValue === "string"
          ? schoolsValue.split(",").map((s: string) => s.trim()).filter(Boolean)
          : null;
    }

    // Handle life_goals array
    if (body.LifeGoals !== undefined || body.life_goals !== undefined) {
      const lifeGoalsValue = body.LifeGoals ?? body.life_goals;
      profileUpdates.life_goals = Array.isArray(lifeGoalsValue)
        ? lifeGoalsValue.filter(Boolean)
        : null;
    }

    // Handle profile_hidden (pause account)
    if (body.ProfileHidden !== undefined || body.profile_hidden !== undefined) {
      const hiddenValue = body.ProfileHidden ?? body.profile_hidden;
      profileUpdates.profile_hidden = typeof hiddenValue === "boolean" ? hiddenValue : hiddenValue === "true";
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
