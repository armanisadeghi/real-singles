"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Search,
  BarChart3,
  Settings,
  Wand2,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchmakerNavProps {
  matchmakerId: string;
}

export function MatchmakerNav({ matchmakerId }: MatchmakerNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Dashboard",
      href: "/matchmaker-portal/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Discover",
      href: "/matchmaker-portal/discover",
      icon: Search,
    },
    {
      name: "Clients",
      href: "/matchmaker-portal/clients",
      icon: Users,
    },
    {
      name: "Introductions",
      href: "/matchmaker-portal/introductions",
      icon: Heart,
    },
    {
      name: "Messages",
      href: "/matchmaker-portal/messages",
      icon: MessageSquare,
    },
    {
      name: "Analytics",
      href: "/matchmaker-portal/analytics",
      icon: BarChart3,
    },
    {
      name: "Settings",
      href: "/matchmaker-portal/settings",
      icon: Settings,
    },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white dark:bg-neutral-950 border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link
            href="/matchmaker-portal/dashboard"
            className="flex items-center gap-2.5 font-semibold text-lg"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <span className="hidden sm:inline">Matchmaker Portal</span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Exit Portal */}
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Exit Portal
          </Link>
        </div>
      </div>
    </nav>
  );
}
