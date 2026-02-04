"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, Calendar, MapPin, ArrowRight } from "lucide-react";

interface Client {
  id: string;
  client_user_id: string;
  status: string;
  started_at: string;
  display_name: string;
  first_name: string;
  last_name: string;
  profile_image_url: string;
  age: number | null;
  city: string;
  state: string;
}

export function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("active");

  useEffect(() => {
    // Fetch clients - TODO: Implement with matchmaker ID
    setLoading(false);
  }, [statusFilter]);

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "paused", label: "Paused" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border/40 p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 bg-muted rounded" />
                <div className="h-3 w-1/4 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border/40 overflow-hidden">
      {/* Filters */}
      <div className="px-6 py-4 border-b border-border/40 bg-muted/20">
        <div className="flex items-center gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === option.value
                  ? "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Client List */}
      {clients.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <User className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">
            No {statusFilter} clients yet
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/matchmaker-portal/clients/${client.id}`}
              className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors group"
            >
              {/* Profile Image */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 flex items-center justify-center overflow-hidden">
                {client.profile_image_url ? (
                  <img
                    src={client.profile_image_url}
                    alt={client.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {client.first_name?.charAt(0) || "?"}
                  </span>
                )}
              </div>

              {/* Client Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">
                  {client.display_name}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  {client.age && <span>{client.age} years old</span>}
                  {(client.city || client.state) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {client.city && client.state
                        ? `${client.city}, ${client.state}`
                        : client.city || client.state}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Since{" "}
                    {new Date(client.started_at).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 p-2 rounded-lg group-hover:bg-muted transition-colors">
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
