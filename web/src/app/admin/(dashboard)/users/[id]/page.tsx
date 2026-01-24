"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Star,
  Shield,
  Ban,
  Trash2,
  CheckCircle,
  AlertCircle,
  Plus,
  Minus,
  Image,
} from "lucide-react";
import { Skeleton } from "@/components/ui/LoadingSkeleton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { BottomSheet, BottomSheetActions } from "@/components/ui/BottomSheet";
import { cn, formatPoints, calculateAge } from "@/lib/utils";

interface UserDetail {
  id: string;
  email: string;
  phone?: string | null;
  display_name?: string | null;
  status: "active" | "suspended" | "deleted";
  role: "user" | "admin" | "moderator";
  points_balance: number;
  referral_code?: string | null;
  created_at: string;
  last_active_at?: string | null;
}

interface ProfileDetail {
  first_name?: string | null;
  last_name?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  occupation?: string | null;
  profile_image_url?: string | null;
  is_verified: boolean;
  is_photo_verified: boolean;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminUserDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPointsSheet, setShowPointsSheet] = useState(false);
  const [pointsAmount, setPointsAmount] = useState(0);
  const [pointsReason, setPointsReason] = useState("");

  const fetchData = useCallback(async () => {
    try {
      // Using admin API endpoint
      const res = await fetch(`/api/admin/users/${id}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setProfile(data.profile);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (newStatus: "active" | "suspended") => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setUser((prev) => (prev ? { ...prev, status: newStatus } : null));
        setShowSuspendConfirm(false);
      } else {
        alert("Failed to update user status");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Redirect to users list
        window.location.href = "/admin/users";
      } else {
        alert("Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdjustPoints = async () => {
    if (pointsAmount === 0) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: pointsAmount,
          reason: pointsReason || "Admin adjustment",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser((prev) =>
          prev ? { ...prev, points_balance: data.new_balance } : null
        );
        setShowPointsSheet(false);
        setPointsAmount(0);
        setPointsReason("");
      } else {
        alert("Failed to adjust points");
      }
    } catch (error) {
      console.error("Error adjusting points:", error);
      alert("Failed to adjust points");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="w-6 h-6" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start gap-6">
            <Skeleton className="w-24 h-24 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
        <Link href="/admin/users" className="text-pink-600 hover:text-pink-700">
          Back to Users
        </Link>
      </div>
    );
  }

  const statusColors = {
    active: "bg-green-100 text-green-800",
    suspended: "bg-red-100 text-red-800",
    deleted: "bg-gray-100 text-gray-800",
  };

  const roleColors = {
    admin: "bg-purple-100 text-purple-800",
    moderator: "bg-blue-100 text-blue-800",
    user: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/users"
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPointsSheet(true)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
          >
            <Star className="w-4 h-4" />
            Adjust Points
          </button>

          {user.status === "active" ? (
            <button
              onClick={() => setShowSuspendConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
            >
              <Ban className="w-4 h-4" />
              Suspend
            </button>
          ) : user.status === "suspended" ? (
            <button
              onClick={() => handleStatusChange("active")}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              Reactivate
            </button>
          ) : null}

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shrink-0">
                {profile?.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-white" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-gray-900">
                    {profile?.first_name && profile?.last_name
                      ? `${profile.first_name} ${profile.last_name}`
                      : user.display_name || "No Name"}
                  </h2>
                  <span
                    className={cn(
                      "px-2 py-0.5 text-xs font-medium rounded-full",
                      statusColors[user.status]
                    )}
                  >
                    {user.status}
                  </span>
                  <span
                    className={cn(
                      "px-2 py-0.5 text-xs font-medium rounded-full",
                      roleColors[user.role]
                    )}
                  >
                    {user.role}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {user.phone}
                    </div>
                  )}
                  {profile?.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {profile.city}
                      {profile.state && `, ${profile.state}`}
                    </div>
                  )}
                </div>

                {/* Verification badges */}
                <div className="flex items-center gap-2 mt-3">
                  {profile?.is_verified && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                  {profile?.is_photo_verified && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <Image className="w-3 h-3" />
                      Photo Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile details */}
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Profile Information
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {profile?.date_of_birth && (
                <div>
                  <p className="text-sm text-gray-500">Age</p>
                  <p className="font-medium">
                    {calculateAge(profile.date_of_birth)} years old
                  </p>
                </div>
              )}
              {profile?.gender && (
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium capitalize">{profile.gender}</p>
                </div>
              )}
              {profile?.occupation && (
                <div>
                  <p className="text-sm text-gray-500">Occupation</p>
                  <p className="font-medium">{profile.occupation}</p>
                </div>
              )}
              {user.referral_code && (
                <div>
                  <p className="text-sm text-gray-500">Referral Code</p>
                  <p className="font-medium font-mono">{user.referral_code}</p>
                </div>
              )}
            </div>

            {profile?.bio && (
              <div className="mt-4">
                <p className="text-sm text-gray-500">Bio</p>
                <p className="mt-1">{profile.bio}</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats sidebar */}
        <div className="space-y-6">
          {/* Points card */}
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-6 h-6" />
              <span className="font-medium">Points Balance</span>
            </div>
            <p className="text-3xl font-bold">
              {formatPoints(user.points_balance)}
            </p>
          </div>

          {/* Account info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Account Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Joined</span>
                <span className="font-medium">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
              {user.last_active_at && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Last Active</span>
                  <span className="font-medium">
                    {new Date(user.last_active_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-500">User ID</span>
                <span className="font-mono text-xs">{user.id.slice(0, 8)}...</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suspend Confirmation */}
      <ConfirmModal
        isOpen={showSuspendConfirm}
        onClose={() => setShowSuspendConfirm(false)}
        onConfirm={() => handleStatusChange("suspended")}
        title="Suspend User"
        message={`Are you sure you want to suspend this user? They will not be able to access their account.`}
        confirmLabel="Suspend"
        variant="warning"
        loading={actionLoading}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to permanently delete this user? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={actionLoading}
      />

      {/* Points Adjustment Sheet */}
      <BottomSheet
        isOpen={showPointsSheet}
        onClose={() => setShowPointsSheet(false)}
        title="Adjust Points"
      >
        <div className="p-4 space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Current Balance</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatPoints(user.points_balance)} points
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount to Add/Remove
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPointsAmount((prev) => prev - 100)}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <Minus className="w-5 h-5" />
              </button>
              <input
                type="number"
                value={pointsAmount}
                onChange={(e) => setPointsAmount(Number(e.target.value))}
                className="flex-1 px-4 py-2 border rounded-lg text-center text-xl font-bold"
              />
              <button
                onClick={() => setPointsAmount((prev) => prev + 100)}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">
              New balance:{" "}
              <span className="font-bold">
                {formatPoints(user.points_balance + pointsAmount)}
              </span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason (optional)
            </label>
            <input
              type="text"
              value={pointsReason}
              onChange={(e) => setPointsReason(e.target.value)}
              placeholder="e.g., Bonus for referral, Compensation"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        <BottomSheetActions>
          <button
            onClick={() => setShowPointsSheet(false)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleAdjustPoints}
            disabled={pointsAmount === 0 || actionLoading}
            className={cn(
              "flex-1 px-4 py-3 rounded-lg font-medium",
              pointsAmount !== 0
                ? "bg-yellow-500 text-white hover:bg-yellow-600"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            {actionLoading ? "Saving..." : "Save Changes"}
          </button>
        </BottomSheetActions>
      </BottomSheet>
    </div>
  );
}
