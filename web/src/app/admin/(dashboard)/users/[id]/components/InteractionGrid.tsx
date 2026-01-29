"use client";

import { UserInteractionCard } from "./UserInteractionCard";
import { Heart, HeartOff, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserWithProfile {
  id: string;
  email: string;
  display_name: string | null;
  status: string | null;
  profile_image_url: string | null;
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  city: string | null;
  state: string | null;
  date_of_birth: string | null;
  is_verified: boolean | null;
  is_photo_verified: boolean | null;
}

interface InteractionItem {
  id: string;
  user?: UserWithProfile;
  target_user?: UserWithProfile;
  action?: string;
  created_at: string;
  is_mutual?: boolean;
}

interface InteractionGridProps {
  items: InteractionItem[];
  direction: "received" | "given";
  emptyIcon?: React.ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  showMutualFilter?: boolean;
}

export function InteractionGrid({
  items,
  direction,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  showMutualFilter = false,
}: InteractionGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          {emptyIcon || <Users className="w-8 h-8 text-slate-300" />}
        </div>
        <h4 className="font-semibold text-slate-700 mb-1">{emptyTitle}</h4>
        <p className="text-sm text-slate-500 max-w-sm">{emptyDescription}</p>
      </div>
    );
  }

  // Separate mutual from non-mutual for potential filtering
  const mutualItems = items.filter((item) => item.is_mutual);
  const nonMutualItems = items.filter((item) => !item.is_mutual);

  return (
    <div className="space-y-6">
      {/* Stats header */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-slate-600">
          <strong className="text-slate-900">{items.length}</strong> total
        </span>
        {showMutualFilter && mutualItems.length > 0 && (
          <span className="flex items-center gap-1 text-emerald-600">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <strong>{mutualItems.length}</strong> mutual
          </span>
        )}
        {showMutualFilter && nonMutualItems.length > 0 && (
          <span className="flex items-center gap-1 text-slate-500">
            <HeartOff className="w-3.5 h-3.5" />
            <strong>{nonMutualItems.length}</strong> one-way
          </span>
        )}
      </div>

      {/* Grid */}
      <div
        className={cn(
          "grid gap-4",
          "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        )}
      >
        {items.map((item, index) => {
          const user = direction === "received" ? item.user : item.target_user;
          if (!user) return null;

          return (
            <div
              key={item.id}
              style={{ transitionDelay: `${Math.min(index * 30, 300)}ms` }}
            >
              <UserInteractionCard
                user={user}
                action={item.action}
                timestamp={item.created_at}
                isMutual={item.is_mutual}
                direction={direction}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
