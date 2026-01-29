import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolve a storage path to a signed URL or public URL.
 * If already a full URL (http/https), returns as-is.
 * If a storage path, generates the appropriate URL based on bucket.
 * 
 * This is the single source of truth for URL resolution across the app.
 * All APIs should use this utility to ensure consistent behavior.
 * 
 * Bucket detection logic:
 * - Explicit bucket option takes precedence
 * - Paths containing "/avatar" → avatars bucket
 * - All other paths (including userId/filename patterns) → gallery bucket
 * 
 * Note: We removed the UUID-based events detection because gallery images
 * also use userId/filename format which starts with a UUID. Event images
 * should use the explicit bucket option when needed.
 */
export async function resolveStorageUrl(
  supabase: SupabaseClient,
  path: string | null | undefined,
  options?: { expiresIn?: number; bucket?: string }
): Promise<string> {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  
  // Determine bucket based on path pattern or explicit bucket option
  let bucket: string;
  if (options?.bucket) {
    bucket = options.bucket;
  } else if (path.includes("/avatar")) {
    bucket = "avatars";
  } else {
    // Default to gallery bucket for all other paths
    // This includes userId/filename patterns used for profile images
    bucket = "gallery";
  }
  
  // Avatars bucket is public, use public URL for better caching
  if (bucket === "avatars") {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data?.publicUrl || "";
  }
  
  // Events bucket is also public
  if (bucket === "events") {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data?.publicUrl || "";
  }
  
  // For private buckets (gallery), use signed URLs
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, options?.expiresIn ?? 3600);
  
  if (error) {
    console.error(`Failed to create signed URL for ${bucket}/${path}:`, error.message);
    return "";
  }
  
  return data?.signedUrl || "";
}

/**
 * Resolve multiple gallery items' URLs in parallel.
 * Handles both media_url and thumbnail_url fields.
 */
export async function resolveGalleryUrls<T extends { media_url: string; thumbnail_url?: string | null }>(
  supabase: SupabaseClient,
  items: T[],
  options?: { expiresIn?: number }
): Promise<T[]> {
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      media_url: await resolveStorageUrl(supabase, item.media_url, options),
      thumbnail_url: item.thumbnail_url 
        ? await resolveStorageUrl(supabase, item.thumbnail_url, options) 
        : null,
    }))
  );
}

/**
 * Resolve multiple profile image URLs in parallel.
 * Useful for list views where multiple users are displayed.
 */
export async function resolveProfileImageUrls<T extends { profile_image_url?: string | null }>(
  supabase: SupabaseClient,
  items: T[],
  options?: { expiresIn?: number }
): Promise<T[]> {
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      profile_image_url: item.profile_image_url 
        ? await resolveStorageUrl(supabase, item.profile_image_url, options)
        : null,
    }))
  );
}

/**
 * Resolve a voice prompt URL.
 * Voice prompts are stored in the gallery bucket under voice/{userId}/ prefix.
 */
export async function resolveVoicePromptUrl(
  supabase: SupabaseClient,
  path: string | null | undefined,
  options?: { expiresIn?: number }
): Promise<string> {
  if (!path) return "";
  // Voice prompts are stored in gallery bucket (private), need signed URL
  return resolveStorageUrl(supabase, path, { 
    ...options, 
    bucket: "gallery" 
  });
}

/**
 * Resolve a video intro URL.
 * Video intros are stored in the gallery bucket under video_intro/{userId}/ prefix.
 */
export async function resolveVideoIntroUrl(
  supabase: SupabaseClient,
  path: string | null | undefined,
  options?: { expiresIn?: number }
): Promise<string> {
  if (!path) return "";
  // Video intros are stored in gallery bucket (private), need signed URL
  return resolveStorageUrl(supabase, path, { 
    ...options, 
    bucket: "gallery" 
  });
}
