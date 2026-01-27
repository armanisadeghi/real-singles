/**
 * Data Integrity Service
 *
 * Provides utilities for detecting and fixing data integrity issues
 * across user profiles, avatars, and gallery items.
 *
 * Used by admin tools to maintain data health.
 */

import { SupabaseClient } from "@supabase/supabase-js";

// =============================================================================
// Types
// =============================================================================

export interface DataIntegrityIssue {
  userId: string;
  userEmail: string;
  firstName: string | null;
  lastName: string | null;
  issueType: IssueType;
  severity: "critical" | "warning" | "info";
  description: string;
  details?: Record<string, unknown>;
  autoFixable: boolean;
  createdAt: string;
}

export type IssueType =
  | "missing_avatar"
  | "broken_avatar"
  | "missing_gender"
  | "missing_looking_for"
  | "missing_dob"
  | "missing_first_name"
  | "no_gallery_photos"
  | "orphaned_gallery_record"
  | "missing_primary_photo"
  | "broken_primary_photo"
  | "profile_incomplete";

export interface IntegrityCheckResult {
  totalUsers: number;
  checkedAt: string;
  issues: DataIntegrityIssue[];
  summary: {
    critical: number;
    warning: number;
    info: number;
    byType: Record<IssueType, number>;
  };
}

export interface FixResult {
  userId: string;
  issueType: IssueType;
  success: boolean;
  action: string;
  error?: string;
}

// =============================================================================
// Issue Detection Functions
// =============================================================================

/**
 * Check if a storage file actually exists
 */
async function checkFileExists(
  supabase: SupabaseClient,
  bucket: string,
  path: string
): Promise<boolean> {
  try {
    // For public buckets, we can try to get the file metadata
    const { data, error } = await supabase.storage.from(bucket).list(
      path.substring(0, path.lastIndexOf("/")), // Get the folder path
      {
        limit: 100,
        search: path.substring(path.lastIndexOf("/") + 1), // Get the filename
      }
    );

    if (error) return false;

    const filename = path.substring(path.lastIndexOf("/") + 1);
    return data?.some((file) => file.name === filename) ?? false;
  } catch {
    return false;
  }
}

/**
 * Check if a profile image URL is accessible
 * This mimics what the client-side avatar component does
 */
async function checkProfileImageAccessible(
  supabase: SupabaseClient,
  profileImageUrl: string | null
): Promise<{ accessible: boolean; reason?: string }> {
  if (!profileImageUrl) {
    return { accessible: false, reason: "no_url" };
  }

  // If it's a full URL, we need to handle it carefully
  if (profileImageUrl.startsWith("http")) {
    // Check if it's a Supabase storage URL - extract path and verify file exists
    // Supabase URLs look like: https://{project}.supabase.co/storage/v1/object/{public|sign}/{bucket}/{path}
    const supabaseUrlMatch = profileImageUrl.match(
      /\/storage\/v1\/object\/(?:public|sign)\/(\w+)\/(.+?)(?:\?|$)/
    );
    
    if (supabaseUrlMatch) {
      const [, bucket, path] = supabaseUrlMatch;
      // Decode the path in case it has URL encoding
      const decodedPath = decodeURIComponent(path);
      const exists = await checkFileExists(supabase, bucket, decodedPath);
      return {
        accessible: exists,
        reason: exists ? undefined : "file_not_found",
      };
    }
    
    // For non-Supabase URLs (external), try a HEAD request but don't fail hard
    // since external URLs might have CORS issues from server
    try {
      const response = await fetch(profileImageUrl, { 
        method: "HEAD",
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      if (!response.ok) {
        return { accessible: false, reason: "http_error" };
      }
      return { accessible: true };
    } catch {
      // External URL check failed - could be CORS or network issue
      // For external URLs, we'll assume they're valid since we can't reliably check
      return { accessible: true };
    }
  }

  // It's a storage path - determine the bucket and check if file exists
  // Use the same logic as resolveStorageUrl for consistency
  let bucket: string;
  let filePath: string = profileImageUrl;

  if (profileImageUrl.includes("/avatar")) {
    bucket = "avatars";
  } else {
    bucket = "gallery";
  }

  const exists = await checkFileExists(supabase, bucket, filePath);
  return {
    accessible: exists,
    reason: exists ? undefined : "file_not_found",
  };
}

/**
 * Run all integrity checks on all users
 */
export async function runFullIntegrityCheck(
  supabase: SupabaseClient
): Promise<IntegrityCheckResult> {
  const issues: DataIntegrityIssue[] = [];
  const checkedAt = new Date().toISOString();

  // Fetch all users with their profiles
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select(
      `
      id,
      email,
      created_at,
      profiles!inner (
        first_name,
        last_name,
        gender,
        looking_for,
        date_of_birth,
        profile_image_url
      )
    `
    )
    .order("created_at", { ascending: false });

  if (usersError) {
    throw new Error(`Failed to fetch users: ${usersError.message}`);
  }

  const totalUsers = users?.length ?? 0;

  // Process each user
  for (const user of users ?? []) {
    const profile = Array.isArray(user.profiles)
      ? user.profiles[0]
      : user.profiles;
    if (!profile) continue;

    const baseIssue = {
      userId: user.id,
      userEmail: user.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      createdAt: user.created_at,
    };

    // Check 1: Avatar/Profile Image
    const imageCheck = await checkProfileImageAccessible(
      supabase,
      profile.profile_image_url
    );
    if (!imageCheck.accessible) {
      const isMissing = imageCheck.reason === "no_url";
      
      // Check if user has gallery images (needed to determine if auto-fixable)
      const { count: galleryImageCount } = await supabase
        .from("user_gallery")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("media_type", "image");
      
      const hasGalleryImages = (galleryImageCount ?? 0) > 0;
      
      issues.push({
        ...baseIssue,
        issueType: isMissing ? "missing_avatar" : "broken_avatar",
        severity: "critical",
        description: isMissing
          ? hasGalleryImages 
            ? "User has no profile image URL set"
            : "User has no profile image URL set (no gallery images to use)"
          : hasGalleryImages
            ? `Profile image is not accessible (${imageCheck.reason})`
            : `Profile image is not accessible (${imageCheck.reason}) - no gallery images to use`,
        details: {
          profileImageUrl: profile.profile_image_url,
          reason: imageCheck.reason,
          hasGalleryImages,
          galleryImageCount: galleryImageCount ?? 0,
        },
        autoFixable: hasGalleryImages, // Can only fix if user has gallery images
      });
    }

    // Check 2: Missing Gender
    if (!profile.gender) {
      issues.push({
        ...baseIssue,
        issueType: "missing_gender",
        severity: "critical",
        description: "User has no gender set - cannot participate in matching",
        autoFixable: false,
      });
    }

    // Check 3: Missing Looking For
    if (
      !profile.looking_for ||
      (Array.isArray(profile.looking_for) && profile.looking_for.length === 0)
    ) {
      issues.push({
        ...baseIssue,
        issueType: "missing_looking_for",
        severity: "critical",
        description:
          "User has no looking_for preference set - cannot participate in matching",
        autoFixable: false,
      });
    }

    // Check 4: Missing Date of Birth
    if (!profile.date_of_birth) {
      issues.push({
        ...baseIssue,
        issueType: "missing_dob",
        severity: "critical",
        description:
          "User has no date of birth set - cannot verify age or participate in matching",
        autoFixable: false,
      });
    }

    // Check 5: Missing First Name
    if (!profile.first_name) {
      issues.push({
        ...baseIssue,
        issueType: "missing_first_name",
        severity: "warning",
        description: "User has no first name set",
        autoFixable: false,
      });
    }
  }

  // Check gallery for all users with issues or sample
  const usersToCheckGallery = new Set(issues.map((i) => i.userId));

  // Also sample some users without issues to check gallery integrity
  const usersWithoutIssues = (users ?? []).filter(
    (u) => !usersToCheckGallery.has(u.id)
  );
  const sampleSize = Math.min(50, usersWithoutIssues.length);
  for (let i = 0; i < sampleSize; i++) {
    usersToCheckGallery.add(usersWithoutIssues[i].id);
  }

  // Check gallery integrity for relevant users
  for (const userId of usersToCheckGallery) {
    const user = users?.find((u) => u.id === userId);
    if (!user) continue;

    const profile = Array.isArray(user.profiles)
      ? user.profiles[0]
      : user.profiles;
    if (!profile) continue;

    const galleryIssues = await checkGalleryIntegrity(supabase, userId);

    for (const issue of galleryIssues) {
      issues.push({
        ...issue,
        userEmail: user.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        createdAt: user.created_at,
      });
    }
  }

  // Calculate summary
  const summary = {
    critical: issues.filter((i) => i.severity === "critical").length,
    warning: issues.filter((i) => i.severity === "warning").length,
    info: issues.filter((i) => i.severity === "info").length,
    byType: {} as Record<IssueType, number>,
  };

  const issueTypes: IssueType[] = [
    "missing_avatar",
    "broken_avatar",
    "missing_gender",
    "missing_looking_for",
    "missing_dob",
    "missing_first_name",
    "no_gallery_photos",
    "orphaned_gallery_record",
    "missing_primary_photo",
    "broken_primary_photo",
    "profile_incomplete",
  ];

  for (const type of issueTypes) {
    summary.byType[type] = issues.filter((i) => i.issueType === type).length;
  }

  return {
    totalUsers,
    checkedAt,
    issues,
    summary,
  };
}

/**
 * Check gallery integrity for a specific user
 */
async function checkGalleryIntegrity(
  supabase: SupabaseClient,
  userId: string
): Promise<Omit<DataIntegrityIssue, "userEmail" | "firstName" | "lastName" | "createdAt">[]> {
  const issues: Omit<DataIntegrityIssue, "userEmail" | "firstName" | "lastName" | "createdAt">[] = [];

  // Fetch gallery records
  const { data: gallery } = await supabase
    .from("user_gallery")
    .select("*")
    .eq("user_id", userId)
    .order("display_order");

  // Check: No gallery photos at all
  const imageCount = gallery?.filter((g) => g.media_type === "image").length ?? 0;
  if (imageCount === 0) {
    issues.push({
      userId,
      issueType: "no_gallery_photos",
      severity: "warning",
      description: "User has no photos in their gallery",
      autoFixable: false,
    });
    return issues; // No point checking further
  }

  // Check: No primary photo set
  const hasPrimary = gallery?.some((g) => g.is_primary);
  if (!hasPrimary && imageCount > 0) {
    issues.push({
      userId,
      issueType: "missing_primary_photo",
      severity: "warning",
      description:
        "User has gallery photos but no primary photo is designated",
      details: { imageCount },
      autoFixable: true,
    });
  }

  // Check each gallery item for file existence
  for (const item of gallery ?? []) {
    if (!item.media_url) continue;

    // Skip full URLs that are external
    if (
      item.media_url.startsWith("http") &&
      !item.media_url.includes("supabase")
    ) {
      continue;
    }

    // Extract path from URL if needed
    let path = item.media_url;
    if (path.includes("/storage/v1/object/")) {
      // Extract path from Supabase URL
      const match = path.match(/\/storage\/v1\/object\/(?:public|sign)\/gallery\/(.+?)(?:\?|$)/);
      if (match) {
        path = match[1];
      }
    }

    const exists = await checkFileExists(supabase, "gallery", path);
    if (!exists) {
      issues.push({
        userId,
        issueType: item.is_primary
          ? "broken_primary_photo"
          : "orphaned_gallery_record",
        severity: item.is_primary ? "critical" : "info",
        description: item.is_primary
          ? "Primary photo file is missing from storage"
          : "Gallery record exists but file is missing from storage",
        details: {
          galleryId: item.id,
          mediaUrl: item.media_url,
          isPrimary: item.is_primary,
        },
        autoFixable: true, // Can delete the record or reassign primary
      });
    }
  }

  return issues;
}

/**
 * Run a specific type of check for all users
 */
export async function runSpecificCheck(
  supabase: SupabaseClient,
  checkType: "avatars" | "profiles" | "gallery"
): Promise<IntegrityCheckResult> {
  const fullResult = await runFullIntegrityCheck(supabase);

  // Filter based on check type
  let filteredIssues: DataIntegrityIssue[];

  switch (checkType) {
    case "avatars":
      filteredIssues = fullResult.issues.filter((i) =>
        ["missing_avatar", "broken_avatar"].includes(i.issueType)
      );
      break;
    case "profiles":
      filteredIssues = fullResult.issues.filter((i) =>
        [
          "missing_gender",
          "missing_looking_for",
          "missing_dob",
          "missing_first_name",
          "profile_incomplete",
        ].includes(i.issueType)
      );
      break;
    case "gallery":
      filteredIssues = fullResult.issues.filter((i) =>
        [
          "no_gallery_photos",
          "orphaned_gallery_record",
          "missing_primary_photo",
          "broken_primary_photo",
        ].includes(i.issueType)
      );
      break;
    default:
      filteredIssues = fullResult.issues;
  }

  // Recalculate summary
  const summary = {
    critical: filteredIssues.filter((i) => i.severity === "critical").length,
    warning: filteredIssues.filter((i) => i.severity === "warning").length,
    info: filteredIssues.filter((i) => i.severity === "info").length,
    byType: {} as Record<IssueType, number>,
  };

  const issueTypes: IssueType[] = [
    "missing_avatar",
    "broken_avatar",
    "missing_gender",
    "missing_looking_for",
    "missing_dob",
    "missing_first_name",
    "no_gallery_photos",
    "orphaned_gallery_record",
    "missing_primary_photo",
    "broken_primary_photo",
    "profile_incomplete",
  ];

  for (const type of issueTypes) {
    summary.byType[type] = filteredIssues.filter(
      (i) => i.issueType === type
    ).length;
  }

  return {
    ...fullResult,
    issues: filteredIssues,
    summary,
  };
}

// =============================================================================
// Issue Fix Functions
// =============================================================================

/**
 * Fix avatar issues for a user by syncing from their primary gallery image
 */
export async function fixAvatarFromGallery(
  supabase: SupabaseClient,
  userId: string
): Promise<FixResult> {
  // Get the user's primary gallery image
  const { data: gallery } = await supabase
    .from("user_gallery")
    .select("*")
    .eq("user_id", userId)
    .eq("is_primary", true)
    .eq("media_type", "image")
    .single();

  if (!gallery) {
    // No primary, try to find any image and set it as primary
    const { data: anyImage } = await supabase
      .from("user_gallery")
      .select("*")
      .eq("user_id", userId)
      .eq("media_type", "image")
      .order("display_order")
      .limit(1)
      .single();

    if (!anyImage) {
      return {
        userId,
        issueType: "missing_avatar",
        success: false,
        action: "No gallery images available to use as avatar",
        error: "no_gallery_images",
      };
    }

    // Set this image as primary
    await supabase
      .from("user_gallery")
      .update({ is_primary: true })
      .eq("id", anyImage.id);

    // Update profile_image_url
    const { error } = await supabase
      .from("profiles")
      .update({ profile_image_url: anyImage.media_url })
      .eq("user_id", userId);

    if (error) {
      return {
        userId,
        issueType: "missing_avatar",
        success: false,
        action: "Failed to update profile image",
        error: error.message,
      };
    }

    return {
      userId,
      issueType: "missing_avatar",
      success: true,
      action: `Set gallery image ${anyImage.id} as primary and updated profile image`,
    };
  }

  // Verify the primary image file exists
  let path = gallery.media_url;
  if (path.includes("/storage/v1/object/")) {
    const match = path.match(/\/storage\/v1\/object\/(?:public|sign)\/gallery\/(.+?)(?:\?|$)/);
    if (match) {
      path = match[1];
    }
  }

  const exists = await checkFileExists(supabase, "gallery", path);
  if (!exists) {
    return {
      userId,
      issueType: "broken_avatar",
      success: false,
      action: "Primary gallery image file is missing from storage",
      error: "primary_file_missing",
    };
  }

  // Update profile_image_url to use the primary gallery image
  const { error } = await supabase
    .from("profiles")
    .update({ profile_image_url: gallery.media_url })
    .eq("user_id", userId);

  if (error) {
    return {
      userId,
      issueType: "missing_avatar",
      success: false,
      action: "Failed to update profile image",
      error: error.message,
    };
  }

  return {
    userId,
    issueType: "missing_avatar",
    success: true,
    action: `Updated profile image to primary gallery image`,
  };
}

/**
 * Fix missing primary photo by setting the first gallery image as primary
 */
export async function fixMissingPrimary(
  supabase: SupabaseClient,
  userId: string
): Promise<FixResult> {
  // Get the first image in gallery
  const { data: firstImage } = await supabase
    .from("user_gallery")
    .select("*")
    .eq("user_id", userId)
    .eq("media_type", "image")
    .order("display_order")
    .limit(1)
    .single();

  if (!firstImage) {
    return {
      userId,
      issueType: "missing_primary_photo",
      success: false,
      action: "No images in gallery",
      error: "no_images",
    };
  }

  // Set as primary
  const { error: updateError } = await supabase
    .from("user_gallery")
    .update({ is_primary: true })
    .eq("id", firstImage.id);

  if (updateError) {
    return {
      userId,
      issueType: "missing_primary_photo",
      success: false,
      action: "Failed to set primary",
      error: updateError.message,
    };
  }

  // Also update profile_image_url
  await supabase
    .from("profiles")
    .update({ profile_image_url: firstImage.media_url })
    .eq("user_id", userId);

  return {
    userId,
    issueType: "missing_primary_photo",
    success: true,
    action: `Set image ${firstImage.id} as primary`,
  };
}

/**
 * Fix orphaned gallery record by deleting it
 */
export async function fixOrphanedGalleryRecord(
  supabase: SupabaseClient,
  userId: string,
  galleryId: string
): Promise<FixResult> {
  const { error } = await supabase
    .from("user_gallery")
    .delete()
    .eq("id", galleryId)
    .eq("user_id", userId);

  if (error) {
    return {
      userId,
      issueType: "orphaned_gallery_record",
      success: false,
      action: "Failed to delete orphaned record",
      error: error.message,
    };
  }

  return {
    userId,
    issueType: "orphaned_gallery_record",
    success: true,
    action: `Deleted orphaned gallery record ${galleryId}`,
  };
}

/**
 * Fix broken primary photo by removing it and promoting next image
 */
export async function fixBrokenPrimaryPhoto(
  supabase: SupabaseClient,
  userId: string,
  brokenGalleryId: string
): Promise<FixResult> {
  // Delete the broken record
  await supabase.from("user_gallery").delete().eq("id", brokenGalleryId);

  // Get the next image
  const { data: nextImage } = await supabase
    .from("user_gallery")
    .select("*")
    .eq("user_id", userId)
    .eq("media_type", "image")
    .order("display_order")
    .limit(1)
    .single();

  if (nextImage) {
    // Set as new primary
    await supabase
      .from("user_gallery")
      .update({ is_primary: true })
      .eq("id", nextImage.id);

    await supabase
      .from("profiles")
      .update({ profile_image_url: nextImage.media_url })
      .eq("user_id", userId);

    return {
      userId,
      issueType: "broken_primary_photo",
      success: true,
      action: `Deleted broken record and promoted image ${nextImage.id} to primary`,
    };
  } else {
    // No more images, clear profile image
    await supabase
      .from("profiles")
      .update({ profile_image_url: null })
      .eq("user_id", userId);

    return {
      userId,
      issueType: "broken_primary_photo",
      success: true,
      action: "Deleted broken record. No more images available.",
    };
  }
}

/**
 * Batch fix all avatar issues
 */
export async function batchFixAvatarIssues(
  supabase: SupabaseClient,
  userIds?: string[]
): Promise<{ fixed: FixResult[]; failed: FixResult[] }> {
  const results: FixResult[] = [];

  // Get users with avatar issues
  let query = supabase.from("profiles").select("user_id, profile_image_url");

  if (userIds && userIds.length > 0) {
    query = query.in("user_id", userIds);
  }

  const { data: profiles } = await query;

  for (const profile of profiles ?? []) {
    // Check if profile image is accessible
    const check = await checkProfileImageAccessible(
      supabase,
      profile.profile_image_url
    );
    if (!check.accessible) {
      const result = await fixAvatarFromGallery(supabase, profile.user_id);
      results.push(result);
    }
  }

  return {
    fixed: results.filter((r) => r.success),
    failed: results.filter((r) => !r.success),
  };
}

/**
 * Batch fix all gallery integrity issues
 */
export async function batchFixGalleryIssues(
  supabase: SupabaseClient,
  userIds?: string[]
): Promise<{ fixed: FixResult[]; failed: FixResult[] }> {
  const results: FixResult[] = [];

  // Get all users or specific ones
  let query = supabase.from("user_gallery").select("user_id").eq("media_type", "image");

  if (userIds && userIds.length > 0) {
    query = query.in("user_id", userIds);
  }

  const { data: galleryUsers } = await query;

  const uniqueUserIds = [...new Set(galleryUsers?.map((g) => g.user_id) ?? [])];

  for (const userId of uniqueUserIds) {
    // Check for missing primary
    const { data: primaryCheck } = await supabase
      .from("user_gallery")
      .select("id")
      .eq("user_id", userId)
      .eq("is_primary", true)
      .single();

    if (!primaryCheck) {
      const result = await fixMissingPrimary(supabase, userId);
      results.push(result);
    }
  }

  return {
    fixed: results.filter((r) => r.success),
    failed: results.filter((r) => !r.success),
  };
}
