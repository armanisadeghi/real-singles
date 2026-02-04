"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart,
  MessageSquare,
  Users,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import type { MatchIntegrityIssue } from "@/app/api/admin/data-integrity/matches/route";

interface MatchesIssuesListProps {
  issues: MatchIntegrityIssue[];
  onRefresh: () => void;
}

const issueTypeConfig = {
  duplicate_match: {
    icon: Heart,
    label: "Duplicate Match",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  duplicate_conversation: {
    icon: MessageSquare,
    label: "Duplicate Conversation",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  orphaned_conversation: {
    icon: Users,
    label: "Orphaned Conversation",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
};

const severityConfig = {
  critical: { label: "Critical", color: "bg-red-100 text-red-800" },
  warning: { label: "Warning", color: "bg-amber-100 text-amber-800" },
  info: { label: "Info", color: "bg-blue-100 text-blue-800" },
};

export function MatchesIssuesList({ issues, onRefresh }: MatchesIssuesListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [fixingIds, setFixingIds] = useState<Set<string>>(new Set());
  const [fixedIds, setFixedIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleFix = async (issue: MatchIntegrityIssue) => {
    setFixingIds((prev) => new Set(prev).add(issue.id));
    setErrors((prev) => {
      const newErrors = new Map(prev);
      newErrors.delete(issue.id);
      return newErrors;
    });

    try {
      let action: string;
      let details: Record<string, any>;

      switch (issue.issueType) {
        case "duplicate_match":
          action = "fix_duplicate_matches";
          details = { matchIds: issue.details.matchIds };
          break;
        case "duplicate_conversation":
          action = "fix_duplicate_conversations";
          details = { conversationIds: issue.details.conversationIds };
          break;
        case "orphaned_conversation":
          action = "fix_orphaned_conversations";
          details = { conversationIds: issue.details.conversationIds };
          break;
        default:
          throw new Error("Unknown issue type");
      }

      const res = await fetch("/api/admin/data-integrity/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, details }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Fix failed");
      }

      setFixedIds((prev) => new Set(prev).add(issue.id));
      
      // Refresh the list after a short delay
      setTimeout(() => {
        onRefresh();
      }, 1500);
    } catch (err) {
      setErrors((prev) => {
        const newErrors = new Map(prev);
        newErrors.set(issue.id, err instanceof Error ? err.message : "Fix failed");
        return newErrors;
      });
    } finally {
      setFixingIds((prev) => {
        const newFixing = new Set(prev);
        newFixing.delete(issue.id);
        return newFixing;
      });
    }
  };

  if (issues.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Issues Found</h3>
        <p className="text-gray-600">
          All matches and conversations are in good shape. No duplicates or orphaned records detected.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Issues ({issues.length})
        </h2>
      </div>

      <div className="divide-y divide-gray-100">
        {issues.map((issue) => {
          const config = issueTypeConfig[issue.issueType];
          const severityConf = severityConfig[issue.severity];
          const Icon = config.icon;
          const isExpanded = expandedIds.has(issue.id);
          const isFixing = fixingIds.has(issue.id);
          const isFixed = fixedIds.has(issue.id);
          const error = errors.get(issue.id);

          return (
            <div key={issue.id} className="px-6 py-4">
              {/* Main row */}
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${severityConf.color}`}>
                      {severityConf.label}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {config.label}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">{issue.description}</p>

                  {/* User info */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <div>
                      <span className="font-medium">User 1:</span>{" "}
                      <Link
                        href={`/admin/users/${issue.user1Id}`}
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        {issue.user1Name || issue.user1Email || issue.user1Id.substring(0, 8)}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                    {issue.user2Id !== "missing" && (
                      <div>
                        <span className="font-medium">User 2:</span>{" "}
                        <Link
                          href={`/admin/users/${issue.user2Id}`}
                          className="text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          {issue.user2Name || issue.user2Email || issue.user2Id.substring(0, 8)}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {error}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleExpand(issue.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="View details"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {issue.autoFixable && !isFixed && (
                    <button
                      onClick={() => handleFix(issue)}
                      disabled={isFixing}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-pink-600 rounded-lg hover:bg-pink-700 disabled:opacity-50 transition-colors"
                    >
                      {isFixing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Fixing...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Fix
                        </>
                      )}
                    </button>
                  )}

                  {isFixed && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                      Fixed
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-4 ml-14 p-4 bg-gray-50 rounded-lg text-sm">
                  {issue.details.matchIds && (
                    <div className="mb-3">
                      <p className="font-medium text-gray-700 mb-1">Match IDs:</p>
                      <div className="flex flex-wrap gap-2">
                        {issue.details.matchIds.map((id) => (
                          <code key={id} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs">
                            {id.substring(0, 12)}...
                          </code>
                        ))}
                      </div>
                    </div>
                  )}

                  {issue.details.conversationIds && (
                    <div className="mb-3">
                      <p className="font-medium text-gray-700 mb-1">Conversation IDs:</p>
                      <div className="flex flex-wrap gap-2">
                        {issue.details.conversationIds.map((id) => (
                          <code key={id} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs">
                            {id.substring(0, 12)}...
                          </code>
                        ))}
                      </div>
                    </div>
                  )}

                  {issue.details.actionCounts && (
                    <div className="mb-3">
                      <p className="font-medium text-gray-700 mb-1">Action Counts:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(issue.details.actionCounts).map(([action, count]) => (
                          <span key={action} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs">
                            {action}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {issue.details.createdDates && (
                    <div>
                      <p className="font-medium text-gray-700 mb-1">Created Dates:</p>
                      <div className="flex flex-wrap gap-2">
                        {issue.details.createdDates.map((date, idx) => (
                          <span key={idx} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs">
                            {new Date(date).toLocaleString()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
