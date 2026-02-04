"use client";

import { useState } from "react";
import { Search, Heart, UserPlus } from "lucide-react";
import { IntroductionModal } from "@/components/matchmaker/IntroductionModal";

interface Profile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
  gender: string | null;
  date_of_birth: string | null;
  city: string | null;
  state: string | null;
}

export default function MatchmakerDiscoverPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([]);
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSelectProfile = (profile: Profile) => {
    if (selectedUsers.find((u) => u.user_id === profile.user_id)) {
      // Deselect
      setSelectedUsers(selectedUsers.filter((u) => u.user_id !== profile.user_id));
    } else if (selectedUsers.length < 2) {
      // Select (max 2)
      setSelectedUsers([...selectedUsers, profile]);
    }
  };

  const handleCreateIntro = () => {
    if (selectedUsers.length === 2) {
      setShowIntroModal(true);
    }
  };

  const handleIntroSuccess = () => {
    setShowIntroModal(false);
    setSelectedUsers([]);
    // TODO: Show success toast
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Search className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Discover Profiles
            </h1>
            <p className="text-sm text-muted-foreground">
              Browse profiles and create introductions
            </p>
          </div>
        </div>

        {/* Create Introduction Button */}
        {selectedUsers.length === 2 && (
          <button
            onClick={handleCreateIntro}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-colors shadow-lg shadow-purple-500/25"
          >
            <Heart className="w-5 h-5" />
            Create Introduction
          </button>
        )}
      </div>

      {/* Selection Indicator */}
      {selectedUsers.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-xl">
          <UserPlus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <p className="text-sm font-medium text-purple-800 dark:text-purple-300">
            {selectedUsers.length === 1
              ? `Selected 1 user. Select one more to create an introduction.`
              : `Selected 2 users. Click "Create Introduction" above.`}
          </p>
        </div>
      )}

      {/* Filters Section - TODO: Add filter UI */}
      <div className="bg-card rounded-xl border border-border/40 p-6">
        <p className="text-sm text-muted-foreground text-center">
          Profile browser with filters coming soon. For now, use the algorithm
          simulator in the admin dashboard to test discovery.
        </p>
      </div>

      {/* Profiles Grid - TODO: Implement profile loading */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">
              Start searching to see profiles
            </p>
          </div>
        )}
      </div>

      {/* Introduction Modal */}
      {selectedUsers.length === 2 && (
        <IntroductionModal
          isOpen={showIntroModal}
          onClose={() => setShowIntroModal(false)}
          userA={selectedUsers[0]}
          userB={selectedUsers[1]}
          onSuccess={handleIntroSuccess}
        />
      )}
    </div>
  );
}
