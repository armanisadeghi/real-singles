"use client";

import { useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { SlidersHorizontal, User, Edit, Star, Settings, LogOut, Info } from "lucide-react";
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
      label: "Favorites",
      icon: Star,
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
    {/*
      LiquidGlass only works correctly on position:fixed — sticky/absolute
      both break the SVG filter coordinate space. So we use fixed + a spacer
      div that reserves the same height in the document flow.
    */}

    {/* Spacer — holds the header's space in document flow */}
    <div className="h-14 sm:h-16" aria-hidden="true" />

    <header
      className="fixed top-0 left-0 right-0 overflow-hidden"
      style={{ zIndex: 'var(--z-sticky)' }}
    >
      {/*
        Glass layer — extends 80px BELOW the header so the mask fade
        has real physical space to work across, not just 56px.
        overflow-hidden on the header clips it visually.
      */}
      <div
        className="absolute left-0 right-0 top-0 pointer-events-none backdrop-blur-[10px] backdrop-saturate-200"
        style={{
          height: "calc(100% + 80px)",
          background: "radial-gradient(ellipse 120% 160% at 50% 0%, rgba(255,200,190,0.60) 0%, rgba(255,220,210,0.52) 30%, rgba(255,240,235,0.28) 60%, rgba(255,255,255,0.04) 100%)",
          // Mask fades from fully opaque at top to transparent at the very bottom of the extended area
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 40%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.3) 80%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, black 0%, black 40%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.3) 80%, transparent 100%)",
        }}
      />
      {/* Inner highlight — top edge only */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_1px_2px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" />

      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-brand-primary focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
        style={{ zIndex: 'var(--z-skip-link)' }}
      >
        Skip to main content
      </a>
      
      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
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
                "hover:bg-white/20 active:bg-white/30",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
                filtersApplied && "bg-pink-500/20"
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
              className="flex items-center gap-2 hover:bg-white/20 active:bg-white/30 rounded-full p-1 sm:pr-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
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
