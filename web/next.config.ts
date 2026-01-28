import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
