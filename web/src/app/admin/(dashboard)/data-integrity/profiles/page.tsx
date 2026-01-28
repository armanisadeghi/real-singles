"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  AlertTriangle,
  Clock,
  RefreshCw,
  Loader2,
  Play,
  ShieldCheck,
} from "lucide-react";
import { ProfileIssuesList } from "./ProfileIssuesList";
import type { IntegrityCheckResult } from "@/lib/services/data-integrity";

export default function ProfileIssuesPage() {
  const [data, setData] = useState<IntegrityCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCheck = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/data-integrity?type=profiles");
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
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Profile Completeness Issues
              </h1>
              <p className="text-sm text-gray-500">
                Users with missing required profile fields
              </p>
            </div>
          </div>
        </div>

        {/* Run Check Card */}
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Check Profile Completeness
            </h2>
            <p className="text-gray-600 mb-6">
              This check identifies users with missing required profile fields
              like gender, looking_for, and date of birth. The process may take
              30+ seconds.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={runCheck}
              className="inline-flex items-center gap-2 px-6 py-3 text-white bg-purple-600 rounded-lg hover:bg-purple-700 font-medium transition-colors"
            >
              <Play className="w-5 h-5" />
              Start Profile Check
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
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Profile Completeness Issues
              </h1>
              <p className="text-sm text-gray-500">Running check...</p>
            </div>
          </div>
        </div>

        {/* Loading Card */}
        <div className="bg-white rounded-lg shadow p-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Checking Profile Completeness...
            </h2>
            <p className="text-gray-600">
              Analyzing user profiles. This may take a minute.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show results
  const missingGender = data.summary.byType.missing_gender || 0;
  const missingLookingFor = data.summary.byType.missing_looking_for || 0;
  const missingDob = data.summary.byType.missing_dob || 0;
  const missingFirstName = data.summary.byType.missing_first_name || 0;
  const totalIssues =
    missingGender + missingLookingFor + missingDob + missingFirstName;
  const criticalCount = missingGender + missingLookingFor + missingDob;

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
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Profile Completeness Issues
              </h1>
              <p className="text-sm text-gray-500">
                Users with missing required profile fields
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
          <p className="text-sm text-gray-500">Missing Gender</p>
          <p className="text-2xl font-bold text-red-600">{missingGender}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Missing Looking For</p>
          <p className="text-2xl font-bold text-red-600">{missingLookingFor}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Missing DOB</p>
          <p className="text-2xl font-bold text-red-600">{missingDob}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Missing First Name</p>
          <p className="text-2xl font-bold text-amber-600">{missingFirstName}</p>
        </div>
      </div>

      {/* Info Banner */}
      {criticalCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">
              Manual Intervention Required
            </p>
            <p className="text-sm text-amber-600">
              Profile completeness issues cannot be auto-fixed as they require
              user input. {criticalCount} users have critical issues that prevent
              them from participating in matching. Consider reaching out to these
              users to complete their profiles.
            </p>
          </div>
        </div>
      )}

      {/* Impact Explanation */}
      <div className="bg-white rounded-lg shadow p-5">
        <h3 className="font-semibold text-gray-900 mb-3">
          Impact of Missing Fields
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5"></span>
            <div>
              <p className="font-medium text-gray-900">Missing Gender</p>
              <p className="text-gray-500">
                User cannot be shown to others or receive matches. Critical for
                matching algorithm.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5"></span>
            <div>
              <p className="font-medium text-gray-900">Missing Looking For</p>
              <p className="text-gray-500">
                User cannot see potential matches. Required to filter discovery
                results.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5"></span>
            <div>
              <p className="font-medium text-gray-900">Missing Date of Birth</p>
              <p className="text-gray-500">
                Cannot verify user is 18+ or apply age filters. Required for
                legal compliance.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full mt-1.5"></span>
            <div>
              <p className="font-medium text-gray-900">Missing First Name</p>
              <p className="text-gray-500">
                Affects personalization and display. Less critical but reduces
                user experience.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Issues List */}
      <ProfileIssuesList issues={data.issues} />
    </div>
  );
}
