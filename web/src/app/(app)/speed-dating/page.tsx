import { createClient } from "@/lib/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";
import Link from "next/link";
import { Calendar, Clock, Users, Video, MapPin } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

interface SpeedDatingSession {
  id: string;
  name: string;
  description?: string | null;
  session_date: string;
  start_time: string;
  end_time?: string | null;
  duration_minutes: number;
  round_duration_minutes: number;
  max_participants: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  event_type: "in_person" | "virtual";
  city?: string | null;
  image_url?: string | null;
  registration_count?: number;
}

async function getSpeedDatingSessions() {
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("virtual_speed_dating")
    .select("*")
    .in("status", ["upcoming", "ongoing"])
    .order("session_date", { ascending: true });

  // Get registration counts for each session and resolve image URLs
  if (sessions) {
    const sessionsWithCounts = await Promise.all(
      sessions.map(async (session) => {
        const { count } = await supabase
          .from("speed_dating_registrations")
          .select("*", { count: "exact", head: true })
          .eq("session_id", session.id);

        // Resolve the image URL (speed dating images use the events bucket)
        const resolvedImageUrl = await resolveStorageUrl(supabase, session.image_url, { bucket: "events" });

        // Map database fields to SpeedDatingSession interface
        const scheduledDate = session.scheduled_datetime ? new Date(session.scheduled_datetime) : new Date();
        const durationMinutes = session.duration_minutes || 60;
        const roundDurationMinutes = session.round_duration_seconds ? Math.floor(session.round_duration_seconds / 60) : 5;

        return {
          id: session.id,
          name: session.title,
          description: session.description,
          session_date: scheduledDate.toISOString().split('T')[0],
          start_time: scheduledDate.toTimeString().split(' ')[0].slice(0, 5),
          end_time: new Date(scheduledDate.getTime() + durationMinutes * 60000).toTimeString().split(' ')[0].slice(0, 5),
          duration_minutes: durationMinutes,
          round_duration_minutes: roundDurationMinutes,
          max_participants: session.max_participants || 20,
          status: (session.status || "upcoming") as "upcoming" | "ongoing" | "completed" | "cancelled",
          event_type: "virtual" as const,
          city: null,
          image_url: resolvedImageUrl || null,
          registration_count: count || 0,
        } as SpeedDatingSession;
      })
    );
    return sessionsWithCounts;
  }

  return [];
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatTime(timeStr: string) {
  const [hours, minutes] = timeStr.split(":");
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function SpeedDatingPage() {
  const sessions = await getSpeedDatingSessions();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Virtual Speed Dating</h1>
        <p className="text-gray-500 mt-1">
          Meet multiple matches in one fun session
        </p>
      </div>

      {/* How it works */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">How It Works</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <span className="text-purple-600 font-bold">1</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Register</p>
              <p className="text-sm text-gray-600">
                Sign up for an upcoming session
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
              <span className="text-pink-600 font-bold">2</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Meet</p>
              <p className="text-sm text-gray-600">
                Have quick video dates with multiple people
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
              <span className="text-rose-600 font-bold">3</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Match</p>
              <p className="text-sm text-gray-600">
                Connect with mutual interests after the session
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions list */}
      {sessions.length === 0 ? (
        <EmptyState
          type="events"
          title="No upcoming sessions"
          description="Check back soon for new speed dating events"
        />
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/speed-dating/${session.id}`}
              className="block bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Image */}
                <div className="sm:w-48 h-32 sm:h-auto bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shrink-0">
                  {session.image_url ? (
                    <img
                      src={session.image_url}
                      alt={session.name || "Speed dating session"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Video className="w-12 h-12 text-white/80" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {session.name}
                      </h3>
                      {session.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {session.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${
                        session.status === "upcoming"
                          ? "bg-green-100 text-green-700"
                          : session.status === "ongoing"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(session.session_date)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {formatTime(session.start_time)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-gray-400" />
                      {session.registration_count || 0}/{session.max_participants}{" "}
                      registered
                    </div>
                    {session.city && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {session.city}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-500">
                      {session.round_duration_minutes} min per date •{" "}
                      {session.duration_minutes} min total
                    </div>
                    <span className="text-pink-600 font-medium text-sm">
                      View Details →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
