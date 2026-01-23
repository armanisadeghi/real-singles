import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        {/* Logo */}
        <Link href="/" className="mb-8">
          <h1 className="text-4xl font-bold text-white">RealSingles</h1>
        </Link>
        
        {/* Auth Card */}
        <div className="w-full max-w-md">
          {children}
        </div>
        
        {/* Footer */}
        <p className="mt-8 text-white/70 text-sm">
          © 2026 RealSingles. All rights reserved.
        </p>
      </div>
    </div>
  );
}
