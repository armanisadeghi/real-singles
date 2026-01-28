"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ImageOff,
  AlertTriangle,
  Clock,
  RefreshCw,
  Loader2,
  Play,
  ShieldCheck,
} from "lucide-react";
import { AvatarIssuesList } from "./AvatarIssuesList";
import type { IntegrityCheckResult } from "@/lib/services/data-integrity";

export default function AvatarIssuesPage() {
  const [data, setData] = useState<IntegrityCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCheck = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/data-integrity?type=avatars");
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
            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
              <ImageOff className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Avatar & Profile Image Issues
              </h1>
              <p className="text-sm text-gray-500">
                Users with missing or broken profile images
              </p>
            </div>
          </div>
        </div>

        {/* Run Check Card */}
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-rose-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Check Avatar Issues
            </h2>
            <p className="text-gray-600 mb-6">
              This check identifies users with missing or broken profile images.
              The process may take 30+ seconds as it verifies image accessibility.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={runCheck}
              className="inline-flex items-center gap-2 px-6 py-3 text-white bg-rose-600 rounded-lg hover:bg-rose-700 font-medium transition-colors"
            >
              <Play className="w-5 h-5" />
              Start Avatar Check
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
            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
              <ImageOff className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Avatar & Profile Image Issues
              </h1>
              <p className="text-sm text-gray-500">Running check...</p>
            </div>
          </div>
        </div>

        {/* Loading Card */}
        <div className="bg-white rounded-lg shadow p-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-rose-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Checking Avatar Issues...
            </h2>
            <p className="text-gray-600">
              Verifying profile image accessibility. This may take a minute.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Guard against null data
  if (!data) {
    return null;
  }

  // Show results
  const missingCount = data.summary.byType.missing_avatar || 0;
  const brokenCount = data.summary.byType.broken_avatar || 0;
  const totalIssues = missingCount + brokenCount;
  const autoFixable = data.issues.filter((i) => i.autoFixable).length;
  const noGalleryImages = data.issues.filter(
    (i) => i.details?.hasGalleryImages === false
  ).length;

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
            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
              <ImageOff className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Avatar & Profile Image Issues
              </h1>
              <p className="text-sm text-gray-500">
                Users with missing or broken profile images
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Total Issues</p>
          <p className="text-2xl font-bold text-gray-900">{totalIssues}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Missing Avatar</p>
          <p className="text-2xl font-bold text-red-600">{missingCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Broken Avatar</p>
          <p className="text-2xl font-bold text-amber-600">{brokenCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Auto-Fixable</p>
          <p className="text-2xl font-bold text-green-600">{autoFixable}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">No Gallery Images</p>
          <p className="text-2xl font-bold text-gray-500">{noGalleryImages}</p>
        </div>
      </div>

      {/* Info Banner */}
      {totalIssues > 0 && autoFixable > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">Auto-Fix Available</p>
            <p className="text-sm text-blue-600">
              {autoFixable} of {totalIssues} issues can be automatically fixed
              by syncing profile images from the user&apos;s primary gallery
              photo. Users without any gallery photos will need to upload images
              manually.
            </p>
          </div>
        </div>
      )}

      {/* Issues List */}
      <AvatarIssuesList issues={data.issues} />
    </div>
  );
}
