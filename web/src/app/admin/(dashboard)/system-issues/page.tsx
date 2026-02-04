"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Check,
  Filter,
} from "lucide-react";
import { AdminPageHeader, AdminButton } from "@/components/admin/AdminPageHeader";
import type { SystemIssue } from "@/app/api/admin/system-issues/route";

interface SystemIssuesResponse {
  issues: SystemIssue[];
  total: number;
  limit: number;
  offset: number;
  summary: {
    unresolved: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

const severityConfig = {
  critical: { label: "Critical", color: "bg-red-100 text-red-800", icon: AlertTriangle },
  high: { label: "High", color: "bg-orange-100 text-orange-800", icon: AlertCircle },
  medium: { label: "Medium", color: "bg-amber-100 text-amber-800", icon: Info },
  low: { label: "Low", color: "bg-blue-100 text-blue-800", icon: Info },
};

export default function SystemIssuesPage() {
  const [data, setData] = useState<SystemIssuesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unresolved" | "resolved">("unresolved");
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [resolvingIds, setResolvingIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.set("resolved", filter === "resolved" ? "true" : "false");
      }
      if (severityFilter) {
        params.set("severity", severityFilter);
      }
      params.set("limit", "100");

      const res = await fetch(`/api/admin/system-issues?${params}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.error("Failed to fetch system issues:", err);
    } finally {
      setLoading(false);
    }
  }, [filter, severityFilter]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleResolve = async (issueId: string) => {
    setResolvingIds((prev) => new Set(prev).add(issueId));
    try {
      const res = await fetch("/api/admin/system-issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve", issueId }),
      });

      if (res.ok) {
        fetchIssues();
      }
    } catch (err) {
      console.error("Failed to resolve issue:", err);
    } finally {
      setResolvingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(issueId);
        return newSet;
      });
    }
  };

  const handleBulkResolve = async () => {
    if (selectedIds.size === 0) return;

    setResolvingIds(new Set(selectedIds));
    try {
      const res = await fetch("/api/admin/system-issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_resolve",
          issueIds: Array.from(selectedIds),
        }),
      });

      if (res.ok) {
        setSelectedIds(new Set());
        fetchIssues();
      }
    } catch (err) {
      console.error("Failed to bulk resolve issues:", err);
    } finally {
      setResolvingIds(new Set());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="System Issues"
        subtitle="Automated issue tracking and monitoring"
        variant="hero"
        iconName="alert-triangle"
        iconGradient="from-red-500 to-orange-500"
      >
        <AdminButton
          variant="secondary"
          iconName="refresh-cw"
          onClick={fetchIssues}
          loading={loading}
        >
          Refresh
        </AdminButton>
      </AdminPageHeader>

      {/* Summary Stats */}
      {data?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <p className="text-sm text-gray-500">Unresolved</p>
            <p className="text-2xl font-bold text-gray-900">{data.summary.unresolved}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <p className="text-sm text-gray-500">Critical</p>
            <p className="text-2xl font-bold text-red-600">{data.summary.critical}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <p className="text-sm text-gray-500">High</p>
            <p className="text-2xl font-bold text-orange-600">{data.summary.high}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <p className="text-sm text-gray-500">Medium</p>
            <p className="text-2xl font-bold text-amber-600">{data.summary.medium}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <p className="text-sm text-gray-500">Low</p>
            <p className="text-2xl font-bold text-blue-600">{data.summary.low}</p>
          </div>
        </div>
      )}

      {/* Filters & Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filter:</span>
          </div>
          
          <div className="flex gap-2">
            {(["unresolved", "all", "resolved"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === f
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <select
            value={severityFilter || ""}
            onChange={(e) => setSeverityFilter(e.target.value || null)}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {selectedIds.size > 0 && (
          <button
            onClick={handleBulkResolve}
            disabled={resolvingIds.size > 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {resolvingIds.size > 0 ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Resolve {selectedIds.size} Selected
          </button>
        )}
      </div>

      {/* Issues List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-slate-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading system issues...</p>
          </div>
        </div>
      ) : data?.issues.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Issues Found</h3>
            <p className="text-gray-600">
              {filter === "unresolved"
                ? "No unresolved system issues. Everything looks good!"
                : "No system issues matching your filters."}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {data?.issues.map((issue) => {
              const config = severityConfig[issue.severity];
              const Icon = config.icon;
              const isExpanded = expandedIds.has(issue.id);
              const isResolving = resolvingIds.has(issue.id);
              const isSelected = selectedIds.has(issue.id);

              return (
                <div key={issue.id} className="px-6 py-4">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    {!issue.resolved && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(issue.id)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    )}

                    {/* Severity Icon */}
                    <div className={`w-8 h-8 ${config.color.split(" ")[0]} rounded-lg flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${config.color.split(" ")[1]}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {issue.issue_type.replace(/_/g, " ")}
                        </span>
                        {issue.resolved && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3" />
                            Resolved
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(issue.created_at).toLocaleString()}
                        </span>
                        {issue.user && (
                          <Link
                            href={`/admin/users/${issue.user_id}`}
                            className="text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            {issue.user.display_name || issue.user.email}
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                        {issue.target_user && (
                          <>
                            <span>→</span>
                            <Link
                              href={`/admin/users/${issue.target_user_id}`}
                              className="text-blue-600 hover:underline inline-flex items-center gap-1"
                            >
                              {issue.target_user.display_name || issue.target_user.email}
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleExpand(issue.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      {!issue.resolved && (
                        <button
                          onClick={() => handleResolve(issue.id)}
                          disabled={isResolving}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          {isResolving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 ml-12 p-4 bg-gray-50 rounded-lg text-sm">
                      {issue.context && (
                        <div className="mb-3">
                          <p className="font-medium text-gray-700 mb-1">Context:</p>
                          <pre className="p-3 bg-white border border-gray-200 rounded text-xs overflow-x-auto">
                            {JSON.stringify(issue.context, null, 2)}
                          </pre>
                        </div>
                      )}

                      {issue.resolved && (
                        <div className="space-y-2">
                          <p className="text-gray-500">
                            <span className="font-medium">Resolved at:</span>{" "}
                            {issue.resolved_at ? new Date(issue.resolved_at).toLocaleString() : "N/A"}
                          </p>
                          {issue.resolution_notes && (
                            <p className="text-gray-500">
                              <span className="font-medium">Notes:</span> {issue.resolution_notes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination Info */}
          {data && data.total > data.limit && (
            <div className="px-6 py-4 border-t border-gray-100 text-sm text-gray-500 text-center">
              Showing {data.issues.length} of {data.total} issues
            </div>
          )}
        </div>
      )}
    </div>
  );
}
