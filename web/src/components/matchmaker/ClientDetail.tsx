"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Heart,
  Save,
  Loader2,
  User,
  Briefcase,
  GraduationCap,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMatchmaker } from "@/contexts/MatchmakerContext";
import { cn } from "@/lib/utils";

interface ClientDetailProps {
  clientId: string;
}

interface ClientData {
  client: {
    id: string;
    status: string;
    notes: string | null;
    started_at: string;
    ended_at: string | null;
  };
  profile: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    date_of_birth: string | null;
    gender: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    occupation: string | null;
    bio: string | null;
    profile_image_url: string | null;
    is_verified: boolean | null;
    is_photo_verified: boolean | null;
    height_inches: number | null;
    body_type: string | null;
    zodiac_sign: string | null;
    interests: string[] | null;
    education: string | null;
    religion: string | null;
    ethnicity: string[] | null;
    languages: string[] | null;
    has_kids: string | null;
    wants_kids: string | null;
    pets: string[] | null;
    smoking: string | null;
    drinking: string | null;
    marijuana: string | null;
    ideal_first_date: string | null;
    non_negotiables: string | null;
    way_to_heart: string | null;
    looking_for: string[] | null;
    dating_intentions: string | null;
  };
  gallery: Array<{
    id: string;
    image_url: string;
    is_primary: boolean;
    position: number;
  }>;
  introductions: Array<{
    id: string;
    user_a_id: string;
    user_b_id: string;
    status: string;
    outcome: string | null;
    created_at: string;
  }>;
}

export function ClientDetail({ clientId }: ClientDetailProps) {
  const { matchmakerId } = useMatchmaker();
  const [data, setData] = useState<ClientData | null>(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchClient = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/matchmakers/${matchmakerId}/clients/${clientId}`
        );
        const result = await response.json();

        if (result.success) {
          setData(result.data);
          setNotes(result.data.client.notes || "");
          setStatus(result.data.client.status);
        } else {
          setError(result.msg || "Failed to fetch client details");
        }
      } catch (err) {
        console.error("Error fetching client:", err);
        setError("Failed to load client details");
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [matchmakerId, clientId]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetch(
        `/api/matchmakers/${matchmakerId}/clients/${clientId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, notes }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError(result.msg || "Failed to save changes");
      }
    } catch (err) {
      console.error("Error saving client:", err);
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const calculateAge = (dob: string | null) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const formatHeight = (inches: number | null) => {
    if (!inches) return null;
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    return `${feet}'${remainingInches}"`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <Link
          href="/matchmaker-portal/clients"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </Link>
        <div className="p-6 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300">
          {error || "Client not found"}
        </div>
      </div>
    );
  }

  const { client, profile, gallery, introductions } = data;
  const age = calculateAge(profile.date_of_birth);

  return (
    <div className="space-y-6 pb-24">
      {/* Back Button */}
      <Link
        href="/matchmaker-portal/clients"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Clients
      </Link>

      {/* Client Profile Card */}
      <div className="bg-card rounded-xl border border-border/40 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Profile Image */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 flex items-center justify-center overflow-hidden">
              {profile.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt={profile.first_name || "Client"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              )}
            </div>

            {/* Client Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {profile.first_name || "Unknown"}{" "}
                  {profile.last_name?.charAt(0) || ""}
                  {profile.last_name ? "." : ""}
                </h1>
                {profile.is_verified && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-medium">
                    <Check className="w-3 h-3 mr-1" />
                    Verified
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                {age && <span>{age} years old</span>}
                {profile.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {profile.city}
                    {profile.state && `, ${profile.state}`}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Client since{" "}
                  {new Date(client.started_at).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <div
              className={cn(
                "px-3 py-1 text-sm font-medium rounded-full",
                client.status === "active" &&
                  "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300",
                client.status === "paused" &&
                  "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300",
                client.status === "completed" &&
                  "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300",
                client.status === "cancelled" &&
                  "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300"
              )}
            >
              {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Profile Info */}
        <div className="space-y-6">
          {/* Bio */}
          {profile.bio && (
            <div className="bg-card rounded-xl border border-border/40 p-6">
              <h2 className="text-lg font-semibold text-foreground mb-3">
                About
              </h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Basic Info */}
          <div className="bg-card rounded-xl border border-border/40 p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Profile Details
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {profile.gender && (
                <InfoItem label="Gender" value={formatValue(profile.gender)} />
              )}
              {profile.looking_for && profile.looking_for.length > 0 && (
                <InfoItem
                  label="Looking for"
                  value={profile.looking_for.map(formatValue).join(", ")}
                />
              )}
              {profile.dating_intentions && (
                <InfoItem
                  label="Dating intentions"
                  value={formatValue(profile.dating_intentions)}
                />
              )}
              {profile.height_inches && (
                <InfoItem
                  label="Height"
                  value={formatHeight(profile.height_inches)}
                />
              )}
              {profile.body_type && (
                <InfoItem
                  label="Body type"
                  value={formatValue(profile.body_type)}
                />
              )}
              {profile.zodiac_sign && (
                <InfoItem
                  label="Zodiac"
                  value={formatValue(profile.zodiac_sign)}
                />
              )}
              {profile.occupation && (
                <InfoItem label="Occupation" value={profile.occupation} />
              )}
              {profile.education && (
                <InfoItem
                  label="Education"
                  value={formatValue(profile.education)}
                />
              )}
              {profile.religion && (
                <InfoItem
                  label="Religion"
                  value={formatValue(profile.religion)}
                />
              )}
              {profile.ethnicity && profile.ethnicity.length > 0 && (
                <InfoItem
                  label="Ethnicity"
                  value={profile.ethnicity.map(formatValue).join(", ")}
                />
              )}
            </div>
          </div>

          {/* Lifestyle */}
          <div className="bg-card rounded-xl border border-border/40 p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Lifestyle
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {profile.smoking && (
                <InfoItem
                  label="Smoking"
                  value={formatValue(profile.smoking)}
                />
              )}
              {profile.drinking && (
                <InfoItem
                  label="Drinking"
                  value={formatValue(profile.drinking)}
                />
              )}
              {profile.marijuana && (
                <InfoItem
                  label="Marijuana"
                  value={formatValue(profile.marijuana)}
                />
              )}
              {profile.has_kids && (
                <InfoItem
                  label="Has children"
                  value={formatValue(profile.has_kids)}
                />
              )}
              {profile.wants_kids && (
                <InfoItem
                  label="Wants children"
                  value={formatValue(profile.wants_kids)}
                />
              )}
            </div>
          </div>

          {/* Prompts */}
          {(profile.ideal_first_date ||
            profile.non_negotiables ||
            profile.way_to_heart) && (
            <div className="bg-card rounded-xl border border-border/40 p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Prompts
              </h2>
              <div className="space-y-4">
                {profile.ideal_first_date && (
                  <PromptItem
                    label="Ideal first date"
                    value={profile.ideal_first_date}
                  />
                )}
                {profile.non_negotiables && (
                  <PromptItem
                    label="Non-negotiables"
                    value={profile.non_negotiables}
                  />
                )}
                {profile.way_to_heart && (
                  <PromptItem
                    label="Way to my heart"
                    value={profile.way_to_heart}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Notes & Intros */}
        <div className="space-y-6">
          {/* Gallery */}
          {gallery.length > 0 && (
            <div className="bg-card rounded-xl border border-border/40 p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Photos ({gallery.length})
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {gallery.map((img) => (
                  <div
                    key={img.id}
                    className="aspect-square rounded-lg overflow-hidden bg-muted"
                  >
                    <img
                      src={img.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status & Notes */}
          <div className="bg-card rounded-xl border border-border/40 p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Relationship Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border/40 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Private Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this client's preferences, goals, or any important details..."
                className="w-full h-32 px-4 py-3 bg-background border border-border/40 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                maxLength={5000}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {notes.length} / 5000 characters
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                "flex items-center gap-2 px-6 py-3 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg",
                saveSuccess
                  ? "bg-green-500 text-white shadow-green-500/25"
                  : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-purple-500/25"
              )}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-5 h-5" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>

          {/* Introductions Made for This Client */}
          <div className="bg-card rounded-xl border border-border/40 p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Introductions ({introductions.length})
            </h2>
            {introductions.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No introductions yet. Create one from the Discover page.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {introductions.map((intro) => (
                  <div
                    key={intro.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Introduction created
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(intro.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "px-2 py-1 text-xs font-medium rounded-full",
                        intro.status === "pending" &&
                          "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300",
                        intro.status === "active" &&
                          "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300",
                        intro.status === "declined" &&
                          "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300"
                      )}
                    >
                      {intro.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to format snake_case values
function formatValue(value: string | null): string {
  if (!value) return "";
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}

function PromptItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-foreground">{value}</p>
    </div>
  );
}
