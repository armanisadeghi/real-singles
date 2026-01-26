import { requireAdmin } from "@/lib/auth/admin-guard";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminUserDropdown } from "@/components/admin/AdminUserDropdown";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-6">
              <Link href="/admin" className="flex items-center gap-2">
                <Image
                  src="/images/logo.png"
                  alt="RealSingles"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                />
                <span className="text-sm font-medium text-gray-500">Admin</span>
              </Link>
              <nav className="flex space-x-1">
                <Link
                  href="/admin"
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/users"
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  Users
                </Link>
                <Link
                  href="/admin/events"
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  Events
                </Link>
                <Link
                  href="/admin/reports"
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  Reports
                </Link>
                <Link
                  href="/admin/products"
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  Products
                </Link>
                <Link
                  href="/admin/settings"
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  Settings
                </Link>
              </nav>
            </div>
            <AdminUserDropdown
              email={user.email}
              role={user.role}
              onSignOut={signOut}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
