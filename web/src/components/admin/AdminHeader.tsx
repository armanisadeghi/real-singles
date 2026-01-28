"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AdminUserDropdown } from "./AdminUserDropdown";
import { Menu, X } from "lucide-react";

interface AdminHeaderProps {
  user: {
    email: string;
    role: string;
  };
  onSignOut: () => void;
}

const navItems = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/email", label: "Email" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/speed-dating", label: "Speed Dating" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/data-integrity", label: "Data Integrity" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminHeader({ user, onSignOut }: AdminHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Logo & Brand */}
          <Link
            href="/admin"
            className="flex items-center gap-2 shrink-0"
          >
            <Image
              src="/images/logo.png"
              alt="RealSingles"
              width={100}
              height={32}
              className="h-7 w-auto"
            />
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              Admin
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {navItems.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                    ${
                      active
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }
                  `}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side: User menu + Mobile hamburger */}
          <div className="flex items-center gap-2 shrink-0">
            <AdminUserDropdown
              email={user.email}
              role={user.role}
              onSignOut={onSignOut}
            />

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <nav className="max-w-7xl mx-auto px-4 py-2 flex flex-col">
            {navItems.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                    ${
                      active
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }
                  `}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
