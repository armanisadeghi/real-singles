"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Wrench,
  ExternalLink,
  User,
  Search,
  Filter,
  Download,
  AlertTriangle,
  AlertCircle,
  Info,
} from "lucide-react";
import type {
  DataIntegrityIssue,
  IssueType,
  IntegrityCheckResult,
} from "@/lib/services/data-integrity";

interface AllIssuesListProps {
  issues: DataIntegrityIssue[];
  summary: IntegrityCheckResult["summary"];
}

export function AllIssuesList({ issues, summary }: AllIssuesListProps) {
  const router = useRouter();
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [fixResults, setFixResults] = useState<
    Record<string, { success: boolean; message: string }>
  >({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<
    "all" | "critical" | "warning" | "info"
  >("all");
  const [filterType, setFilterType] = useState<"all" | IssueType>("all");

  // Get unique issue types from the data
  const issueTypes = useMemo(() => {
    const types = new Set<IssueType>();
    for (const issue of issues) {
      types.add(issue.issueType);
    }
    return Array.from(types);
  }, [issues]);

  // Filter and search issues
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchesSearch =
        searchQuery === "" ||
        issue.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (issue.firstName &&
          issue.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (issue.lastName &&
          issue.lastName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSeverity =
        filterSeverity === "all" || issue.severity === filterSeverity;

      const matchesType = filterType === "all" || issue.issueType === filterType;

      return matchesSearch && matchesSeverity && matchesType;
    });
  }, [issues, searchQuery, filterSeverity, filterType]);

  async function handleFixSingle(
    userId: string,
    issueType: string,
    details?: Record<string, unknown>
  ) {
    const fixKey = details?.galleryId
      ? `${userId}-${issueType}-${details.galleryId}`
      : `${userId}-${issueType}`;
    setFixingId(fixKey);

    try {
      const response = await fetch("/api/admin/data-integrity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "fix_single",
          userId,
          issueType,
          details,
        }),
      });

      const data = await response.json();

      setFixResults((prev) => ({
        ...prev,
        [fixKey]: {
          success: data.success,
          message: data.result?.action || data.error || "Unknown result",
        },
      }));

      if (data.success) {
        setTimeout(() => {
          router.refresh();
        }, 1500);
      }
    } catch (error) {
      setFixResults((prev) => ({
        ...prev,
        [fixKey]: {
          success: false,
          message: error instanceof Error ? error.message : "Failed to fix",
        },
      }));
    } finally {
      setFixingId(null);
    }
  }

  function exportToCSV() {
    const headers = [
      "User ID",
      "Email",
      "First Name",
      "Last Name",
      "Issue Type",
      "Severity",
      "Description",
      "Auto-Fixable",
      "Created At",
    ];

    const rows = filteredIssues.map((issue) => [
      issue.userId,
      issue.userEmail,
      issue.firstName || "",
      issue.lastName || "",
      issue.issueType,
      issue.severity,
      issue.description,
      issue.autoFixable ? "Yes" : "No",
      issue.createdAt,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `data-integrity-issues-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  }

  function getSeverityIcon(severity: string) {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case "info":
        return <Info className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  }

  function formatIssueType(type: string) {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  if (issues.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Issues Found
        </h3>
        <p className="text-gray-500">All data integrity checks passed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterSeverity}
            onChange={(e) =>
              setFilterSeverity(
                e.target.value as "all" | "critical" | "warning" | "info"
              )
            }
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">
              Critical ({summary.critical})
            </option>
            <option value="warning">Warnings ({summary.warning})</option>
            <option value="info">Info ({summary.info})</option>
          </select>
        </div>

        {/* Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as "all" | IssueType)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Issue Types</option>
          {issueTypes.map((type) => (
            <option key={type} value={type}>
              {formatIssueType(type)} ({summary.byType[type] || 0})
            </option>
          ))}
        </select>

        {/* Export Button */}
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 ml-auto"
        >
          <Download className="w-4 h-4" />
          Export ({filteredIssues.length})
        </button>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        Showing {filteredIssues.length} of {issues.length} issues
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
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
                const fixKey = issue.details?.galleryId
                  ? `${issue.userId}-${issue.issueType}-${issue.details.galleryId}`
                  : `${issue.userId}-${issue.issueType}`;
                const result = fixResults[fixKey];
                const isFixing = fixingId === fixKey;

                return (
                  <tr
                    key={`${issue.userId}-${issue.issueType}-${idx}`}
                    className={result?.success ? "bg-green-50" : ""}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(issue.severity)}
                        <span
                          className={`text-xs font-medium ${
                            issue.severity === "critical"
                              ? "text-red-600"
                              : issue.severity === "warning"
                                ? "text-amber-600"
                                : "text-blue-600"
                          }`}
                        >
                          {issue.severity}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {issue.firstName || "Unknown"} {issue.lastName || ""}
                          </p>
                          <p className="text-xs text-gray-500 max-w-[150px] truncate">
                            {issue.userEmail}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {formatIssueType(issue.issueType)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 max-w-xs truncate">
                        {issue.description}
                      </p>
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
                          <span className="truncate max-w-[120px]">
                            {result.message}
                          </span>
                        </div>
                      ) : issue.autoFixable ? (
                        <span className="text-xs text-green-600">
                          Auto-fixable
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Manual</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {issue.autoFixable && !result?.success && (
                          <button
                            onClick={() =>
                              handleFixSingle(
                                issue.userId,
                                issue.issueType,
                                issue.details as Record<string, unknown>
                              )
                            }
                            disabled={isFixing}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View
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
