import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdmin } from "@/lib/auth/admin-guard";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";
import {
  getDiscoverableCandidates,
  getMutualMatches,
  getLikesReceived,
  type DiscoveryFilters,
  type UserProfileContext,
} from "@/lib/services/discovery";
import { z } from "zod";

// Validation schema for simulation request
const simulationSchema = z.object({
  targetUserId: z.string().uuid("Invalid user ID"),
  algorithm: z.enum([
    "discover-profiles",
    "discover-home",
    "top-matches",
    "nearby",
    "mutual-matches",
    "likes-received",
  ]),
  filters: z.object({
    minAge: z.number().optional(),
    maxAge: z.number().optional(),
    minHeight: z.number().optional(),
    maxHeight: z.number().optional(),
    maxDistanceMiles: z.number().optional(),
    bodyTypes: z.array(z.string()).optional(),
    ethnicities: z.array(z.string()).optional(),
    religions: z.array(z.string()).optional(),
    educationLevels: z.array(z.string()).optional(),
    zodiacSigns: z.array(z.string()).optional(),
    smoking: z.string().optional(),
    drinking: z.string().optional(),
    marijuana: z.string().optional(),
    hasKids: z.string().optional(),
    wantsKids: z.string().optional(),
  }).optional(),
  pagination: z.object({
    limit: z.number().min(1).max(200).default(50),
    offset: z.number().min(0).default(0),
  }).optional(),
});

/**
 * POST /api/admin/algorithm-simulator
 * 
 * Admin-only endpoint to simulate discovery algorithms for any user.
 * Uses the exact same service functions as production endpoints to ensure
 * identical results.
 * 
 * Body:
 * - targetUserId: UUID of the user to simulate as
 * - algorithm: which algorithm to test
 * - filters: optional filter parameters
 * - pagination: optional limit/offset
 * 
 * Returns:
 * - profiles: array of matching profiles with debug info
 * - userProfile: the target user's profile context
 * - debug: filtering statistics (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = simulationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { targetUserId, algorithm, filters, pagination } = validation.data;

    // Use admin client to bypass RLS
    const supabase = createAdminClient();

    // Get target user's profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", targetUserId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Build user profile context
    const userProfile: UserProfileContext = {
      userId: targetUserId,
      gender: profile.gender,
      lookingFor: profile.looking_for,
      latitude: profile.latitude,
      longitude: profile.longitude,
    };

    // Execute the requested algorithm
    switch (algorithm) {
      case "discover-profiles":
      case "discover-home":
      case "top-matches":
      case "nearby": {
        const result = await getDiscoverableCandidates(supabase, {
          userProfile,
          filters: filters as DiscoveryFilters,
          pagination: pagination || { limit: 100, offset: 0 },
          includeDebugInfo: true, // Admin always gets debug info
          sortBy: algorithm === "nearby" ? "distance" : "recent",
        });

        // Resolve profile image URLs and add extra debug info
        const profilesWithUrls = await Promise.all(
          result.profiles.map(async (p) => ({
            user_id: p.user_id,
            first_name: p.first_name,
            last_name: p.last_name,
            gender: p.gender,
            looking_for: p.looking_for,
            date_of_birth: p.date_of_birth,
            city: p.city,
            state: p.state,
            profile_image_url: await resolveStorageUrl(supabase, p.profile_image_url),
            is_verified: p.is_verified,
            can_start_matching: p.can_start_matching,
            profile_hidden: p.profile_hidden,
            distance_km: p.distance_km,
            is_favorite: p.is_favorite,
            has_liked_me: p.has_liked_me,
            // Debug fields for admin
            _debug: {
              gender_match: userProfile.lookingFor?.includes(p.gender || "") || false,
              bidirectional_match: p.looking_for?.includes(userProfile.gender || "") || false,
            },
          }))
        );

        return NextResponse.json({
          success: true,
          algorithm,
          userProfile: {
            userId: targetUserId,
            gender: profile.gender,
            lookingFor: profile.looking_for,
            city: profile.city,
            state: profile.state,
            canStartMatching: profile.can_start_matching,
          },
          profiles: profilesWithUrls,
          total: result.total,
          debug: result.debug,
        });
      }

      case "mutual-matches": {
        const matches = await getMutualMatches(supabase, targetUserId);

        const matchesWithUrls = await Promise.all(
          matches.map(async (m) => ({
            user_id: m.userId,
            first_name: m.profile.first_name,
            last_name: m.profile.last_name,
            gender: m.profile.gender,
            looking_for: m.profile.looking_for,
            city: m.profile.city,
            state: m.profile.state,
            profile_image_url: await resolveStorageUrl(
              supabase, 
              m.primaryPhoto || m.profile.profile_image_url
            ),
            is_verified: m.profile.is_verified,
            matched_at: m.matchedAt,
            conversation_id: m.conversationId,
          }))
        );

        return NextResponse.json({
          success: true,
          algorithm,
          userProfile: {
            userId: targetUserId,
            gender: profile.gender,
            lookingFor: profile.looking_for,
          },
          matches: matchesWithUrls,
          total: matches.length,
        });
      }

      case "likes-received": {
        const likes = await getLikesReceived(supabase, targetUserId, {
          includeSuperLikes: true,
          limit: pagination?.limit || 100,
          offset: pagination?.offset || 0,
        });

        const likesWithUrls = await Promise.all(
          likes.map(async (l) => ({
            user_id: l.userId,
            first_name: l.profile.first_name,
            last_name: l.profile.last_name,
            gender: l.profile.gender,
            looking_for: l.profile.looking_for,
            city: l.profile.city,
            state: l.profile.state,
            profile_image_url: await resolveStorageUrl(
              supabase,
              l.primaryPhoto || l.profile.profile_image_url
            ),
            is_verified: l.profile.is_verified,
            action: l.action,
            liked_at: l.likedAt,
          }))
        );

        return NextResponse.json({
          success: true,
          algorithm,
          userProfile: {
            userId: targetUserId,
            gender: profile.gender,
            lookingFor: profile.looking_for,
          },
          likes: likesWithUrls,
          total: likes.length,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown algorithm: ${algorithm}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Algorithm simulator error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/algorithm-simulator/users
 * 
 * Get list of users for the user selector dropdown.
 * Returns basic info for searching/selecting users.
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const supabase = createAdminClient();

    let query = supabase
      .from("profiles")
      .select(`
        user_id,
        first_name,
        last_name,
        gender,
        looking_for,
        city,
        state,
        can_start_matching,
        profile_image_url,
        users!inner(id, email, display_name, status)
      `)
      .order("updated_at", { ascending: false })
      .limit(limit);

    // Apply search filter if provided
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,users.email.ilike.%${search}%,users.display_name.ilike.%${search}%`
      );
    }

    const { data: profiles, error } = await query;

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Resolve profile image URLs
    const usersWithUrls = await Promise.all(
      (profiles || []).map(async (p) => {
        const user = Array.isArray(p.users) ? p.users[0] : p.users;
        return {
          user_id: p.user_id,
          email: user?.email,
          display_name: user?.display_name,
          first_name: p.first_name,
          last_name: p.last_name,
          gender: p.gender,
          looking_for: p.looking_for,
          city: p.city,
          state: p.state,
          can_start_matching: p.can_start_matching,
          status: user?.status,
          profile_image_url: await resolveStorageUrl(supabase, p.profile_image_url),
        };
      })
    );

    return NextResponse.json({
      success: true,
      users: usersWithUrls,
    });
  } catch (error) {
    console.error("Error fetching users for simulator:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
