/**
 * Supabase Storage Configuration
 * 
 * Bucket Configuration:
 * - avatars: public (profile pictures viewable by anyone)
 * - gallery: private (user photos require authentication)
 * - events: public (event images viewable by anyone)
 */

import { createClient } from "./client";

// Storage bucket names - must match Supabase Dashboard configuration
export const STORAGE_BUCKETS = {
  AVATARS: "avatars",
  GALLERY: "gallery",
  EVENTS: "events",
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  [STORAGE_BUCKETS.AVATARS]: 5 * 1024 * 1024, // 5MB
  [STORAGE_BUCKETS.GALLERY]: 50 * 1024 * 1024, // 50MB (supports video)
  [STORAGE_BUCKETS.EVENTS]: 10 * 1024 * 1024, // 10MB
} as const;

// Allowed image MIME types (shared across buckets that accept images)
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
] as const;

// Specific MIME types for video intros (subset of gallery)
export const VIDEO_INTRO_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

// Specific MIME types for voice prompts (subset of gallery)
export const VOICE_PROMPT_MIME_TYPES = [
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
] as const;

// File input accept strings (use these in <input type="file" accept="...">)
export const IMAGE_ACCEPT_STRING = ALLOWED_IMAGE_MIME_TYPES.join(",");
export const VIDEO_ACCEPT_STRING = VIDEO_INTRO_MIME_TYPES.join(",");
export const IMAGE_AND_VIDEO_ACCEPT_STRING = [...ALLOWED_IMAGE_MIME_TYPES, ...VIDEO_INTRO_MIME_TYPES].join(",");

// Allowed MIME types per bucket
export const ALLOWED_MIME_TYPES = {
  [STORAGE_BUCKETS.AVATARS]: ALLOWED_IMAGE_MIME_TYPES,
  [STORAGE_BUCKETS.GALLERY]: [
    ...ALLOWED_IMAGE_MIME_TYPES,
    ...VIDEO_INTRO_MIME_TYPES,
    ...VOICE_PROMPT_MIME_TYPES,
  ],
  [STORAGE_BUCKETS.EVENTS]: ALLOWED_IMAGE_MIME_TYPES,
} as const;

/**
 * Get the public URL for a file in a public bucket
 * Works for: avatars, events
 */
export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Get a signed URL for a file in a private bucket
 * Works for: gallery (requires authentication)
 * @param expiresIn - Seconds until the URL expires (default: 1 hour)
 */
export async function getSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  
  if (error) {
    console.error("Error creating signed URL:", error);
    return null;
  }
  
  return data.signedUrl;
}

/**
 * Generate the storage path for a user's avatar
 * Format: {userId}/avatar.{ext}
 */
export function getAvatarPath(userId: string, fileExtension: string): string {
  return `${userId}/avatar.${fileExtension}`;
}

/**
 * Generate the storage path for a gallery item
 * Format: {userId}/{filename}
 */
export function getGalleryPath(userId: string, filename: string): string {
  return `${userId}/${filename}`;
}

/**
 * Generate the storage path for an event image
 * Format: {eventId}/{filename}
 */
export function getEventImagePath(eventId: string, filename: string): string {
  return `${eventId}/${filename}`;
}

/**
 * Generate the storage path for a voice prompt
 * Format: {userId}/voice_{timestamp}.{ext}
 * 
 * Note: The userId must be first to satisfy the RLS policy which checks
 * that the first folder matches the authenticated user's ID.
 */
export function getVoicePromptPath(userId: string, fileExtension: string): string {
  const timestamp = Date.now();
  return `${userId}/voice_${timestamp}.${fileExtension}`;
}

/**
 * Generate the storage path for a video intro
 * Format: {userId}/video_intro_{timestamp}.{ext}
 * 
 * Note: The userId must be first to satisfy the RLS policy which checks
 * that the first folder matches the authenticated user's ID.
 */
export function getVideoIntroPath(userId: string, fileExtension: string): string {
  const timestamp = Date.now();
  return `${userId}/video_intro_${timestamp}.${fileExtension}`;
}

/**
 * Generate the storage path for a verification selfie
 * Format: {userId}/verification_{timestamp}.{ext}
 * 
 * Note: The userId must be first to satisfy the RLS policy which checks
 * that the first folder matches the authenticated user's ID.
 */
export function getVerificationSelfiePath(userId: string, fileExtension: string): string {
  const timestamp = Date.now();
  return `${userId}/verification_${timestamp}.${fileExtension}`;
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  bucket: StorageBucket
): { valid: boolean; error?: string } {
  // Check file size
  const maxSize = FILE_SIZE_LIMITS[bucket];
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${maxSize / 1024 / 1024}MB`,
    };
  }

  // Check MIME type
  const allowedTypes = ALLOWED_MIME_TYPES[bucket] as readonly string[];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Upload a file to storage (client-side)
 */
export async function uploadFile(
  bucket: StorageBucket,
  path: string,
  file: File,
  options?: { upsert?: boolean }
): Promise<{ path: string; error?: string }> {
  // Validate file first
  const validation = validateFile(file, bucket);
  if (!validation.valid) {
    return { path: "", error: validation.error };
  }

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: options?.upsert ?? false,
    });

  if (error) {
    return { path: "", error: error.message };
  }

  return { path: data.path };
}

/**
 * Delete a file from storage (client-side)
 */
export async function deleteFile(
  bucket: StorageBucket,
  path: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * List files in a user's gallery
 */
export async function listGalleryFiles(
  userId: string
): Promise<{ files: string[]; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.GALLERY)
    .list(userId);

  if (error) {
    return { files: [], error: error.message };
  }

  return { files: data.map((file) => `${userId}/${file.name}`) };
}
