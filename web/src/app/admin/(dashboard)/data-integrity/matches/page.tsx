"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  AlertTriangle,
  Clock,
  RefreshCw,
  Loader2,
  Play,
  ShieldCheck,
  MessageSquare,
  Users,
} from "lucide-react";
import { MatchesIssuesList } from "./MatchesIssuesList";
import type { MatchIntegrityResult } from "@/app/api/admin/data-integrity/matches/route";

export default function MatchesIntegrityPage() {
  const [data, setData] = useState<MatchIntegrityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCheck = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/data-integrity/matches");
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
            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Matching & Conversations
              </h1>
              <p className="text-sm text-gray-500">
                Duplicate matches, likes, and conversation issues
              </p>
            </div>
          </div>
        </div>

        {/* Run Check Card */}
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-pink-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Check Matching Integrity
            </h2>
            <p className="text-gray-600 mb-6">
              This check identifies duplicate matches (users who have liked the same 
              person multiple times), duplicate conversations, and orphaned conversation
              records. These issues can cause bugs in the matching flow.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={runCheck}
              className="inline-flex items-center gap-2 px-6 py-3 text-white bg-pink-600 rounded-lg hover:bg-pink-700 font-medium transition-colors"
            >
              <Play className="w-5 h-5" />
              Start Matching Check
            </button>
          </div>
        </div>

        {/* What Gets Checked */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">What Gets Checked</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Duplicate Matches</p>
                <p className="text-sm text-gray-500">
                  Same user pair with multiple like/pass records
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Duplicate Conversations</p>
                <p className="text-sm text-gray-500">
                  Same user pair with multiple direct chats
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Orphaned Conversations</p>
                <p className="text-sm text-gray-500">
                  Conversations with missing participants
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
        <div className="flex items-center gap-4">
          <Link
            href="/admin/data-integrity"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Matching & Conversations
              </h1>
              <p className="text-sm text-gray-500">Running check...</p>
            </div>
          </div>
        </div>

        {/* Loading Card */}
        <div className="bg-white rounded-lg shadow p-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-pink-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Checking Matching Integrity...
            </h2>
            <p className="text-gray-600">
              Analyzing matches and conversations. This may take a moment.
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
  const duplicateMatches = data.summary.byType.duplicate_match || 0;
  const duplicateConvos = data.summary.byType.duplicate_conversation || 0;
  const orphanedConvos = data.summary.byType.orphaned_conversation || 0;
  const totalIssues = duplicateMatches + duplicateConvos + orphanedConvos;
  const autoFixable = data.issues.filter((i) => i.autoFixable).length;

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
            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Matching & Conversations
              </h1>
              <p className="text-sm text-gray-500">
                Duplicate matches, likes, and conversation issues
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
          <p className="text-sm text-gray-500">Total Matches</p>
          <p className="text-2xl font-bold text-gray-900">{data.totalMatches.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Total Issues</p>
          <p className="text-2xl font-bold text-gray-900">{totalIssues}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Duplicate Matches</p>
          <p className="text-2xl font-bold text-red-600">{duplicateMatches}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Duplicate Conversations</p>
          <p className="text-2xl font-bold text-amber-600">{duplicateConvos}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Orphaned Conversations</p>
          <p className="text-2xl font-bold text-blue-600">{orphanedConvos}</p>
        </div>
      </div>

      {/* Info Banner */}
      {autoFixable > 0 && (
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-pink-600 mt-0.5" />
          <div>
            <p className="font-medium text-pink-800">Auto-Fix Available</p>
            <p className="text-sm text-pink-600">
              {autoFixable} issues can be automatically fixed:
            </p>
            <ul className="text-sm text-pink-600 mt-1 list-disc list-inside">
              <li>
                <strong>Duplicate Matches:</strong> Keep most recent match, delete older duplicates
              </li>
              <li>
                <strong>Duplicate Conversations:</strong> Merge messages into oldest conversation, delete duplicates
              </li>
              <li>
                <strong>Orphaned Conversations:</strong> Delete conversations with missing participants
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Issues List */}
      <MatchesIssuesList issues={data.issues} onRefresh={runCheck} />
    </div>
  );
}
