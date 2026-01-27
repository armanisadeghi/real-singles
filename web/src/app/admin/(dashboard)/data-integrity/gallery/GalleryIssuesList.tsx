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
  Search,
  Filter,
  Image,
  Trash2,
  AlertTriangle,
  ImageOff,
} from "lucide-react";
import type { DataIntegrityIssue } from "@/lib/services/data-integrity";

interface GalleryIssuesListProps {
  issues: DataIntegrityIssue[];
}

type GalleryIssueType =
  | "all"
  | "no_gallery_photos"
  | "missing_primary_photo"
  | "broken_primary_photo"
  | "orphaned_gallery_record";

export function GalleryIssuesList({ issues }: GalleryIssuesListProps) {
  const router = useRouter();
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [fixResults, setFixResults] = useState<
    Record<string, { success: boolean; message: string }>
  >({});
  const [batchFixing, setBatchFixing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<GalleryIssueType>("all");

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
      filterType === "all" || issue.issueType === filterType;

    return matchesSearch && matchesFilter;
  });

  async function handleFixSingle(
    userId: string,
    issueType: string,
    details?: Record<string, unknown>
  ) {
    const fixKey = details?.galleryId
      ? `${userId}-${details.galleryId}`
      : userId;
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

  async function handleBatchFix() {
    setBatchFixing(true);

    try {
      const response = await fetch("/api/admin/data-integrity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fix_gallery" }),
      });

      const data = await response.json();

      // Update results
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

      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (error) {
      console.error("Batch fix failed:", error);
    } finally {
      setBatchFixing(false);
    }
  }

  const countByType: Record<GalleryIssueType, number> = {
    all: issues.length,
    no_gallery_photos: issues.filter((i) => i.issueType === "no_gallery_photos")
      .length,
    missing_primary_photo: issues.filter(
      (i) => i.issueType === "missing_primary_photo"
    ).length,
    broken_primary_photo: issues.filter(
      (i) => i.issueType === "broken_primary_photo"
    ).length,
    orphaned_gallery_record: issues.filter(
      (i) => i.issueType === "orphaned_gallery_record"
    ).length,
  };

  const autoFixableCount = filteredIssues.filter(
    (i) =>
      i.autoFixable &&
      !fixResults[
        i.details?.galleryId ? `${i.userId}-${i.details.galleryId}` : i.userId
      ]?.success
  ).length;

  function getIssueIcon(type: string) {
    switch (type) {
      case "no_gallery_photos":
        return <ImageOff className="w-3 h-3" />;
      case "missing_primary_photo":
        return <Image className="w-3 h-3" />;
      case "broken_primary_photo":
        return <AlertTriangle className="w-3 h-3" />;
      case "orphaned_gallery_record":
        return <Trash2 className="w-3 h-3" />;
      default:
        return <Image className="w-3 h-3" />;
    }
  }

  function getIssueLabel(type: string) {
    switch (type) {
      case "no_gallery_photos":
        return "No Photos";
      case "missing_primary_photo":
        return "No Primary";
      case "broken_primary_photo":
        return "Broken Primary";
      case "orphaned_gallery_record":
        return "Orphaned";
      default:
        return type;
    }
  }

  if (issues.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          All Galleries Healthy
        </h3>
        <p className="text-gray-500">
          No gallery integrity issues detected.
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
                setFilterType(e.target.value as GalleryIssueType)
              }
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Issues ({countByType.all})</option>
              <option value="no_gallery_photos">
                No Photos ({countByType.no_gallery_photos})
              </option>
              <option value="missing_primary_photo">
                Missing Primary ({countByType.missing_primary_photo})
              </option>
              <option value="broken_primary_photo">
                Broken Primary ({countByType.broken_primary_photo})
              </option>
              <option value="orphaned_gallery_record">
                Orphaned Records ({countByType.orphaned_gallery_record})
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
                Fix All ({autoFixableCount})
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
                  ? `${issue.userId}-${issue.details.galleryId}`
                  : issue.userId;
                const result = fixResults[fixKey];
                const isFixing = fixingId === fixKey;

                return (
                  <tr
                    key={`${issue.userId}-${issue.issueType}-${idx}`}
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
                          issue.issueType === "broken_primary_photo"
                            ? "bg-red-100 text-red-800"
                            : issue.issueType === "orphaned_gallery_record"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {getIssueIcon(issue.issueType)}
                        {getIssueLabel(issue.issueType)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 max-w-xs">
                        {issue.description}
                      </p>
                      {typeof issue.details?.galleryId === "string" && (
                        <p className="text-xs text-gray-400 mt-1 font-mono">
                          ID: {issue.details.galleryId.substring(0, 8)}...
                        </p>
                      )}
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
                      ) : (
                        <span className="text-xs text-gray-400">
                          User action needed
                        </span>
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
