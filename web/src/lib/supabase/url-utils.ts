import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolve a storage path to a signed URL.
 * If already a full URL (http/https), returns as-is.
 * If a storage path, generates a signed URL.
 * 
 * This is the single source of truth for URL resolution across the app.
 * All APIs should use this utility to ensure consistent behavior.
 */
export async function resolveStorageUrl(
  supabase: SupabaseClient,
  path: string | null | undefined,
  options?: { expiresIn?: number }
): Promise<string> {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  
  // Determine bucket based on path pattern
  // Avatar paths contain "/avatar" while gallery images don't
  const bucket = path.includes("/avatar") ? "avatars" : "gallery";
  const { data } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, options?.expiresIn ?? 3600);
  
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
