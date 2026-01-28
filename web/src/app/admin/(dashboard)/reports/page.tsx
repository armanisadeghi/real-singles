import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { AlertTriangle, FileWarning, CheckCircle, Clock } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

interface Report {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string | null;
  reporter: { email?: string; display_name?: string | null } | null;
  reported: { email?: string; display_name?: string | null } | null;
}

async function getReports(): Promise<Report[]> {
  const supabase = createAdminClient();

  const { data: reports } = await supabase
    .from("reports")
    .select(`
      *,
      reporter:reporter_id(email, display_name),
      reported:reported_user_id(email, display_name)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  return (reports || []) as Report[];
}

function getStatusConfig(status: string) {
  switch (status) {
    case "pending":
      return { bg: "bg-amber-100", text: "text-amber-800", icon: Clock };
    case "reviewed":
      return { bg: "bg-blue-100", text: "text-blue-800", icon: FileWarning };
    case "resolved":
      return { bg: "bg-emerald-100", text: "text-emerald-800", icon: CheckCircle };
    default:
      return { bg: "bg-slate-100", text: "text-slate-800", icon: FileWarning };
  }
}

export default async function AdminReportsPage() {
  const reports = await getReports();
  const pendingCount = reports.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="User Reports"
        subtitle="Review and manage user-submitted reports"
        variant="hero"
        icon={AlertTriangle}
        iconGradient="from-amber-500 to-orange-500"
        stat={{
          value: pendingCount,
          label: "Pending Reviews",
        }}
      />

      {reports.length === 0 ? (
        <div 
          className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 text-center
            opacity-100 translate-y-0
            [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
            [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">All clear!</h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            No reports to review at the moment. Check back later.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report, index) => {
            const statusConfig = getStatusConfig(report.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <div 
                key={report.id} 
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6
                  opacity-100 translate-y-0
                  [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
                  [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
                style={{ 
                  transitionDelay: `${index * 50}ms`,
                  animationDelay: `${index * 50}ms`
                }}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {report.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">{report.reason}</h3>
                    {report.description && (
                      <p className="text-slate-600 text-sm">{report.description}</p>
                    )}
                  </div>
                  <div className="text-sm text-slate-500 shrink-0">
                    {report.created_at ? new Date(report.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    }) : "N/A"}
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Reporter:</span>
                    <span className="font-medium text-slate-900">
                      {report.reporter?.display_name || report.reporter?.email || "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Reported User:</span>
                    <span className="font-medium text-slate-900">
                      {report.reported?.display_name || report.reported?.email || "Unknown"}
                    </span>
                  </div>
                </div>
                
                {report.status === "pending" && (
                  <div className="mt-4 flex gap-2">
                    <button className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                      Resolve
                    </button>
                    <button className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors">
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
