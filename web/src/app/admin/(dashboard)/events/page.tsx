import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Calendar, Plus, Eye, Edit2, CalendarDays } from "lucide-react";
import { AdminPageHeader, AdminLinkButton } from "@/components/admin/AdminPageHeader";

interface EventListItem {
  id: string;
  title: string;
  event_type: string;
  start_datetime: string;
  status: string;
  current_attendees: number;
  max_attendees: number | null;
  city: string | null;
  state: string | null;
}

async function getEvents(): Promise<EventListItem[]> {
  const supabase = createAdminClient();

  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, event_type, start_datetime, status, current_attendees, max_attendees, city, state")
    .order("start_datetime", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching events:", error);
    return [];
  }

  // Map to ensure proper types
  return (events || []).map((event) => ({
    id: event.id,
    title: event.title,
    event_type: event.event_type,
    start_datetime: event.start_datetime,
    status: event.status || "upcoming",
    current_attendees: event.current_attendees || 0,
    max_attendees: event.max_attendees,
    city: event.city,
    state: event.state,
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
    case "upcoming":
      return "bg-blue-100 text-blue-800";
    case "ongoing":
      return "bg-emerald-100 text-emerald-800";
    case "completed":
      return "bg-slate-100 text-slate-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

function getEventTypeLabel(type: string): string {
  switch (type) {
    case "in_person":
      return "In Person";
    case "virtual":
      return "Virtual";
    case "speed_dating":
      return "Speed Dating";
    default:
      return type;
  }
}

export default async function AdminEventsPage() {
  const events = await getEvents();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Event Management"
        subtitle="Create and manage singles events"
        variant="hero"
        icon={CalendarDays}
        iconGradient="from-purple-500 to-purple-600"
        stat={{
          value: events.length,
          label: "Total Events",
        }}
      >
        <AdminLinkButton href="/admin/events/create" icon={Plus}>
          Create Event
        </AdminLinkButton>
      </AdminPageHeader>

      {events.length === 0 ? (
        <div 
          className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 text-center
            opacity-100 translate-y-0
            [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
            [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
        >
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No events yet</h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">
            Create your first event to start engaging with your community.
          </p>
          <AdminLinkButton href="/admin/events/create" icon={Plus}>
            Create Event
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
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Attendees
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200/60">
                {events.map((event, index) => (
                  <tr 
                    key={event.id} 
                    className="hover:bg-slate-50/80 transition-colors"
                    style={{
                      animation: `fadeIn 300ms ease-out forwards`,
                      animationDelay: `${index * 30}ms`,
                      opacity: 0,
                    }}
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors"
                      >
                        {event.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600">
                        {getEventTypeLabel(event.event_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600">
                        {formatDate(event.start_datetime)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600">
                        {[event.city, event.state].filter(Boolean).join(", ") || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          event.status
                        )}`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-900">
                        {event.current_attendees}
                        {event.max_attendees ? (
                          <span className="text-slate-500">/{event.max_attendees}</span>
                        ) : null}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/events/${event.id}/edit`}
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
