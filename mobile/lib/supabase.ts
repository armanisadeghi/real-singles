/**
 * Supabase Client for React Native / Expo
 * 
 * This client is configured for mobile use with:
 * - AsyncStorage for session persistence
 * - Auto token refresh
 * - Persistent sessions across app restarts
 * 
 * @see https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file:\n' +
    '- EXPO_PUBLIC_SUPABASE_URL\n' +
    '- EXPO_PUBLIC_SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Required for React Native
  },
});

// ===========================================
// AUTH HELPER FUNCTIONS
// ===========================================

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    throw error;
  }
  
  return data;
}

/**
 * Sign up with email and password
 * Note: User profile is auto-created via database trigger
 */
export async function signUpWithEmail(
  email: string, 
  password: string, 
  metadata?: { 
    display_name?: string;
    referral_code?: string;
  }
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  
  if (error) {
    throw error;
  }
  
  return data;
}

/**
 * Sign out current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw error;
  }
}

/**
 * Get current session
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    throw error;
  }
  
  return session;
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    throw error;
  }
  
  return user;
}

/**
 * Reset password (send reset email)
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  
  if (error) {
    throw error;
  }
}

/**
 * Update password (when logged in)
 */
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  
  if (error) {
    throw error;
  }
}

// ===========================================
// PROFILE HELPER FUNCTIONS
// ===========================================

/**
 * Get current user's profile from the profiles table
 */
export async function getProfile() {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw error;
  }
  
  return data;
}

/**
 * Get current user's data from the users table
 */
export async function getUserData() {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  
  return data;
}

/**
 * Get combined user data (auth user + users table + profile)
 */
export async function getFullUserData() {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }
  
  const [userData, profile] = await Promise.all([
    getUserData(),
    getProfile(),
  ]);
  
  return {
    auth: user,
    user: userData,
    profile,
  };
}

/**
 * Update user profile
 */
export async function updateProfile(profileData: Record<string, unknown>) {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Not authenticated');
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      user_id: user.id,
      ...profileData,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    })
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
}

// ===========================================
// STORAGE CONSTANTS
// ===========================================

export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  GALLERY: 'gallery',
  EVENTS: 'events',
} as const;

/**
 * Get public URL for a file in storage
 */
export function getPublicUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
