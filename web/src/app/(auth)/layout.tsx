import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-dvh bg-gradient-to-br from-[#F6EDE1] via-[#FFFAF2] to-white overflow-auto">
      <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-6">
        {/* Logo */}
        <Link href="/" className="mb-4 shrink-0">
          <Image
            src="/images/logo-transparent.png"
            alt="RealSingles"
            width={180}
            height={58}
            className="h-12 w-auto"
            priority
          />
        </Link>
        
        {/* Auth Card */}
        <div className="w-full max-w-md">
          {children}
        </div>
        
        {/* Footer */}
        <p className="mt-4 text-gray-500 text-xs shrink-0">
          © 2026 RealSingles. All rights reserved.
        </p>
      </div>
    </div>
  );
}
