"use client";

import { useState, useEffect } from "react";
import { 
  GitBranch, 
  GitCommit, 
  Clock, 
  Calendar,
  TrendingUp,
  RefreshCw,
  Loader2,
  AlertCircle,
  Package,
  Activity,
  MessageSquare,
  FileText,
  Plus,
  Minus,
} from "lucide-react";
import { AdminPageHeader, AdminButton } from "@/components/admin/AdminPageHeader";
import { formatRelativeTime } from "@/lib/utils";

interface Version {
  id: string;
  version: string;
  build_number: number;
  git_commit: string | null;
  commit_message: string | null;
  lines_added: number | null;
  lines_deleted: number | null;
  files_changed: number | null;
  deployed_at: string;
  created_at: string;
  deployment_status?: string | null;
  vercel_deployment_id?: string | null;
  vercel_deployment_url?: string | null;
  deployment_error?: string | null;
}

interface VersionHistoryResponse {
  versions: Version[];
  total: number;
  limit: number;
  offset: number;
}

interface DeploymentStats {
  deploymentsThisWeek: number;
  deploymentsThisMonth: number;
  averageTimeBetweenDeployments: string;
}

export default function AppVersionPage() {
  const [currentVersion, setCurrentVersion] = useState<Version | null>(null);
  const [history, setHistory] = useState<Version[]>([]);
  const [stats, setStats] = useState<DeploymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const truncateMessage = (message: string | null, maxLength: number = 50): { text: string; isTruncated: boolean } => {
    if (!message) return { text: "No commit message", isTruncated: false };
    if (message.length <= maxLength) return { text: message, isTruncated: false };
    return { text: message.substring(0, maxLength) + "...", isTruncated: true };
  };

  const toggleMessageExpansion = (versionId: string) => {
    setExpandedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(versionId)) {
        next.delete(versionId);
      } else {
        next.add(versionId);
      }
      return next;
    });
  };

  const fetchVersionData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Fetch current version and history in parallel
      const [versionRes, historyRes] = await Promise.all([
        fetch("/api/version"),
        fetch("/api/version/history?limit=20&offset=0"),
      ]);

      if (!versionRes.ok || !historyRes.ok) {
        throw new Error("Failed to fetch version data");
      }

      const versionData = await versionRes.json();
      const historyData: VersionHistoryResponse = await historyRes.json();

      // Set current version
      setCurrentVersion({
        id: "",
        version: versionData.version,
        build_number: versionData.buildNumber,
        git_commit: versionData.gitCommit,
        commit_message: versionData.commitMessage || null,
        lines_added: versionData.linesAdded || null,
        lines_deleted: versionData.linesDeleted || null,
        files_changed: versionData.filesChanged || null,
        deployed_at: versionData.deployedAt,
        created_at: versionData.deployedAt,
        deployment_status: versionData.deploymentStatus || null,
        vercel_deployment_url: versionData.vercelDeploymentUrl || null,
        deployment_error: versionData.deploymentError || null,
      });

      // Set history
      setHistory(historyData.versions);
      setTotal(historyData.total);
      setHasMore(historyData.versions.length < historyData.total);

      // Calculate stats
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const deploymentsThisWeek = historyData.versions.filter(
        (v) => new Date(v.deployed_at) >= oneWeekAgo
      ).length;

      const deploymentsThisMonth = historyData.versions.filter(
        (v) => new Date(v.deployed_at) >= oneMonthAgo
      ).length;

      // Calculate average time between deployments
      let averageTimeBetweenDeployments = "N/A";
      if (historyData.versions.length > 1) {
        const times = historyData.versions
          .map((v) => new Date(v.deployed_at).getTime())
          .sort((a, b) => b - a);

        let totalDiff = 0;
        for (let i = 0; i < times.length - 1; i++) {
          totalDiff += times[i] - times[i + 1];
        }

        const avgDiffMs = totalDiff / (times.length - 1);
        const avgDiffHours = avgDiffMs / (1000 * 60 * 60);

        if (avgDiffHours < 24) {
          averageTimeBetweenDeployments = `${Math.round(avgDiffHours)}h`;
        } else {
          averageTimeBetweenDeployments = `${Math.round(avgDiffHours / 24)}d`;
        }
      }

      setStats({
        deploymentsThisWeek,
        deploymentsThisMonth,
        averageTimeBetweenDeployments,
      });
    } catch (err) {
      console.error("Error fetching version data:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVersionData();
  }, []);

  const handleRefresh = () => {
    fetchVersionData(true);
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const offset = history.length;
      const res = await fetch(`/api/version/history?limit=20&offset=${offset}`);
      
      if (!res.ok) {
        throw new Error("Failed to load more versions");
      }

      const data: VersionHistoryResponse = await res.json();
      setHistory(prev => [...prev, ...data.versions]);
      setHasMore(history.length + data.versions.length < data.total);
    } catch (err) {
      console.error("Error loading more versions:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const getDeploymentStatusBadge = (status?: string | null) => {
    if (!status || status === "pending") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
          <Clock className="w-3.5 h-3.5" />
          Pending
        </span>
      );
    }
    if (status === "building") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Building
        </span>
      );
    }
    if (status === "ready") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Deployed
        </span>
      );
    }
    if (status === "error") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <AlertCircle className="w-3.5 h-3.5" />
          Failed
        </span>
      );
    }
    if (status === "canceled") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Canceled
        </span>
      );
    }
    return null;
  };

  if (loading && !currentVersion) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="App Version"
          subtitle="View deployment history and current app version"
          variant="hero"
          iconName="cog"
          iconGradient="from-violet-500 to-purple-600"
        />

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-violet-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Loading Version Data...
            </h2>
            <p className="text-slate-600">
              Fetching current version and deployment history
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !currentVersion) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="App Version"
          subtitle="View deployment history and current app version"
          variant="hero"
          iconName="cog"
          iconGradient="from-violet-500 to-purple-600"
        />

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Failed to Load Version Data
            </h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <AdminButton onClick={handleRefresh} iconName="refresh-cw">
              Try Again
            </AdminButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="App Version"
        subtitle="View deployment history and current app version"
        variant="hero"
        iconName="cog"
        iconGradient="from-violet-500 to-purple-600"
      >
        <AdminButton
          variant="secondary"
          iconName="refresh-cw"
          onClick={handleRefresh}
          loading={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </AdminButton>
      </AdminPageHeader>

      {/* Current Version - Large Prominent Display */}
      <div 
        className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-2xl shadow-lg p-8
          opacity-100 translate-y-0
          [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
          [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/90">Current Version</h2>
              <p className="text-sm text-white/60">Currently deployed to production</p>
            </div>
          </div>
          {currentVersion && (
            <div className="text-right">
              <p className="text-sm text-white/60">Build Number</p>
              <p className="text-2xl font-bold text-white">{currentVersion.build_number}</p>
            </div>
          )}
        </div>

        <div className="text-center py-6">
          <div className="inline-flex items-baseline gap-3">
            <span className="text-white/60 text-2xl font-medium">v</span>
            <span className="text-7xl font-bold text-white tracking-tight">
              {currentVersion?.version || "0.0.0"}
            </span>
          </div>
        </div>

        {currentVersion && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-white/60" />
                <div>
                  <p className="text-xs text-white/60">Deployed</p>
                  <p className="text-sm font-medium text-white">
                    {formatRelativeTime(currentVersion.deployed_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-white/60" />
                <div>
                  <p className="text-xs text-white/60">Deploy Time</p>
                  <p className="text-sm font-medium text-white">
                    {new Date(currentVersion.deployed_at).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <GitCommit className="w-5 h-5 text-white/60" />
                <div>
                  <p className="text-xs text-white/60">Git Commit</p>
                  <p className="text-sm font-medium text-white font-mono">
                    {currentVersion.git_commit?.substring(0, 7) || "N/A"}
                  </p>
                </div>
              </div>
            </div>
            
            {currentVersion.commit_message && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-white/60 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-white/60 mb-1">Commit Message</p>
                    <p className="text-sm font-medium text-white">{currentVersion.commit_message}</p>
                  </div>
                </div>
              </div>
            )}

            {currentVersion.files_changed !== null && currentVersion.lines_added !== null && currentVersion.lines_deleted !== null && (
              <div className="mt-3 flex items-center gap-4 text-white/90">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-white/60" />
                  <span className="text-sm font-medium">{currentVersion.files_changed} files</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-emerald-300" />
                    <span className="text-sm font-medium">{currentVersion.lines_added}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Minus className="w-4 h-4 text-red-300" />
                    <span className="text-sm font-medium">{currentVersion.lines_deleted}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Deployment Statistics */}
      {stats && (
        <div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4
            opacity-100 translate-y-0
            [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
            [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
          style={{ transitionDelay: "50ms" }}
        >
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">This Week</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {stats.deploymentsThisWeek}
                </p>
                <p className="text-xs text-slate-400 mt-1">deployments</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">This Month</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {stats.deploymentsThisMonth}
                </p>
                <p className="text-xs text-slate-400 mt-1">deployments</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Avg Frequency</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {stats.averageTimeBetweenDeployments}
                </p>
                <p className="text-xs text-slate-400 mt-1">between deploys</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Version History Table */}
      <div 
        className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden
          opacity-100 translate-y-0
          [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
          [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
        style={{ transitionDelay: "100ms" }}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Version History</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Deployment history and status tracking
            </p>
          </div>
          <div className="text-sm text-slate-500">
            {history.length} of {total} versions
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Build
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Changes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Deployed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Commit
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <GitBranch className="w-12 h-12 text-slate-300" />
                      <p className="text-sm text-slate-500">No version history found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                history.map((version, index) => {
                  const isLatest = index === 0;
                  const isExpanded = expandedMessages.has(version.id);
                  const { text: messageText, isTruncated } = truncateMessage(version.commit_message);
                  const displayMessage = isExpanded ? version.commit_message : messageText;
                  
                  return (
                    <tr 
                      key={version.id || index}
                      className={`hover:bg-slate-50 transition-colors ${
                        isLatest ? "bg-violet-50/30" : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 font-mono">
                            v{version.version}
                          </span>
                          {isLatest && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                              Current
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-600 font-mono">
                          #{version.build_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getDeploymentStatusBadge(version.deployment_status)}
                        {version.deployment_status === "ready" && version.vercel_deployment_url && (
                          <a 
                            href={version.vercel_deployment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-xs text-violet-600 hover:text-violet-700 underline"
                          >
                            View
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm text-slate-700 ${isExpanded ? "" : "truncate"}`}>
                              {displayMessage || "No commit message"}
                            </p>
                            {isTruncated && (
                              <button
                                onClick={() => toggleMessageExpansion(version.id)}
                                className="text-xs text-violet-600 hover:text-violet-700 font-medium mt-1"
                              >
                                {isExpanded ? "Show less" : "Show more"}
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {version.files_changed !== null && version.lines_added !== null && version.lines_deleted !== null ? (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-slate-600">
                              <FileText className="w-4 h-4" />
                              <span className="text-sm font-medium">{version.files_changed}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-emerald-600">
                                <Plus className="w-3.5 h-3.5" />
                                <span className="text-sm font-medium">{version.lines_added}</span>
                              </div>
                              <div className="flex items-center gap-1 text-red-600">
                                <Minus className="w-3.5 h-3.5" />
                                <span className="text-sm font-medium">{version.lines_deleted}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">No data</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-900">
                          {formatRelativeTime(version.deployed_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {version.git_commit ? (
                          <code className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded font-mono">
                            {version.git_commit.substring(0, 7)}
                          </code>
                        ) : (
                          <span className="text-sm text-slate-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {hasMore && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Showing {history.length} of {total} versions
            </p>
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Load More
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div 
        className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3
          opacity-100 translate-y-0
          [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
          [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
        style={{ transitionDelay: "150ms" }}
      >
        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900">Version Tracking Information</p>
          <p className="text-sm text-blue-700 mt-1">
            Version data is automatically updated on each deployment. The version history shows
            all deployments to production. Users are notified when a new version is available.
          </p>
        </div>
      </div>
    </div>
  );
}
