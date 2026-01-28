import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import {
  Users,
  CalendarDays,
  AlertTriangle,
  UserCheck,
  FileWarning,
  Package,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  Activity,
  Clock,
  ChevronRight,
} from "lucide-react";

async function getStats() {
  const supabase = createAdminClient();

  const [
    { count: usersCount },
    { count: profilesCount },
    { count: eventsCount },
    { count: reportsCount },
    { count: productsCount },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase
      .from("users")
      .select("id, email, created_at, profiles(first_name, last_name)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return {
    users: usersCount || 0,
    profiles: profilesCount || 0,
    events: eventsCount || 0,
    pendingReports: reportsCount || 0,
    activeProducts: productsCount || 0,
    recentUsers: recentUsers || [],
  };
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default async function AdminDashboardPage() {
  const stats = await getStats();
  const profileCompletionRate = stats.users > 0 
    ? Math.round((stats.profiles / stats.users) * 100) 
    : 0;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <header
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8
          opacity-100 translate-y-0
          [transition:opacity_500ms_ease-out,transform_500ms_ease-out]
          [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-amber-500/10 to-orange-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4" />
                {formatDate(new Date())}
              </p>
              <h1 className="text-[clamp(1.75rem,2vw+1rem,2.5rem)] font-semibold text-white mb-2">
                {getGreeting()}, Admin
              </h1>
              <p className="text-slate-400 max-w-lg">
                Here&apos;s what&apos;s happening with RealSingles today. You have{" "}
                <span className="text-amber-400 font-medium">{stats.pendingReports} pending reports</span> to review.
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-3">
              <div className="text-right">
                <p className="text-3xl font-bold text-white">{stats.users.toLocaleString()}</p>
                <p className="text-sm text-slate-400">Total Users</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Grid - Bento Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Primary Stat - Users (Larger) */}
        <Link
          href="/admin/users"
          className="@container col-span-2 lg:col-span-1 group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white
            hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5
            [transition:transform_300ms_cubic-bezier(0.34,1.56,0.64,1),box-shadow_300ms_ease]
            opacity-100 translate-y-0
            [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
          style={{ transitionDelay: "50ms" }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-[clamp(2rem,3vw,2.5rem)] font-bold">{stats.users.toLocaleString()}</p>
            <p className="text-blue-100 text-sm font-medium">Total Users</p>
          </div>
        </Link>

        {/* Profile Completion */}
        <div
          className="@container relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5
            opacity-100 translate-y-0
            [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
            [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
          style={{ transitionDelay: "100ms" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
              <UserCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {profileCompletionRate}%
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.profiles.toLocaleString()}</p>
          <p className="text-sm text-slate-500">Profiles Created</p>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000"
              style={{ width: `${profileCompletionRate}%` }}
            />
          </div>
        </div>

        {/* Events */}
        <Link
          href="/admin/events"
          className="@container group relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5
            hover:border-purple-200 hover:shadow-lg hover:shadow-purple-500/10
            [transition:all_300ms_cubic-bezier(0.34,1.56,0.64,1)]
            opacity-100 translate-y-0
            [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
          style={{ transitionDelay: "150ms" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
              <CalendarDays className="w-4 h-4 text-white" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.events}</p>
          <p className="text-sm text-slate-500">Active Events</p>
        </Link>

        {/* Pending Reports - Attention needed */}
        <Link
          href="/admin/reports"
          className="@container group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 p-5
            hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/10
            [transition:all_300ms_cubic-bezier(0.34,1.56,0.64,1)]
            opacity-100 translate-y-0
            [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
          style={{ transitionDelay: "200ms" }}
        >
          {stats.pendingReports > 0 && (
            <div className="absolute top-3 right-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
              </span>
            </div>
          )}
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm">
              <FileWarning className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.pendingReports}</p>
          <p className="text-sm text-amber-700 font-medium">Pending Reports</p>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions - Takes 2 columns */}
        <div
          className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/80 p-6
            opacity-100 translate-y-0
            [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
            [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
          style={{ transitionDelay: "250ms" }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
              <p className="text-sm text-slate-500">Frequently used admin tasks</p>
            </div>
            <Sparkles className="w-5 h-5 text-slate-400" />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Link
              href="/admin/users"
              className="group flex flex-col items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50
                hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-sm
                [transition:all_200ms_cubic-bezier(0.34,1.56,0.64,1)]"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm
                group-hover:scale-110 group-hover:shadow-md group-hover:shadow-blue-500/25 transition-all duration-300">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700 transition-colors">
                Manage Users
              </span>
            </Link>

            <Link
              href="/admin/events"
              className="group flex flex-col items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50
                hover:border-purple-200 hover:bg-purple-50/50 hover:shadow-sm
                [transition:all_200ms_cubic-bezier(0.34,1.56,0.64,1)]"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm
                group-hover:scale-110 group-hover:shadow-md group-hover:shadow-purple-500/25 transition-all duration-300">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-700 group-hover:text-purple-700 transition-colors">
                Manage Events
              </span>
            </Link>

            <Link
              href="/admin/reports"
              className="group flex flex-col items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50
                hover:border-amber-200 hover:bg-amber-50/50 hover:shadow-sm
                [transition:all_200ms_cubic-bezier(0.34,1.56,0.64,1)]"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm
                group-hover:scale-110 group-hover:shadow-md group-hover:shadow-amber-500/25 transition-all duration-300">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-700 group-hover:text-amber-700 transition-colors">
                Review Reports
              </span>
            </Link>

            <Link
              href="/admin/products"
              className="group flex flex-col items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50
                hover:border-rose-200 hover:bg-rose-50/50 hover:shadow-sm
                [transition:all_200ms_cubic-bezier(0.34,1.56,0.64,1)]"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-sm
                group-hover:scale-110 group-hover:shadow-md group-hover:shadow-rose-500/25 transition-all duration-300">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-700 group-hover:text-rose-700 transition-colors">
                Products
              </span>
            </Link>

            <Link
              href="/admin/data-integrity"
              className="group flex flex-col items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50
                hover:border-emerald-200 hover:bg-emerald-50/50 hover:shadow-sm
                [transition:all_200ms_cubic-bezier(0.34,1.56,0.64,1)]"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm
                group-hover:scale-110 group-hover:shadow-md group-hover:shadow-emerald-500/25 transition-all duration-300">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-700 group-hover:text-emerald-700 transition-colors">
                Data Integrity
              </span>
            </Link>

            <Link
              href="/admin/speed-dating"
              className="group flex flex-col items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50
                hover:border-cyan-200 hover:bg-cyan-50/50 hover:shadow-sm
                [transition:all_200ms_cubic-bezier(0.34,1.56,0.64,1)]"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-sm
                group-hover:scale-110 group-hover:shadow-md group-hover:shadow-cyan-500/25 transition-all duration-300">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-700 group-hover:text-cyan-700 transition-colors">
                Speed Dating
              </span>
            </Link>
          </div>
        </div>

        {/* Recent Users Activity */}
        <div
          className="rounded-2xl bg-white border border-slate-200/80 p-6
            opacity-100 translate-y-0
            [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
            [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
          style={{ transitionDelay: "300ms" }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Recent Signups</h2>
              <p className="text-sm text-slate-500">New users this week</p>
            </div>
            <Link
              href="/admin/users"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View all
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats.recentUsers.length > 0 ? (
              stats.recentUsers.map((user: { 
                id: string; 
                email: string; 
                created_at: string | null;
                profiles: { first_name: string | null; last_name: string | null } | null;
              }) => {
                const profile = Array.isArray(user.profiles) ? user.profiles[0] : user.profiles;
                const name = profile?.first_name 
                  ? `${profile.first_name} ${profile.last_name || ""}`.trim()
                  : null;
                
                return (
                  <Link
                    key={user.id}
                    href={`/admin/users/${user.id}`}
                    className="group flex items-center gap-3 p-3 -mx-3 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-sm font-medium text-slate-600">
                      {name ? name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {name || "New User"}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">
                      {user.created_at ? formatRelativeTime(user.created_at) : "Unknown"}
                    </span>
                  </Link>
                );
              })
            ) : (
              <div className="text-center py-8 text-sm text-slate-500">
                No recent signups
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="rounded-xl bg-white border border-slate-200/80 p-4 flex items-center gap-4
            opacity-100 translate-y-0
            [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
            [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
          style={{ transitionDelay: "350ms" }}
        >
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
            <Package className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{stats.activeProducts}</p>
            <p className="text-xs text-slate-500">Active Products</p>
          </div>
        </div>

        <div
          className="rounded-xl bg-white border border-slate-200/80 p-4 flex items-center gap-4
            opacity-100 translate-y-0
            [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
            [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
          style={{ transitionDelay: "400ms" }}
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{profileCompletionRate}%</p>
            <p className="text-xs text-slate-500">Profile Rate</p>
          </div>
        </div>

        <div
          className="rounded-xl bg-white border border-slate-200/80 p-4 flex items-center gap-4
            opacity-100 translate-y-0
            [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
            [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
          style={{ transitionDelay: "450ms" }}
        >
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{stats.events}</p>
            <p className="text-xs text-slate-500">Total Events</p>
          </div>
        </div>

        <div
          className="rounded-xl bg-white border border-slate-200/80 p-4 flex items-center gap-4
            opacity-100 translate-y-0
            [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
            [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
          style={{ transitionDelay: "500ms" }}
        >
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{stats.profiles.toLocaleString()}</p>
            <p className="text-xs text-slate-500">Profiles</p>
          </div>
        </div>
      </div>
    </div>
  );
}
