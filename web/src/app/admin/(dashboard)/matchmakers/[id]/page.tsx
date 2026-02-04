"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Ban, CheckCircle, Loader2, Star, Heart, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface MatchmakerDetail {
  id: string;
  user_id: string;
  status: string;
  display_name: string;
  first_name: string;
  last_name: string;
  profile_image_url: string;
  city: string;
  state: string;
  bio: string;
  specialties: string[];
  years_experience: number;
  certifications: string[];
  created_at: string;
  stats: {
    total_introductions: number;
    successful_introductions: number;
    success_rate: number;
    active_clients: number;
    average_rating: number | null;
    total_reviews: number;
  };
}

export default function AdminMatchmakerDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [matchmakerId, setMatchmakerId] = useState<string>("");
  const [matchmaker, setMatchmaker] = useState<MatchmakerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");

  useEffect(() => {
    params.then(({ id }) => {
      setMatchmakerId(id);
      fetchMatchmaker(id);
    });
  }, []);

  const fetchMatchmaker = async (id: string) => {
    try {
      const response = await fetch(`/api/matchmakers/${id}`);
      const data = await response.json();

      if (data.success) {
        setMatchmaker(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch matchmaker:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: "approve" | "suspend") => {
    if (action === "suspend" && (!suspendReason || suspendReason.trim().length < 10)) {
      alert("Please enter a suspension reason (min 10 characters)");
      return;
    }

    setActionLoading(true);
    
    try {
      const response = await fetch(`/api/admin/matchmakers/${matchmakerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason: action === "suspend" ? suspendReason : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Matchmaker ${action === "approve" ? "approved" : "suspended"} successfully`);
        router.push("/admin/matchmakers");
      } else {
        alert(data.msg || "Action failed");
      }
    } catch (error) {
      console.error("Action failed:", error);
      alert("Network error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!matchmaker) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Matchmaker not found</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const config: { [key: string]: string } = {
      approved: "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300",
      pending: "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300",
      suspended: "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300",
    };
    return config[status] || config.pending;
  };

  return (
    <div className="space-y-6">
      <Link
        href="/admin/matchmakers"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Matchmakers
      </Link>

      {/* Profile Card */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 p-6 space-y-6">
        {/* Header with Photo */}
        <div className="flex items-start gap-4">
          <img
            src={matchmaker.profile_image_url || "/avatar-placeholder.png"}
            alt={matchmaker.display_name}
            className="w-20 h-20 rounded-full object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {matchmaker.display_name}
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(matchmaker.status)}`}>
                {matchmaker.status}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {matchmaker.city}, {matchmaker.state} • {matchmaker.years_experience} years experience
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 py-4 border-y border-gray-200 dark:border-neutral-800">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              <Heart className="w-5 h-5 text-purple-500" />
              {matchmaker.stats.total_introductions}
            </div>
            <div className="text-xs text-gray-500">Introductions</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              <CheckCircle className="w-5 h-5 text-green-500" />
              {matchmaker.stats.success_rate}%
            </div>
            <div className="text-xs text-gray-500">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              <Users className="w-5 h-5 text-blue-500" />
              {matchmaker.stats.active_clients}
            </div>
            <div className="text-xs text-gray-500">Active Clients</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              <Star className="w-5 h-5 text-yellow-500" />
              {matchmaker.stats.average_rating?.toFixed(1) || "N/A"}
            </div>
            <div className="text-xs text-gray-500">Rating</div>
          </div>
        </div>

        {/* Bio */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Bio
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{matchmaker.bio}</p>
        </div>

        {/* Specialties */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Specialties
          </h3>
          <div className="flex flex-wrap gap-2">
            {matchmaker.specialties.map((spec) => (
              <span
                key={spec}
                className="px-3 py-1 bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 text-xs rounded-full"
              >
                {spec.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Certifications
          </h3>
          <ul className="space-y-1">
            {matchmaker.certifications.map((cert, i) => (
              <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {cert}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actions Card */}
      {matchmaker.status === "approved" && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Admin Actions
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Suspension Reason
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Enter reason for suspension (min 10 characters)"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            <button
              onClick={() => handleAction("suspend")}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Ban className="w-5 h-5" />
              )}
              Suspend Matchmaker
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
