"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Sparkles } from "lucide-react";

const navigation = [
  { name: "Features", href: "/features" },
  { name: "Events", href: "/events" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
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
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
