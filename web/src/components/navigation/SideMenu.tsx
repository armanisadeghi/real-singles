"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  User,
  Bell,
  Mail,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    displayName: string;
    profileImage: string | null;
  };
  onSignOut: () => void;
}

const menuItems = [
  {
    title: "Profile",
    icon: User,
    href: "/profile",
  },
  {
    title: "Notifications",
    icon: Bell,
    href: "/notifications",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
  },
  {
    title: "Contact Us",
    icon: Mail,
    href: "/contact",
  },
  {
    title: "Refer a Friend",
    icon: Users,
    href: "/refer",
  },
];

/**
 * Side Menu Component
 * 
 * Slide-out menu for mobile that matches the mobile app's SidebarMenu.
 * Provides quick access to Profile, Notifications, Settings, Contact, and Referrals.
 */
export function SideMenu({ isOpen, onClose, user, onSignOut }: SideMenuProps) {
  const pathname = usePathname();
  
  // Store onClose in a ref so effects don't re-run when it changes
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close menu when route actually changes (not just on re-renders)
  const previousPathname = useRef(pathname);
  useEffect(() => {
    // Only close if pathname actually changed (user navigated)
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      onCloseRef.current();
    }
  }, [pathname]);

  if (!isOpen) return null;

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-72 bg-gradient-to-b from-amber-700 to-amber-800 z-50 shadow-2xl",
          "transform transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-4 flex justify-end">
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-4 rounded-lg text-white transition-colors",
                  "border-b border-white/20",
                  active
                    ? "bg-white/20"
                    : "hover:bg-white/10"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer - User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <Avatar
              src={user.profileImage}
              name={user.displayName}
              size="lg"
              className="border-2 border-white"
            />
            <span className="text-white font-semibold text-lg">
              {user.displayName}
            </span>
          </div>
          
          <button
            onClick={onSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}
