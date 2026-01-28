"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Users,
  ArrowLeft,
  Edit2,
  XCircle,
  Trash2,
  Loader2,
  User,
  Video,
  Info,
  Mail,
} from "lucide-react";
import { EmailComposeSheet } from "@/components/admin/EmailComposeSheet";

interface SessionDetail {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  scheduled_datetime: string;
  duration_minutes: number | null;
  round_duration_seconds: number | null;
  min_participants: number | null;
  max_participants: number | null;
  gender_preference: string | null;
  age_min: number | null;
  age_max: number | null;
  status: string;
  agora_channel_prefix: string | null;
  created_at: string;
}

interface Registration {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  status: string;
  registeredAt: string;
}

interface RegistrationSummary {
  total: number;
  registered: number;
  cancelled: number;
}

export default function AdminSpeedDatingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [summary, setSummary] = useState<RegistrationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [showEmailSheet, setShowEmailSheet] = useState(false);

  useEffect(() => {
    fetchData();
  }, [resolvedParams.id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch session details and registrations in parallel
      const [sessionRes, registrationsRes] = await Promise.all([
        fetch(`/api/admin/speed-dating/${resolvedParams.id}`),
        fetch(`/api/admin/speed-dating/${resolvedParams.id}/registrations`),
      ]);

      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        if (sessionData.success) {
          setSession(sessionData.session);
        }
      }

      if (registrationsRes.ok) {
        const registrationsData = await registrationsRes.json();
        if (registrationsData.success) {
          setRegistrations(registrationsData.registrations);
          setSummary(registrationsData.summary);
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSession = async () => {
    if (!session || !confirm("Are you sure you want to cancel this session?")) return;

    setIsCancelling(true);
    try {
      const res = await fetch(`/api/admin/speed-dating/${session.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSession({ ...session, status: "cancelled" });
      } else {
        alert("Failed to cancel session");
      }
    } catch (err) {
      console.error("Error cancelling session:", err);
      alert("Failed to cancel session");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRemoveRegistration = async (userId: string) => {
    if (!confirm("Remove this registration?")) return;

    setRemovingUserId(userId);
    try {
      const res = await fetch(`/api/admin/speed-dating/${resolvedParams.id}/registrations`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        setRegistrations(registrations.filter((r) => r.userId !== userId));
        if (summary) {
          setSummary({ ...summary, total: summary.total - 1 });
        }
      } else {
        alert("Failed to remove registration");
      }
    } catch (err) {
      console.error("Error removing registration:", err);
      alert("Failed to remove registration");
    } finally {
      setRemovingUserId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "registered":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Session not found</p>
        <Link href="/admin/speed-dating" className="text-indigo-600 hover:underline">
          Back to Speed Dating
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/speed-dating"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
            <p className="text-sm text-gray-500">Speed Dating Session</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {registrations.length > 0 && (
            <button
              onClick={() => setShowEmailSheet(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-white bg-violet-600 rounded-lg hover:bg-violet-700"
            >
              <Mail className="w-4 h-4" />
              Email Participants ({registrations.length})
            </button>
          )}
          <Link
            href={`/admin/speed-dating/${session.id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </Link>
          {session.status !== "cancelled" && (
            <button
              onClick={handleCancelSession}
              disabled={isCancelling}
              className="inline-flex items-center gap-2 px-4 py-2 text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50"
            >
              {isCancelling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              Cancel Session
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Card */}
          <div className="bg-white rounded-lg shadow p-6">
            {session.image_url ? (
              <div className="aspect-video rounded-lg overflow-hidden mb-6 bg-gray-100">
                <img
                  src={session.image_url}
                  alt={session.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video rounded-lg overflow-hidden mb-6 bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                <Video className="w-16 h-16 text-white/80" />
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                  session.status
                )}`}
              >
                {session.status}
              </span>
              <span className="text-sm text-gray-500">Virtual Speed Dating</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
                    {formatDate(session.scheduled_datetime)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
                    {session.duration_minutes || 45} minutes total
                  </p>
                  <p className="text-sm text-gray-500">
                    {session.round_duration_seconds
                      ? Math.round(session.round_duration_seconds / 60)
                      : 3}{" "}
                    minutes per round
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
                    {summary?.total || 0} registered
                  </p>
                  <p className="text-sm text-gray-500">
                    {session.min_participants || 6} min / {session.max_participants || 20} max
                    participants
                  </p>
                </div>
              </div>

              {(session.age_min || session.age_max || session.gender_preference) && (
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Preferences</p>
                    <p className="text-sm text-gray-500">
                      {session.age_min && session.age_max
                        ? `Ages ${session.age_min}-${session.age_max}`
                        : session.age_min
                        ? `Ages ${session.age_min}+`
                        : session.age_max
                        ? `Ages up to ${session.age_max}`
                        : "Any age"}
                      {" • "}
                      {session.gender_preference || "Mixed"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {session.description && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{session.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Registrations Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          {summary && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Registration Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-700">{summary.registered}</p>
                  <p className="text-xs text-gray-500">Active</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-700">{summary.cancelled}</p>
                  <p className="text-xs text-gray-500">Cancelled</p>
                </div>
              </div>
            </div>
          )}

          {/* Registration List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">Registrations</h3>
            </div>
            {registrations.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No registrations yet</div>
            ) : (
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {registrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="p-4 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shrink-0 overflow-hidden">
                        {reg.profileImageUrl ? (
                          <img
                            src={reg.profileImageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/admin/users/${reg.userId}`}
                          className="text-sm font-medium text-gray-900 hover:text-indigo-600"
                        >
                          {reg.displayName}
                        </Link>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 text-xs rounded ${getStatusColor(
                              reg.status
                            )}`}
                          >
                            {reg.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveRegistration(reg.userId)}
                      disabled={removingUserId === reg.userId}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                      title="Remove registration"
                    >
                      {removingUserId === reg.userId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Participants Sheet */}
      <EmailComposeSheet
        isOpen={showEmailSheet}
        onClose={() => setShowEmailSheet(false)}
        recipients={registrations.map((r) => ({
          id: r.userId,
          email: r.email,
          name: r.displayName || `${r.firstName} ${r.lastName}`.trim() || r.email,
        }))}
        title="Email Speed Dating Participants"
        defaultSubject={`Update: ${session.title}`}
      />
    </div>
  );
}
