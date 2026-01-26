import { createAdminClient } from "@/lib/supabase/admin";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";
import Link from "next/link";
import { User } from "lucide-react";

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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <div className="text-sm text-gray-500">
          Showing {users.length} users
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Points
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Active
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 cursor-pointer group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shrink-0 overflow-hidden">
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
                      <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                        {getUserDisplayName(user)}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link href={`/admin/users/${user.id}`}>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === "active"
                          ? "bg-green-100 text-green-800"
                          : user.status === "suspended"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.status}
                    </span>
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link href={`/admin/users/${user.id}`}>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : user.role === "moderator"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.role}
                    </span>
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <Link href={`/admin/users/${user.id}`} className="block">
                    {user.points_balance}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <Link href={`/admin/users/${user.id}`} className="block">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
  );
}
