"use client";

import { useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { SlidersHorizontal, User, Edit, Heart, Settings, LogOut, Info } from "lucide-react";
import { NotificationBell, MessagesIndicator } from "@/components/notifications";
import { PointsBadge } from "@/components/rewards";
import { Avatar } from "@/components/ui";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/ActionMenu";
import { useCurrentUser } from "@/components/providers/AppProviders";
import { FilterPanel, FilterValues } from "@/components/search/FilterPanel";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  user: {
    displayName: string;
    profileImage: string;
  };
  signOutAction: () => void;
}

/**
 * App Header Component
 * 
 * Mobile-first, clean header for the authenticated app.
 * 
 * Features:
 * - Messages indicator with unread count
 * - Notifications bell with categorized notifications
 * - Profile avatar dropdown (no chevron - cleaner design)
 * 
 * Hidden on:
 * - /discover, /explore, / (these have their own hero)
 * - Full-screen profile views
 * 
 * Accessibility:
 * - Skip to main content link
 * - Keyboard-accessible dropdown with proper ARIA
 */
export function AppHeader({ user, signOutAction }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useCurrentUser();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [menuAnchorPosition, setMenuAnchorPosition] = useState<{ top: number; right: number } | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filtersApplied, setFiltersApplied] = useState(false);
  
  // Hide header on discover page - it has its own hero with avatar/notifications
  const isDiscoverPage = pathname === "/discover" || pathname === "/";
  
  // Hide header on full-screen profile views (search, focus)
  const isFullScreenProfile = pathname.startsWith("/search/profile/") || 
                               pathname.startsWith("/profile/") && pathname.includes("/focus");
  
  // Hide header on individual chat pages (immersive messaging experience)
  const isChatPage = pathname.startsWith("/chats/") && pathname !== "/chats";

  // Handle filter application
  const handleApplyFilters = useCallback(async (filters: FilterValues) => {
    try {
      const saveRes = await fetch("/api/filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          min_age: filters.minAge,
          max_age: filters.maxAge,
          min_height: filters.minHeight,
          max_height: filters.maxHeight,
          max_distance: filters.maxDistance,
          body_types: filters.bodyType,
          ethnicities: filters.ethnicity,
          religions: filters.religion,
          education_levels: filters.education,
          smoking: filters.smoking,
          drinking: filters.drinking,
          marijuana: filters.marijuana,
          has_kids: filters.hasKids,
          wants_kids: filters.wantsKids,
          zodiac_signs: filters.zodiac,
          marital_status: filters.maritalStatus,
          exercise: filters.exercise,
          political_views: filters.politicalViews,
        }),
      });

      if (saveRes.ok) {
        setFiltersApplied(true);
        // Optionally trigger a page refresh or event to reload profiles
        window.dispatchEvent(new CustomEvent("filters-updated"));
      }
    } catch (error) {
      console.error("Error applying filters:", error);
    }
  }, []);

  // Profile menu items
  const profileMenuItems: ActionMenuItem[] = [
    {
      id: "profile",
      label: "My Profile",
      icon: User,
    },
    {
      id: "edit-profile",
      label: "Edit Profile",
      icon: Edit,
    },
    {
      id: "favorites",
      label: "Saved Profiles",
      icon: Heart,
    },
    {
      id: "app-info",
      label: "App Info",
      icon: Info,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
    },
    {
      id: "sign-out",
      label: "Sign Out",
      icon: LogOut,
      variant: "destructive",
    },
  ];

  // Handle profile menu selection
  const handleProfileMenuSelect = useCallback((itemId: string) => {
    setShowProfileMenu(false);
    
    switch (itemId) {
      case "profile":
        router.push("/profile");
        break;
      case "edit-profile":
        router.push("/profile/edit");
        break;
      case "favorites":
        router.push("/favorites");
        break;
      case "app-info":
        router.push("/app-info");
        break;
      case "settings":
        router.push("/settings");
        break;
      case "sign-out":
        signOutAction();
        break;
    }
  }, [router, signOutAction]);
  
  if (isDiscoverPage || isFullScreenProfile || isChatPage) {
    return null;
  }

  return (
    <>
    <header className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm shadow-sm sticky top-0" style={{ zIndex: 'var(--z-sticky)' }}>
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-brand-primary focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
        style={{ zIndex: 'var(--z-skip-link)' }}
      >
        Skip to main content
      </a>
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Left side: Logo, Filters, Points */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Logo - slightly smaller on mobile, theme-aware */}
            <Link 
              href="/discover" 
              className="-m-1 p-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
            >
              {/* Light mode logo (black text on transparent) */}
              <Image
                src="/images/logo-transparent.png"
                alt="RealSingles"
                width={120}
                height={100}
                className="h-7 sm:h-8 w-auto dark:hidden"
                priority
              />
              {/* Dark mode logo (white text on transparent) */}
              <Image
                src="/images/logo-dark-transparent.png"
                alt="RealSingles"
                width={120}
                height={100}
                className="h-7 sm:h-8 w-auto hidden dark:block"
                priority
              />
            </Link>

            {/* Filters Button */}
            <button
              onClick={() => setIsFilterOpen(true)}
              aria-label="Search filters"
              className={cn(
                "p-2 rounded-full transition-colors",
                "hover:bg-gray-100 dark:hover:bg-neutral-800 active:bg-gray-200 dark:active:bg-neutral-700",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
                filtersApplied && "bg-pink-50 dark:bg-pink-900/20"
              )}
            >
              <SlidersHorizontal 
                className={cn(
                  "w-5 h-5",
                  filtersApplied 
                    ? "text-pink-500 dark:text-pink-400" 
                    : "text-gray-600 dark:text-gray-400"
                )} 
              />
            </button>

            {/* Points Badge */}
            {currentUser && (
              <PointsBadge
                points={currentUser.points}
                size="sm"
                href="/rewards"
                showLabel={false}
              />
            )}
          </div>

          {/* Right side: Messages, Notifications, Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Messages Indicator */}
            <MessagesIndicator />

            {/* Notifications */}
            <NotificationBell />

            {/* Profile Avatar Button */}
            <button
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setMenuAnchorPosition({
                  top: rect.bottom + 8,
                  right: window.innerWidth - rect.right,
                });
                setShowProfileMenu(true);
              }}
              aria-label={`Profile menu for ${user.displayName}`}
              className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-neutral-800 active:bg-gray-200 dark:active:bg-neutral-700 rounded-full p-1 sm:pr-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
            >
              <Avatar
                src={user.profileImage}
                name={user.displayName || "User"}
                size="sm"
              />
              {/* Display name - hidden on mobile for cleaner look */}
              <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                {user.displayName}
              </span>
            </button>
          </div>
        </div>
      </div>

    </header>

      {/* Filter Panel - rendered outside header to avoid stacking context issues */}
      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilters}
      />

      {/* Profile Menu */}
      <ActionMenu
        isOpen={showProfileMenu}
        onClose={() => setShowProfileMenu(false)}
        onSelect={handleProfileMenuSelect}
        items={profileMenuItems}
        title={user.displayName}
        anchorPosition={menuAnchorPosition}
      />
    </>
  );
}
