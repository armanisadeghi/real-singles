"use client";

import { useState } from "react";
import { MoreHorizontal, Flag, Ban, MessageCircle, Heart, X } from "lucide-react";
import { BottomSheet, BottomSheetActions } from "@/components/ui/BottomSheet";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { cn } from "@/lib/utils";

const REPORT_REASONS = [
  { value: "fake_profile", label: "Fake or spam profile" },
  { value: "inappropriate_content", label: "Inappropriate photos or bio" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "underage", label: "User appears underage" },
  { value: "scam", label: "Scammer or catfish" },
  { value: "other", label: "Other" },
];

interface UserActionsProps {
  userId: string;
  userName: string;
  isBlocked?: boolean;
  onBlock?: () => void;
  onUnblock?: () => void;
  onMessage?: () => void;
  onLike?: () => void;
}

export function UserActions({
  userId,
  userName,
  isBlocked = false,
  onBlock,
  onUnblock,
  onMessage,
  onLike,
}: UserActionsProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [reported, setReported] = useState(false);

  const handleReport = async () => {
    if (!reportReason) return;

    setLoading(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reported_user_id: userId,
          reason: reportReason,
          description: reportDescription,
        }),
      });

      if (res.ok) {
        setReported(true);
        setShowReportSheet(false);
        setReportReason("");
        setReportDescription("");
      } else {
        alert("Failed to submit report");
      }
    } catch (error) {
      console.error("Error reporting user:", error);
      alert("Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked_user_id: userId }),
      });

      if (res.ok) {
        setShowBlockConfirm(false);
        onBlock?.();
      } else {
        alert("Failed to block user");
      }
    } catch (error) {
      console.error("Error blocking user:", error);
      alert("Failed to block user");
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/blocks/${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onUnblock?.();
      } else {
        alert("Failed to unblock user");
      }
    } catch (error) {
      console.error("Error unblocking user:", error);
      alert("Failed to unblock user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Action buttons row */}
      <div className="flex items-center gap-2">
        {onMessage && (
          <button
            onClick={onMessage}
            disabled={isBlocked}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors",
              isBlocked
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-pink-500 text-white hover:bg-pink-600"
            )}
          >
            <MessageCircle className="w-4 h-4" />
            Message
          </button>
        )}

        {onLike && (
          <button
            onClick={onLike}
            disabled={isBlocked}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors",
              isBlocked
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "border border-pink-500 text-pink-500 hover:bg-pink-50"
            )}
          >
            <Heart className="w-4 h-4" />
            Like
          </button>
        )}

        {/* More menu */}
        <button
          onClick={() => setShowMenu(true)}
          className="p-2.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Action Menu Bottom Sheet */}
      <BottomSheet
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        title="Options"
      >
        <div className="p-2">
          {isBlocked ? (
            <button
              onClick={() => {
                setShowMenu(false);
                handleUnblock();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Ban className="w-5 h-5 text-green-500" />
              <span className="font-medium text-gray-900">Unblock {userName}</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowReportSheet(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Flag className="w-5 h-5 text-orange-500" />
                <span className="font-medium text-gray-900">Report {userName}</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowBlockConfirm(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Ban className="w-5 h-5 text-red-500" />
                <span className="font-medium text-red-600">Block {userName}</span>
              </button>
            </>
          )}
        </div>
      </BottomSheet>

      {/* Report Sheet */}
      <BottomSheet
        isOpen={showReportSheet}
        onClose={() => setShowReportSheet(false)}
        title="Report User"
        fullHeight
      >
        <div className="p-4 space-y-4">
          <p className="text-gray-600">
            Why are you reporting {userName}? Your report is confidential.
          </p>

          {/* Reason selection */}
          <div className="space-y-2">
            {REPORT_REASONS.map((reason) => (
              <button
                key={reason.value}
                onClick={() => setReportReason(reason.value)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors text-left",
                  reportReason === reason.value
                    ? "border-pink-500 bg-pink-50"
                    : "border-gray-200 hover:bg-gray-50"
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    reportReason === reason.value
                      ? "border-pink-500 bg-pink-500"
                      : "border-gray-300"
                  )}
                >
                  {reportReason === reason.value && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <span
                  className={cn(
                    "font-medium",
                    reportReason === reason.value
                      ? "text-pink-700"
                      : "text-gray-700"
                  )}
                >
                  {reason.label}
                </span>
              </button>
            ))}
          </div>

          {/* Additional details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional details (optional)
            </label>
            <textarea
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="Provide more context about your report..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
        </div>

        <BottomSheetActions>
          <button
            onClick={() => setShowReportSheet(false)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleReport}
            disabled={!reportReason || loading}
            className={cn(
              "flex-1 px-4 py-3 rounded-lg font-medium transition-colors",
              reportReason && !loading
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            {loading ? "Submitting..." : "Submit Report"}
          </button>
        </BottomSheetActions>
      </BottomSheet>

      {/* Block Confirmation Modal */}
      <ConfirmModal
        isOpen={showBlockConfirm}
        onClose={() => setShowBlockConfirm(false)}
        onConfirm={handleBlock}
        title={`Block ${userName}?`}
        message={`${userName} won't be able to see your profile or send you messages. They won't know you blocked them.`}
        confirmLabel="Block"
        variant="danger"
        loading={loading}
      />
    </>
  );
}

interface BlockedUsersListProps {
  blockedUsers: Array<{
    id: string;
    blocked_user_id: string;
    user: {
      display_name?: string | null;
    } | null;
    profile?: {
      first_name?: string | null;
      profile_image_url?: string | null;
    } | null;
  }>;
  onUnblock: (userId: string) => Promise<void>;
}

export function BlockedUsersList({
  blockedUsers,
  onUnblock,
}: BlockedUsersListProps) {
  const [unblocking, setUnblocking] = useState<string | null>(null);

  if (blockedUsers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Ban className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p>You haven't blocked anyone</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {blockedUsers.map((block) => {
        const name =
          block.profile?.first_name ||
          block.user?.display_name ||
          "Unknown User";
        const image = block.profile?.profile_image_url;

        return (
          <div
            key={block.id}
            className="flex items-center gap-3 py-3"
          >
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
              {image ? (
                <img
                  src={image}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-gray-400 font-medium">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{name}</p>
            </div>

            <button
              onClick={async () => {
                setUnblocking(block.blocked_user_id);
                await onUnblock(block.blocked_user_id);
                setUnblocking(null);
              }}
              disabled={unblocking === block.blocked_user_id}
              className="px-4 py-2 text-sm font-medium text-pink-600 hover:bg-pink-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {unblocking === block.blocked_user_id ? "..." : "Unblock"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
