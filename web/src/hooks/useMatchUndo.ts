import { useState, useCallback, useEffect } from "react";

const UNDO_STORAGE_KEY = "rs_last_match_action";
const UNDO_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export interface LastMatchAction {
  targetUserId: string;
  targetUserName: string;
  action: "like" | "pass" | "super_like";
  timestamp: number;
}

interface UseMatchUndoReturn {
  /** The last action that can be undone, or null if none/expired */
  lastAction: LastMatchAction | null;
  /** Whether there's an action available to undo */
  canUndo: boolean;
  /** Seconds remaining before undo expires */
  secondsRemaining: number;
  /** Store an action as undoable */
  recordAction: (targetUserId: string, targetUserName: string, action: "like" | "pass" | "super_like") => void;
  /** Clear the stored action (after successful undo) */
  clearAction: () => void;
  /** Perform the undo API call and return the result */
  performUndo: () => Promise<{ success: boolean; targetUserId?: string; error?: string }>;
}

/**
 * Hook to manage undo functionality for match actions
 * 
 * Stores the last action in localStorage with a 5-minute expiry.
 * Provides methods to record, clear, and perform undo operations.
 */
export function useMatchUndo(): UseMatchUndoReturn {
  const [lastAction, setLastAction] = useState<LastMatchAction | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(UNDO_STORAGE_KEY);
      if (stored) {
        const parsed: LastMatchAction = JSON.parse(stored);
        const elapsed = Date.now() - parsed.timestamp;
        
        if (elapsed < UNDO_EXPIRY_MS) {
          setLastAction(parsed);
          setSecondsRemaining(Math.floor((UNDO_EXPIRY_MS - elapsed) / 1000));
        } else {
          // Expired, clear it
          localStorage.removeItem(UNDO_STORAGE_KEY);
        }
      }
    } catch {
      // Invalid stored data, clear it
      localStorage.removeItem(UNDO_STORAGE_KEY);
    }
  }, []);

  // Update countdown timer
  useEffect(() => {
    if (!lastAction) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastAction.timestamp;
      const remaining = Math.floor((UNDO_EXPIRY_MS - elapsed) / 1000);

      if (remaining <= 0) {
        // Expired
        setLastAction(null);
        setSecondsRemaining(0);
        localStorage.removeItem(UNDO_STORAGE_KEY);
        clearInterval(interval);
      } else {
        setSecondsRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastAction]);

  const recordAction = useCallback((
    targetUserId: string,
    targetUserName: string,
    action: "like" | "pass" | "super_like"
  ) => {
    const newAction: LastMatchAction = {
      targetUserId,
      targetUserName,
      action,
      timestamp: Date.now(),
    };
    
    setLastAction(newAction);
    setSecondsRemaining(Math.floor(UNDO_EXPIRY_MS / 1000));
    
    try {
      localStorage.setItem(UNDO_STORAGE_KEY, JSON.stringify(newAction));
    } catch {
      // localStorage might be full or disabled
      console.warn("Failed to save undo action to localStorage");
    }
  }, []);

  const clearAction = useCallback(() => {
    setLastAction(null);
    setSecondsRemaining(0);
    localStorage.removeItem(UNDO_STORAGE_KEY);
  }, []);

  const performUndo = useCallback(async (): Promise<{ success: boolean; targetUserId?: string; error?: string }> => {
    if (!lastAction) {
      return { success: false, error: "No action to undo" };
    }

    try {
      const response = await fetch("/api/matches/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: lastAction.targetUserId }),
      });

      const data = await response.json();

      if (data.success) {
        const targetUserId = lastAction.targetUserId;
        clearAction();
        return { success: true, targetUserId };
      } else {
        // If server says it's expired or not found, clear local state too
        if (response.status === 404 || data.error?.includes("too old")) {
          clearAction();
        }
        return { success: false, error: data.error || "Failed to undo" };
      }
    } catch (error) {
      console.error("Undo error:", error);
      return { success: false, error: "Network error" };
    }
  }, [lastAction, clearAction]);

  return {
    lastAction,
    canUndo: lastAction !== null && secondsRemaining > 0,
    secondsRemaining,
    recordAction,
    clearAction,
    performUndo,
  };
}
