"use client";

import { ClientList } from "@/components/matchmaker/ClientList";
import { Users } from "lucide-react";

export default function ClientsPage() {
  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Clients</h1>
          <p className="text-sm text-muted-foreground">
            Manage your client relationships
          </p>
        </div>
      </div>

      {/* Client List */}
      <ClientList />
    </div>
  );
}
