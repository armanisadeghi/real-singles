"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, X, Sparkles, User, LogOut, Compass } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const publicNavigation = [
  { name: "Features", href: "/features" },
  { name: "Events", href: "/events" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

const authenticatedNavigation = [
  { name: "Discover", href: "/discover" },
  { name: "Matches", href: "/matches" },
  { name: "Favorites", href: "/favorites" },
  { name: "Events", href: "/events" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    
    // Get initial session
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

  const navigation = user ? authenticatedNavigation : publicNavigation;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
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
          <div className="hidden lg:flex lg:gap-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-foreground hover:text-brand-primary transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTA buttons */}
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4 items-center">
            {loading ? (
              <div className="w-20 h-8 bg-gray-200 animate-pulse rounded" />
            ) : user ? (
              <>
                <Link
                  href="/profile"
                  className="text-sm font-medium text-foreground hover:text-brand-primary transition-colors px-4 py-2 flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <Link
                  href="/discover"
                  className="rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary-dark transition-colors flex items-center gap-2"
                >
                  <Compass className="w-4 h-4" />
                  Discover
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-foreground hover:text-brand-primary transition-colors px-4 py-2"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary-dark transition-colors flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
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
              <div className="border-t border-border mt-4 pt-4 space-y-2">
                {loading ? (
                  <div className="w-full h-10 bg-gray-200 animate-pulse rounded-lg" />
                ) : user ? (
                  <>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium text-foreground hover:bg-muted transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="w-5 h-5" />
                      Profile
                    </Link>
                    <Link
                      href="/discover"
                      className="flex items-center justify-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-base font-semibold text-white shadow-sm hover:bg-brand-primary-dark transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Compass className="w-5 h-5" />
                      Discover
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-base font-medium text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block rounded-lg px-3 py-2 text-base font-medium text-foreground hover:bg-muted transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Log in
                    </Link>
                    <Link
                      href="/register"
                      className="block rounded-full bg-brand-primary px-4 py-2 text-center text-base font-semibold text-white shadow-sm hover:bg-brand-primary-dark transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
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
