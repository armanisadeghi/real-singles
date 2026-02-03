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
  Heart,
  HeartOff,
  Users,
  MessageCircle,
  Play,
  Sparkles,
} from "lucide-react";
import { Skeleton } from "@/components/ui/LoadingSkeleton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { BottomSheet, BottomSheetActions } from "@/components/ui/BottomSheet";
import { AdminPageHeader, AdminButton } from "@/components/admin/AdminPageHeader";
import { EmailComposeSheet } from "@/components/admin/EmailComposeSheet";
import { cn, formatPoints, calculateAge } from "@/lib/utils";
import {
  GENDER_OPTIONS,
  BODY_TYPE_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  HAS_KIDS_OPTIONS,
  WANTS_KIDS_OPTIONS,
  SMOKING_OPTIONS,
  DRINKING_OPTIONS,
  MARIJUANA_OPTIONS,
  EXERCISE_OPTIONS,
  EDUCATION_OPTIONS,
  ETHNICITY_OPTIONS,
  RELIGION_OPTIONS,
  POLITICAL_OPTIONS,
  ZODIAC_OPTIONS,
  PETS_OPTIONS,
  LANGUAGE_OPTIONS,
  INTEREST_OPTIONS,
  COUNTRY_OPTIONS,
  DATING_INTENTIONS_OPTIONS,
} from "@/types";
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

// Import new components
import {
  QuickStats,
  EligibilityPanel,
  InteractionGrid,
  MatchGrid,
  BlocksPanel,
} from "./components";

// Types
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
  // Basic Info
  first_name?: string | null;
  last_name?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  looking_for?: string[] | null;
  zodiac_sign?: string | null;
  bio?: string | null;
  looking_for_description?: string | null;
  dating_intentions?: string | null;
  // Physical
  height_inches?: number | null;
  body_type?: string | null;
  ethnicity?: string[] | null;
  // Location
  country?: string | null;
  state?: string | null;
  city?: string | null;
  zip_code?: string | null;
  hometown?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  // Lifestyle
  marital_status?: string | null;
  religion?: string | null;
  political_views?: string | null;
  education?: string | null;
  occupation?: string | null;
  company?: string | null;
  schools?: string[] | null;
  smoking?: string | null;
  drinking?: string | null;
  marijuana?: string | null;
  exercise?: string | null;
  languages?: string[] | null;
  // Family
  has_kids?: string | null;
  wants_kids?: string | null;
  pets?: string[] | null;
  // Interests & Goals
  interests?: string[] | null;
  life_goals?: string[] | null;
  // Profile Prompts
  ideal_first_date?: string | null;
  non_negotiables?: string | null;
  worst_job?: string | null;
  dream_job?: string | null;
  nightclub_or_home?: string | null;
  pet_peeves?: string | null;
  after_work?: string | null;
  way_to_heart?: string | null;
  craziest_travel_story?: string | null;
  weirdest_gift?: string | null;
  past_event?: string | null;
  // Social
  social_link_1?: string | null;
  social_link_2?: string | null;
  // Media
  profile_image_url?: string | null;
  voice_prompt_url?: string | null;
  voice_prompt_duration_seconds?: number | null;
  video_intro_url?: string | null;
  video_intro_duration_seconds?: number | null;
  verification_selfie_url?: string | null;
  // Verification & Status
  is_verified: boolean;
  is_photo_verified: boolean;
  is_id_verified?: boolean | null;
  can_start_matching?: boolean | null;
  profile_hidden?: boolean | null;
}

interface GalleryImage {
  id: string;
  user_id: string;
  media_url: string;
  display_order: number;
  is_primary: boolean;
}

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

interface LikeInteraction {
  id: string;
  user?: UserWithProfile;
  target_user?: UserWithProfile;
  action: string;
  created_at: string;
  is_mutual: boolean;
}

interface MutualMatch {
  id: string;
  user: UserWithProfile;
  matched_at: string;
  conversation_id: string | null;
  message_count: number;
  is_archived: boolean;
}

interface Block {
  id: string;
  user: UserWithProfile;
  created_at: string;
}

interface MatchEligibility {
  can_match: boolean;
  reasons: string[];
  profile_complete: boolean;
  has_photos: boolean;
  is_verified: boolean;
  is_photo_verified: boolean;
  account_status: string;
  profile_hidden: boolean;
}

interface InteractionsData {
  likes_received: LikeInteraction[];
  likes_given: LikeInteraction[];
  mutual_matches: MutualMatch[];
  passes_received: LikeInteraction[];
  passes_given: LikeInteraction[];
  blocks: {
    blocked_by_user: Block[];
    blocked_this_user: Block[];
  };
  match_eligibility: MatchEligibility;
  stats: {
    likes_received_count: number;
    likes_given_count: number;
    mutual_matches_count: number;
    super_likes_received: number;
    super_likes_given: number;
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

// Tab definitions
type TabId = "overview" | "likes-received" | "likes-given" | "matches" | "passes" | "blocks";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: User },
  { id: "likes-received", label: "Likes Received", icon: Heart },
  { id: "likes-given", label: "Likes Given", icon: Heart },
  { id: "matches", label: "Matches", icon: Users },
  { id: "passes", label: "Passes", icon: HeartOff },
  { id: "blocks", label: "Blocks", icon: Ban },
];

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
  const router = useRouter();
  
  // Core data state
  const [user, setUser] = useState<UserDetail | null>(null);
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [interactions, setInteractions] = useState<InteractionsData | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [interactionsLoading, setInteractionsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Modal states
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteImageConfirm, setShowDeleteImageConfirm] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [showPointsSheet, setShowPointsSheet] = useState(false);
  const [showEditProfileSheet, setShowEditProfileSheet] = useState(false);
  const [showEditImageSheet, setShowEditImageSheet] = useState(false);
  const [showEmailSheet, setShowEmailSheet] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [pointsAmount, setPointsAmount] = useState(0);
  const [pointsReason, setPointsReason] = useState("");
  
  // Edit profile form state - comprehensive state for all fields
  const [editForm, setEditForm] = useState<Partial<ProfileDetail>>({});
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

      const newGallery = arrayMove(gallery, oldIndex, newIndex);
      const updatedGallery = newGallery.map((img, index) => ({
        ...img,
        display_order: index,
      }));
      setGallery(updatedGallery);

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
      const res = await fetch(`/api/admin/users/${id}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setProfile(data.profile);
        setGallery(data.gallery || []);
        
        if (data.profile) {
          setEditForm(data.profile);
          setEditProfileImageUrl(data.profile.profile_image_url || "");
        }
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchInteractions = useCallback(async () => {
    setInteractionsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/interactions`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setInteractions(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching interactions:", error);
    } finally {
      setInteractionsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
    fetchInteractions();
  }, [fetchData, fetchInteractions]);

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
          ...editForm,
          profile_image_url: editProfileImageUrl,
        }),
      });

      if (res.ok) {
        await fetchData(); // Refresh data
        setShowEditProfileSheet(false);
        alert("Profile updated successfully");
      } else {
        const errorData = await res.json();
        alert(`Failed to update profile: ${errorData.error || "Unknown error"}`);
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

  const handleSimulateAlgorithm = () => {
    router.push(`/admin/algorithm-simulator?user_id=${id}`);
  };

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
          variant="primary"
          iconName="play"
          onClick={handleSimulateAlgorithm}
        >
          Simulate Algorithm
        </AdminButton>
        <AdminButton
          variant="secondary"
          iconName="zap"
          onClick={() => setShowEmailSheet(true)}
        >
          Email
        </AdminButton>
        <AdminButton
          variant="secondary"
          iconName="user"
          onClick={() => setShowEditProfileSheet(true)}
        >
          Edit
        </AdminButton>
        <AdminButton
          variant="warning"
          iconName="star"
          onClick={() => setShowPointsSheet(true)}
        >
          Points
        </AdminButton>
        {user.status === "active" ? (
          <AdminButton
            variant="warning"
            iconName="ban"
            onClick={() => setShowSuspendConfirm(true)}
          >
            Suspend
          </AdminButton>
        ) : user.status === "suspended" ? (
          <AdminButton
            variant="success"
            iconName="check-circle"
            onClick={() => handleStatusChange("active")}
            loading={actionLoading}
          >
            Reactivate
          </AdminButton>
        ) : null}
        <AdminButton
          variant="danger"
          iconName="trash2"
          onClick={() => setShowDeleteConfirm(true)}
        >
          Delete
        </AdminButton>
      </AdminPageHeader>

      {/* Quick Stats */}
      {interactions && (
        <QuickStats
          likesReceived={interactions.stats.likes_received_count}
          likesGiven={interactions.stats.likes_given_count}
          mutualMatches={interactions.stats.mutual_matches_count}
          superLikesReceived={interactions.stats.super_likes_received}
        />
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 overflow-x-auto">
          <nav className="flex min-w-max px-4" role="tablist">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              // Get count for badge
              let count: number | undefined;
              if (interactions) {
                switch (tab.id) {
                  case "likes-received":
                    count = interactions.likes_received.length;
                    break;
                  case "likes-given":
                    count = interactions.likes_given.length;
                    break;
                  case "matches":
                    count = interactions.mutual_matches.length;
                    break;
                  case "passes":
                    count = interactions.passes_received.length + interactions.passes_given.length;
                    break;
                  case "blocks":
                    count = interactions.blocks.blocked_by_user.length + interactions.blocks.blocked_this_user.length;
                    break;
                }
              }

              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {count !== undefined && count > 0 && (
                    <span
                      className={cn(
                        "px-1.5 py-0.5 text-xs font-medium rounded-full",
                        isActive
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* User Profile Card */}
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
                    {profile?.can_start_matching && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                        <Heart className="w-3 h-3" />
                        Can Match
                      </span>
                    )}
                    {profile?.profile_hidden && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                        <AlertCircle className="w-3 h-3" />
                        Profile Hidden
                      </span>
                    )}
                  </div>
                </div>

                {/* Points & Account Info Sidebar */}
                <div className="space-y-4 w-64 shrink-0">
                  {/* Points card */}
                  <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg p-4 text-white">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-5 h-5" />
                      <span className="text-sm font-medium">Points Balance</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {formatPoints(user.points_balance)}
                    </p>
                  </div>

                  {/* Account info */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-medium text-slate-700 mb-2 text-sm">Account Info</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Joined</span>
                        <span className="font-medium">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {user.last_active_at && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Last Active</span>
                          <span className="font-medium">
                            {new Date(user.last_active_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-500">User ID</span>
                        <span className="font-mono text-[10px]">{user.id.slice(0, 12)}...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Details Grid */}
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Basic Info Section */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {profile?.date_of_birth && (
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Age</p>
                          <p className="font-medium">
                            {calculateAge(profile.date_of_birth)} years old
                          </p>
                        </div>
                      )}
                      {profile?.gender && (
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Gender</p>
                          <p className="font-medium capitalize">{profile.gender}</p>
                        </div>
                      )}
                      {profile?.zodiac_sign && (
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Zodiac Sign</p>
                          <p className="font-medium capitalize">{profile.zodiac_sign}</p>
                        </div>
                      )}
                      {profile?.dating_intentions && (
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Dating Intentions</p>
                          <p className="font-medium capitalize">{profile.dating_intentions.replace(/_/g, " ")}</p>
                        </div>
                      )}
                      {profile?.marital_status && (
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Marital Status</p>
                          <p className="font-medium capitalize">{profile.marital_status.replace(/_/g, " ")}</p>
                        </div>
                      )}
                      {profile?.looking_for && profile.looking_for.length > 0 && (
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Looking For</p>
                          <p className="font-medium capitalize">{profile.looking_for.join(", ")}</p>
                        </div>
                      )}
                    </div>
                    {profile?.bio && (
                      <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-1">Bio</p>
                        <p className="text-sm bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">{profile.bio}</p>
                      </div>
                    )}
                    {profile?.looking_for_description && (
                      <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-1">Looking For Description</p>
                        <p className="text-sm bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">{profile.looking_for_description}</p>
                      </div>
                    )}
                  </div>

                  {/* Physical Attributes */}
                  {(profile?.height_inches || profile?.body_type || (profile?.ethnicity && profile.ethnicity.length > 0)) && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Physical Attributes</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {profile?.height_inches && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Height</p>
                            <p className="font-medium">
                              {Math.floor(profile.height_inches / 12)}&apos;{profile.height_inches % 12}&quot;
                            </p>
                          </div>
                        )}
                        {profile?.body_type && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Body Type</p>
                            <p className="font-medium capitalize">{profile.body_type.replace(/_/g, " ")}</p>
                          </div>
                        )}
                        {profile?.ethnicity && profile.ethnicity.length > 0 && (
                          <div className="bg-slate-50 rounded-lg p-3 sm:col-span-2">
                            <p className="text-xs text-gray-500">Ethnicity</p>
                            <p className="font-medium capitalize">{profile.ethnicity.join(", ")}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  {(profile?.city || profile?.state || profile?.country || profile?.hometown) && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Location</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {profile?.city && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">City</p>
                            <p className="font-medium">{profile.city}</p>
                          </div>
                        )}
                        {profile?.state && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">State</p>
                            <p className="font-medium">{profile.state}</p>
                          </div>
                        )}
                        {profile?.country && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Country</p>
                            <p className="font-medium">{profile.country}</p>
                          </div>
                        )}
                        {profile?.zip_code && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">ZIP Code</p>
                            <p className="font-medium">{profile.zip_code}</p>
                          </div>
                        )}
                        {profile?.hometown && (
                          <div className="bg-slate-50 rounded-lg p-3 sm:col-span-2">
                            <p className="text-xs text-gray-500">Hometown</p>
                            <p className="font-medium">{profile.hometown}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Career & Education */}
                  {(profile?.occupation || profile?.company || profile?.education || (profile?.schools && profile.schools.length > 0)) && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Career & Education</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {profile?.occupation && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Occupation</p>
                            <p className="font-medium">{profile.occupation}</p>
                          </div>
                        )}
                        {profile?.company && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Company</p>
                            <p className="font-medium">{profile.company}</p>
                          </div>
                        )}
                        {profile?.education && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Education</p>
                            <p className="font-medium capitalize">{profile.education.replace(/_/g, " ")}</p>
                          </div>
                        )}
                        {profile?.schools && profile.schools.length > 0 && (
                          <div className="bg-slate-50 rounded-lg p-3 sm:col-span-2">
                            <p className="text-xs text-gray-500">Schools</p>
                            <p className="font-medium">{profile.schools.join(", ")}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Lifestyle */}
                  {(profile?.religion || profile?.political_views || profile?.exercise || (profile?.languages && profile.languages.length > 0)) && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Lifestyle</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {profile?.religion && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Religion</p>
                            <p className="font-medium capitalize">{profile.religion}</p>
                          </div>
                        )}
                        {profile?.political_views && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Political Views</p>
                            <p className="font-medium capitalize">{profile.political_views.replace(/_/g, " ")}</p>
                          </div>
                        )}
                        {profile?.exercise && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Exercise</p>
                            <p className="font-medium capitalize">{profile.exercise}</p>
                          </div>
                        )}
                        {profile?.languages && profile.languages.length > 0 && (
                          <div className="bg-slate-50 rounded-lg p-3 sm:col-span-2">
                            <p className="text-xs text-gray-500">Languages</p>
                            <p className="font-medium">{profile.languages.join(", ")}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Habits */}
                  {(profile?.smoking || profile?.drinking || profile?.marijuana) && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Habits</h3>
                      <div className="grid sm:grid-cols-3 gap-4">
                        {profile?.smoking && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Smoking</p>
                            <p className="font-medium capitalize">{profile.smoking}</p>
                          </div>
                        )}
                        {profile?.drinking && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Drinking</p>
                            <p className="font-medium capitalize">{profile.drinking}</p>
                          </div>
                        )}
                        {profile?.marijuana && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Marijuana</p>
                            <p className="font-medium capitalize">{profile.marijuana}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Family */}
                  {(profile?.has_kids || profile?.wants_kids || (profile?.pets && profile.pets.length > 0)) && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Family</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {profile?.has_kids && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Has Kids</p>
                            <p className="font-medium capitalize">{profile.has_kids.replace(/_/g, " ")}</p>
                          </div>
                        )}
                        {profile?.wants_kids && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Wants Kids</p>
                            <p className="font-medium capitalize">{profile.wants_kids.replace(/_/g, " ")}</p>
                          </div>
                        )}
                        {profile?.pets && profile.pets.length > 0 && (
                          <div className="bg-slate-50 rounded-lg p-3 sm:col-span-2">
                            <p className="text-xs text-gray-500">Pets</p>
                            <p className="font-medium capitalize">{profile.pets.join(", ")}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Interests & Goals */}
                  {((profile?.interests && profile.interests.length > 0) || (profile?.life_goals && profile.life_goals.length > 0)) && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Interests & Goals</h3>
                      {profile?.interests && profile.interests.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 mb-2">Interests</p>
                          <div className="flex flex-wrap gap-2">
                            {profile.interests.map((interest, idx) => (
                              <span key={idx} className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {profile?.life_goals && profile.life_goals.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-2">Life Goals</p>
                          <div className="flex flex-wrap gap-2">
                            {profile.life_goals.map((goal, idx) => (
                              <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                {goal}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Profile Prompts */}
                  {(profile?.ideal_first_date || profile?.non_negotiables || profile?.way_to_heart || 
                    profile?.after_work || profile?.nightclub_or_home || profile?.pet_peeves ||
                    profile?.worst_job || profile?.dream_job || profile?.craziest_travel_story ||
                    profile?.weirdest_gift || profile?.past_event) && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Profile Prompts</h3>
                      <div className="space-y-3">
                        {profile?.ideal_first_date && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Ideal First Date</p>
                            <p className="text-sm whitespace-pre-wrap">{profile.ideal_first_date}</p>
                          </div>
                        )}
                        {profile?.non_negotiables && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Non-Negotiables</p>
                            <p className="text-sm whitespace-pre-wrap">{profile.non_negotiables}</p>
                          </div>
                        )}
                        {profile?.way_to_heart && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Way to My Heart</p>
                            <p className="text-sm whitespace-pre-wrap">{profile.way_to_heart}</p>
                          </div>
                        )}
                        {profile?.after_work && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">After Work</p>
                            <p className="text-sm whitespace-pre-wrap">{profile.after_work}</p>
                          </div>
                        )}
                        {profile?.nightclub_or_home && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Nightclub or Home</p>
                            <p className="text-sm">{profile.nightclub_or_home}</p>
                          </div>
                        )}
                        {profile?.pet_peeves && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Pet Peeves</p>
                            <p className="text-sm whitespace-pre-wrap">{profile.pet_peeves}</p>
                          </div>
                        )}
                        {profile?.worst_job && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Worst Job</p>
                            <p className="text-sm whitespace-pre-wrap">{profile.worst_job}</p>
                          </div>
                        )}
                        {profile?.dream_job && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Dream Job</p>
                            <p className="text-sm whitespace-pre-wrap">{profile.dream_job}</p>
                          </div>
                        )}
                        {profile?.craziest_travel_story && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Craziest Travel Story</p>
                            <p className="text-sm whitespace-pre-wrap">{profile.craziest_travel_story}</p>
                          </div>
                        )}
                        {profile?.weirdest_gift && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Weirdest Gift</p>
                            <p className="text-sm whitespace-pre-wrap">{profile.weirdest_gift}</p>
                          </div>
                        )}
                        {profile?.past_event && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Past Event</p>
                            <p className="text-sm whitespace-pre-wrap">{profile.past_event}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Social Links */}
                  {(profile?.social_link_1 || profile?.social_link_2) && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Social Links</h3>
                      <div className="space-y-2">
                        {profile?.social_link_1 && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Social Link 1</p>
                            <a href={profile.social_link_1} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                              {profile.social_link_1}
                            </a>
                          </div>
                        )}
                        {profile?.social_link_2 && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Social Link 2</p>
                            <a href={profile.social_link_2} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                              {profile.social_link_2}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Voice & Video Section */}
                  {(profile?.voice_prompt_url || profile?.video_intro_url) && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">Voice & Video</p>
                      <div className="flex flex-wrap gap-2">
                        {profile?.voice_prompt_url && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-pink-50 rounded-lg">
                            <Play className="w-4 h-4 text-pink-500" />
                            <span className="text-sm text-pink-700">
                              Voice Prompt
                              {profile?.voice_prompt_duration_seconds && (
                                <span className="text-pink-400 ml-1">
                                  ({profile.voice_prompt_duration_seconds}s)
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                        {profile?.video_intro_url && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg">
                            <Sparkles className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm text-indigo-700">
                              Video Intro
                              {profile?.video_intro_duration_seconds && (
                                <span className="text-indigo-400 ml-1">
                                  ({profile.video_intro_duration_seconds}s)
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Verification Selfie Section */}
                  {profile?.verification_selfie_url && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">Verification Selfie</p>
                      <div className="flex items-start gap-4">
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                          <img
                            src={profile.verification_selfie_url}
                            alt="Verification selfie"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://via.placeholder.com/96?text=Error";
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium h-fit">
                          <Shield className="w-3 h-3" />
                          Selfie Uploaded
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Eligibility Panel */}
                {interactions && (
                  <EligibilityPanel eligibility={interactions.match_eligibility} />
                )}
              </div>

              {/* Gallery Section */}
              {gallery.length > 0 && (
                <div className="pt-4 border-t">
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
            </div>
          )}

          {/* Likes Received Tab */}
          {activeTab === "likes-received" && (
            interactionsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : interactions ? (
              <InteractionGrid
                items={interactions.likes_received}
                direction="received"
                emptyIcon={<Heart className="w-8 h-8 text-slate-300" />}
                emptyTitle="No likes received"
                emptyDescription="This user hasn't received any likes yet. Likes appear here when other users like this person's profile."
                showMutualFilter
              />
            ) : null
          )}

          {/* Likes Given Tab */}
          {activeTab === "likes-given" && (
            interactionsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : interactions ? (
              <InteractionGrid
                items={interactions.likes_given}
                direction="given"
                emptyIcon={<Heart className="w-8 h-8 text-slate-300" />}
                emptyTitle="No likes given"
                emptyDescription="This user hasn't liked anyone yet. Likes appear here when they like other profiles."
                showMutualFilter
              />
            ) : null
          )}

          {/* Matches Tab */}
          {activeTab === "matches" && (
            interactionsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : interactions ? (
              <MatchGrid matches={interactions.mutual_matches} />
            ) : null
          )}

          {/* Passes Tab */}
          {activeTab === "passes" && (
            interactionsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : interactions ? (
              <div className="space-y-8">
                {/* Passes Received */}
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
                    <HeartOff className="w-4 h-4 text-slate-400" />
                    Users who passed on this person ({interactions.passes_received.length})
                  </h4>
                  <InteractionGrid
                    items={interactions.passes_received}
                    direction="received"
                    emptyIcon={<HeartOff className="w-8 h-8 text-slate-300" />}
                    emptyTitle="No passes received"
                    emptyDescription="No users have passed on this person yet."
                  />
                </div>

                {/* Passes Given */}
                <div className="pt-6 border-t">
                  <h4 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
                    <HeartOff className="w-4 h-4 text-slate-400" />
                    Users this person passed on ({interactions.passes_given.length})
                  </h4>
                  <InteractionGrid
                    items={interactions.passes_given}
                    direction="given"
                    emptyIcon={<HeartOff className="w-8 h-8 text-slate-300" />}
                    emptyTitle="No passes given"
                    emptyDescription="This user hasn't passed on anyone yet."
                  />
                </div>
              </div>
            ) : null
          )}

          {/* Blocks Tab */}
          {activeTab === "blocks" && (
            interactionsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : interactions ? (
              <BlocksPanel
                blockedByUser={interactions.blocks.blocked_by_user}
                blockedThisUser={interactions.blocks.blocked_this_user}
              />
            ) : null
          )}
        </div>
      </div>

      {/* Modals */}
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

      {/* Edit Profile Sheet - Comprehensive Form */}
      <BottomSheet
        isOpen={showEditProfileSheet}
        onClose={() => setShowEditProfileSheet(false)}
        title="Edit Profile"
      >
        <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto space-y-6">
          {/* Basic Info */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={editForm.first_name || ""}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={editForm.last_name || ""}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={editForm.date_of_birth || ""}
                  onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={editForm.gender || ""}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                >
                  <option value="">Select...</option>
                  {GENDER_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Zodiac Sign</label>
                <select
                  value={editForm.zodiac_sign || ""}
                  onChange={(e) => setEditForm({ ...editForm, zodiac_sign: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                >
                  <option value="">Select...</option>
                  {ZODIAC_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Dating Intentions</label>
                <select
                  value={editForm.dating_intentions || ""}
                  onChange={(e) => setEditForm({ ...editForm, dating_intentions: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                >
                  <option value="">Select...</option>
                  {DATING_INTENTIONS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Marital Status</label>
                <select
                  value={editForm.marital_status || ""}
                  onChange={(e) => setEditForm({ ...editForm, marital_status: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                >
                  <option value="">Select...</option>
                  {MARITAL_STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Looking For (comma-separated)</label>
              <input
                type="text"
                value={editForm.looking_for?.join(", ") || ""}
                onChange={(e) => setEditForm({ 
                  ...editForm, 
                  looking_for: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                })}
                placeholder="male, female"
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={editForm.bio || ""}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Looking For Description</label>
              <textarea
                value={editForm.looking_for_description || ""}
                onChange={(e) => setEditForm({ ...editForm, looking_for_description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
          </div>

          {/* Physical */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Physical Attributes</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Height (inches)</label>
                <input
                  type="number"
                  value={editForm.height_inches || ""}
                  onChange={(e) => setEditForm({ ...editForm, height_inches: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Body Type</label>
                <select
                  value={editForm.body_type || ""}
                  onChange={(e) => setEditForm({ ...editForm, body_type: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                >
                  <option value="">Select...</option>
                  {BODY_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Ethnicity (comma-separated)</label>
                <input
                  type="text"
                  value={editForm.ethnicity?.join(", ") || ""}
                  onChange={(e) => setEditForm({ 
                    ...editForm, 
                    ethnicity: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                  })}
                  placeholder="white, asian"
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Location</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                <select
                  value={editForm.country || ""}
                  onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                >
                  <option value="">Select...</option>
                  {COUNTRY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={editForm.state || ""}
                  onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={editForm.city || ""}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ZIP Code</label>
                <input
                  type="text"
                  value={editForm.zip_code || ""}
                  onChange={(e) => setEditForm({ ...editForm, zip_code: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Hometown</label>
                <input
                  type="text"
                  value={editForm.hometown || ""}
                  onChange={(e) => setEditForm({ ...editForm, hometown: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Career & Education */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Career & Education</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Occupation</label>
                <input
                  type="text"
                  value={editForm.occupation || ""}
                  onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  value={editForm.company || ""}
                  onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Education</label>
                <select
                  value={editForm.education || ""}
                  onChange={(e) => setEditForm({ ...editForm, education: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                >
                  <option value="">Select...</option>
                  {EDUCATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Schools (comma-separated)</label>
                <input
                  type="text"
                  value={editForm.schools?.join(", ") || ""}
                  onChange={(e) => setEditForm({ 
                    ...editForm, 
                    schools: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                  })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Lifestyle */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Lifestyle</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Religion</label>
                <select
                  value={editForm.religion || ""}
                  onChange={(e) => setEditForm({ ...editForm, religion: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                >
                  <option value="">Select...</option>
                  {RELIGION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Political Views</label>
                <select
                  value={editForm.political_views || ""}
                  onChange={(e) => setEditForm({ ...editForm, political_views: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                >
                  <option value="">Select...</option>
                  {POLITICAL_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Exercise</label>
                <select
                  value={editForm.exercise || ""}
                  onChange={(e) => setEditForm({ ...editForm, exercise: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                >
                  <option value="">Select...</option>
                  {EXERCISE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Languages (comma-separated)</label>
                <input
                  type="text"
                  value={editForm.languages?.join(", ") || ""}
                  onChange={(e) => setEditForm({ 
                    ...editForm, 
                    languages: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                  })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Habits */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Habits</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Smoking</label>
                <select
                  value={editForm.smoking || ""}
                  onChange={(e) => setEditForm({ ...editForm, smoking: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                >
                  <option value="">Select...</option>
                  {SMOKING_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Drinking</label>
                <select
                  value={editForm.drinking || ""}
                  onChange={(e) => setEditForm({ ...editForm, drinking: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                >
                  <option value="">Select...</option>
                  {DRINKING_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Marijuana</label>
                <select
                  value={editForm.marijuana || ""}
                  onChange={(e) => setEditForm({ ...editForm, marijuana: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                >
                  <option value="">Select...</option>
                  {MARIJUANA_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Family */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Family</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Has Kids</label>
                <select
                  value={editForm.has_kids || ""}
                  onChange={(e) => setEditForm({ ...editForm, has_kids: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                >
                  <option value="">Select...</option>
                  {HAS_KIDS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Wants Kids</label>
                <select
                  value={editForm.wants_kids || ""}
                  onChange={(e) => setEditForm({ ...editForm, wants_kids: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                >
                  <option value="">Select...</option>
                  {WANTS_KIDS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Pets (comma-separated)</label>
                <input
                  type="text"
                  value={editForm.pets?.join(", ") || ""}
                  onChange={(e) => setEditForm({ 
                    ...editForm, 
                    pets: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                  })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Interests & Goals */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Interests & Goals</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Interests (comma-separated)</label>
                <input
                  type="text"
                  value={editForm.interests?.join(", ") || ""}
                  onChange={(e) => setEditForm({ 
                    ...editForm, 
                    interests: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                  })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Life Goals (comma-separated)</label>
                <input
                  type="text"
                  value={editForm.life_goals?.join(", ") || ""}
                  onChange={(e) => setEditForm({ 
                    ...editForm, 
                    life_goals: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                  })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Profile Prompts */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Profile Prompts</h4>
            <div className="space-y-3">
              {[
                { key: "ideal_first_date", label: "Ideal First Date" },
                { key: "non_negotiables", label: "Non-Negotiables" },
                { key: "way_to_heart", label: "Way to My Heart" },
                { key: "after_work", label: "After Work" },
                { key: "nightclub_or_home", label: "Nightclub or Home" },
                { key: "pet_peeves", label: "Pet Peeves" },
                { key: "worst_job", label: "Worst Job" },
                { key: "dream_job", label: "Dream Job" },
                { key: "craziest_travel_story", label: "Craziest Travel Story" },
                { key: "weirdest_gift", label: "Weirdest Gift" },
                { key: "past_event", label: "Past Event" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                  <textarea
                    value={(editForm[key as keyof ProfileDetail] as string) || ""}
                    onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Social Links</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Social Link 1</label>
                <input
                  type="url"
                  value={editForm.social_link_1 || ""}
                  onChange={(e) => setEditForm({ ...editForm, social_link_1: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Social Link 2</label>
                <input
                  type="url"
                  value={editForm.social_link_2 || ""}
                  onChange={(e) => setEditForm({ ...editForm, social_link_2: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Media URLs */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Media URLs</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Profile Image URL</label>
                <input
                  type="url"
                  value={editProfileImageUrl}
                  onChange={(e) => setEditProfileImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-sm border rounded-lg"
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
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Voice Prompt URL</label>
                <input
                  type="url"
                  value={editForm.voice_prompt_url || ""}
                  onChange={(e) => setEditForm({ ...editForm, voice_prompt_url: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Video Intro URL</label>
                <input
                  type="url"
                  value={editForm.video_intro_url || ""}
                  onChange={(e) => setEditForm({ ...editForm, video_intro_url: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Verification Selfie URL</label>
                <input
                  type="url"
                  value={editForm.verification_selfie_url || ""}
                  onChange={(e) => setEditForm({ ...editForm, verification_selfie_url: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Status Flags */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Status Flags</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.is_verified || false}
                  onChange={(e) => setEditForm({ ...editForm, is_verified: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Is Verified</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.is_photo_verified || false}
                  onChange={(e) => setEditForm({ ...editForm, is_photo_verified: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Is Photo Verified</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.can_start_matching || false}
                  onChange={(e) => setEditForm({ ...editForm, can_start_matching: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Can Start Matching</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.profile_hidden || false}
                  onChange={(e) => setEditForm({ ...editForm, profile_hidden: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Profile Hidden</span>
              </label>
            </div>
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

      {/* Email User Sheet */}
      <EmailComposeSheet
        isOpen={showEmailSheet}
        onClose={() => setShowEmailSheet(false)}
        recipients={[{
          id: user.id,
          email: user.email,
          name: profile?.first_name && profile?.last_name
            ? `${profile.first_name} ${profile.last_name}`
            : user.display_name || user.email,
        }]}
        title="Email User"
      />
    </div>
  );
}
