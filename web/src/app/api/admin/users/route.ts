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

    // Determine if we have profile-related filters that require post-fetch filtering
    // Supabase PostgREST doesn't support filtering parent rows by related table columns,
    // so we need to fetch more data and filter in JS for profile-based filters
    const hasProfileFilters = !!(
      search || verified || canStartMatching || profileHidden || 
      city || state || gender || minAge || maxAge
    );

    // Build base query with all needed fields
    // When profile filters are active, we fetch more data and filter in JS
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
          can_start_matching,
          voice_prompt_url,
          video_intro_url
        )
      `, { count: 'exact' });

    // Apply search filter on users table columns only (profile search done post-fetch)
    if (search) {
      query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`);
    }

    // Apply status filter (users table - works directly)
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // Apply role filter (users table - works directly)
    if (role && role !== "all") {
      query = query.eq("role", role);
    }

    // Apply points balance filters (users table - works directly)
    if (minPoints) {
      query = query.gte("points_balance", parseInt(minPoints, 10));
    }
    if (maxPoints) {
      query = query.lte("points_balance", parseInt(maxPoints, 10));
    }

    // Apply date range filters for created_at (users table - works directly)
    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("created_at", dateTo);
    }

    // Apply last active filters (users table - works directly)
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

    // If we have profile filters, fetch more records for post-filtering
    // Otherwise use normal pagination
    if (hasProfileFilters) {
      // Fetch a larger batch to account for filtering loss
      // We'll apply pagination after filtering
      query = query.range(0, Math.max(limit * 10, 500) - 1);
    } else {
      query = query.range(offset, offset + limit - 1);
    }

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

    // Apply all profile-based filters in JS (PostgREST doesn't support filtering parent by joined columns)
    let filteredUsers = usersWithProcessedData;

    // Search filter - also search in profile names
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter((user) => {
        const firstName = user.profiles?.first_name?.toLowerCase() || "";
        const lastName = user.profiles?.last_name?.toLowerCase() || "";
        // Email and display_name already filtered by Supabase, but profiles weren't
        return (
          firstName.includes(searchLower) ||
          lastName.includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.display_name?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Verified filter
    if (verified === "true") {
      filteredUsers = filteredUsers.filter((user) => user.profiles?.is_verified === true);
    } else if (verified === "false") {
      filteredUsers = filteredUsers.filter((user) => user.profiles?.is_verified === false);
    }

    // Can start matching filter
    if (canStartMatching === "true") {
      filteredUsers = filteredUsers.filter((user) => user.profiles?.can_start_matching === true);
    } else if (canStartMatching === "false") {
      filteredUsers = filteredUsers.filter((user) => user.profiles?.can_start_matching === false);
    }

    // Profile hidden filter
    if (profileHidden === "true") {
      filteredUsers = filteredUsers.filter((user) => user.profiles?.profile_hidden === true);
    } else if (profileHidden === "false") {
      filteredUsers = filteredUsers.filter((user) => user.profiles?.profile_hidden === false);
    }

    // City filter (case-insensitive partial match)
    if (city) {
      const cityLower = city.toLowerCase();
      filteredUsers = filteredUsers.filter((user) => 
        user.profiles?.city?.toLowerCase().includes(cityLower)
      );
    }

    // State filter (case-insensitive)
    if (state) {
      const stateLower = state.toLowerCase();
      filteredUsers = filteredUsers.filter((user) => 
        user.profiles?.state?.toLowerCase() === stateLower
      );
    }

    // Gender filter
    if (gender && gender !== "all") {
      filteredUsers = filteredUsers.filter((user) => user.profiles?.gender === gender);
    }

    // Age filter
    if (minAge || maxAge) {
      filteredUsers = filteredUsers.filter((user) => {
        const age = user.profiles?.age;
        if (!age) return false;
        if (minAge && age < parseInt(minAge, 10)) return false;
        if (maxAge && age > parseInt(maxAge, 10)) return false;
        return true;
      });
    }

    // Calculate total after filtering
    const filteredTotal = filteredUsers.length;

    // Apply pagination to filtered results
    const paginatedUsers = hasProfileFilters
      ? filteredUsers.slice(offset, offset + limit)
      : filteredUsers;

    return NextResponse.json({
      success: true,
      data: paginatedUsers,
      pagination: {
        page,
        limit,
        total: hasProfileFilters ? filteredTotal : (count || 0),
        totalPages: Math.ceil((hasProfileFilters ? filteredTotal : (count || 0)) / limit),
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
