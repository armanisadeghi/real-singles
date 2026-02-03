"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  Heart,
  Calendar,
  Star,
  Gift,
  UserPlus,
  Shield,
  X,
  Sparkles,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  data?: Record<string, unknown>;
}

// Categorized notification type for grouped display
type NotificationCategory = "matches" | "events" | "activity";

const notificationIcons: Record<string, { icon: typeof Bell; color: string }> = {
  match: { icon: Heart, color: "text-pink-500 bg-pink-100" },
  like: { icon: Heart, color: "text-pink-500 bg-pink-100" },
  event: { icon: Calendar, color: "text-purple-500 bg-purple-100" },
  event_reminder: { icon: Calendar, color: "text-purple-500 bg-purple-100" },
  review: { icon: Star, color: "text-yellow-500 bg-yellow-100" },
  reward: { icon: Gift, color: "text-green-500 bg-green-100" },
  referral: { icon: UserPlus, color: "text-indigo-500 bg-indigo-100" },
  system: { icon: Shield, color: "text-gray-500 bg-gray-100" },
  admin: { icon: Sparkles, color: "text-amber-500 bg-amber-100" },
  default: { icon: Bell, color: "text-gray-500 bg-gray-100" },
};

// Helper to categorize notifications
function categorizeNotification(type: string): NotificationCategory {
  if (["match", "like", "super_like"].includes(type)) return "matches";
  if (["event", "event_reminder", "rsvp"].includes(type)) return "events";
  return "activity";
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * NotificationBell Component
 * 
 * Displays notifications in a clean dropdown with categories:
 * - App/Admin notifications (existing API)
 * - New matches (TODO: API endpoint needed)
 * - Event reminders (TODO: API endpoint needed)
 * 
 * Mobile-first design with proper touch targets and overflow handling.
 */
export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  /**
   * Fetch notifications from API
   * 
   * Currently fetches from /api/notifications which handles system notifications.
   * 
   * TODO: Additional endpoints needed for full functionality:
   * - GET /api/notifications/matches - New match notifications
   * - GET /api/notifications/events - Event reminders for RSVPd events
   * 
   * These should be lazy-loaded in the background and never block the UI.
   */
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=15");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and polling (lazy loading - doesn't block render)
  useEffect(() => {
    // Delay initial fetch slightly to not block critical path
    const timeout = setTimeout(fetchNotifications, 100);
    
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  // Refetch on visibility/focus change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchNotifications();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [fetchNotifications]);

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: true }),
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const config = notificationIcons[type] || notificationIcons.default;
    return config;
  };

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================

  /**
   * Placeholder for coming soon notification categories
   * TODO: Remove when APIs are implemented
   */
  const ComingSoonSection = ({ 
    title, 
    description, 
    icon: Icon 
  }: { 
    title: string; 
    description: string; 
    icon: typeof Bell;
  }) => (
    <div className="px-4 py-3 bg-gray-50/50">
      <div className="flex items-center gap-2 text-gray-400">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{title}</span>
      </div>
      <p className="text-xs text-gray-400 mt-1 pl-6">{description}</p>
    </div>
  );

  // Group notifications by category
  const groupedNotifications = notifications.reduce((acc, notification) => {
    const category = categorizeNotification(notification.type);
    if (!acc[category]) acc[category] = [];
    acc[category].push(notification);
    return acc;
  }, {} as Record<NotificationCategory, Notification[]>);

  const hasMatchNotifications = (groupedNotifications.matches?.length ?? 0) > 0;
  const hasEventNotifications = (groupedNotifications.events?.length ?? 0) > 0;

  return (
    <div className="relative" ref={dropdownRef} onKeyDown={handleKeyDown}>
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={unreadCount > 0 ? `Notifications - ${unreadCount} unread` : "Notifications"}
        className={cn(
          "relative p-2 rounded-full transition-colors",
          "hover:bg-gray-100 active:bg-gray-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
          isOpen && "bg-gray-100"
        )}
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span 
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-pink-500 text-white text-[10px] font-bold rounded-full"
            aria-hidden="true"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications"
          className={cn(
            "absolute mt-2 bg-white rounded-xl shadow-xl border overflow-hidden z-50",
            // Mobile: use fixed positioning for full-width appearance
            "fixed left-2 right-2 sm:left-auto sm:right-0 sm:absolute",
            // Width: auto on mobile (uses left/right), fixed on desktop
            "sm:w-80",
            "animate-in fade-in slide-in-from-top-2 duration-200"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0">
            <h2 className="font-semibold text-gray-900">Notifications</h2>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-pink-600 hover:text-pink-700 font-medium"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full -mr-1"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[min(60vh,400px)] overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">We'll notify you when something happens</p>
              </div>
            ) : (
              <div>
                {/* Match notifications - show coming soon if no match notifications from API */}
                {!hasMatchNotifications && (
                  <ComingSoonSection 
                    title="New Matches" 
                    description="Coming soon - you'll see new matches here"
                    icon={Heart}
                  />
                )}

                {/* Event reminders - show coming soon if no event notifications */}
                {!hasEventNotifications && (
                  <ComingSoonSection 
                    title="Event Reminders" 
                    description="Coming soon - reminders for RSVPd events"
                    icon={Calendar}
                  />
                )}

                {/* All notifications (currently mostly system/activity) */}
                {notifications.map((notification) => {
                  const iconConfig = getNotificationIcon(notification.type);
                  const Icon = iconConfig.icon;

                  return (
                    <button
                      key={notification.id}
                      onClick={() => {
                        if (!notification.is_read) {
                          markAsRead(notification.id);
                        }
                        setIsOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-start gap-3 px-4 py-3 text-left",
                        "hover:bg-gray-50 active:bg-gray-100 transition-colors",
                        "focus:outline-none focus:bg-gray-50",
                        !notification.is_read && "bg-pink-50/30"
                      )}
                    >
                      <div
                        className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                          iconConfig.color
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm leading-snug",
                            !notification.is_read
                              ? "font-semibold text-gray-900"
                              : "font-medium text-gray-700"
                          )}
                        >
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-500 line-clamp-2 leading-snug mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatRelativeTime(notification.created_at)}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-pink-500 rounded-full shrink-0 mt-2" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t p-2 bg-white">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="block w-full py-2 text-center text-sm font-medium text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
