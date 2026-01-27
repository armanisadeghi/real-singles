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
  Copy,
  ClipboardList,
  Check,
} from "lucide-react";
import type { DataIntegrityIssue } from "@/lib/services/data-integrity";

interface AvatarIssuesListProps {
  issues: DataIntegrityIssue[];
}

// Helper to copy text to clipboard with feedback
function useCopyToClipboard() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return { copy, copiedId };
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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const { copy, copiedId } = useCopyToClipboard();

  const toggleRowExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Format issue for clipboard (JSON)
  const formatIssueForCopy = (issue: DataIntegrityIssue) => ({
    userId: issue.userId,
    email: issue.userEmail,
    name: `${issue.firstName || ""} ${issue.lastName || ""}`.trim() || "Unknown",
    issueType: issue.issueType,
    description: issue.description,
    profileImageUrl: issue.details?.profileImageUrl || null,
    autoFixable: issue.autoFixable,
    hasGalleryImages: issue.details?.hasGalleryImages ?? null,
    createdAt: issue.createdAt,
  });

  const copyAllToClipboard = async () => {
    const data = filteredIssues.map(formatIssueForCopy);
    await copy(JSON.stringify(data, null, 2), "all");
  };

  const copyRowToClipboard = async (issue: DataIntegrityIssue) => {
    await copy(JSON.stringify(formatIssueForCopy(issue), null, 2), issue.userId);
  };

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

        <div className="flex items-center gap-2">
          {/* Copy All Button */}
          <button
            onClick={copyAllToClipboard}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            {copiedId === "all" ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <ClipboardList className="w-4 h-4" />
                Copy All ({filteredIssues.length})
              </>
            )}
          </button>

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
                      <p className="text-sm text-gray-600 max-w-md">
                        {issue.description}
                      </p>
                      {typeof issue.details?.profileImageUrl === "string" && (
                        <div className="mt-1">
                          <button
                            onClick={() => toggleRowExpand(`url-${issue.userId}`)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {expandedRows.has(`url-${issue.userId}`) ? "Hide URL" : "Show URL"}
                          </button>
                          {expandedRows.has(`url-${issue.userId}`) && (
                            <div className="mt-1 p-2 bg-gray-50 rounded border text-xs font-mono break-all">
                              {issue.details.profileImageUrl}
                              <button
                                onClick={() => copy(issue.details!.profileImageUrl as string, `url-copy-${issue.userId}`)}
                                className="ml-2 text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                              >
                                {copiedId === `url-copy-${issue.userId}` ? (
                                  <Check className="w-3 h-3 text-green-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
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
                        <button
                          onClick={() => copyRowToClipboard(issue)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                          title="Copy row data"
                        >
                          {copiedId === issue.userId ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
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
