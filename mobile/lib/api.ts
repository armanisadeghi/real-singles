/**
 * API Client for Next.js Backend
 * 
 * This module provides all API functions that call the Next.js backend.
 * The backend uses Supabase for data storage and authentication.
 */

import { EditProfileFormData } from "@/types";
import { supabase, getSession } from "./supabase";

// Get API URL from environment
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

/**
 * Make an authenticated API request
 */
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const session = await getSession();
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Add auth token if available
  if (session?.access_token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${session.access_token}`;
  }

  const url = `${API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`API Error [${endpoint}]:`, data);
      return {
        success: false,
        msg: data.msg || data.error || "Request failed",
      } as T;
    }

    return data;
  } catch (error) {
    console.error(`API Request Error [${endpoint}]:`, error);
    return {
      success: false,
      msg: "Network error. Please check your connection.",
    } as T;
  }
}

/**
 * Make an authenticated FormData API request
 */
async function apiFormDataRequest<T = any>(
  endpoint: string,
  formData: FormData,
  method: "POST" | "PUT" | "DELETE" = "POST"
): Promise<T> {
  const session = await getSession();
  
  const headers: HeadersInit = {};

  // Add auth token if available
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const url = `${API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method,
      body: formData,
      headers,
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`API Error [${endpoint}]:`, data);
      return {
        success: false,
        msg: data.msg || data.error || "Request failed",
      } as T;
    }

    return data;
  } catch (error) {
    console.error(`API Request Error [${endpoint}]:`, error);
    return {
      success: false,
      msg: "Network error. Please check your connection.",
    } as T;
  }
}

// ===========================================
// AUTH ENDPOINTS
// ===========================================

/**
 * Login with email and password
 * Note: For mobile, we recommend using Supabase auth directly via lib/supabase.ts
 * This is provided for compatibility with FormData-based login flows
 */
export const login = async (loginData: FormData) => {
  const email = loginData.get("Email") as string || loginData.get("email") as string;
  const password = loginData.get("Password") as string || loginData.get("password") as string;

  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

/**
 * Register new user
 */
export const register = async (registerData: FormData) => {
  const email = registerData.get("Email") as string || registerData.get("email") as string;
  const password = registerData.get("Password") as string || registerData.get("password") as string;
  const displayName = registerData.get("DisplayName") as string || registerData.get("name") as string;

  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, display_name: displayName }),
  });
};

/**
 * Logout current user
 */
export const logout = async () => {
  return apiRequest("/auth/logout", { method: "POST" });
};

/**
 * Request password reset email
 */
export const forgotPassword = async (data: FormData) => {
  const email = data.get("Email") as string || data.get("email") as string;
  
  return apiRequest("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
};

/**
 * Verify OTP code
 */
export const verifyOtp = async (data: FormData) => {
  const email = data.get("Email") as string;
  const otp = data.get("OTP") as string || data.get("otp") as string;
  
  return apiRequest("/auth/confirm-phone", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
};

/**
 * Change password (authenticated)
 */
export const changePassword = async (data: FormData) => {
  const currentPassword = data.get("CurrentPassword") as string || data.get("current_password") as string;
  const newPassword = data.get("NewPassword") as string || data.get("new_password") as string;
  
  return apiRequest("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
};

// ===========================================
// USER & PROFILE ENDPOINTS
// ===========================================

/**
 * Get current user's profile
 */
export const getProfile = async () => {
  return apiRequest("/users/me");
};

/**
 * Fetch user profile by ID (for current user)
 */
export const fetchUserProfile = async (userId: string) => {
  // If fetching current user, use /users/me
  const session = await getSession();
  if (session?.user?.id === userId) {
    return apiRequest("/users/me");
  }
  return apiRequest(`/users/${userId}`);
};

/**
 * Fetch another user's profile
 */
export const fetchOtherProfile = async (id: string) => {
  return apiRequest(`/users/${id}`);
};

/**
 * Update user profile
 */
export const updateUser = async (data: EditProfileFormData) => {
  return apiRequest("/users/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

/**
 * Check if email already exists
 * Uses API endpoint instead of direct Supabase for SSOT compliance
 */
export const checkEmailExist = async (emailData: FormData) => {
  const email = emailData.get("Email") as string || emailData.get("email") as string;
  
  try {
    const response = await apiRequest("/auth/check-email", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    
    return {
      success: true,
      exists: response?.exists ?? false,
      msg: response?.message ?? "Email check completed",
    };
  } catch (error) {
    console.error("Email check error:", error);
    return {
      success: false,
      exists: false,
      msg: "Failed to check email",
    };
  }
};

// ===========================================
// HOME SCREEN & DISCOVERY ENDPOINTS
// ===========================================

/**
 * Get aggregated home screen data
 */
export const getHomeScreenData = async () => {
  return apiRequest("/discover");
};

/**
 * Get all top matches
 */
export const getAllTopMatches = async () => {
  return apiRequest("/discover/top-matches");
};

/**
 * Get nearby profiles
 */
export const getAllNearBy = async (location: FormData) => {
  const latitude = location.get("Latitude") as string || location.get("latitude") as string;
  const longitude = location.get("Longitude") as string || location.get("longitude") as string;
  
  return apiRequest(`/discover/nearby?latitude=${latitude}&longitude=${longitude}`);
};

/**
 * Get featured videos
 * Note: Videos come from the discover endpoint now
 */
export const getAllFeaturedVideos = async () => {
  const data = await apiRequest("/discover");
  return {
    success: true,
    data: data?.data?.Videos || [],
    msg: "Featured videos fetched",
  };
};

// ===========================================
// FILTER ENDPOINTS
// ===========================================

/**
 * Get user's saved filters
 */
export const getFilter = async () => {
  return apiRequest("/filters");
};

/**
 * Save filter preferences
 */
export const saveFilter = async (data: FormData) => {
  return apiFormDataRequest("/filters", data);
};

/**
 * Apply filters and get results
 */
export const applyFilters = async (paramsObj: any) => {
  const queryString = new URLSearchParams(paramsObj).toString();
  return apiRequest(`/discover/top-matches?${queryString}`);
};

/**
 * Clear/reset filters
 */
export const clearFilter = async () => {
  return apiRequest("/filters", { method: "DELETE" });
};

// ===========================================
// FAVORITES ENDPOINTS
// ===========================================

/**
 * Get user's favorites list
 */
  export const getFavoriteList = async () => {
  return apiRequest("/favorites");
};

/**
 * Toggle favorite status for a user
 */
export const toggleFavorite = async (data: FormData) => {
  const favoriteUserId = data.get("FavoriteUserID") as string || 
                         data.get("favorite_user_id") as string ||
                         data.get("user_id") as string;
  
  return apiRequest("/favorites", {
    method: "POST",
    body: JSON.stringify({ favorite_user_id: favoriteUserId }),
  });
};

/**
 * Follow/unfollow a user
 */
export const followUser = async (userId: string) => {
  return apiRequest("/favorites", {
    method: "POST",
    body: JSON.stringify({ favorite_user_id: userId }),
  });
};

// ===========================================
// MATCHES ENDPOINTS (Like, Pass, Super Like)
// ===========================================

/**
 * Send a match action (like, pass, or super_like)
 */
export const sendMatchAction = async (
  targetUserId: string, 
  action: "like" | "pass" | "super_like"
) => {
  return apiRequest("/matches", {
    method: "POST",
    body: JSON.stringify({ target_user_id: targetUserId, action }),
  });
};

/**
 * Like a user
 */
export const likeUser = async (targetUserId: string) => {
  return sendMatchAction(targetUserId, "like");
};

/**
 * Pass on a user
 */
export const passUser = async (targetUserId: string) => {
  return sendMatchAction(targetUserId, "pass");
};

/**
 * Super like a user
 */
export const superLikeUser = async (targetUserId: string) => {
  return sendMatchAction(targetUserId, "super_like");
};

/**
 * Get mutual matches
 */
export const getMatches = async () => {
  return apiRequest("/matches");
};

/**
 * Get users who have liked you (premium feature)
 */
export const getLikesReceived = async () => {
  return apiRequest("/matches/likes-received");
};

/**
 * Unmatch a user
 */
export const unmatchUser = async (userId: string) => {
  return apiRequest(`/matches/${userId}`, { method: "DELETE" });
};

/**
 * Get match status with a specific user
 */
export const getMatchStatus = async (userId: string) => {
  return apiRequest(`/matches/${userId}`);
};

// ===========================================
// EVENTS ENDPOINTS
// ===========================================

/**
 * Get all events - fetches both current (upcoming) and past events
 * Returns data in format: { success, currentEvent, pastEvent }
 */
export const getAllEvents = async () => {
  try {
    // Fetch upcoming events and past events in parallel
    const [upcomingRes, pastRes] = await Promise.all([
      apiRequest("/events?status=upcoming&limit=20"),
      apiRequest("/events?status=past&limit=20"),
    ]);

    // Process the responses
    const currentEvent = upcomingRes?.success && upcomingRes?.data ? upcomingRes.data : [];
    const pastEvent = pastRes?.success && pastRes?.data ? pastRes.data : [];

    return {
      success: true,
      currentEvent,
      pastEvent,
      msg: "Events fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching events:", error);
    return {
      success: false,
      currentEvent: [],
      pastEvent: [],
      msg: "Failed to fetch events",
    };
  }
};

/**
 * Get event details
 */
export const getEventDetails = async (EventID: string) => {
  return apiRequest(`/events/${EventID}`);
};

/**
 * Create a new event
 */
export const createEvent = async (data: FormData) => {
  return apiFormDataRequest("/events", data);
};

/**
 * Mark event as interested / register (RSVP)
 */
export const markEventAsInterested = async (data: FormData) => {
  const eventId = data.get("EventID") as string || data.get("event_id") as string;
  
  return apiRequest(`/events/${eventId}/register`, {
    method: "POST",
  });
};

/**
 * Cancel event registration (Cancel RSVP)
 */
export const cancelEventRegistration = async (eventId: string) => {
  return apiRequest(`/events/${eventId}/register`, {
    method: "DELETE",
  });
};

// ===========================================
// VIRTUAL SPEED DATING ENDPOINTS
// ===========================================

/**
 * Get all virtual speed dating sessions
 */
export const getAllVirtualDate = async () => {
  return apiRequest("/speed-dating");
};

/**
 * Get virtual date list (alias)
 */
export const getVirtualDateList = async () => {
  return apiRequest("/speed-dating");
};

/**
 * Get speed dating session details
 */
export const getVirtualSpeedDetails = async (id: string) => {
  return apiRequest(`/speed-dating/${id}`);
};

/**
 * Register for virtual speed dating slot
 */
export const registerVirtualSlot = async (data: FormData) => {
  const sessionId = data.get("SessionID") as string || data.get("session_id") as string;
  
  return apiRequest(`/speed-dating/${sessionId}/register`, {
    method: "POST",
  });
};

// ===========================================
// NOTIFICATIONS ENDPOINTS
// ===========================================

/**
 * Get all notifications
 */
export const getAllNotifications = async () => {
  return apiRequest("/notifications");
};

// ===========================================
// GROUPS ENDPOINTS
// ===========================================

/**
 * Get user's groups
 */
export const getGroupList = async () => {
  return apiRequest("/groups");
};

/**
 * Create a new group
 */
export const createGroup = async (data: FormData) => {
  return apiFormDataRequest("/groups", data);
};

// ===========================================
// PRODUCTS & REWARDS ENDPOINTS
// ===========================================

/**
 * Get products/gifts list
 */
export const getProductsGiftList = async () => {
  return apiRequest("/products");
};

/**
 * Get product details
 */
export const getProductsGiftDetail = async (data: FormData) => {
  const productId = data.get("productid") as string || data.get("product_id") as string;
  return apiRequest(`/products/${productId}`);
};

/**
 * Check user's redeemable points
 */
export const checkRedeemPoints = async () => {
  return apiRequest("/points");
};

/**
 * Accept/place order using points
 */
export const acceptOrderRedeemPoints = async (data: FormData) => {
  const productId = data.get("ProductID") as string || data.get("product_id") as string;
  const quantity = data.get("Quantity") as string || "1";
  const shippingAddress = data.get("ShippingAddress") as string || data.get("shipping_address") as string;
  
  return apiRequest("/orders", {
    method: "POST",
    body: JSON.stringify({ 
      product_id: productId, 
      quantity: parseInt(quantity),
      shipping_address: shippingAddress,
    }),
  });
};

// Alias for compatibility
export const acceptOrderRedeemPointsWithFetch = acceptOrderRedeemPoints;

// ===========================================
// REVIEWS & RATINGS ENDPOINTS
// ===========================================

/**
 * Add or update rating/review
 */
export const addUpdateRating = async (data: FormData) => {
  const reviewedUserId = data.get("ReviewedUserID") as string || data.get("reviewed_user_id") as string;
  const rating = data.get("Rating") as string || data.get("rating") as string;
  const reviewText = data.get("ReviewText") as string || data.get("review_text") as string;
  const relationship = data.get("Relationship") as string || data.get("relationship") as string;
  
  return apiRequest("/reviews", {
    method: "POST",
    body: JSON.stringify({
      reviewed_user_id: reviewedUserId,
      rating: parseInt(rating),
      review_text: reviewText,
      relationship,
    }),
  });
};

// ===========================================
// AGORA CHAT & CALL ENDPOINTS
// ===========================================

/**
 * Get Agora chat token
 */
export const getAgoraChatToken = async (userId: string) => {
  return apiRequest("/agora/chat-token", {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
};

/**
 * Get Agora call token
 */
export const getAgoraCallToken = async (userId: string) => {
  return apiRequest("/agora/call-token", {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
};

/**
 * Refresh Agora call token
 */
export const getAgoraCallRefreshToken = async (data: FormData) => {
  const channelName = data.get("ChannelName") as string || data.get("channel_name") as string;
  const userId = data.get("UserID") as string || data.get("user_id") as string;
  
  return apiRequest("/agora/call-token", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, channel_name: channelName }),
  });
};

/**
 * Refresh Agora chat token
 */
export const getAgoraChatRefreshToken = async (data: FormData) => {
  const userId = data.get("UserID") as string || data.get("user_id") as string;
  
  return apiRequest("/agora/chat-token", {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
};

// ===========================================
// UPLOAD & GALLERY ENDPOINTS
// ===========================================

/**
 * Upload image/video file
 */
export const uploadImage = async (imageUrl?: string, videoUrl?: string) => {
  const formData = new FormData();
  
  if (imageUrl) {
    formData.append("file", {
      uri: imageUrl,
      type: "image/jpeg",
      name: "photo.jpg",
    } as any);
    formData.append("type", "image");
  }

  if (videoUrl) {
    formData.append("file", {
      uri: videoUrl,
      type: "video/mp4",
      name: "video.mp4",
    } as any);
    formData.append("type", "video");
  }

  return apiFormDataRequest("/upload", formData);
};

/**
 * Common file upload (for profile images, etc.)
 */
export const CommonFileUpload = async (formData: FormData) => {
  return apiFormDataRequest("/upload", formData);
};

/**
 * Save gallery image/video
 */
export const saveGalleryImage = async (imageUrl: string, videoUrl: string) => {
  const formData = new FormData();
  
  if (imageUrl) {
    formData.append("file", {
      uri: imageUrl,
      type: "image/jpeg",
      name: "gallery_photo.jpg",
    } as any);
    formData.append("type", "image");
  }
  
  if (videoUrl) {
    formData.append("file", {
      uri: videoUrl,
      type: "video/mp4",
      name: "gallery_video.mp4",
    } as any);
    formData.append("type", "video");
  }

  formData.append("bucket", "gallery");
  
  return apiFormDataRequest("/upload", formData);
};

// ===========================================
// CONTACT & MISC ENDPOINTS
// ===========================================

/**
 * Submit contact form
 */
export const contactUs = async (data: FormData) => {
  const name = data.get("Name") as string || data.get("name") as string;
  const email = data.get("Email") as string || data.get("email") as string;
  const subject = data.get("Subject") as string || data.get("subject") as string;
  const message = data.get("Message") as string || data.get("message") as string;
  
  return apiRequest("/contact", {
    method: "POST",
    body: JSON.stringify({ name, email, subject, message }),
  });
};

/**
 * Save share link notification
 * Note: This may not be needed with the new backend
 */
export const saveLink = async (linkData: FormData) => {
  // This functionality can be handled by notifications endpoint
  return { success: true, msg: "Link saved" };
};

// ===========================================
// BLOCK & REPORT ENDPOINTS
// ===========================================

/**
 * Block a user
 */
export const blockUser = async (blockedUserId: string) => {
  return apiRequest("/blocks", {
    method: "POST",
    body: JSON.stringify({ blocked_user_id: blockedUserId }),
  });
};

/**
 * Unblock a user
 */
export const unblockUser = async (blockedUserId: string) => {
  return apiRequest(`/blocks/${blockedUserId}`, {
    method: "DELETE",
  });
};

/**
 * Report a user
 */
export const reportUser = async (reportedUserId: string, reason: string) => {
  return apiRequest("/reports", {
    method: "POST",
    body: JSON.stringify({ 
      reported_user_id: reportedUserId,
      reason: reason,
    }),
  });
};

/**
 * Get block status for a user
 */
export const getBlockStatus = async (userId: string) => {
  return apiRequest(`/blocks/${userId}`);
};

// ===========================================
// GROUP MEMBER ENDPOINTS
// ===========================================

/**
 * Add member to a group
 */
export const addGroupMember = async (groupId: string, userId: string) => {
  return apiRequest(`/groups/${groupId}/members`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
};

/**
 * Remove member from a group
 */
export const removeGroupMember = async (groupId: string, userId: string) => {
  return apiRequest(`/groups/${groupId}/members/${userId}`, {
    method: "DELETE",
  });
};

/**
 * Get group members
 */
export const getGroupMembers = async (groupId: string) => {
  return apiRequest(`/groups/${groupId}/members`);
};

