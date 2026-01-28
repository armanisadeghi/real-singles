"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  User,
  RefreshCw,
  ArrowRight,
  CheckCircle,
  Clock,
  Loader2,
  ShieldCheck,
  Play,
} from "lucide-react";
import { DataIntegrityActions } from "./components/DataIntegrityActions";
import { IssueTypeCard } from "./components/IssueTypeCard";
import type { IntegrityCheckResult } from "@/lib/services/data-integrity";

export default function DataIntegrityPage() {
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Integrity</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor and fix data quality issues across user accounts
          </p>
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
              This check analyzes all user profiles, avatars, and gallery items
              to identify data quality issues. The process may take 30+ seconds
              depending on the number of users.
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

        {/* What Gets Checked */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            What Gets Checked
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-rose-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Avatar & Profile Images</p>
                <p className="text-sm text-gray-500">
                  Missing or broken profile images, file accessibility
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Profile Completeness</p>
                <p className="text-sm text-gray-500">
                  Missing gender, looking_for, DOB, first name
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <Info className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Gallery Integrity</p>
                <p className="text-sm text-gray-500">
                  Missing primary photos, orphaned records, broken files
                </p>
              </div>
            </div>
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Integrity</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor and fix data quality issues across user accounts
          </p>
        </div>

        {/* Loading Card */}
        <div className="bg-white rounded-lg shadow p-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Running Integrity Check...
            </h2>
            <p className="text-gray-600">
              Analyzing user profiles, avatars, and gallery items. This may take a minute.
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
  const totalIssues =
    data.summary.critical + data.summary.warning + data.summary.info;
  const hasNoIssues = totalIssues === 0;

  // Group issues by category for display
  const avatarIssueCount =
    (data.summary.byType.missing_avatar || 0) +
    (data.summary.byType.broken_avatar || 0);

  const profileIssueCount =
    (data.summary.byType.missing_gender || 0) +
    (data.summary.byType.missing_looking_for || 0) +
    (data.summary.byType.missing_dob || 0) +
    (data.summary.byType.missing_first_name || 0);

  const galleryIssueCount =
    (data.summary.byType.no_gallery_photos || 0) +
    (data.summary.byType.orphaned_gallery_record || 0) +
    (data.summary.byType.missing_primary_photo || 0) +
    (data.summary.byType.broken_primary_photo || 0);

  // Get auto-fixable counts
  const autoFixableAvatars = data.issues.filter(
    (i) =>
      (i.issueType === "missing_avatar" || i.issueType === "broken_avatar") &&
      i.autoFixable
  ).length;

  const autoFixableGallery = data.issues.filter(
    (i) =>
      (i.issueType === "missing_primary_photo" ||
        i.issueType === "orphaned_gallery_record" ||
        i.issueType === "broken_primary_photo") &&
      i.autoFixable
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Integrity</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor and fix data quality issues across user accounts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Last checked:{" "}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          href="/admin/users"
          className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.totalUsers}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Link>

        <Link
          href="/admin/data-integrity/all?severity=critical"
          className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Critical Issues</p>
              <p className="text-2xl font-bold text-red-600">
                {data.summary.critical}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </Link>

        <Link
          href="/admin/data-integrity/all?severity=warning"
          className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Warnings</p>
              <p className="text-2xl font-bold text-amber-600">
                {data.summary.warning}
              </p>
            </div>
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </Link>

        <Link
          href="/admin/data-integrity/all?severity=info"
          className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Info</p>
              <p className="text-2xl font-bold text-blue-600">
                {data.summary.info}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Link>
      </div>

      {/* Health Status Banner */}
      {hasNoIssues ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-medium text-green-800">All Systems Healthy</p>
            <p className="text-sm text-green-600">
              No data integrity issues detected across {data.totalUsers} users.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">
                {totalIssues} Issues Detected
              </p>
              <p className="text-sm text-amber-600">
                {data.summary.critical} critical, {data.summary.warning}{" "}
                warnings, {data.summary.info} info across {data.totalUsers}{" "}
                users.
              </p>
            </div>
          </div>
          <DataIntegrityActions
            autoFixableAvatars={autoFixableAvatars}
            autoFixableGallery={autoFixableGallery}
          />
        </div>
      )}

      {/* Issue Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar Issues */}
        <IssueTypeCard
          title="Avatar & Profile Image"
          description="Missing or broken profile images"
          iconName="image-off"
          iconColor="text-rose-600"
          iconBg="bg-rose-100"
          count={avatarIssueCount}
          criticalCount={
            (data.summary.byType.missing_avatar || 0) +
            (data.summary.byType.broken_avatar || 0)
          }
          href="/admin/data-integrity/avatars"
          issues={[
            {
              label: "Missing Avatar",
              count: data.summary.byType.missing_avatar || 0,
              severity: "critical",
            },
            {
              label: "Broken Avatar",
              count: data.summary.byType.broken_avatar || 0,
              severity: "critical",
            },
          ]}
          autoFixable={autoFixableAvatars}
        />

        {/* Profile Issues */}
        <IssueTypeCard
          title="Profile Completeness"
          description="Missing required profile fields"
          iconName="user"
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
          count={profileIssueCount}
          criticalCount={
            (data.summary.byType.missing_gender || 0) +
            (data.summary.byType.missing_looking_for || 0) +
            (data.summary.byType.missing_dob || 0)
          }
          href="/admin/data-integrity/profiles"
          issues={[
            {
              label: "Missing Gender",
              count: data.summary.byType.missing_gender || 0,
              severity: "critical",
            },
            {
              label: "Missing Looking For",
              count: data.summary.byType.missing_looking_for || 0,
              severity: "critical",
            },
            {
              label: "Missing DOB",
              count: data.summary.byType.missing_dob || 0,
              severity: "critical",
            },
            {
              label: "Missing First Name",
              count: data.summary.byType.missing_first_name || 0,
              severity: "warning",
            },
          ]}
          autoFixable={0}
        />

        {/* Gallery Issues */}
        <IssueTypeCard
          title="Gallery & Photos"
          description="Gallery integrity issues"
          iconName="images"
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
          count={galleryIssueCount}
          criticalCount={data.summary.byType.broken_primary_photo || 0}
          href="/admin/data-integrity/gallery"
          issues={[
            {
              label: "No Gallery Photos",
              count: data.summary.byType.no_gallery_photos || 0,
              severity: "warning",
            },
            {
              label: "Missing Primary Photo",
              count: data.summary.byType.missing_primary_photo || 0,
              severity: "warning",
            },
            {
              label: "Broken Primary Photo",
              count: data.summary.byType.broken_primary_photo || 0,
              severity: "critical",
            },
            {
              label: "Orphaned Gallery Records",
              count: data.summary.byType.orphaned_gallery_record || 0,
              severity: "info",
            },
          ]}
          autoFixable={autoFixableGallery}
        />
      </div>

      {/* Recent Issues Table Preview */}
      {data.issues.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Critical Issues
            </h2>
            <Link
              href="/admin/data-integrity/all"
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              View all issues
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auto-Fix
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.issues
                  .filter((i) => i.severity === "critical")
                  .slice(0, 10)
                  .map((issue, idx) => (
                    <tr key={`${issue.userId}-${issue.issueType}-${idx}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {issue.firstName || "Unknown"} {issue.lastName || ""}
                          </p>
                          <p className="text-xs text-gray-500">
                            {issue.userEmail}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {issue.issueType.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            issue.severity === "critical"
                              ? "bg-red-100 text-red-800"
                              : issue.severity === "warning"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {issue.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 max-w-xs truncate">
                          {issue.description}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {issue.autoFixable ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Yes
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
