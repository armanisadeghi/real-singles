"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, X, Sparkles, Compass, ChevronDown, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// Public navigation - matches WordPress site structure
const navigation = [
  { name: "About Us", href: "/about" },
  { name: "Membership", href: "/membership" },
  { name: "Community", href: "/community" },
  { name: "Matchmaking", href: "/matchmaking" },
  { name: "Events", href: "/our-events" },
];

const appDownloadLinks = {
  ios: "https://apps.apple.com/app/real-singles/id6473915498",
  android: "https://play.google.com/store/apps/details?id=com.realsingles.app",
};

function DownloadDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-brand-primary transition-colors"
      >
        Download the App
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
          <Link
            href={appDownloadLinks.ios}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            <div>
              <p className="text-xs text-gray-500">Download on the</p>
              <p className="text-sm font-semibold text-foreground">App Store</p>
            </div>
          </Link>
          <Link
            href={appDownloadLinks.android}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
            </svg>
            <div>
              <p className="text-xs text-gray-500">Get it on</p>
              <p className="text-sm font-semibold text-foreground">Google Play</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    
    // Get initial session - only used for CTA button display
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-border" style={{ zIndex: 'var(--z-sticky)' }}>
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Global">
        <div className="flex h-[var(--header-height)] items-center justify-between">
          {/* Logo */}
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
              <Image
                src="/images/logo.png"
                alt="Real Singles"
                width={140}
                height={45}
                className="h-10 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex lg:gap-x-6 items-center">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-foreground hover:text-brand-primary transition-colors"
              >
                {item.name}
              </Link>
            ))}
            
            {/* Download App Dropdown */}
            <DownloadDropdown />
          </div>

          {/* Desktop CTA buttons */}
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-3 items-center">
            {loading ? (
              <div className="w-20 h-8 bg-gray-200 animate-pulse rounded" />
            ) : user ? (
              <>
                {/* Authenticated user on public page - show "Enter App" */}
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
                >
                  Log out
                </button>
                <Link
                  href="/discover"
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-brand-primary text-sm font-medium text-white shadow-sm hover:bg-brand-primary-dark transition-colors"
                >
                  <Compass className="w-3.5 h-3.5" />
                  Enter App
                </Link>
              </>
            ) : (
              <>
                {/* Guest - show login and signup */}
                <Link
                  href="/login"
                  className="text-sm font-medium text-foreground hover:text-brand-primary transition-colors px-3 py-1.5"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-brand-primary text-sm font-medium text-white shadow-sm hover:bg-brand-primary-dark transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden">
            <div className="space-y-1 pb-4 pt-2">
              {/* Main navigation */}
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-base font-medium text-foreground hover:bg-muted transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* App download links */}
              <div className="border-t border-border mt-3 pt-3">
                <p className="px-3 py-2 text-sm font-semibold text-muted-foreground">Download the App</p>
                <Link
                  href={appDownloadLinks.ios}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Download className="w-5 h-5 text-muted-foreground" />
                  <span className="text-base font-medium text-foreground">iOS App Store</span>
                </Link>
                <Link
                  href={appDownloadLinks.android}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Download className="w-5 h-5 text-muted-foreground" />
                  <span className="text-base font-medium text-foreground">Google Play</span>
                </Link>
              </div>
              
              {/* Auth actions */}
              <div className="border-t border-border mt-3 pt-3 space-y-2">
                {loading ? (
                  <div className="w-full h-9 bg-gray-200 animate-pulse rounded-lg" />
                ) : user ? (
                  <>
                    <Link
                      href="/discover"
                      className="flex items-center justify-center gap-1.5 h-9 rounded-full bg-brand-primary text-sm font-medium text-white shadow-sm hover:bg-brand-primary-dark transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Compass className="w-4 h-4" />
                      Enter App
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full rounded-lg px-3 py-2 text-center text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Log in
                    </Link>
                    <Link
                      href="/register"
                      className="flex items-center justify-center gap-1.5 h-9 rounded-full bg-brand-primary text-sm font-medium text-white shadow-sm hover:bg-brand-primary-dark transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Sparkles className="w-4 h-4" />
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
