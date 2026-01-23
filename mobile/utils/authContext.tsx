import { getProfile } from '@/lib/api'; // Assuming this function exists
import { User } from '@/types';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getToken } from './token'; // Assuming these functions exist


type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  refreshUser: () => Promise<void>;
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);

  // Initialize auth state function
  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      
      if (token) {
        // const userId = await getCurrentUserId();
        const userProfile = await getProfile();
          
          if (userProfile?.data) {
            setUser(userProfile.data);
            setIsAuthenticated(true);
            console.log('User authenticated successfully');
          } else {
            // Invalid user profile
            setUser(null);
            setIsAuthenticated(false);
            console.log('User profile not found or invalid');
          }
      } else {
        // No token found
        setUser(null);
        setIsAuthenticated(false);
        console.log('No authentication token found');
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize on component mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Function to refresh user - just recalls initializeAuth
  const refreshUser = async () => {
    await initializeAuth();
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    refreshUser,
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