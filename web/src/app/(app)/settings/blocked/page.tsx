"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserX, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/ui";

interface BlockedUser {
  id: string;
  blocked_id: string;
  blocked_profile: {
    first_name?: string;
    profile_image_url?: string;
  };
  blocked_user: {
    display_name?: string;
  };
  created_at: string;
}

export default function BlockedUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [unblocking, setUnblocking] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("blocks")
        .select(`
          id,
          blocked_id,
          created_at,
          blocked_profile:profiles!blocks_blocked_id_fkey(first_name, profile_image_url),
          blocked_user:users!blocks_blocked_id_fkey(display_name)
        `)
        .eq("blocker_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading blocked users:", error);
        return;
      }

      // Resolve storage URLs for profile images
      const blockedWithUrls = await Promise.all(
        ((data as any) || []).map(async (block: any) => {
          const profileImageUrl = block.blocked_profile?.profile_image_url;
          if (profileImageUrl && !profileImageUrl.startsWith("http")) {
            const bucket = profileImageUrl.includes("/avatar") ? "avatars" : "gallery";
            const { data: signedData } = await supabase.storage
              .from(bucket)
              .createSignedUrl(profileImageUrl, 3600);
            return {
              ...block,
              blocked_profile: {
                ...block.blocked_profile,
                profile_image_url: signedData?.signedUrl || profileImageUrl,
              },
            };
          }
          return block;
        })
      );

      setBlockedUsers(blockedWithUrls);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (blockId: string) => {
    if (!confirm("Are you sure you want to unblock this user?")) {
      return;
    }

    setUnblocking(blockId);
    try {
      const response = await fetch(`/api/blocks/${blockId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to unblock user");
      }

      // Remove from list
      setBlockedUsers((prev) => prev.filter((block) => block.id !== blockId));
      setMessage("User unblocked successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Unblock error:", error);
      alert("Failed to unblock user. Please try again.");
    } finally {
      setUnblocking(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-6">
        {/* Compact Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href="/settings"
              className="flex items-center justify-center w-8 h-8 -ml-1 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Back to settings"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Blocked</h1>
          </div>
          <span className="text-sm text-gray-500">
            {blockedUsers.length} user{blockedUsers.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Success Message */}
        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-800">{message}</p>
          </div>
        )}

        {/* Info Box */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">About Blocking</p>
              <p>Blocked users cannot see your profile, message you, or interact with you in any way.</p>
            </div>
          </div>
        </div>

        {/* Blocked Users List */}
        {blockedUsers.length === 0 ? (
          <EmptyState
            title="No blocked users"
            description="You haven't blocked anyone yet"
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm divide-y">
            {blockedUsers.map((block) => {
              const name = block.blocked_profile?.first_name || block.blocked_user?.display_name || "Unknown User";
              const image = block.blocked_profile?.profile_image_url;
              const blockedDate = new Date(block.created_at).toLocaleDateString();

              return (
                <div key={block.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      {image ? (
                        <img
                          src={image}
                          alt={`Photo of ${name}`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-semibold">
                          {name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Info */}
                      <div>
                        <h3 className="font-semibold text-gray-900">{name}</h3>
                        <p className="text-sm text-gray-500">Blocked on {blockedDate}</p>
                      </div>
                    </div>

                    {/* Unblock Button */}
                    <button
                      onClick={() => handleUnblock(block.id)}
                      disabled={unblocking === block.id}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
                    >
                      {unblocking === block.id ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Unblocking...
                        </span>
                      ) : (
                        "Unblock"
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
