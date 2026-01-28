import Link from "next/link";
import Image from "next/image";
import { Mail, Facebook } from "lucide-react";

// Quick Links matching WordPress footer
const quickLinks = [
  { name: "Contact Us", href: "/contact" },
  { name: "FAQs", href: "/faq" },
  { name: "Privacy Policy", href: "/privacy-policy" },
  { name: "Safety", href: "/safety" },
  { name: "Team", href: "/team" },
  { name: "Terms", href: "/terms" },
  { name: "Success Stories", href: "/success-stories" },
];

const appDownloadLinks = {
  ios: "https://apps.apple.com/app/real-singles/id6473915498",
  android: "https://play.google.com/store/apps/details?id=com.realsingles.app",
};

export function Footer() {
  return (
    <footer className="bg-[#F6EDE1] text-foreground" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand section */}
          <div className="space-y-6 lg:col-span-2">
            <Link href="/" className="flex items-center">
              <Image
                src="/images/logo.png"
                alt="Real Singles"
                width={140}
                height={45}
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-sm text-gray-600 max-w-sm">
              A social and dating app that welcomes everyone regardless of your stage of life.
            </p>
            <div className="flex gap-4">
              <Link
                href="https://facebook.com/realsingles"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-brand-primary transition-colors"
              >
                <span className="sr-only">Facebook</span>
                <Facebook className="h-6 w-6" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Quick Links</h3>
            <ul role="list" className="mt-4 space-y-3">
              {quickLinks.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-600 hover:text-brand-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Get In Touch */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Get In Touch</h3>
            <div className="mt-4 space-y-3">
              <p className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a 
                  href="mailto:support@realsingles.dating" 
                  className="hover:text-brand-primary transition-colors"
                >
                  support@realsingles.dating
                </a>
              </p>
            </div>
            
            {/* App download buttons */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-foreground mb-3">Download Our App</h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  href={appDownloadLinks.ios}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-black text-white hover:bg-gray-800 transition-colors rounded-lg px-3 py-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-[9px] text-gray-400 leading-none">Download on the</p>
                    <p className="text-xs font-semibold leading-tight">App Store</p>
                  </div>
                </Link>
                <Link
                  href={appDownloadLinks.android}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-black text-white hover:bg-gray-800 transition-colors rounded-lg px-3 py-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-[9px] text-gray-400 leading-none">Get it on</p>
                    <p className="text-xs font-semibold leading-tight">Google Play</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-brand-primary/20 pt-8">
          <p className="text-sm text-gray-500 text-center">
            © Copyright {new Date().getFullYear()} | Real Singles Dating | All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
