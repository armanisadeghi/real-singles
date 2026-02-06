import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Video, Eye, Edit2, Users } from "lucide-react";
import { AdminPageHeader, AdminLinkButton } from "@/components/admin/AdminPageHeader";

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
  price: number | null;
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
      price,
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
    price: session.price,
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
      return "bg-emerald-100 text-emerald-800";
    case "completed":
      return "bg-slate-100 text-slate-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return "—";
  if (price === 0) return "Free";
  return `$${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}`;
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
  const scheduledCount = sessions.filter((s) => s.status === "scheduled").length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Virtual Speed Dating"
        subtitle="Manage virtual speed dating sessions and registrations"
        variant="hero"
        iconName="zap"
        iconGradient="from-cyan-500 to-blue-500"
        stat={{
          value: scheduledCount,
          label: "Scheduled Sessions",
        }}
      >
        <AdminLinkButton href="/admin/speed-dating/create" iconName="plus">
          Create Session
        </AdminLinkButton>
      </AdminPageHeader>

      {sessions.length === 0 ? (
        <div 
          className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 text-center
            opacity-100 translate-y-0
            [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
            [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
        >
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No sessions yet</h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">
            Create your first speed dating session to help users connect.
          </p>
          <AdminLinkButton href="/admin/speed-dating/create" iconName="plus">
            Create Session
          </AdminLinkButton>
        </div>
      ) : (
        <div 
          className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden
            opacity-100 translate-y-0
            [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
            [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
          style={{ transitionDelay: "100ms" }}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/80">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Session
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Preferences
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Registrations
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200/60">
                {sessions.map((session, index) => (
                  <tr 
                    key={session.id} 
                    className="hover:bg-slate-50/80 transition-colors"
                    style={{
                      animation: `fadeIn 300ms ease-out forwards`,
                      animationDelay: `${index * 30}ms`,
                      opacity: 0,
                    }}
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/speed-dating/${session.id}`}
                        className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors"
                      >
                        {session.title}
                      </Link>
                      {session.description && (
                        <p className="text-xs text-slate-500 truncate max-w-xs">
                          {session.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600">
                        {formatDate(session.scheduled_datetime)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-600">
                        {formatDuration(session.duration_minutes)}
                      </div>
                      <div className="text-xs text-slate-400">
                        {formatRoundDuration(session.round_duration_seconds)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-600">
                        {session.age_min && session.age_max
                          ? `Ages ${session.age_min}–${session.age_max}`
                          : session.age_min
                          ? `Ages ${session.age_min}+`
                          : session.age_max
                          ? `Ages ≤${session.age_max}`
                          : "Any age"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {session.gender_preference || "Mixed"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600">
                        {formatPrice(session.price)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          session.status
                        )}`}
                      >
                        {session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">{session.registration_count}</span>
                        {session.max_participants && (
                          <span className="text-slate-400">/{session.max_participants}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/speed-dating/${session.id}`}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/speed-dating/${session.id}/edit`}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
        </div>
      )}

    </div>
  );
}
