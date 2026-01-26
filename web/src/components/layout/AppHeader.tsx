"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { NotificationBell } from "@/components/notifications";
import { Avatar } from "@/components/ui";

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
 * Conditionally displays the header based on current route:
 * - Hidden on /home (matches mobile app behavior - home has its own hero)
 * - Visible on all other authenticated pages
 */
export function AppHeader({ user, signOutAction }: AppHeaderProps) {
  const pathname = usePathname();
  
  // Hide header on home page - it has its own hero with avatar/notifications
  // This matches the mobile app behavior
  const isHomePage = pathname === "/home" || pathname === "/";
  
  if (isHomePage) {
    return null;
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/home" className="-m-1.5 p-1.5">
            <Image
              src="/images/logo.png"
              alt="RealSingles"
              width={140}
              height={45}
              className="h-9 w-auto"
              priority
            />
          </Link>

          {/* Navigation - Hidden on mobile (bottom nav handles it) */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/home" className="text-gray-600 hover:text-gray-900 font-medium">
              Home
            </Link>
            <Link href="/discover" className="text-gray-600 hover:text-gray-900 font-medium">
              Discover
            </Link>
            <Link href="/matches" className="text-gray-600 hover:text-gray-900 font-medium">
              Matches
            </Link>
            <Link href="/favorites" className="text-gray-600 hover:text-gray-900 font-medium">
              Favorites
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <NotificationBell />

            {/* Profile Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-2 hover:bg-gray-100 rounded-full p-1 pr-3">
                <Avatar
                  src={user.profileImage}
                  name={user.displayName || "User"}
                  size="sm"
                />
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user.displayName}
                </span>
              </button>

              {/* Dropdown */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-t-lg"
                >
                  My Profile
                </Link>
                <Link
                  href="/profile/edit"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Edit Profile
                </Link>
                <Link
                  href="/settings"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Settings
                </Link>
                <hr className="my-1" />
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-b-lg"
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
