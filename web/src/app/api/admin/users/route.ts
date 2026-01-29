import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";

/**
 * GET /api/admin/users
 * Get list of users with comprehensive filtering, sorting, and pagination (admin only)
 */
export async function GET(request: NextRequest) {
  // Verify admin access
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json(
      { success: false, msg: "Unauthorized" },
      { status: 401 }
    );
  }

  // Check if user is admin
  const adminSupabase = createAdminClient();
  const { data: userData } = await adminSupabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single();

  if (!userData || (userData.role !== "admin" && userData.role !== "moderator")) {
    return NextResponse.json(
      { success: false, msg: "Forbidden - Admin access required" },
      { status: 403 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;
    
    // Search
    const search = searchParams.get("search") || "";
    
    // Filters
    const status = searchParams.get("status");
    const role = searchParams.get("role");
    const verified = searchParams.get("verified");
    const canStartMatching = searchParams.get("can_start_matching");
    const profileHidden = searchParams.get("profile_hidden");
    const city = searchParams.get("city");
    const state = searchParams.get("state");
    const gender = searchParams.get("gender");
    const minAge = searchParams.get("min_age");
    const maxAge = searchParams.get("max_age");
    const minPoints = searchParams.get("min_points");
    const maxPoints = searchParams.get("max_points");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const lastActiveFrom = searchParams.get("last_active_from");
    const lastActiveTo = searchParams.get("last_active_to");
    
    // Sorting
    const sortBy = searchParams.get("sort_by") || "created_at";
    const sortOrder = searchParams.get("sort_order") || "desc";

    // Build base query with all needed fields
    let query = adminSupabase
      .from("users")
      .select(`
        id,
        email,
        display_name,
        status,
        role,
        points_balance,
        created_at,
        last_active_at,
        profiles (
          profile_image_url,
          first_name,
          last_name,
          date_of_birth,
          gender,
          city,
          state,
          is_verified,
          profile_hidden,
          can_start_matching
        )
      `, { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%,profiles.first_name.ilike.%${search}%,profiles.last_name.ilike.%${search}%`);
    }

    // Apply status filter
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // Apply role filter
    if (role && role !== "all") {
      query = query.eq("role", role);
    }

    // Apply verified filter
    if (verified === "true") {
      query = query.eq("profiles.is_verified", true);
    } else if (verified === "false") {
      query = query.eq("profiles.is_verified", false);
    }

    // Apply can_start_matching filter
    if (canStartMatching === "true") {
      query = query.eq("profiles.can_start_matching", true);
    } else if (canStartMatching === "false") {
      query = query.eq("profiles.can_start_matching", false);
    }

    // Apply profile_hidden filter
    if (profileHidden === "true") {
      query = query.eq("profiles.profile_hidden", true);
    } else if (profileHidden === "false") {
      query = query.eq("profiles.profile_hidden", false);
    }

    // Apply city filter
    if (city) {
      query = query.eq("profiles.city", city);
    }

    // Apply state filter
    if (state) {
      query = query.eq("profiles.state", state);
    }

    // Apply gender filter
    if (gender && gender !== "all") {
      query = query.eq("profiles.gender", gender);
    }

    // Apply points balance filters
    if (minPoints) {
      query = query.gte("points_balance", parseInt(minPoints, 10));
    }
    if (maxPoints) {
      query = query.lte("points_balance", parseInt(maxPoints, 10));
    }

    // Apply date range filters for created_at
    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("created_at", dateTo);
    }

    // Apply last active filters
    if (lastActiveFrom) {
      query = query.gte("last_active_at", lastActiveFrom);
    }
    if (lastActiveTo) {
      query = query.lte("last_active_at", lastActiveTo);
    }

    // Apply sorting
    const validSortColumns = ["created_at", "last_active_at", "points_balance", "email", "display_name"];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : "created_at";
    query = query.order(sortColumn, { ascending: sortOrder === "asc" });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json(
        { success: false, msg: "Error fetching users" },
        { status: 500 }
      );
    }

    // Calculate age and resolve profile image URLs
    const usersWithProcessedData = await Promise.all(
      (users || []).map(async (user) => {
        let age = null;
        if (user.profiles?.date_of_birth) {
          const birthDate = new Date(user.profiles.date_of_birth);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }

        let profileImageUrl = user.profiles?.profile_image_url || null;
        if (profileImageUrl) {
          profileImageUrl = await resolveStorageUrl(adminSupabase, profileImageUrl);
        }

        return {
          ...user,
          profiles: user.profiles ? {
            ...user.profiles,
            profile_image_url: profileImageUrl,
            age,
          } : null,
        };
      })
    );

    // Filter by age if specified
    let filteredUsers = usersWithProcessedData;
    if (minAge || maxAge) {
      filteredUsers = usersWithProcessedData.filter((user) => {
        const age = user.profiles?.age;
        if (!age) return false;
        if (minAge && age < parseInt(minAge, 10)) return false;
        if (maxAge && age > parseInt(maxAge, 10)) return false;
        return true;
      });
    }

    return NextResponse.json({
      success: true,
      data: filteredUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/admin/users:", error);
    return NextResponse.json(
      { success: false, msg: "Internal server error" },
      { status: 500 }
    );
  }
}
