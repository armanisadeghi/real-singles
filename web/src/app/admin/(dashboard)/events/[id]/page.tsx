"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Edit2,
  XCircle,
  Trash2,
  Loader2,
  User,
  Mail,
  CalendarDays,
} from "lucide-react";
import { AdminPageHeader, AdminLinkButton, AdminButton } from "@/components/admin/AdminPageHeader";

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  image_url: string | null;
  venue_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  start_datetime: string;
  end_datetime: string | null;
  max_attendees: number | null;
  current_attendees: number;
  status: string;
  is_public: boolean;
  created_at: string;
  users: {
    id: string;
    display_name: string;
    email: string;
  } | null;
}

interface Attendee {
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

interface AttendeeSummary {
  total: number;
  registered: number;
  interested: number;
  cancelled: number;
}

export default function AdminEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [summary, setSummary] = useState<AttendeeSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [resolvedParams.id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch event details and attendees in parallel
      const [eventRes, attendeesRes] = await Promise.all([
        fetch(`/api/admin/events/${resolvedParams.id}`),
        fetch(`/api/admin/events/${resolvedParams.id}/attendees`),
      ]);

      if (eventRes.ok) {
        const eventData = await eventRes.json();
        if (eventData.success) {
          setEvent(eventData.event);
        }
      }

      if (attendeesRes.ok) {
        const attendeesData = await attendeesRes.json();
        if (attendeesData.success) {
          setAttendees(attendeesData.attendees);
          setSummary(attendeesData.summary);
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEvent = async () => {
    if (!event || !confirm("Are you sure you want to cancel this event?")) return;

    setIsCancelling(true);
    try {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setEvent({ ...event, status: "cancelled" });
      } else {
        alert("Failed to cancel event");
      }
    } catch (err) {
      console.error("Error cancelling event:", err);
      alert("Failed to cancel event");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRemoveAttendee = async (userId: string) => {
    if (!confirm("Remove this attendee from the event?")) return;

    setRemovingUserId(userId);
    try {
      const res = await fetch(`/api/admin/events/${resolvedParams.id}/attendees`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        setAttendees(attendees.filter((a) => a.userId !== userId));
        if (summary) {
          setSummary({ ...summary, total: summary.total - 1 });
        }
      } else {
        alert("Failed to remove attendee");
      }
    } catch (err) {
      console.error("Error removing attendee:", err);
      alert("Failed to remove attendee");
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
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "ongoing":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "registered":
        return "bg-green-100 text-green-800";
      case "interested":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-100 rounded-lg animate-pulse" />
          <div className="space-y-2">
            <div className="h-7 w-48 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Event Not Found"
          subtitle="The requested event could not be found"
          showBack
        />
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">This event may have been deleted or doesn&apos;t exist.</p>
          <Link href="/admin/events" className="text-blue-600 hover:text-blue-700 font-medium">
            View all events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title={event.title}
        subtitle="Event Details"
        showBack
      >
        <AdminLinkButton
          href={`/admin/events/${event.id}/edit`}
          variant="secondary"
          icon={Edit2}
        >
          Edit
        </AdminLinkButton>
        {event.status !== "cancelled" && (
          <AdminButton
            variant="danger"
            icon={isCancelling ? undefined : XCircle}
            onClick={handleCancelEvent}
            loading={isCancelling}
          >
            Cancel Event
          </AdminButton>
        )}
      </AdminPageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Card */}
          <div 
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6
              opacity-100 translate-y-0
              [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
              [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
          >
            {event.image_url && (
              <div className="aspect-video rounded-lg overflow-hidden mb-6 bg-gray-100">
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                  event.status
                )}`}
              >
                {event.status}
              </span>
              <span className="text-sm text-gray-500">
                {event.event_type === "in_person"
                  ? "In Person"
                  : event.event_type === "virtual"
                  ? "Virtual"
                  : "Speed Dating"}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
                    {formatDate(event.start_datetime)}
                  </p>
                  {event.end_datetime && (
                    <p className="text-sm text-gray-500">
                      to {formatDate(event.end_datetime)}
                    </p>
                  )}
                </div>
              </div>

              {(event.venue_name || event.address || event.city) && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    {event.venue_name && (
                      <p className="font-medium text-gray-900">{event.venue_name}</p>
                    )}
                    {event.address && (
                      <p className="text-sm text-gray-500">{event.address}</p>
                    )}
                    {(event.city || event.state) && (
                      <p className="text-sm text-gray-500">
                        {[event.city, event.state].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
                    {event.current_attendees} attendees
                  </p>
                  {event.max_attendees && (
                    <p className="text-sm text-gray-500">
                      Max capacity: {event.max_attendees}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {event.description && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Attendees Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          {summary && (
            <div 
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6
                opacity-100 translate-y-0
                [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
                [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
              style={{ transitionDelay: "100ms" }}
            >
              <h3 className="font-semibold text-gray-900 mb-4">Attendee Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-700">{summary.registered}</p>
                  <p className="text-xs text-gray-500">Registered</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-700">{summary.interested}</p>
                  <p className="text-xs text-gray-500">Interested</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-700">{summary.cancelled}</p>
                  <p className="text-xs text-gray-500">Cancelled</p>
                </div>
              </div>
            </div>
          )}

          {/* Attendee List */}
          <div 
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm
              opacity-100 translate-y-0
              [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
              [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
            style={{ transitionDelay: "150ms" }}
          >
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">Attendees</h3>
            </div>
            {attendees.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No attendees yet
              </div>
            ) : (
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {attendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="p-4 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shrink-0 overflow-hidden">
                        {attendee.profileImageUrl ? (
                          <img
                            src={attendee.profileImageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/admin/users/${attendee.userId}`}
                          className="text-sm font-medium text-gray-900 hover:text-indigo-600"
                        >
                          {attendee.displayName}
                        </Link>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 text-xs rounded ${getStatusColor(
                              attendee.status
                            )}`}
                          >
                            {attendee.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveAttendee(attendee.userId)}
                      disabled={removingUserId === attendee.userId}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                      title="Remove attendee"
                    >
                      {removingUserId === attendee.userId ? (
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
    </div>
  );
}
