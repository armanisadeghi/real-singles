"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  RefreshCw,
  Loader2,
  Play,
  ShieldCheck,
} from "lucide-react";
import { AllIssuesList } from "./AllIssuesList";
import type { IntegrityCheckResult } from "@/lib/services/data-integrity";

export default function AllIssuesPage() {
  const searchParams = useSearchParams();
  const initialSeverity = searchParams.get("severity") as
    | "all"
    | "critical"
    | "warning"
    | "info"
    | undefined;
  const initialType = searchParams.get("type") || undefined;

  const [data, setData] = useState<IntegrityCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCheck = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/data-integrity");
      if (!res.ok) {
        throw new Error("Failed to run integrity check");
      }
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Show initial state with "Run Check" button
  if (!data && !loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
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
                Complete list of all detected issues
              </p>
            </div>
          </div>
        </div>

        {/* Run Check Card */}
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Run Integrity Check
            </h2>
            <p className="text-gray-600 mb-6">
              This check analyzes all user profiles, avatars, and gallery items.
              The process may take 30+ seconds depending on the number of users.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={runCheck}
              className="inline-flex items-center gap-2 px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              <Play className="w-5 h-5" />
              Start Integrity Check
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
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
                Running integrity check...
              </p>
            </div>
          </div>
        </div>

        {/* Loading Card */}
        <div className="bg-white rounded-lg shadow p-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Running Integrity Check...
            </h2>
            <p className="text-gray-600">
              Analyzing user profiles, avatars, and gallery items. This may take
              a minute.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show results
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
          <button
            onClick={runCheck}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
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
