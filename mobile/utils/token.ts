/**
 * Token and Storage Utilities
 * 
 * NOTE: Session management is now handled by Supabase Auth automatically.
 * These functions are kept for backward compatibility during migration.
 * 
 * For new code, use:
 * - supabase.auth.getSession() for session/token access
 * - supabase.auth.getUser() for current user
 * 
 * @deprecated These token functions will be removed after full migration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

// ===========================================
// TOKEN FUNCTIONS (deprecated - use Supabase auth)
// ===========================================

const TOKEN_KEY = 'auth_token';

/**
 * @deprecated Use Supabase session instead
 */
export const storeToken = async (token: string) => {
  console.warn('[Deprecated] storeToken is deprecated. Use Supabase auth instead.');
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error storing token:', error);
  }
};

/**
 * @deprecated Use supabase.auth.getSession() instead
 */
export const getToken = async () => {
  // Try to get Supabase session token first
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return session.access_token;
    }
  } catch (error) {
    console.error('Error getting Supabase session:', error);
  }
  
  // Fallback to stored token (for backward compatibility)
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

/**
 * @deprecated Use supabase.auth.signOut() instead
 */
export const removeToken = async () => {
  console.warn('[Deprecated] removeToken is deprecated. Use supabase.auth.signOut() instead.');
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

// ===========================================
// USER ID FUNCTIONS (deprecated - use Supabase auth)
// ===========================================

/**
 * @deprecated Use supabase.auth.getUser() instead
 */
export const addCurrentUserId = async (id: string) => {
  console.warn('[Deprecated] addCurrentUserId is deprecated. User ID is managed by Supabase.');
  try {
    await AsyncStorage.setItem('curr_userid', id);
  } catch (error) {
    console.error('Error storing current user ID:', error);
  }
};

/**
 * @deprecated Use supabase.auth.getUser() instead
 */
export const getCurrentUserId = async () => {
  // Try to get Supabase user ID first
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      return user.id;
    }
  } catch (error) {
    console.error('Error getting Supabase user:', error);
  }
  
  // Fallback to stored user ID (for backward compatibility)
  try {
    return await AsyncStorage.getItem('curr_userid');
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
};

/**
 * @deprecated Use supabase.auth.signOut() instead
 */
export const removeCurrentUserId = async () => {
  console.warn('[Deprecated] removeCurrentUserId is deprecated. Use supabase.auth.signOut() instead.');
  try {
    await AsyncStorage.removeItem('curr_userid');
  } catch (error) {
    console.error('Error removing current user ID:', error);
  }
};

// ===========================================
// MEDIA URL CONSTANTS
// ===========================================

// Supabase Storage URL
export const SUPABASE_STORAGE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL 
  ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public`
  : '';

// These constants are provided for backward compatibility during migration
// New code should use getImageUrl() and getVideoUrl() functions instead
export const IMAGE_URL = SUPABASE_STORAGE_URL ? `${SUPABASE_STORAGE_URL}/` : '';
export const VIDEO_URL = SUPABASE_STORAGE_URL ? `${SUPABASE_STORAGE_URL}/` : '';
export const MEDIA_BASE_URL = SUPABASE_STORAGE_URL ? `${SUPABASE_STORAGE_URL}/` : '';

/**
 * Get full URL for an image
 * Handles Supabase storage paths
 */
export const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  
  // Already a full URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Supabase storage path (starts with bucket name)
  if (path.startsWith('avatars/') || path.startsWith('gallery/') || path.startsWith('events/')) {
    return `${SUPABASE_STORAGE_URL}/${path}`;
  }
  
  // Assume Supabase path without bucket prefix - default to avatars
  return `${SUPABASE_STORAGE_URL}/avatars/${path}`;
};

/**
 * Get full URL for a video
 */
export const getVideoUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  
  // Already a full URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Supabase storage path
  if (path.startsWith('gallery/') || path.startsWith('videos/')) {
    return `${SUPABASE_STORAGE_URL}/${path}`;
  }
  
  // Assume Supabase path without bucket prefix - default to gallery
  return `${SUPABASE_STORAGE_URL}/gallery/${path}`;
};
