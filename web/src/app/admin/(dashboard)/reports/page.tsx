import { createAdminClient } from "@/lib/supabase/admin";

async function getReports() {
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

  return reports || [];
}

export default async function AdminReportsPage() {
  const reports = await getReports();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">User Reports</h1>

      {reports.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No reports to review.
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    report.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                    report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {report.status}
                  </span>
                  <h3 className="text-lg font-medium mt-2">{report.reason}</h3>
                  {report.description && (
                    <p className="text-gray-600 mt-1">{report.description}</p>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {report.created_at ? new Date(report.created_at).toLocaleString() : "N/A"}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Reporter:</span>{" "}
                  <span className="font-medium">
                    {(report.reporter as { email?: string })?.email || "Unknown"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Reported User:</span>{" "}
                  <span className="font-medium">
                    {(report.reported as { email?: string })?.email || "Unknown"}
                  </span>
                </div>
              </div>
              {report.status === 'pending' && (
                <div className="mt-4 flex space-x-2">
                  <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                    Resolve
                  </button>
                  <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
