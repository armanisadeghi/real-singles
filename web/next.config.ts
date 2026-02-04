import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Set Turbopack root to current working directory to avoid workspace root confusion
  // This prevents Next.js from inferring the monorepo root when multiple lockfiles exist
  // process.cwd() returns the absolute path of the directory where the command is executed
  turbopack: {
    root: process.cwd(),
  },
  // Allow external images from these domains
  images: {
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
