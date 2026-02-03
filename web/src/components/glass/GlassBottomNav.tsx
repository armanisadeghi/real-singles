"use client";

/**
 * GlassBottomNav
 *
 * iOS 26-inspired floating bottom navigation dock.
 * Uses CSS glassmorphism (compatible with position: fixed).
 *
 * Features:
 * - Floating pill shape (detached from screen edges)
 * - Frosted glass effect with backdrop-filter
 * - 5 tabs: Discover, Explore, Likes, Messages, Profile
 * - Active state with filled icons
 * - Safe area padding for notched devices
 * - Hidden on full-screen views
 *
 * Note: Uses CSS-based glass effect instead of LiquidGlass
 * because SVG filters break position: fixed.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Diamond,
  Compass as CompassIcon,
  Heart,Gem,
  MessageCircle,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}

function NavItem({ href, icon: Icon, label, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex flex-col items-center justify-center flex-1 py-2 min-h-[52px] transition-colors",
        "active:opacity-70 touch-manipulation rounded-xl",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500",
        isActive ? "text-pink-600 dark:text-pink-400" : "text-gray-600 dark:text-gray-400"
      )}
    >
      <Icon
        className={cn(
          "w-[22px] h-[22px] mb-0.5 transition-transform",
          isActive && "scale-110"
        )}
        strokeWidth={isActive ? 2.5 : 2}
        fill={isActive ? "currentColor" : "none"}
        aria-hidden="true"
      />
      <span
        className={cn(
          "text-[10px] font-medium leading-tight",
          isActive && "font-semibold"
        )}
      >
        {label}
      </span>
    </Link>
  );
}

export function GlassBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/discover", icon: Gem, label: "Discover" },
    { href: "/explore", icon: CompassIcon, label: "Explore" },
    { href: "/likes", icon: Heart, label: "Likes" },
    { href: "/messages", icon: MessageCircle, label: "Messages" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  // Determine active tab based on pathname
  const getIsActive = (href: string) => {
    if (href === "/discover" || href === "/explore") {
      return pathname === href;
    }
    // Messages tab should be active on both /messages and /chats routes
    if (href === "/messages") {
      return pathname.startsWith("/messages") || pathname.startsWith("/chats");
    }
    return pathname.startsWith(href);
  };

  // Hide bottom nav on full-screen views:
  // - /discover (immersive single-profile discovery)
  // - /search/profile/* (full-screen profile from search)
  // - /profile/*/focus (profile focus view)
  // - /chats/[id] (individual chat - immersive messaging)
  const isFullScreenView =
    pathname === "/discover" ||
    pathname.startsWith("/search/profile/") ||
    (pathname.startsWith("/chats/") && pathname !== "/chats") ||
    (pathname.startsWith("/profile/") && pathname.includes("/focus"));

  if (isFullScreenView) {
    return null;
  }

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        "md:hidden fixed z-50",
        // Floating position - detached from edges like Tinder
        "bottom-3 left-3 right-3",
        // Safe area padding
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      {/* CSS-based glass effect (compatible with position: fixed) */}
      <div
        className={cn(
          "rounded-3xl overflow-hidden",
          "bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl backdrop-saturate-150",
          "border border-white/30 dark:border-white/10",
          "shadow-lg shadow-black/10 dark:shadow-black/30"
        )}
      >
        <div className="flex items-stretch px-1" role="list">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={getIsActive(item.href)}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}
