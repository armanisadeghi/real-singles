"use client";

import Link from "next/link";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EventCardData {
  EventID: string;
  EventName: string;
  EventDate: string;
  StartTime: string;
  EndTime?: string;
  Description?: string;
  Street?: string;
  City?: string;
  State?: string;
  EventImage?: string;
  MaxAttendees?: number;
  CurrentAttendees: number;
  EventType: string;
  Status: string;
  isMarkInterested?: number;
}

interface EventCardProps {
  event: EventCardData;
  className?: string;
  showDescription?: boolean;
}

export function EventCard({ event, className, showDescription = true }: EventCardProps) {
  const location = [event.City, event.State].filter(Boolean).join(", ");
  const isRegistered = event.isMarkInterested === 1;
  
  // Format date nicely
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Link
      href={`/events/${event.EventID}`}
      className={cn(
        "group block bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-100",
        className
      )}
    >
      {/* Image */}
      <div className="aspect-video bg-gradient-to-br from-primary/20 to-purple-100 relative overflow-hidden">
        {event.EventImage ? (
          <img
            src={event.EventImage}
            alt={event.EventName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-12 h-12 text-primary/40" />
          </div>
        )}
        
        {/* Status badge */}
        {isRegistered && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
            RSVP'd
          </div>
        )}
        
        {/* Date overlay */}
        <div className="absolute bottom-3 left-3 px-2.5 py-1.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-sm">
          <p className="text-xs font-semibold text-primary">
            {formatDate(event.EventDate)}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-1.5 line-clamp-1 group-hover:text-primary transition-colors">
          {event.EventName}
        </h3>
        
        {showDescription && event.Description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {event.Description}
          </p>
        )}

        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          {event.StartTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {event.StartTime}
            </span>
          )}
          
          {location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {location}
            </span>
          )}
          
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {event.CurrentAttendees}
            {event.MaxAttendees ? `/${event.MaxAttendees}` : ""} going
          </span>
        </div>
      </div>
    </Link>
  );
}

// Skeleton loader for EventCard
export function EventCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 animate-pulse">
      <div className="aspect-video bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="flex gap-3">
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
      </div>
    </div>
  );
}
