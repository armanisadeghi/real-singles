"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
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
  GripVertical,
} from "lucide-react";
import { Skeleton } from "@/components/ui/LoadingSkeleton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { BottomSheet, BottomSheetActions } from "@/components/ui/BottomSheet";
import { AdminPageHeader, AdminButton } from "@/components/admin/AdminPageHeader";
import { cn, formatPoints, calculateAge } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

interface GalleryImage {
  id: string;
  user_id: string;
  media_url: string;
  display_order: number;
  is_primary: boolean;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

// Sortable Gallery Item Component
function SortableGalleryItem({
  image,
  onEdit,
  onDelete,
  onSetPrimary,
  actionLoading,
}: {
  image: GalleryImage;
  onEdit: (displayOrder: number) => void;
  onDelete: (id: string) => void;
  onSetPrimary: (id: string) => void;
  actionLoading: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
        <img
          src={image.media_url}
          alt={`Gallery ${image.display_order + 1}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://via.placeholder.com/200?text=Error";
          }}
        />
      </div>
      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(image.display_order)}
            className="px-3 py-1 bg-white text-gray-900 rounded text-sm font-medium hover:bg-gray-100"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(image.id)}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600"
          >
            Delete
          </button>
        </div>
        {!image.is_primary && (
          <button
            onClick={() => onSetPrimary(image.id)}
            disabled={actionLoading}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
          >
            Set as Primary
          </button>
        )}
      </div>
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 p-1 bg-white rounded shadow cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-4 h-4 text-gray-500" />
      </div>
      {/* Order badge */}
      <div className="absolute top-2 left-2">
        <span className="px-2 py-0.5 bg-black bg-opacity-50 text-white text-xs rounded">
          #{image.display_order + 1}
          {image.is_primary && " (Primary)"}
        </span>
      </div>
    </div>
  );
}

export default function AdminUserDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteImageConfirm, setShowDeleteImageConfirm] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [showPointsSheet, setShowPointsSheet] = useState(false);
  const [showEditProfileSheet, setShowEditProfileSheet] = useState(false);
  const [showEditImageSheet, setShowEditImageSheet] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [pointsAmount, setPointsAmount] = useState(0);
  const [pointsReason, setPointsReason] = useState("");
  
  // Edit profile form state
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editProfileImageUrl, setEditProfileImageUrl] = useState("");
  const [editGalleryImageUrl, setEditGalleryImageUrl] = useState("");

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = gallery.findIndex((img) => img.id === active.id);
      const newIndex = gallery.findIndex((img) => img.id === over.id);

      // Optimistically update local state
      const newGallery = arrayMove(gallery, oldIndex, newIndex);
      // Update display_order for each item
      const updatedGallery = newGallery.map((img, index) => ({
        ...img,
        display_order: index,
      }));
      setGallery(updatedGallery);

      // Send reorder request to API
      try {
        const orderPayload = updatedGallery.map((img) => ({
          id: img.id,
          display_order: img.display_order,
        }));

        const res = await fetch(`/api/admin/users/${id}/gallery`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: orderPayload }),
        });

        if (!res.ok) {
          // Revert on failure
          await fetchData();
          alert("Failed to reorder images");
        }
      } catch (error) {
        console.error("Error reordering images:", error);
        await fetchData();
        alert("Failed to reorder images");
      }
    }
  };

  const fetchData = useCallback(async () => {
    try {
      // Using admin API endpoint
      const res = await fetch(`/api/admin/users/${id}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setProfile(data.profile);
        setGallery(data.gallery || []);
        
        // Initialize edit form values
        if (data.profile) {
          setEditFirstName(data.profile.first_name || "");
          setEditLastName(data.profile.last_name || "");
          setEditGender(data.profile.gender || "");
          setEditProfileImageUrl(data.profile.profile_image_url || "");
        }
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

  const handleUpdateProfile = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: editFirstName,
          last_name: editLastName,
          gender: editGender,
          profile_image_url: editProfileImageUrl,
        }),
      });

      if (res.ok) {
        setProfile((prev) => prev ? {
          ...prev,
          first_name: editFirstName,
          last_name: editLastName,
          gender: editGender,
          profile_image_url: editProfileImageUrl,
        } : null);
        setShowEditProfileSheet(false);
        alert("Profile updated successfully");
      } else {
        alert("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateGalleryImage = async () => {
    if (editingImageIndex === null || !editGalleryImageUrl) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/gallery`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_order: editingImageIndex,
          media_url: editGalleryImageUrl,
          is_primary: editingImageIndex === 0,
        }),
      });

      if (res.ok) {
        // Refetch all data to ensure consistency
        await fetchData();
        setShowEditImageSheet(false);
        setEditingImageIndex(null);
        setEditGalleryImageUrl("");
      } else {
        alert("Failed to update image");
      }
    } catch (error) {
      console.error("Error updating image:", error);
      alert("Failed to update image");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditImageSheet = (index: number) => {
    const image = gallery.find((img) => img.display_order === index);
    setEditingImageIndex(index);
    setEditGalleryImageUrl(image?.media_url || "");
    setShowEditImageSheet(true);
  };

  const handleDeleteImage = async () => {
    if (!deletingImageId) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/gallery?gallery_id=${deletingImageId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Refetch all data to ensure consistency (handles auto-primary assignment)
        await fetchData();
        setShowDeleteImageConfirm(false);
        setDeletingImageId(null);
      } else {
        alert("Failed to delete image");
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Failed to delete image");
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteImageConfirm = (imageId: string) => {
    setDeletingImageId(imageId);
    setShowDeleteImageConfirm(true);
  };

  const handleSetPrimary = async (imageId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/gallery`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gallery_id: imageId,
          set_primary: true,
        }),
      });

      if (res.ok) {
        // Refetch all data to ensure consistency
        await fetchData();
      } else {
        alert("Failed to set primary image");
      }
    } catch (error) {
      console.error("Error setting primary image:", error);
      alert("Failed to set primary image");
    } finally {
      setActionLoading(false);
    }
  };

  const router = useRouter();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
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
      <div className="space-y-6">
        <AdminPageHeader
          title="User Not Found"
          subtitle="The requested user could not be found"
          showBack
        />
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">This user may have been deleted or doesn&apos;t exist.</p>
          <Link href="/admin/users" className="text-blue-600 hover:text-blue-700 font-medium">
            View all users
          </Link>
        </div>
      </div>
    );
  }

  const statusColors = {
    active: "bg-emerald-100 text-emerald-800",
    suspended: "bg-red-100 text-red-800",
    deleted: "bg-slate-100 text-slate-800",
  };

  const roleColors = {
    admin: "bg-purple-100 text-purple-800",
    moderator: "bg-blue-100 text-blue-800",
    user: "bg-slate-100 text-slate-800",
  };

  const userName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : user.display_name || "User Details";

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title={userName}
        subtitle={user.email}
        showBack
      >
        <AdminButton
          variant="secondary"
          icon={User}
          onClick={() => setShowEditProfileSheet(true)}
        >
          Edit Profile
        </AdminButton>
        <AdminButton
          variant="warning"
          icon={Star}
          onClick={() => setShowPointsSheet(true)}
        >
          Adjust Points
        </AdminButton>
        {user.status === "active" ? (
          <AdminButton
            variant="warning"
            icon={Ban}
            onClick={() => setShowSuspendConfirm(true)}
          >
            Suspend
          </AdminButton>
        ) : user.status === "suspended" ? (
          <AdminButton
            variant="success"
            icon={CheckCircle}
            onClick={() => handleStatusChange("active")}
            loading={actionLoading}
          >
            Reactivate
          </AdminButton>
        ) : null}
        <AdminButton
          variant="danger"
          icon={Trash2}
          onClick={() => setShowDeleteConfirm(true)}
        >
          Delete
        </AdminButton>
      </AdminPageHeader>

      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm
          opacity-100 translate-y-0
          [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
          [@starting-style]:opacity-0 [@starting-style]:translate-y-4">
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
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
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

      {/* Gallery Section */}
      {gallery.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6
          opacity-100 translate-y-0
          [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
          [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
          style={{ transitionDelay: "100ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Gallery Images</h3>
            <span className="text-xs text-gray-500">Drag to reorder</span>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={gallery.map((img) => img.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {gallery.map((img) => (
                  <SortableGalleryItem
                    key={img.id}
                    image={img}
                    onEdit={openEditImageSheet}
                    onDelete={openDeleteImageConfirm}
                    onSetPrimary={handleSetPrimary}
                    actionLoading={actionLoading}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

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

      {/* Delete Image Confirmation */}
      <ConfirmModal
        isOpen={showDeleteImageConfirm}
        onClose={() => {
          setShowDeleteImageConfirm(false);
          setDeletingImageId(null);
        }}
        onConfirm={handleDeleteImage}
        title="Delete Image"
        message="Are you sure you want to delete this image? This action cannot be undone."
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

      {/* Edit Profile Sheet */}
      <BottomSheet
        isOpen={showEditProfileSheet}
        onClose={() => setShowEditProfileSheet(false)}
        title="Edit Profile"
      >
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              value={editGender}
              onChange={(e) => setEditGender(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profile Image URL
            </label>
            <input
              type="url"
              value={editProfileImageUrl}
              onChange={(e) => setEditProfileImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-4 py-2 border rounded-lg text-sm"
            />
            {editProfileImageUrl && (
              <div className="mt-2">
                <img
                  src={editProfileImageUrl}
                  alt="Preview"
                  className="w-24 h-24 rounded-lg object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/100?text=Invalid";
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <BottomSheetActions>
          <button
            onClick={() => setShowEditProfileSheet(false)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateProfile}
            disabled={actionLoading}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {actionLoading ? "Saving..." : "Save Changes"}
          </button>
        </BottomSheetActions>
      </BottomSheet>

      {/* Edit Image Sheet */}
      <BottomSheet
        isOpen={showEditImageSheet}
        onClose={() => {
          setShowEditImageSheet(false);
          setEditingImageIndex(null);
          setEditGalleryImageUrl("");
        }}
        title={`Edit Image #${(editingImageIndex ?? 0) + 1}`}
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URL
            </label>
            <input
              type="url"
              value={editGalleryImageUrl}
              onChange={(e) => setEditGalleryImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-4 py-2 border rounded-lg text-sm"
            />
          </div>

          {editGalleryImageUrl && (
            <div className="flex justify-center">
              <img
                src={editGalleryImageUrl}
                alt="Preview"
                className="max-w-full h-48 rounded-lg object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/200?text=Invalid+URL";
                }}
              />
            </div>
          )}

          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
            <p className="font-medium mb-1">Tip: Use Unsplash URLs</p>
            <p>Format: https://images.unsplash.com/photo-[ID]?w=800&h=800&fit=crop&crop=face</p>
          </div>
        </div>

        <BottomSheetActions>
          <button
            onClick={() => {
              setShowEditImageSheet(false);
              setEditingImageIndex(null);
              setEditGalleryImageUrl("");
            }}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateGalleryImage}
            disabled={actionLoading || !editGalleryImageUrl}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {actionLoading ? "Saving..." : "Update Image"}
          </button>
        </BottomSheetActions>
      </BottomSheet>
    </div>
  );
}
