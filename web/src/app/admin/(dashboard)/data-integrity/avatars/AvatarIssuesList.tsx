"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Wrench,
  ExternalLink,
  User,
  Image as ImageIcon,
  AlertCircle,
  Search,
  Filter,
} from "lucide-react";
import type { DataIntegrityIssue } from "@/lib/services/data-integrity";

interface AvatarIssuesListProps {
  issues: DataIntegrityIssue[];
}

export function AvatarIssuesList({ issues }: AvatarIssuesListProps) {
  const router = useRouter();
  const [fixingUserId, setFixingUserId] = useState<string | null>(null);
  const [fixResults, setFixResults] = useState<
    Record<string, { success: boolean; message: string }>
  >({});
  const [batchFixing, setBatchFixing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "missing" | "broken">(
    "all"
  );

  // Filter and search issues
  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      searchQuery === "" ||
      issue.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (issue.firstName &&
        issue.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (issue.lastName &&
        issue.lastName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter =
      filterType === "all" ||
      (filterType === "missing" && issue.issueType === "missing_avatar") ||
      (filterType === "broken" && issue.issueType === "broken_avatar");

    return matchesSearch && matchesFilter;
  });

  async function handleFixSingle(userId: string, issueType: string) {
    setFixingUserId(userId);

    try {
      const response = await fetch("/api/admin/data-integrity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "fix_single",
          userId,
          issueType,
        }),
      });

      const data = await response.json();

      setFixResults((prev) => ({
        ...prev,
        [userId]: {
          success: data.success,
          message: data.result?.action || data.error || "Unknown result",
        },
      }));

      if (data.success) {
        // Refresh after a short delay
        setTimeout(() => {
          router.refresh();
        }, 1500);
      }
    } catch (error) {
      setFixResults((prev) => ({
        ...prev,
        [userId]: {
          success: false,
          message: error instanceof Error ? error.message : "Failed to fix",
        },
      }));
    } finally {
      setFixingUserId(null);
    }
  }

  async function handleBatchFix() {
    setBatchFixing(true);

    try {
      const autoFixableUserIds = filteredIssues
        .filter((i) => i.autoFixable && !fixResults[i.userId]?.success)
        .map((i) => i.userId);

      const response = await fetch("/api/admin/data-integrity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "fix_avatars",
          userIds: autoFixableUserIds,
        }),
      });

      const data = await response.json();

      // Update results for all fixed users
      for (const result of data.fixed || []) {
        setFixResults((prev) => ({
          ...prev,
          [result.userId]: {
            success: true,
            message: result.action,
          },
        }));
      }

      for (const result of data.failed || []) {
        setFixResults((prev) => ({
          ...prev,
          [result.userId]: {
            success: false,
            message: result.error || result.action,
          },
        }));
      }

      // Refresh after delay
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (error) {
      console.error("Batch fix failed:", error);
    } finally {
      setBatchFixing(false);
    }
  }

  const autoFixableCount = filteredIssues.filter(
    (i) => i.autoFixable && !fixResults[i.userId]?.success
  ).length;

  if (issues.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Avatar Issues Found
        </h3>
        <p className="text-gray-500">
          All users have valid profile images configured.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) =>
                setFilterType(e.target.value as "all" | "missing" | "broken")
              }
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Issues ({issues.length})</option>
              <option value="missing">
                Missing Avatar (
                {issues.filter((i) => i.issueType === "missing_avatar").length})
              </option>
              <option value="broken">
                Broken Avatar (
                {issues.filter((i) => i.issueType === "broken_avatar").length})
              </option>
            </select>
          </div>
        </div>

        {/* Batch Fix Button */}
        {autoFixableCount > 0 && (
          <button
            onClick={handleBatchFix}
            disabled={batchFixing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {batchFixing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Fixing...
              </>
            ) : (
              <>
                <Wrench className="w-4 h-4" />
                Fix All Visible ({autoFixableCount})
              </>
            )}
          </button>
        )}
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredIssues.map((issue, idx) => {
                const result = fixResults[issue.userId];
                const isFixing = fixingUserId === issue.userId;

                return (
                  <tr
                    key={`${issue.userId}-${idx}`}
                    className={result?.success ? "bg-green-50" : ""}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {issue.firstName || "Unknown"} {issue.lastName || ""}
                          </p>
                          <p className="text-xs text-gray-500">
                            {issue.userEmail}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                          issue.issueType === "missing_avatar"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {issue.issueType === "missing_avatar" ? (
                          <ImageIcon className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {issue.issueType === "missing_avatar"
                          ? "Missing"
                          : "Broken"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 max-w-xs">
                        {issue.description}
                      </p>
                      {typeof issue.details?.profileImageUrl === "string" && (
                        <p className="text-xs text-gray-400 mt-1 font-mono truncate max-w-xs">
                          {issue.details.profileImageUrl.substring(0, 50)}...
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {result ? (
                        <div
                          className={`flex items-center gap-1.5 text-sm ${
                            result.success ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {result.success ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          <span className="truncate max-w-[150px]">
                            {result.message}
                          </span>
                        </div>
                      ) : issue.autoFixable ? (
                        <span className="text-xs text-green-600">
                          Auto-fixable
                        </span>
                      ) : issue.details?.hasGalleryImages === false ? (
                        <span className="text-xs text-amber-600">
                          No gallery images
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">
                          Manual action needed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {issue.autoFixable && !result?.success && (
                          <button
                            onClick={() =>
                              handleFixSingle(issue.userId, issue.issueType)
                            }
                            disabled={isFixing || batchFixing}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isFixing ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Wrench className="w-3 h-3" />
                            )}
                            Fix
                          </button>
                        )}
                        <Link
                          href={`/admin/users/${issue.userId}`}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View User
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state for filtered results */}
        {filteredIssues.length === 0 && issues.length > 0 && (
          <div className="p-8 text-center text-gray-500">
            No issues match your search or filter criteria.
          </div>
        )}
      </div>
    </div>
  );
}
