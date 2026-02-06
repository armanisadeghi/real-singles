"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileWarning,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  MessageSquare,
  User,
  AlertTriangle,
  Flag,
} from "lucide-react";
import { RouteModal } from "@/components/ui/RouteModal";
import { EmailComposeSheet } from "@/components/admin/EmailComposeSheet";
import { DMComposeSheet } from "@/components/admin/DMComposeSheet";

// ─── Types ────────────────────────────────────────────────────────
type ReportStatus = "pending" | "resolved" | "dismissed";

interface ReportUser {
  id: string;
  email?: string;
  display_name?: string | null;
}

interface ReportMetrics {
  times_reported: number;
  times_reporter_has_reported: number;
}

interface Report {
  id: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  created_at: string | null;
  reviewed_at: string | null;
  resolution_notes: string | null;
  reporter_id: string | null;
  reported_user_id: string | null;
  reviewed_by: string | null;
  reporter: ReportUser | null;
  reported: ReportUser | null;
  reviewer: ReportUser | null;
  metrics: ReportMetrics;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface ReportsManagerProps {
  initialCounts: {
    pending: number;
    resolved: number;
    dismissed: number;
  };
}

// ─── Email target type ────────────────────────────────────────────
interface EmailTarget {
  id: string;
  email: string;
  name: string;
  role: "reporter" | "reported";
  reportReason: string;
}

// ─── DM target type ───────────────────────────────────────────────
interface DMTarget {
  id: string;
  name: string;
  role: "reporter" | "reported";
  reportReason: string;
}

// ─── Profile modal state ─────────────────────────────────────────
interface ProfileModalState {
  userId: string;
  userName: string;
}

// ─── Status config ────────────────────────────────────────────────
function getStatusConfig(status: ReportStatus) {
  switch (status) {
    case "pending":
      return {
        bg: "bg-amber-100",
        text: "text-amber-800",
        icon: Clock,
        label: "Pending",
      };
    case "resolved":
      return {
        bg: "bg-emerald-100",
        text: "text-emerald-800",
        icon: CheckCircle,
        label: "Resolved",
      };
    case "dismissed":
      return {
        bg: "bg-slate-100",
        text: "text-slate-600",
        icon: XCircle,
        label: "Dismissed",
      };
    default:
      return {
        bg: "bg-slate-100",
        text: "text-slate-800",
        icon: FileWarning,
        label: status,
      };
  }
}

// ─── Main component ───────────────────────────────────────────────
export function ReportsManager({ initialCounts }: ReportsManagerProps) {
  const [activeTab, setActiveTab] = useState<ReportStatus>("pending");
  const [reports, setReports] = useState<Report[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [counts, setCounts] = useState(initialCounts);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Email compose state
  const [emailTarget, setEmailTarget] = useState<EmailTarget | null>(null);

  // Profile modal state
  const [profileModal, setProfileModal] = useState<ProfileModalState | null>(
    null
  );

  // DM compose state
  const [dmTarget, setDmTarget] = useState<DMTarget | null>(null);

  // Fetch reports for the active tab and page
  const fetchReports = useCallback(
    async (status: ReportStatus, page: number) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/reports?status=${status}&page=${page}&limit=20`
        );
        const json = await res.json();

        if (json.success) {
          setReports(json.data.reports);
          setPagination(json.data.pagination);
        } else {
          console.error("Failed to fetch reports:", json.msg);
          setReports([]);
        }
      } catch (err) {
        console.error("Error fetching reports:", err);
        setReports([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load reports when tab changes
  useEffect(() => {
    fetchReports(activeTab, 1);
  }, [activeTab, fetchReports]);

  // Handle resolve/dismiss actions
  async function handleAction(
    reportId: string,
    action: "resolved" | "dismissed"
  ) {
    setActionLoading(reportId);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();

      if (json.success) {
        // Remove the report from the current list
        setReports((prev) => prev.filter((r) => r.id !== reportId));

        // Update counts
        setCounts((prev) => ({
          ...prev,
          pending: Math.max(0, prev.pending - 1),
          [action]: prev[action] + 1,
        }));

        // Update pagination total
        setPagination((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          totalPages: Math.ceil(Math.max(0, prev.total - 1) / prev.limit),
        }));
      } else {
        alert(json.msg || "Failed to update report");
      }
    } catch (err) {
      console.error("Error updating report:", err);
      alert("An error occurred. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  // Handle DM — opens the compose sheet
  function handleDM(target: DMTarget) {
    setDmTarget(target);
  }

  function handlePageChange(newPage: number) {
    setPagination((prev) => ({ ...prev, page: newPage }));
    fetchReports(activeTab, newPage);
  }

  function handleTabChange(tab: ReportStatus) {
    setActiveTab(tab);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }

  // ─── Tab bar ──────────────────────────────────────────────────────
  const tabs: { key: ReportStatus; label: string; count: number }[] = [
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "resolved", label: "Resolved", count: counts.resolved },
    { key: "dismissed", label: "Dismissed", count: counts.dismissed },
  ];

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
              ${
                activeTab === tab.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }
            `}
          >
            {tab.label}
            <span
              className={`
              inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-xs font-semibold rounded-full
              ${
                activeTab === tab.key
                  ? tab.key === "pending"
                    ? "bg-amber-100 text-amber-800"
                    : tab.key === "resolved"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-600"
                  : "bg-slate-200 text-slate-500"
              }
            `}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 text-center">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <EmptyState status={activeTab} />
      ) : (
        <>
          <div className="space-y-4">
            {reports.map((report, index) => (
              <ReportCard
                key={report.id}
                report={report}
                index={index}
                onAction={handleAction}
                isActionLoading={actionLoading === report.id}
                onEmail={(target) => setEmailTarget(target)}
                onDM={(target) => setDmTarget(target)}
                onViewProfile={(userId, userName) =>
                  setProfileModal({ userId, userName })
                }
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <PaginationControls
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      {/* Email compose sheet */}
      {emailTarget && (
        <EmailComposeSheet
          isOpen={true}
          onClose={() => setEmailTarget(null)}
          recipients={[
            {
              id: emailTarget.id,
              email: emailTarget.email,
              name: emailTarget.name,
            },
          ]}
          defaultSubject={
            emailTarget.role === "reported"
              ? `Regarding a report about your account`
              : `Update on your report`
          }
          defaultMessage={
            emailTarget.role === "reported"
              ? `Hi ${emailTarget.name},\n\nWe received a report regarding your account for "${emailTarget.reportReason}". We wanted to reach out to discuss this matter.\n\n`
              : `Hi ${emailTarget.name},\n\nThank you for bringing this to our attention. We're writing to update you on the report you submitted regarding "${emailTarget.reportReason}".\n\n`
          }
          title={`Email ${emailTarget.role === "reported" ? "Reported User" : "Reporter"}`}
        />
      )}

      {/* DM compose sheet */}
      {dmTarget && (
        <DMComposeSheet
          isOpen={true}
          onClose={() => setDmTarget(null)}
          recipient={{ id: dmTarget.id, name: dmTarget.name }}
          context={`Regarding report: ${dmTarget.reportReason}`}
          defaultMessage={
            dmTarget.role === "reported"
              ? `Hi ${dmTarget.name},\n\nWe're reaching out regarding a report about your account for "${dmTarget.reportReason}". We wanted to discuss this with you.\n\n`
              : `Hi ${dmTarget.name},\n\nThank you for your report regarding "${dmTarget.reportReason}". We wanted to follow up with you about this.\n\n`
          }
          title={`DM ${dmTarget.role === "reported" ? "Reported User" : "Reporter"}`}
        />
      )}

      {/* Profile preview modal */}
      {profileModal && (
        <RouteModal
          isOpen={true}
          onClose={() => setProfileModal(null)}
          url={`/admin/users/${profileModal.userId}`}
          title={`Profile: ${profileModal.userName}`}
        />
      )}
    </div>
  );
}

// ─── Report card ──────────────────────────────────────────────────
function ReportCard({
  report,
  index,
  onAction,
  isActionLoading,
  onEmail,
  onDM,
  onViewProfile,
}: {
  report: Report;
  index: number;
  onAction: (id: string, action: "resolved" | "dismissed") => void;
  isActionLoading: boolean;
  onEmail: (target: EmailTarget) => void;
  onDM: (target: DMTarget) => void;
  onViewProfile: (userId: string, userName: string) => void;
}) {
  const statusConfig = getStatusConfig(report.status);
  const StatusIcon = statusConfig.icon;

  const reporterName =
    report.reporter?.display_name || report.reporter?.email || "Unknown";
  const reportedName =
    report.reported?.display_name || report.reported?.email || "Unknown";

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6
        opacity-100 translate-y-0
        [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
        [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
      style={{
        transitionDelay: `${index * 50}ms`,
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* Header row */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${statusConfig.bg} ${statusConfig.text}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {statusConfig.label}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            {report.reason}
          </h3>
          {report.description && (
            <p className="text-slate-600 text-sm">{report.description}</p>
          )}
        </div>
        <div className="text-sm text-slate-500 shrink-0">
          {report.created_at
            ? new Date(report.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })
            : "N/A"}
        </div>
      </div>

      {/* People + Metrics section */}
      <div className="mt-4 pt-4 border-t border-slate-200/80">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Reporter card */}
          <PersonCard
            label="Reporter"
            userId={report.reporter_id}
            user={report.reporter}
            displayName={reporterName}
            metricLabel="reports filed"
            metricValue={report.metrics.times_reporter_has_reported}
            metricIcon={
              <Flag className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            }
            onEmail={
              report.reporter?.email
                ? () =>
                    onEmail({
                      id: report.reporter_id!,
                      email: report.reporter!.email!,
                      name: reporterName,
                      role: "reporter",
                      reportReason: report.reason,
                    })
                : undefined
            }
            onDM={
              report.reporter_id
                ? () =>
                    onDM({
                      id: report.reporter_id!,
                      name: reporterName,
                      role: "reporter",
                      reportReason: report.reason,
                    })
                : undefined
            }
            onViewProfile={
              report.reporter_id
                ? () => onViewProfile(report.reporter_id!, reporterName)
                : undefined
            }
          />

          {/* Reported user card */}
          <PersonCard
            label="Reported User"
            userId={report.reported_user_id}
            user={report.reported}
            displayName={reportedName}
            metricLabel="times reported"
            metricValue={report.metrics.times_reported}
            metricIcon={
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            }
            metricHighlight={report.metrics.times_reported >= 3}
            onEmail={
              report.reported?.email
                ? () =>
                    onEmail({
                      id: report.reported_user_id!,
                      email: report.reported!.email!,
                      name: reportedName,
                      role: "reported",
                      reportReason: report.reason,
                    })
                : undefined
            }
            onDM={
              report.reported_user_id
                ? () =>
                    onDM({
                      id: report.reported_user_id!,
                      name: reportedName,
                      role: "reported",
                      reportReason: report.reason,
                    })
                : undefined
            }
            onViewProfile={
              report.reported_user_id
                ? () =>
                    onViewProfile(report.reported_user_id!, reportedName)
                : undefined
            }
          />
        </div>
      </div>

      {/* Reviewed info for resolved/dismissed */}
      {report.status !== "pending" && (
        <div className="mt-3 pt-3 border-t border-slate-200/80 text-sm text-slate-500 space-y-1">
          <div className="flex items-center gap-2">
            <span>Reviewed by:</span>
            <span className="font-medium text-slate-700">
              {report.reviewer?.display_name ||
                report.reviewer?.email ||
                "System"}
            </span>
            {report.reviewed_at && (
              <span>
                on{" "}
                {new Date(report.reviewed_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
          {report.resolution_notes && (
            <div className="flex items-start gap-2">
              <span className="shrink-0">Notes:</span>
              <span className="font-medium text-slate-700">
                {report.resolution_notes}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Action buttons for pending reports */}
      {report.status === "pending" && (
        <div className="mt-4 pt-4 border-t border-slate-200/80 flex gap-2">
          <button
            onClick={() => onAction(report.id, "resolved")}
            disabled={isActionLoading}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg
              hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isActionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Resolve
          </button>
          <button
            onClick={() => onAction(report.id, "dismissed")}
            disabled={isActionLoading}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg
              hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isActionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Person card (reporter or reported user) ──────────────────────
function PersonCard({
  label,
  userId,
  user,
  displayName,
  metricLabel,
  metricValue,
  metricIcon,
  metricHighlight = false,
  onEmail,
  onDM,
  onViewProfile,
}: {
  label: string;
  userId: string | null;
  user: ReportUser | null;
  displayName: string;
  metricLabel: string;
  metricValue: number;
  metricIcon: React.ReactNode;
  metricHighlight?: boolean;
  onEmail?: () => void;
  onDM?: () => void;
  onViewProfile?: () => void;
}) {
  return (
    <div className="bg-slate-50 rounded-xl p-3.5 space-y-2.5">
      {/* Header: label + action icons */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        <div className="flex items-center gap-0.5">
          {onViewProfile && (
            <button
              onClick={onViewProfile}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="View profile"
            >
              <User className="w-3.5 h-3.5" />
            </button>
          )}
          {onEmail && (
            <button
              onClick={onEmail}
              className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-md transition-colors"
              title="Send email"
            >
              <Mail className="w-3.5 h-3.5" />
            </button>
          )}
          {onDM && (
            <button
              onClick={onDM}
              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
              title="Send DM"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Name */}
      <div className="font-medium text-slate-900 text-sm">{displayName}</div>

      {/* Metric */}
      <div
        className={`flex items-center gap-1.5 text-xs ${
          metricHighlight
            ? "text-amber-700 bg-amber-50 px-2 py-1 rounded-md font-medium -mx-0.5"
            : "text-slate-500"
        }`}
      >
        {metricIcon}
        <span>
          {metricValue} {metricLabel}
        </span>
        {metricHighlight && metricValue >= 5 && (
          <span className="ml-1 text-amber-600 font-semibold">
            — frequent
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────
function EmptyState({ status }: { status: ReportStatus }) {
  const config = {
    pending: {
      icon: CheckCircle,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      title: "All clear!",
      description: "No pending reports to review at the moment.",
    },
    resolved: {
      icon: FileWarning,
      iconBg: "bg-slate-100",
      iconColor: "text-slate-400",
      title: "No resolved reports",
      description: "Reports you resolve will appear here.",
    },
    dismissed: {
      icon: XCircle,
      iconBg: "bg-slate-100",
      iconColor: "text-slate-400",
      title: "No dismissed reports",
      description: "Reports you dismiss will appear here.",
    },
  }[status];

  const Icon = config.icon;

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 text-center
        opacity-100 translate-y-0
        [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
        [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
    >
      <div
        className={`w-16 h-16 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}
      >
        <Icon className={`w-8 h-8 ${config.iconColor}`} />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        {config.title}
      </h3>
      <p className="text-slate-500 max-w-sm mx-auto">{config.description}</p>
    </div>
  );
}

// ─── Pagination controls ──────────────────────────────────────────
function PaginationControls({
  pagination,
  onPageChange,
}: {
  pagination: Pagination;
  onPageChange: (page: number) => void;
}) {
  const { page, totalPages, total, limit } = pagination;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200/80 shadow-sm px-4 py-3">
      <p className="text-sm text-slate-600">
        Showing <span className="font-medium">{start}</span> to{" "}
        <span className="font-medium">{end}</span> of{" "}
        <span className="font-medium">{total}</span> reports
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg
            hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg
            hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
