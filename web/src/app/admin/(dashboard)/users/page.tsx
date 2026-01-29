"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { User, ArrowUpDown, Download, RefreshCw } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { UserFilters, type UserFilterState } from "@/components/admin/UserFilters";
import { Pagination } from "@/components/admin/Pagination";

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
    age: number | null;
    gender: string | null;
    city: string | null;
    state: string | null;
    is_verified: boolean;
    profile_hidden: boolean;
    can_start_matching: boolean;
  } | null;
}

const initialFilters: UserFilterState = {
  search: "",
  status: "all",
  role: "all",
  verified: "all",
  can_start_matching: "all",
  profile_hidden: "all",
  gender: "all",
  city: "",
  state: "",
  min_age: "",
  max_age: "",
  min_points: "",
  max_points: "",
  date_from: "",
  date_to: "",
  last_active_from: "",
  last_active_to: "",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<UserFilterState>(initialFilters);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      // Add non-empty filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") {
          params.append(key, value);
        }
      });

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotalUsers(data.pagination.total);
      } else {
        setError(data.msg || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFilterChange = (newFilters: UserFilterState) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
    setPage(1);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const handleExport = async () => {
    setSuccessMessage("Preparing CSV export...");
    setError(null);

    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "10000", // Export all matching records
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") {
          params.append(key, value);
        }
      });

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        // Convert to CSV
        const csvRows = [
          [
            "ID",
            "Email",
            "Name",
            "Status",
            "Role",
            "Points",
            "Verified",
            "Can Match",
            "Age",
            "Gender",
            "City",
            "State",
            "Joined",
            "Last Active",
          ],
          ...data.data.map((user: UserWithProfile) => [
            user.id,
            user.email,
            getUserDisplayName(user),
            user.status,
            user.role,
            user.points_balance,
            user.profiles?.is_verified ? "Yes" : "No",
            user.profiles?.can_start_matching ? "Yes" : "No",
            user.profiles?.age || "",
            user.profiles?.gender || "",
            user.profiles?.city || "",
            user.profiles?.state || "",
            user.created_at,
            user.last_active_at || "",
          ]),
        ];

        const csvContent = csvRows.map((row) => row.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();

        setSuccessMessage(`Exported ${data.data.length} users successfully`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError("Failed to export users");
      }
    } catch (error) {
      console.error("Export error:", error);
      setError("Failed to export users");
    }
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => value && value !== "all" && value !== ""
  ).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="User Management"
        subtitle="View and manage all registered users"
        variant="hero"
        iconName="users"
        iconGradient="from-blue-500 to-blue-600"
        stat={{
          value: totalUsers.toLocaleString(),
          label: "Total Users",
        }}
      />

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <UserFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          activeFilterCount={activeFilterCount}
        />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              {loading ? "Loading..." : `${users.length} Users`}
            </h2>
            <p className="text-xs text-slate-500">
              {activeFilterCount > 0 ? `${activeFilterCount} filter(s) active` : "All users"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/80">
            <thead className="bg-slate-50/80">
              <tr>
                <SortableHeader
                  label="User"
                  column="display_name"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Info
                </th>
                <SortableHeader
                  label="Points"
                  column="points_balance"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Joined"
                  column="created_at"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Last Active"
                  column="last_active_at"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No users found matching your filters
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/80 cursor-pointer group transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3">
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
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {getUserDisplayName(user)}
                          </div>
                          <div className="text-sm text-slate-500 truncate">{user.email}</div>
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
                        <div className="flex flex-wrap gap-1">
                          {user.profiles?.is_verified && (
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                              ✓
                            </span>
                          )}
                          {user.profiles?.can_start_matching && (
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                              Match
                            </span>
                          )}
                          {user.profiles?.profile_hidden && (
                            <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded">
                              Hidden
                            </span>
                          )}
                          {user.profiles?.age && (
                            <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded">
                              {user.profiles.age}
                            </span>
                          )}
                          {user.profiles?.city && (
                            <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded">
                              {user.profiles.city}
                            </span>
                          )}
                        </div>
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
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : "N/A"}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <Link href={`/admin/users/${user.id}`} className="block">
                        {formatRelativeTime(user.last_active_at)}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalUsers}
            itemsPerPage={limit}
            onPageChange={setPage}
            onItemsPerPageChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        )}
      </div>
    </div>
  );
}

function SortableHeader({
  label,
  column,
  currentSort,
  currentOrder,
  onSort,
}: {
  label: string;
  column: string;
  currentSort: string;
  currentOrder: "asc" | "desc";
  onSort: (column: string) => void;
}) {
  const isActive = currentSort === column;

  return (
    <th
      className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 transition-colors"
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-2">
        {label}
        <ArrowUpDown
          className={`w-3.5 h-3.5 ${isActive ? "text-blue-600" : "text-slate-400"}`}
        />
      </div>
    </th>
  );
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
