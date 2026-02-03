/**
 * Profile Page Loading State
 * 
 * Shows skeleton for the user's own profile page with:
 * - Profile header with avatar and name
 * - Stats/completion section
 * - Gallery grid
 * - Action buttons
 */

export default function ProfileLoading() {
  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-neutral-950 animate-pulse">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-6">
          {/* Avatar placeholder */}
          <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-neutral-800" />
          <div className="flex-1">
            <div className="h-6 w-32 bg-gray-200 dark:bg-neutral-800 rounded mb-2" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-neutral-800 rounded mb-2" />
            <div className="h-3 w-40 bg-gray-200 dark:bg-neutral-800 rounded" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 h-10 bg-gray-200 dark:bg-neutral-800 rounded-xl" />
          <div className="flex-1 h-10 bg-gray-200 dark:bg-neutral-800 rounded-xl" />
        </div>

        {/* Profile Completion Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 w-36 bg-gray-100 dark:bg-neutral-800 rounded" />
            <div className="h-5 w-12 bg-gray-100 dark:bg-neutral-800 rounded" />
          </div>
          <div className="h-2 w-full bg-gray-100 dark:bg-neutral-800 rounded-full" />
        </div>

        {/* Gallery Section */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 mb-6">
          <div className="h-5 w-24 bg-gray-100 dark:bg-neutral-800 rounded mb-4" />
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-lg bg-gray-100 dark:bg-neutral-800"
              />
            ))}
          </div>
        </div>

        {/* Voice/Video Prompts Section */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 mb-6">
          <div className="h-5 w-32 bg-gray-100 dark:bg-neutral-800 rounded mb-4" />
          <div className="flex gap-3">
            <div className="flex-1 h-16 bg-gray-100 dark:bg-neutral-800 rounded-xl" />
            <div className="flex-1 h-16 bg-gray-100 dark:bg-neutral-800 rounded-xl" />
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4">
          <div className="h-5 w-20 bg-gray-100 dark:bg-neutral-800 rounded mb-4" />
          <div className="space-y-3">
            <div className="h-4 w-full bg-gray-100 dark:bg-neutral-800 rounded" />
            <div className="h-4 w-3/4 bg-gray-100 dark:bg-neutral-800 rounded" />
            <div className="h-4 w-5/6 bg-gray-100 dark:bg-neutral-800 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
