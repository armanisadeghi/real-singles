import Link from "next/link";
import Image from "next/image";
import { Mail, Facebook, Instagram } from "lucide-react";

const quickLinks = [
  { name: "Contact", href: "/contact" },
  { name: "FAQs", href: "/faq" },
  { name: "Privacy", href: "/privacy-policy" },
  { name: "Terms", href: "/terms" },
  { name: "Safety", href: "/safety" },
  { name: "Team", href: "/team" },
];

const appDownloadLinks = {
  ios: "https://apps.apple.com/app/real-singles/id6473915498",
  android: "https://play.google.com/store/apps/details?id=com.realsingles.app",
};

export function Footer() {
  return (
    <footer className="bg-[#F6EDE1] text-foreground" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Footer</h2>
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Main footer content - single row on desktop */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          
          {/* Left: Logo + tagline + social */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <Link href="/" className="flex-shrink-0">
              <Image
                src="/images/logo.png"
                alt="Real Singles"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-sm text-gray-600 max-w-xs">
              Find your true connection
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="https://facebook.com/realsingles"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-brand-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="https://instagram.com/realsingles"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-brand-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Center: Quick links - horizontal on desktop */}
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {quickLinks.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm text-gray-600 hover:text-brand-primary transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right: App download buttons */}
          <div className="flex items-center gap-2">
            <Link
              href={appDownloadLinks.ios}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-black text-white hover:bg-gray-800 transition-colors rounded-lg px-3 py-1.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              <span className="text-xs font-medium">App Store</span>
            </Link>
            <Link
              href={appDownloadLinks.android}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-black text-white hover:bg-gray-800 transition-colors rounded-lg px-3 py-1.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
              </svg>
              <span className="text-xs font-medium">Google Play</span>
            </Link>
          </div>
        </div>

        {/* Bottom bar: Copyright + email */}
        <div className="mt-6 pt-6 border-t border-brand-primary/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Real Singles Dating. All rights reserved.
          </p>
          <a 
            href="mailto:support@realsingles.dating" 
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-primary transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            support@realsingles.dating
          </a>
        </div>
      </div>
    </footer>
  );
}
