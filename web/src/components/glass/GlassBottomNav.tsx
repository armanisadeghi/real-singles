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
 * - 5 tabs: Discover, Explore, New Matches, Messages, Profile
 * - Active state with filled icons
 * - Safe area padding for notched devices
 * - Hidden on full-screen views
 * - Responsive: full width on mobile, centered max-width (md:max-w-md) on desktop
 *
 * Note: Uses CSS-based glass effect instead of LiquidGlass
 * because SVG filters break position: fixed.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass as CompassIcon,
  Heart,
  Gem,
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
  // - /search/profile/* (full-screen profile from search)
  // - /profile/*/focus (profile focus view)
  // - /chats/[id] (individual chat - immersive messaging)
  // Note: /discover now shows bottom nav like other routes
  const isFullScreenView =
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
        "fixed",
        // Floating position - detached from edges like Tinder
        "bottom-3 left-3 right-3",
        // Desktop: center with max-width so it doesn't stretch across wide screens
        "md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-full md:max-w-md",
        // Safe area padding
        "pb-[env(safe-area-inset-bottom)]"
      )}
      style={{ zIndex: 'var(--z-fixed)' }}
    >
      {/* CSS-based glass effect (compatible with position: fixed) */}
      {/* 
        iOS 26 Liquid Glass insight: The blur effect needs colorful content behind it.
        When over white/plain backgrounds, we add:
        1. Subtle warm gradient tint (from-rose-50/60 via-white/70 to-amber-50/60)
        2. Stronger shadow for visual separation
        3. Subtle inner highlight for depth
        This ensures the glass looks good regardless of background content.
      */}
      <div
        className={cn(
          "rounded-3xl overflow-hidden relative",
          // Backdrop filter — edges blur/saturate more, center stays clearer
          "backdrop-blur-[10px] backdrop-saturate-200",
          // Border - slightly tinted for warmth
          "border border-rose-200/30 dark:border-white/10",
          // Stronger shadow for separation from white backgrounds
          "shadow-[0_-2px_20px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.1)]",
          "dark:shadow-[0_-2px_20px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.4)]",
          // Inner shadow for depth (simulates glass edge refraction)
          "before:absolute before:inset-0 before:rounded-3xl",
          "before:shadow-[inset_0_1px_2px_rgba(255,255,255,0.7)]",
          "dark:before:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]",
          "before:pointer-events-none"
        )}
        style={{
          // Radial gradient: heavy tint at edges, nearly clear in the center
          // This mimics Apple's Liquid Glass — the perimeter does the work,
          // the center is almost fully transparent so content reads through.
          background:
            "radial-gradient(ellipse 90% 120% at 50% 50%, rgba(255,255,255,0.08) 0%, rgba(255,240,235,0.28) 55%, rgba(255,220,210,0.52) 80%, rgba(255,200,190,0.60) 100%)",
        }}
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
