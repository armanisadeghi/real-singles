import type { Metadata } from "next";
import { Poppins, Baskervville } from "next/font/google";
import "./globals.css";

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
      { url: "/favicon.png", type: "image/png" },
      { url: "/images/icon.png", sizes: "192x192", type: "image/png" },
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
        {children}
      </body>
    </html>
  );
}
