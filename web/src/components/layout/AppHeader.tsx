"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { SlidersHorizontal } from "lucide-react";
import { NotificationBell, MessagesIndicator } from "@/components/notifications";
import { PointsBadge } from "@/components/rewards";
import { Avatar } from "@/components/ui";
import { useCurrentUser } from "@/components/providers/AppProviders";
import { GlassContainer } from "@/components/glass";
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
  const currentUser = useCurrentUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Handle keyboard navigation in dropdown
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isDropdownOpen) {
      if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
        event.preventDefault();
        setIsDropdownOpen(true);
      }
      return;
    }

    const menuItems = dropdownRef.current?.querySelectorAll<HTMLElement>(
      'a[role="menuitem"], button[role="menuitem"]'
    );
    
    if (!menuItems?.length) return;
    
    const currentIndex = Array.from(menuItems).findIndex(
      (item) => item === document.activeElement
    );

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        setIsDropdownOpen(false);
        buttonRef.current?.focus();
        break;
      case "ArrowDown":
        event.preventDefault();
        if (currentIndex < menuItems.length - 1) {
          menuItems[currentIndex + 1].focus();
        } else {
          menuItems[0].focus();
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (currentIndex > 0) {
          menuItems[currentIndex - 1].focus();
        } else {
          menuItems[menuItems.length - 1].focus();
        }
        break;
      case "Tab":
        setIsDropdownOpen(false);
        break;
      case "Home":
        event.preventDefault();
        menuItems[0].focus();
        break;
      case "End":
        event.preventDefault();
        menuItems[menuItems.length - 1].focus();
        break;
    }
  };

  // Focus first menu item when dropdown opens
  useEffect(() => {
    if (isDropdownOpen) {
      const firstItem = dropdownRef.current?.querySelector<HTMLElement>(
        'a[role="menuitem"], button[role="menuitem"]'
      );
      firstItem?.focus();
    }
  }, [isDropdownOpen]);
  
  if (isDiscoverPage || isFullScreenProfile || isChatPage) {
    return null;
  }

  return (
    <>
    <header className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-primary focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
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

            {/* Profile Avatar Dropdown */}
            <div className="relative" ref={dropdownRef} onKeyDown={handleKeyDown}>
              <button
                ref={buttonRef}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-expanded={isDropdownOpen}
                aria-haspopup="menu"
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

              {/* Dropdown Menu - Glass Effect */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <GlassContainer
                    variant="menu"
                    className="w-52 py-1.5 shadow-xl shadow-black/10"
                  >
                    <div
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu"
                    >
                      {/* User info header - shows name on mobile */}
                      <div className="sm:hidden px-4 py-2 border-b border-white/20 dark:border-white/10 mb-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{user.displayName}</p>
                      </div>

                      <Link
                        href="/profile"
                        role="menuitem"
                        tabIndex={-1}
                        onClick={() => setIsDropdownOpen(false)}
                        className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-white/10 focus:bg-white/40 dark:focus:bg-white/10 focus:outline-none transition-colors"
                      >
                        My Profile
                      </Link>
                      <Link
                        href="/profile/edit"
                        role="menuitem"
                        tabIndex={-1}
                        onClick={() => setIsDropdownOpen(false)}
                        className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-white/10 focus:bg-white/40 dark:focus:bg-white/10 focus:outline-none transition-colors"
                      >
                        Edit Profile
                      </Link>
                      <Link
                        href="/favorites"
                        role="menuitem"
                        tabIndex={-1}
                        onClick={() => setIsDropdownOpen(false)}
                        className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-white/10 focus:bg-white/40 dark:focus:bg-white/10 focus:outline-none transition-colors"
                      >
                        Saved Profiles
                      </Link>
                      <Link
                        href="/settings"
                        role="menuitem"
                        tabIndex={-1}
                        onClick={() => setIsDropdownOpen(false)}
                        className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-white/10 focus:bg-white/40 dark:focus:bg-white/10 focus:outline-none transition-colors"
                      >
                        Settings
                      </Link>
                      <hr className="my-1.5 border-white/20 dark:border-white/10" aria-hidden="true" />
                      <form action={signOutAction}>
                        <button
                          type="submit"
                          role="menuitem"
                          tabIndex={-1}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/30 focus:bg-red-50/50 dark:focus:bg-red-900/30 focus:outline-none transition-colors"
                        >
                          Sign Out
                        </button>
                      </form>
                    </div>
                  </GlassContainer>
                </div>
              )}
            </div>
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
    </>
  );
}
