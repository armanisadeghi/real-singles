import type { Metadata, Viewport } from "next";
import { Poppins, Baskervville } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

/**
 * PERFORMANCE STANDARDS IMPLEMENTATION
 * See /PERFORMANCE-STANDARDS.md for full requirements
 *
 * Vercel Analytics and SpeedInsights are conditionally imported
 * to track performance metrics in production.
 */
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const baskervville = Baskervville({
  variable: "--font-baskervville",
  subsets: ["latin"],
  weight: ["400"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Ensure proper keyboard handling on Android
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  ),
  title: "Real Singles - Find Your Real Connection",
  description: "Join the dating community that prioritizes authenticity. With verified profiles, video introductions, and curated events, find someone who's genuinely looking for what you are.",
  keywords: ["dating", "singles", "matchmaking", "events", "verified profiles", "video dating"],
  openGraph: {
    title: "Real Singles - Find Your Real Connection",
    description: "Join the dating community that prioritizes authenticity.",
    type: "website",
    images: ["/images/logo.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "48x48", type: "image/png" },
      { url: "/images/icon.png", sizes: "192x192", type: "image/png" },
      { url: "/images/app-icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/images/app-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${baskervville.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
        {/* PERFORMANCE MONITORING - See /PERFORMANCE-STANDARDS.md */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
