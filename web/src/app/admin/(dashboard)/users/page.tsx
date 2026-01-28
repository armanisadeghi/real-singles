import { createAdminClient } from "@/lib/supabase/admin";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";
import Link from "next/link";
import { User, Users, Search } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

interface UserWithProfile {
  id: string;
  email: string;
  display_name: string | null;
  status: string;
  role: string;
  points_balance: number;
  created_at: string;
  last_active_at: string | null;
  profiles: {
    profile_image_url: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

async function getUsers(): Promise<UserWithProfile[]> {
  const supabase = createAdminClient();

  const { data: users, error } = await supabase
    .from("users")
    .select(`
      id,
      email,
      display_name,
      status,
      role,
      points_balance,
      created_at,
      last_active_at,
      profiles (
        profile_image_url,
        first_name,
        last_name
      )
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }

  // Resolve profile image URLs (handles private storage paths)
  const usersWithResolvedUrls = await Promise.all(
    (users || []).map(async (user) => {
      if (user.profiles?.profile_image_url) {
        const resolvedUrl = await resolveStorageUrl(supabase, user.profiles.profile_image_url);
        return {
          ...user,
          profiles: {
            ...user.profiles,
            profile_image_url: resolvedUrl || null,
          },
        };
      }
      return user;
    })
  );

  return usersWithResolvedUrls as UserWithProfile[];
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "Never";
  
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
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}

function getUserDisplayName(user: UserWithProfile): string {
  if (user.profiles?.first_name && user.profiles?.last_name) {
    return `${user.profiles.first_name} ${user.profiles.last_name}`;
  }
  if (user.profiles?.first_name) {
    return user.profiles.first_name;
  }
  return user.display_name || "No name";
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="User Management"
        subtitle="View and manage all registered users"
        variant="hero"
        icon={Users}
        iconGradient="from-blue-500 to-blue-600"
        stat={{
          value: users.length.toLocaleString(),
          label: "Total Users",
        }}
      />

      {/* Table Card */}
      <div
        className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden
          opacity-100 translate-y-0
          [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
          [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
        style={{ transitionDelay: "100ms" }}
      >
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <Search className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">All Users</h2>
              <p className="text-xs text-slate-500">Showing {users.length} users</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/80">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Last Active
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200/60">
              {users.map((user, index) => (
                <tr 
                  key={user.id} 
                  className="hover:bg-slate-50/80 cursor-pointer group transition-colors"
                  style={{
                    animation: `fadeIn 300ms ease-out forwards`,
                    animationDelay: `${index * 30}ms`,
                    opacity: 0,
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-white shadow-sm">
                        {user.profiles?.profile_image_url ? (
                          <img
                            src={user.profiles.profile_image_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                          {getUserDisplayName(user)}
                        </div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/admin/users/${user.id}`}>
                      <span
                        className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : user.status === "suspended"
                            ? "bg-red-100 text-red-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {user.status}
                      </span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/admin/users/${user.id}`}>
                      <span
                        className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "moderator"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/admin/users/${user.id}`} className="block">
                      <span className="text-sm font-medium text-slate-900">
                        {user.points_balance.toLocaleString()}
                      </span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <Link href={`/admin/users/${user.id}`} className="block">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <Link href={`/admin/users/${user.id}`} className="block">
                      {formatRelativeTime(user.last_active_at)}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
