import { createAdminClient } from "@/lib/supabase/admin";
import { runFullIntegrityCheck } from "@/lib/services/data-integrity";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { AllIssuesList } from "./AllIssuesList";

async function getAllIssues() {
  const supabase = createAdminClient();
  return runFullIntegrityCheck(supabase);
}

interface PageProps {
  searchParams: Promise<{ severity?: string; type?: string }>;
}

export default async function AllIssuesPage({ searchParams }: PageProps) {
  const data = await getAllIssues();
  const params = await searchParams;
  const initialSeverity = params.severity as "all" | "critical" | "warning" | "info" | undefined;
  const initialType = params.type;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/data-integrity"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                All Data Integrity Issues
              </h1>
              <p className="text-sm text-gray-500">
                Complete list of all detected issues across {data.totalUsers}{" "}
                users
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {new Date(data.checkedAt).toLocaleString("en-US", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </span>
          <Link
            href="/admin/data-integrity/all"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Link>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Total Issues</p>
          <p className="text-2xl font-bold text-gray-900">
            {data.issues.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Critical</p>
          <p className="text-2xl font-bold text-red-600">
            {data.summary.critical}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Warnings</p>
          <p className="text-2xl font-bold text-amber-600">
            {data.summary.warning}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Info</p>
          <p className="text-2xl font-bold text-blue-600">
            {data.summary.info}
          </p>
        </div>
      </div>

      {/* Issues List */}
      <AllIssuesList 
        issues={data.issues} 
        summary={data.summary}
        initialSeverity={initialSeverity}
        initialType={initialType}
      />
    </div>
  );
}
