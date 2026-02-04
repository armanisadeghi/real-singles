"use client";

import { useState, useEffect } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import Link from "next/link";
import { Star, Users, Heart, TrendingUp, Search, ChevronRight } from "lucide-react";

interface Matchmaker {
  id: string;
  user_id: string;
  status: string;
  display_name: string;
  profile_image_url: string;
  years_experience: number;
  created_at: string;
  stats: {
    total_introductions: number;
    successful_introductions: number;
    active_clients: number;
    average_rating: number | null;
    total_reviews: number;
  };
}

export default function AdminMatchmakersPage() {
  const [matchmakers, setMatchmakers] = useState<Matchmaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchMatchmakers();
  }, [statusFilter]);

  const fetchMatchmakers = async () => {
    setLoading(true);
    try {
      const url = statusFilter === "all" 
        ? "/api/matchmakers?limit=100"
        : `/api/matchmakers?status=${statusFilter}&limit=100`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setMatchmakers(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch matchmakers:", error);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "approved", label: "Approved" },
    { value: "pending", label: "Pending" },
    { value: "suspended", label: "Suspended" },
  ];

  const getStatusBadge = (status: string) => {
    const config: { [key: string]: string } = {
      approved: "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300",
      pending: "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300",
      suspended: "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300",
      inactive: "bg-gray-100 dark:bg-gray-950/30 text-gray-700 dark:text-gray-300",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config[status] || config.inactive}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Matchmaker Management"
        subtitle="Manage professional matchmakers and review applications"
        variant="hero"
        iconName="users"
        iconGradient="from-purple-500 to-pink-500"
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-500">Total Matchmakers</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">0</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-4 h-4 text-pink-500" />
            <span className="text-sm text-gray-500">Total Introductions</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">0</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-500">Avg Success Rate</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">0%</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Search className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-gray-500">Pending Applications</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">0</p>
        </div>
      </div>

      {/* Matchmakers Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
        {/* Filters */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950/50">
          <div className="flex items-center gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  statusFilter === option.value
                    ? "bg-purple-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-neutral-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-slate-200 dark:bg-neutral-800 rounded" />
                    <div className="h-3 w-1/4 bg-slate-200 dark:bg-neutral-800 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : matchmakers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-500">No matchmakers found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-neutral-800">
            {matchmakers.map((mm) => (
              <Link
                key={mm.id}
                href={`/admin/matchmakers/${mm.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-neutral-950/50 transition-colors group"
              >
                {/* Profile Image */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 flex items-center justify-center overflow-hidden">
                  {mm.profile_image_url ? (
                    <img
                      src={mm.profile_image_url}
                      alt={mm.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      M
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {mm.display_name}
                    </p>
                    {getStatusBadge(mm.status)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{mm.years_experience} years exp</span>
                    <span>{mm.stats.active_clients} active clients</span>
                    <span>{mm.stats.total_introductions} intros</span>
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
