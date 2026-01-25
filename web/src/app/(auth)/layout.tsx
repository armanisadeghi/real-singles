import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6EDE1] via-[#FFFAF2] to-white">
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        {/* Logo */}
        <Link href="/" className="mb-8">
          <Image
            src="/images/logo.png"
            alt="RealSingles"
            width={200}
            height={65}
            className="h-16 w-auto"
            priority
          />
        </Link>
        
        {/* Auth Card */}
        <div className="w-full max-w-md">
          {children}
        </div>
        
        {/* Footer */}
        <p className="mt-8 text-gray-500 text-sm">
          © 2026 RealSingles. All rights reserved.
        </p>
      </div>
    </div>
  );
}
