"use client";

import { User, Ban, ShieldAlert, MapPin } from "lucide-react";
import { cn, calculateAge } from "@/lib/utils";
import Link from "next/link";

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

interface Block {
  id: string;
  user: UserWithProfile;
  created_at: string;
}

interface BlockCardProps {
  block: Block;
  direction: "blocked" | "blocked_by";
}

function BlockCard({ block, direction }: BlockCardProps) {
  const { user, created_at } = block;

  const name =
    user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.display_name || user.email.split("@")[0];

  const age = user.date_of_birth ? calculateAge(user.date_of_birth) : null;

  return (
    <Link
      href={`/admin/users/${user.id}`}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl",
        "bg-white border border-slate-200/80",
        "hover:bg-slate-50 hover:border-slate-300 transition-colors"
      )}
    >
      {/* Avatar */}
      <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 shrink-0 overflow-hidden">
        {user.profile_image_url ? (
          <img
            src={user.profile_image_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-6 h-6 text-slate-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 truncate">
          {name}
          {age && <span className="text-slate-500 font-normal">, {age}</span>}
        </p>
        <p className="text-xs text-slate-500">
          {direction === "blocked" ? "Blocked on" : "Blocked by on"}{" "}
          {new Date(created_at).toLocaleDateString()}
        </p>
      </div>

      {/* Status */}
      {user.status && user.status !== "active" && (
        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full capitalize shrink-0">
          {user.status}
        </span>
      )}
    </Link>
  );
}

interface BlocksPanelProps {
  blockedByUser: Block[];
  blockedThisUser: Block[];
}

export function BlocksPanel({
  blockedByUser,
  blockedThisUser,
}: BlocksPanelProps) {
  const totalBlocks = blockedByUser.length + blockedThisUser.length;

  if (totalBlocks === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Ban className="w-8 h-8 text-slate-300" />
        </div>
        <h4 className="font-semibold text-slate-700 mb-1">No blocks</h4>
        <p className="text-sm text-slate-500 max-w-sm">
          This user hasn&apos;t blocked anyone and hasn&apos;t been blocked by
          anyone.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats header */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-slate-600">
          <strong className="text-slate-900">{totalBlocks}</strong> total blocks
        </span>
        {blockedByUser.length > 0 && (
          <span className="flex items-center gap-1 text-red-600">
            <Ban className="w-3.5 h-3.5" />
            <strong>{blockedByUser.length}</strong> blocked by this user
          </span>
        )}
        {blockedThisUser.length > 0 && (
          <span className="flex items-center gap-1 text-amber-600">
            <ShieldAlert className="w-3.5 h-3.5" />
            <strong>{blockedThisUser.length}</strong> blocked this user
          </span>
        )}
      </div>

      {/* Users blocked by this user */}
      {blockedByUser.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Ban className="w-4 h-4 text-red-500" />
            <h4 className="text-sm font-medium text-slate-700">
              Users this person blocked
            </h4>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {blockedByUser.map((block) => (
              <BlockCard key={block.id} block={block} direction="blocked" />
            ))}
          </div>
        </div>
      )}

      {/* Users who blocked this user */}
      {blockedThisUser.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <h4 className="text-sm font-medium text-slate-700">
              Users who blocked this person
            </h4>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {blockedThisUser.map((block) => (
              <BlockCard key={block.id} block={block} direction="blocked_by" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
