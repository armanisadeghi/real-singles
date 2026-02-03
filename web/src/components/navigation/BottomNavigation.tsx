"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Compass as CompassIcon, Heart, MessageCircle, User } from "lucide-react";
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
        "flex flex-col items-center justify-center flex-1 py-2 min-h-[56px] transition-colors",
        "active:bg-gray-100 touch-manipulation",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500",
        isActive ? "text-pink-600" : "text-gray-500"
      )}
    >
      <Icon
        className={cn(
          "w-6 h-6 mb-1 transition-transform",
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

/**
 * Mobile Bottom Navigation for Web
 *
 * Follows iOS/Android native patterns:
 * - 5 tabs: Discover, Explore, Likes, Messages, Profile
 * - Always visible labels
 * - Active state with filled icons
 * - Safe area padding for notched devices
 * - 56px height matching iOS tab bar
 */
export function BottomNavigation() {
  const pathname = usePathname();

  const navItems = [
    { href: "/discover", icon: Sparkles, label: "Discover" },
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
  const isFullScreenView = pathname === "/discover" ||
                           pathname.startsWith("/search/profile/") || 
                           (pathname.startsWith("/profile/") && pathname.includes("/focus"));
  
  if (isFullScreenView) {
    return null;
  }

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-50",
        "bg-white/95 backdrop-blur-lg",
        "border-t border-gray-200/80",
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      <div className="flex items-stretch" role="list">
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
    </nav>
  );
}
