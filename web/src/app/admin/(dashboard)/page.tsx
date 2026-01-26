import { createAdminClient } from "@/lib/supabase/admin";
import { Users, CalendarDays, AlertTriangle, Gift, UserCheck, FileWarning, Package } from "lucide-react";
import { LucideIcon } from "lucide-react";

async function getStats() {
  const supabase = createAdminClient();

  const [
    { count: usersCount },
    { count: profilesCount },
    { count: eventsCount },
    { count: reportsCount },
    { count: productsCount },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
  ]);

  return {
    users: usersCount || 0,
    profiles: profilesCount || 0,
    events: eventsCount || 0,
    pendingReports: reportsCount || 0,
    activeProducts: productsCount || 0,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const statCards: { label: string; value: number; color: string; icon: LucideIcon }[] = [
    { label: "Total Users", value: stats.users, color: "bg-blue-500", icon: Users },
    { label: "Profiles Created", value: stats.profiles, color: "bg-green-500", icon: UserCheck },
    { label: "Active Events", value: stats.events, color: "bg-purple-500", icon: CalendarDays },
    { label: "Pending Reports", value: stats.pendingReports, color: "bg-red-500", icon: FileWarning },
    { label: "Active Products", value: stats.activeProducts, color: "bg-amber-500", icon: Package },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
              </div>
              <h3 className="text-gray-600 text-sm">{stat.label}</h3>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/admin/users"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors"
          >
            <div className="flex justify-center mb-2">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-600">Manage Users</span>
          </a>
          <a
            href="/admin/events"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors"
          >
            <div className="flex justify-center mb-2">
              <CalendarDays className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-600">Manage Events</span>
          </a>
          <a
            href="/admin/reports"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors"
          >
            <div className="flex justify-center mb-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-sm text-gray-600">Review Reports</span>
          </a>
          <a
            href="/admin/products"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors"
          >
            <div className="flex justify-center mb-2">
              <Gift className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-sm text-gray-600">Manage Products</span>
          </a>
        </div>
      </div>
    </div>
  );
}
