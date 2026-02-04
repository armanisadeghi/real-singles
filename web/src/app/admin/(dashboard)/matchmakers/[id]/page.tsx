"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Ban, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminMatchmakerDetailPage({ params }: PageProps) {
  const [matchmakerId, setMatchmakerId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      setMatchmakerId(id);
      // TODO: Fetch matchmaker details
      setLoading(false);
    });
  }, []);

  const handleAction = async (action: "approve" | "suspend", reason?: string) => {
    setActionLoading(true);
    // TODO: Implement admin actions
    setTimeout(() => setActionLoading(false), 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/matchmakers"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Matchmakers
      </Link>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Matchmaker Detail
        </h1>
        <p className="text-sm text-gray-500">
          Matchmaker details and management will be shown here
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => handleAction("approve")}
            disabled={actionLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-5 h-5" />
            Approve
          </button>
          <button
            onClick={() => handleAction("suspend", "Reason here")}
            disabled={actionLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Ban className="w-5 h-5" />
            Suspend
          </button>
        </div>
      </div>
    </div>
  );
}
