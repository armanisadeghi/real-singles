"use client";

/**
 * DiscoverProfileView Component
 * 
 * Wraps SearchProfileView with discover-specific action handlers.
 * Manages the single-profile discovery flow:
 * - Like/Pass/SuperLike → API call → advance to next profile
 * - Block/Report → API call + confirmation → advance to next profile
 * - Share → stay on current profile
 * - Undo → API call → go back to previous profile
 * - Back → navigate to /explore
 * 
 * Uses the DiscoverProfilesContext for profile queue management
 * and useMatchUndo for undo functionality.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchProfileView } from "@/components/search/SearchProfileView";
import { useDiscoverProfiles } from "@/contexts/DiscoverProfilesContext";
import { useMatchUndo } from "@/hooks/useMatchUndo";
import { useCurrentUser } from "@/components/providers/AppProviders";

// Gallery item type matching what SearchProfileView expects
interface GalleryItem {
  media_url: string;
  media_type: string;
  is_primary?: boolean;
}

interface MatchActionResult {
  success: boolean;
  is_mutual?: boolean;
  conversation_id?: string | null;
  msg?: string;
}

/**
 * Call the match action API
 */
async function callMatchAction(
  targetUserId: string,
  action: "like" | "pass" | "super_like"
): Promise<MatchActionResult> {
  const response = await fetch("/api/matches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_user_id: targetUserId, action }),
  });
  return response.json();
}

/**
 * Call the block API
 */
async function callBlockAction(
  blockedUserId: string
): Promise<{ success: boolean; msg?: string }> {
  const response = await fetch("/api/blocks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blocked_user_id: blockedUserId }),
  });
  return response.json();
}

/**
 * Call the report API
 */
async function callReportAction(
  reportedUserId: string,
  reason: string
): Promise<{ success: boolean; msg?: string }> {
  const response = await fetch("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reported_user_id: reportedUserId, reason }),
  });
  return response.json();
}

export function DiscoverProfileView() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  
  // Get profile queue and navigation functions
  const {
    currentProfile,
    advanceToNext,
    goToPrevious,
    isLoading,
    markActedOn,
  } = useDiscoverProfiles();
  
  // Track if we're waiting for match modal to close before advancing
  const [pendingAdvanceUserId, setPendingAdvanceUserId] = useState<string | null>(null);
  
  // Undo functionality
  const {
    recordAction,
    performUndo,
    canUndo,
    secondsRemaining,
    lastAction,
  } = useMatchUndo();
  
  // Gallery data for current profile
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  
  // Fetch gallery when current profile changes
  // Uses /api/users/[id] which returns full profile with gallery
  useEffect(() => {
    if (!currentProfile?.user_id) {
      setGallery([]);
      return;
    }
    
    let cancelled = false;
    setGalleryLoading(true);
    
    fetch(`/api/users/${currentProfile.user_id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success && data.data?.gallery) {
          // Transform gallery items to the expected format
          const galleryItems: GalleryItem[] = data.data.gallery.map((item: {
            media_url: string;
            media_type?: string;
            is_primary?: boolean;
          }) => ({
            media_url: item.media_url,
            media_type: item.media_type || "image",
            is_primary: item.is_primary || false,
          }));
          setGallery(galleryItems);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch gallery:", err);
      })
      .finally(() => {
        if (!cancelled) setGalleryLoading(false);
      });
    
    return () => {
      cancelled = true;
    };
  }, [currentProfile?.user_id]);
  
  // Handle Like action
  const handleLike = useCallback(async (userId: string): Promise<MatchActionResult> => {
    const result = await callMatchAction(userId, "like");
    
    if (result.success) {
      // Record for potential undo
      const userName = currentProfile?.first_name || "User";
      recordAction(userId, userName, "like");
      
      // If mutual match, don't advance yet - wait for match modal to close
      // Store the userId so we can advance when modal closes
      if (result.is_mutual) {
        setPendingAdvanceUserId(userId);
      } else {
        // Mark as acted on and advance to next profile
        markActedOn(userId);
        advanceToNext();
      }
    }
    
    return result;
  }, [currentProfile?.first_name, recordAction, advanceToNext, markActedOn]);
  
  // Handle Pass/Dislike action
  const handlePass = useCallback(async (userId: string): Promise<{ success: boolean; msg?: string }> => {
    const result = await callMatchAction(userId, "pass");
    
    if (result.success) {
      const userName = currentProfile?.first_name || "User";
      recordAction(userId, userName, "pass");
      // Mark as acted on and advance
      markActedOn(userId);
      advanceToNext();
    }
    
    return result;
  }, [currentProfile?.first_name, recordAction, advanceToNext, markActedOn]);
  
  // Handle Super Like action
  const handleSuperLike = useCallback(async (userId: string): Promise<MatchActionResult> => {
    const result = await callMatchAction(userId, "super_like");
    
    if (result.success) {
      const userName = currentProfile?.first_name || "User";
      recordAction(userId, userName, "super_like");
      
      // If mutual match, don't advance yet - wait for match modal to close
      if (result.is_mutual) {
        setPendingAdvanceUserId(userId);
      } else {
        // Mark as acted on and advance to next profile
        markActedOn(userId);
        advanceToNext();
      }
    }
    
    return result;
  }, [currentProfile?.first_name, recordAction, advanceToNext, markActedOn]);
  
  // Handle Block action
  const handleBlock = useCallback(async (userId: string): Promise<{ success: boolean; msg?: string }> => {
    const result = await callBlockAction(userId);
    
    if (result.success) {
      // Mark as acted on and advance to next profile after blocking
      markActedOn(userId);
      advanceToNext();
    }
    
    return result;
  }, [advanceToNext, markActedOn]);
  
  // Handle Report action
  const handleReport = useCallback(async (userId: string, reason: string): Promise<{ success: boolean; msg?: string }> => {
    const result = await callReportAction(userId, reason);
    
    if (result.success) {
      // Mark as acted on and advance to next profile after reporting
      markActedOn(userId);
      advanceToNext();
    }
    
    return result;
  }, [advanceToNext, markActedOn]);
  
  // Handle Undo action
  const handleUndo = useCallback(async (): Promise<{ success: boolean; targetUserId?: string; error?: string }> => {
    const result = await performUndo();
    
    if (result.success && result.targetUserId) {
      // Go back to the previous profile in the queue
      goToPrevious();
    }
    
    return result;
  }, [performUndo, goToPrevious]);
  
  // Handle Back/Close
  // If there's a pending advance (from match modal), complete it
  // Otherwise navigate to explore page
  const handleClose = useCallback(() => {
    if (pendingAdvanceUserId) {
      // This is from the match modal closing - advance to next profile
      markActedOn(pendingAdvanceUserId);
      advanceToNext();
      setPendingAdvanceUserId(null);
    } else {
      // This is from the X button - navigate away
      router.push("/explore");
    }
  }, [pendingAdvanceUserId, markActedOn, advanceToNext, router]);
  
  // Don't render if still loading or no profile
  if (isLoading || !currentProfile) {
    return null;
  }
  
  return (
    <SearchProfileView
      profile={currentProfile}
      gallery={gallery}
      currentUserImage={currentUser?.profileImage}
      currentUserName={currentUser?.displayName}
      onLike={handleLike}
      onPass={handlePass}
      onSuperLike={handleSuperLike}
      onReport={handleReport}
      onBlock={handleBlock}
      onClose={handleClose}
      undoState={{
        canUndo,
        secondsRemaining,
        targetUserName: lastAction?.targetUserName,
      }}
      onUndo={handleUndo}
      parentHandlesNavigation={true}
    />
  );
}

export default DiscoverProfileView;
