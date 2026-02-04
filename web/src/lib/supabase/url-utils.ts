import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Image transformation options for Supabase Storage
 * Uses Supabase's built-in image optimization
 */
export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100, default 80
  format?: "webp" | "avif" | "origin"; // webp is smaller, avif is smallest but less compatible
  resize?: "cover" | "contain" | "fill";
}

/**
 * Predefined image sizes for consistency across the app
 * All sizes use WebP format by default for ~30-50% smaller file sizes
 */
export const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150, quality: 70, format: "webp" as const },
  card: { width: 400, height: 400, quality: 75, format: "webp" as const },
  cardWide: { width: 600, height: 400, quality: 75, format: "webp" as const },
  medium: { width: 600, height: 600, quality: 80, format: "webp" as const },
  large: { width: 1200, height: 1200, quality: 85, format: "webp" as const },
  hero: { width: 800, height: 600, quality: 80, format: "webp" as const },
} as const;

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
  options?: { 
    expiresIn?: number; 
    bucket?: string;
    transform?: ImageTransformOptions;
  }
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
  
  // Build transform options if provided
  const transformOptions = options?.transform ? {
    transform: {
      width: options.transform.width,
      height: options.transform.height,
      quality: options.transform.quality ?? 80,
      format: options.transform.format === "avif" || options.transform.format === "webp" ? options.transform.format : ("origin" as const),
      resize: options.transform.resize ?? "cover",
    }
  } : undefined;
  
  // Avatars bucket is public, use public URL for better caching
  if (bucket === "avatars") {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path, transformOptions as any);
    return data?.publicUrl || "";
  }
  
  // Events bucket is also public
  if (bucket === "events") {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path, transformOptions as any);
    return data?.publicUrl || "";
  }
  
  // Products bucket is also public
  if (bucket === "products") {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path, transformOptions as any);
    return data?.publicUrl || "";
  }
  
  // For private buckets (gallery), use signed URLs with transforms
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, options?.expiresIn ?? 3600, transformOptions as any);
  
  if (error) {
    console.error(`Failed to create signed URL for ${bucket}/${path}:`, error.message);
    return "";
  }
  
  return data?.signedUrl || "";
}

/**
 * Resolve a storage URL with a predefined image size
 * Convenience wrapper for common use cases
 */
export async function resolveOptimizedImageUrl(
  supabase: SupabaseClient,
  path: string | null | undefined,
  size: keyof typeof IMAGE_SIZES,
  options?: { expiresIn?: number; bucket?: string }
): Promise<string> {
  return resolveStorageUrl(supabase, path, {
    ...options,
    transform: IMAGE_SIZES[size],
  });
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

/**
 * Resolve a verification selfie URL.
 * Verification selfies are stored in the gallery bucket under verification/{userId}/ prefix.
 */
export async function resolveVerificationSelfieUrl(
  supabase: SupabaseClient,
  path: string | null | undefined,
  options?: { expiresIn?: number }
): Promise<string> {
  if (!path) return "";
  // Verification selfies are stored in gallery bucket (private), need signed URL
  return resolveStorageUrl(supabase, path, { 
    ...options, 
    bucket: "gallery" 
  });
}
