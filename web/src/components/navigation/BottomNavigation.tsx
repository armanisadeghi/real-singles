"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Heart, User } from "lucide-react";
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
      className={cn(
        "flex flex-col items-center justify-center flex-1 py-2 min-h-[56px] transition-colors",
        "active:bg-gray-100 touch-manipulation",
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
 * - 4 tabs matching native app (Home, Chats, Favorites, Profile)
 * - Always visible labels
 * - Active state with filled icons
 * - Safe area padding for notched devices
 * - 56px height matching iOS tab bar
 */
export function BottomNavigation() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/chats", icon: MessageCircle, label: "Chats" },
    { href: "/favorites", icon: Heart, label: "Favorites" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  // Determine active tab based on pathname
  const getIsActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname === "/discover";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-50",
        "bg-white/95 backdrop-blur-lg",
        "border-t border-gray-200/80",
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      <div className="flex items-stretch">
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
