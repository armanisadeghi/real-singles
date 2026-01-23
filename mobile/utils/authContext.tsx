/**
 * Auth Context Provider for React Native / Expo
 * 
 * Uses Supabase Auth for session management with:
 * - Automatic session persistence via AsyncStorage
 * - Auth state change listeners
 * - Token auto-refresh
 * 
 * @example
 * // Wrap your app with AuthProvider in _layout.tsx
 * <AuthProvider>
 *   <Stack />
 * </AuthProvider>
 * 
 * @example
 * // Use in any component
 * const { user, isAuthenticated, isLoading, signOut } = useAuth();
 */

import { supabase, getProfile, getUserData } from '@/lib/supabase';
import { User as AuthUser, Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Types for user data
interface UserData {
  id: string;
  email: string;
  phone?: string;
  display_name?: string;
  status?: string;
  role?: string;
  points_balance?: number;
  referral_code?: string;
  agora_user_id?: string;
  created_at?: string;
  updated_at?: string;
  last_active_at?: string;
}

interface ProfileData {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
  looking_for?: string[];
  height_inches?: number;
  body_type?: string;
  city?: string;
  state?: string;
  country?: string;
  occupation?: string;
  education?: string;
  religion?: string;
  smoking?: string;
  drinking?: string;
  exercise?: string;
  has_kids?: boolean;
  wants_kids?: string;
  interests?: string[];
  bio?: string;
  looking_for_description?: string;
  profile_image_url?: string;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

type AuthContextType = {
  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  session: Session | null;
  
  // User data
  authUser: AuthUser | null;      // Supabase auth user
  userData: UserData | null;       // From public.users table
  profile: ProfileData | null;     // From public.profiles table
  
  // Computed properties (for backward compatibility)
  user: (UserData & { profile?: ProfileData }) | null;
  
  // Actions
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  // Computed properties
  const isAuthenticated = !!session;
  
  // Backward-compatible user object
  const user = userData ? { ...userData, profile: profile || undefined } : null;

  // Load user data from database
  const loadUserData = useCallback(async () => {
    try {
      const [userResult, profileResult] = await Promise.all([
        getUserData(),
        getProfile(),
      ]);
      
      setUserData(userResult as UserData | null);
      setProfile(profileResult as ProfileData | null);
      
      console.log('[Auth] User data loaded successfully');
    } catch (error) {
      console.error('[Auth] Error loading user data:', error);
      setUserData(null);
      setProfile(null);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    console.log('[Auth] Initializing...');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log('[Auth] Initial session:', initialSession ? 'Found' : 'None');
      setSession(initialSession);
      setAuthUser(initialSession?.user ?? null);
      
      if (initialSession?.user) {
        loadUserData().finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[Auth] State changed:', event);
        
        setSession(newSession);
        setAuthUser(newSession?.user ?? null);
        
        if (event === 'SIGNED_IN' && newSession?.user) {
          await loadUserData();
        } else if (event === 'SIGNED_OUT') {
          setUserData(null);
          setProfile(null);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('[Auth] Token refreshed');
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  // Refresh user data manually
  const refreshUser = useCallback(async () => {
    if (!session) {
      console.log('[Auth] Cannot refresh - no session');
      return;
    }
    
    console.log('[Auth] Refreshing user data...');
    await loadUserData();
  }, [session, loadUserData]);

  // Sign out
  const handleSignOut = useCallback(async () => {
    console.log('[Auth] Signing out...');
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[Auth] Sign out error:', error);
        throw error;
      }
      
      // Clear local state
      setSession(null);
      setAuthUser(null);
      setUserData(null);
      setProfile(null);
      
      console.log('[Auth] Signed out successfully');
    } catch (error) {
      console.error('[Auth] Sign out failed:', error);
      throw error;
    }
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    session,
    authUser,
    userData,
    profile,
    user,
    refreshUser,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Export the Provider component
export default AuthProvider;
