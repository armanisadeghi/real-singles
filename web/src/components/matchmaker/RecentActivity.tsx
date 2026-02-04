"use client";

import { useEffect, useState } from "react";
import { Clock, Heart, Users, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ActivityItem {
  id: string;
  type: "intro_created" | "intro_accepted" | "intro_declined" | "client_joined";
  title: string;
  description: string;
  time: string;
  link?: string;
}

interface RecentActivityProps {
  matchmakerId: string;
}

export function RecentActivity({ matchmakerId }: RecentActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);

      try {
        // Fetch recent introductions
        const introsResponse = await fetch(
          `/api/matchmakers/${matchmakerId}/introductions?limit=5`
        );
        const introsData = await introsResponse.json();

        // Fetch recent clients
        const clientsResponse = await fetch(
          `/api/matchmakers/${matchmakerId}/clients?limit=5`
        );
        const clientsData = await clientsResponse.json();

        const items: ActivityItem[] = [];

        // Map introductions to activity items
        if (introsData.success && introsData.data) {
          introsData.data.forEach((intro: any) => {
            const userAName = intro.user_a?.first_name || "User";
            const userBName = intro.user_b?.first_name || "User";

            let type: ActivityItem["type"] = "intro_created";
            let title = `Introduction created`;
            let description = `${userAName} & ${userBName}`;

            if (intro.status === "active") {
              type = "intro_accepted";
              title = "Introduction accepted!";
            } else if (intro.status === "declined") {
              type = "intro_declined";
              title = "Introduction declined";
            }

            items.push({
              id: intro.id,
              type,
              title,
              description,
              time: formatRelativeTime(intro.created_at),
              link: `/matchmaker-portal/introductions/${intro.id}`,
            });
          });
        }

        // Map clients to activity items (only recent ones)
        if (clientsData.success && clientsData.data) {
          clientsData.data.slice(0, 3).forEach((client: any) => {
            const clientName = client.first_name || "New client";
            items.push({
              id: `client-${client.id}`,
              type: "client_joined",
              title: "New client joined",
              description: clientName,
              time: formatRelativeTime(client.started_at),
              link: `/matchmaker-portal/clients/${client.id}`,
            });
          });
        }

        // Sort by time (most recent first) and take top 5
        items.sort(
          (a, b) =>
            new Date(b.time).getTime() - new Date(a.time).getTime()
        );

        setActivities(items.slice(0, 5));
      } catch (err) {
        console.error("Error fetching activity:", err);
      } finally {
        setLoading(false);
      }
    };

    if (matchmakerId) {
      fetchActivity();
    }
  }, [matchmakerId]);

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border/40 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            Recent Activity
          </h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border/40 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            Recent Activity
          </h2>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            No recent activity. Start browsing profiles to create your first
            introduction!
          </p>
          <Link
            href="/matchmaker-portal/discover"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
          >
            Browse Profiles
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const getIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "intro_created":
        return Heart;
      case "intro_accepted":
        return Heart;
      case "intro_declined":
        return Heart;
      case "client_joined":
        return Users;
      default:
        return Clock;
    }
  };

  const getColor = (type: ActivityItem["type"]) => {
    switch (type) {
      case "intro_created":
        return "from-purple-500 to-pink-500";
      case "intro_accepted":
        return "from-green-500 to-emerald-500";
      case "intro_declined":
        return "from-red-500 to-rose-500";
      case "client_joined":
        return "from-blue-500 to-cyan-500";
      default:
        return "from-gray-500 to-slate-500";
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border/40 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            Recent Activity
          </h2>
        </div>
        <Link
          href="/matchmaker-portal/introductions"
          className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
        >
          View All
        </Link>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => {
          const Icon = getIcon(activity.type);
          const color = getColor(activity.type);

          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {activity.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activity.time}
                </p>
              </div>
              {activity.link && (
                <Link
                  href={activity.link}
                  className="flex-shrink-0 p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
