import type { NextConfig } from "next";

/**
 * Next.js Configuration
 *
 * PERFORMANCE STANDARDS IMPLEMENTATION
 * See /PERFORMANCE-STANDARDS.md for full requirements
 */
const nextConfig: NextConfig = {
  // Set Turbopack root to the monorepo root to help resolve packages with pnpm hoisting
  // The root node_modules contains the hoisted packages that need to be resolved
  turbopack: {
    root: "/Users/armanisadeghi/Code/real-singles",
  },

  // ==========================================================================
  // PERFORMANCE: Bundle Optimization
  // ==========================================================================

  // Remove console logs in production for smaller bundles
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Optimize package imports to reduce bundle size
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@supabase/supabase-js",
      "@supabase/ssr",
      "@livekit/components-react",
      "livekit-client",
      "zod",
    ],
  },

  // ==========================================================================
  // IMAGE OPTIMIZATION
  // ==========================================================================

  images: {
    // Serve images in modern WebP format when supported
    formats: ["image/webp"],
    // Allow external images from these domains
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
    // Configure device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    // Configure image sizes for srcset
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Redirects for old routes to new routes (matching WordPress URLs)
  async redirects() {
    return [
      {
        source: "/features",
        destination: "/membership",
        permanent: true,
      },
      {
        source: "/about-us",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/contact-us",
        destination: "/contact",
        permanent: true,
      },
      {
        source: "/faqs",
        destination: "/faq",
        permanent: true,
      },
      {
        source: "/privacy",
        destination: "/privacy-policy",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
