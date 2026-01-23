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
// LEGACY TOKEN FUNCTIONS (deprecated)
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
  
  // Fallback to legacy token (for backward compatibility during migration)
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
// LEGACY USER ID FUNCTIONS (deprecated)
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
  
  // Fallback to legacy storage (for backward compatibility during migration)
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

// Legacy URLs (still pointing to old server during migration)
export const IMAGE_URL = 'https://itinfonity.io/datingAPI/webservice/';
export const VIDEO_URL = 'https://itinfonity.io/datingAPI/webservice/uploads/';
export const MEDIA_BASE_URL = 'https://itinfonity.io/datingAPI/webservice/uploads/';

// New Supabase Storage URL
// TODO: Update when Supabase Storage is configured
export const SUPABASE_STORAGE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL 
  ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public`
  : '';

/**
 * Get full URL for an image
 * Handles both legacy (PHP) and new (Supabase) storage paths
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
  
  // Legacy path (assume it's from old PHP server)
  return `${IMAGE_URL}${path}`;
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
  
  // Legacy path
  return `${VIDEO_URL}${path}`;
};
