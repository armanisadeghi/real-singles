"use client";

import { useState, useEffect } from "react";
import { Loader2, Calendar } from "lucide-react";
import { EventCard, EventCardSkeleton, type EventCardData } from "@/components/events";
import { EmptyState } from "@/components/ui";

type FilterStatus = "upcoming" | "past";

export default function EventsPage() {
  const [events, setEvents] = useState<EventCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("upcoming");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events?status=${filter}&limit=50`);
      if (!res.ok) {
        throw new Error("Failed to fetch events");
      }
      const data = await res.json();
      if (data.success) {
        setEvents(data.data || []);
      } else {
        throw new Error(data.msg || "Failed to fetch events");
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Unable to load events. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Events</h1>
                <p className="text-sm text-gray-500">
                  Discover and RSVP to upcoming events
                </p>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("upcoming")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === "upcoming"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilter("past")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === "past"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Past
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchEvents}
              className="px-4 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            type="events"
            title={filter === "upcoming" ? "No upcoming events" : "No past events"}
            description={
              filter === "upcoming"
                ? "Check back later for new events in your area"
                : "Past events will appear here"
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.EventID} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
