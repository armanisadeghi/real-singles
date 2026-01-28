import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Video, Plus, Eye, Edit2, Users } from "lucide-react";

interface SpeedDatingSession {
  id: string;
  title: string;
  description: string | null;
  scheduled_datetime: string;
  duration_minutes: number | null;
  round_duration_seconds: number | null;
  min_participants: number | null;
  max_participants: number | null;
  gender_preference: string | null;
  age_min: number | null;
  age_max: number | null;
  status: string;
  registration_count: number;
}

async function getSessions(): Promise<SpeedDatingSession[]> {
  const supabase = createAdminClient();

  const { data: sessions, error } = await supabase
    .from("virtual_speed_dating")
    .select(`
      id, 
      title, 
      description,
      scheduled_datetime, 
      duration_minutes,
      round_duration_seconds,
      min_participants,
      max_participants,
      gender_preference,
      age_min,
      age_max,
      status,
      speed_dating_registrations(count)
    `)
    .order("scheduled_datetime", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching speed dating sessions:", error);
    return [];
  }

  // Map to ensure proper types and count registrations
  return (sessions || []).map((session) => ({
    id: session.id,
    title: session.title,
    description: session.description,
    scheduled_datetime: session.scheduled_datetime,
    duration_minutes: session.duration_minutes,
    round_duration_seconds: session.round_duration_seconds,
    min_participants: session.min_participants,
    max_participants: session.max_participants,
    gender_preference: session.gender_preference,
    age_min: session.age_min,
    age_max: session.age_max,
    status: session.status || "scheduled",
    registration_count: Array.isArray(session.speed_dating_registrations)
      ? session.speed_dating_registrations.length
      : (session.speed_dating_registrations as { count: number })?.count || 0,
  }));
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusColor(status: string): string {
  switch (status) {
    case "scheduled":
      return "bg-blue-100 text-blue-800";
    case "in_progress":
      return "bg-green-100 text-green-800";
    case "completed":
      return "bg-gray-100 text-gray-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return "—";
  return `${minutes} min`;
}

function formatRoundDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min/round`;
}

export default async function AdminSpeedDatingPage() {
  const sessions = await getSessions();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Virtual Speed Dating</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage virtual speed dating sessions and registrations
          </p>
        </div>
        <Link
          href="/admin/speed-dating/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Session
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No speed dating sessions yet. Create one to get started.</p>
          <Link
            href="/admin/speed-dating/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Create Session
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Session
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preferences
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registrations
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/speed-dating/${session.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-indigo-600"
                    >
                      {session.title}
                    </Link>
                    {session.description && (
                      <p className="text-xs text-gray-500 truncate max-w-xs">
                        {session.description}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {formatDate(session.scheduled_datetime)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDuration(session.duration_minutes)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatRoundDuration(session.round_duration_seconds)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {session.age_min && session.age_max
                        ? `Ages ${session.age_min}-${session.age_max}`
                        : "Any age"}
                    </div>
                    <div className="text-xs text-gray-400">
                      {session.gender_preference || "Mixed"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        session.status
                      )}`}
                    >
                      {session.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Users className="w-4 h-4" />
                      {session.registration_count}
                      {session.max_participants ? `/${session.max_participants}` : ""}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/speed-dating/${session.id}`}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/admin/speed-dating/${session.id}/edit`}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
