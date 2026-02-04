/**
 * Matchmaker Profile Loading Skeleton
 * 
 * This skeleton matches the exact structure of the matchmaker profile page
 * to prevent Cumulative Layout Shift (CLS).
 */

export default function MatchmakerProfileLoading() {
  return (
    <div className="min-h-dvh bg-background pb-24 animate-pulse">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Back Button */}
        <div className="h-5 w-36 bg-gray-200 dark:bg-neutral-700 rounded" />

        {/* Profile Header Card */}
        <div className="bg-card rounded-xl border border-border/40 overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Profile Image Skeleton */}
              <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-neutral-700 ring-4 ring-gray-100 dark:ring-neutral-800" />

              {/* Info Skeleton */}
              <div className="flex-1 w-full">
                {/* Name */}
                <div className="h-8 w-48 bg-gray-200 dark:bg-neutral-700 rounded mb-2" />
                {/* Location + Experience */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="h-5 w-32 bg-gray-200 dark:bg-neutral-700 rounded" />
                  <div className="h-5 w-24 bg-gray-200 dark:bg-neutral-700 rounded" />
                </div>
                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="w-5 h-5 bg-gray-200 dark:bg-neutral-700 rounded" />
                    ))}
                  </div>
                  <div className="h-5 w-20 bg-gray-200 dark:bg-neutral-700 rounded" />
                </div>
                {/* Bio */}
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-200 dark:bg-neutral-700 rounded" />
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-neutral-700 rounded" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar Skeleton */}
          <div className="grid grid-cols-3 gap-px bg-border/40">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <div className="w-4 h-4 bg-gray-200 dark:bg-neutral-700 rounded" />
                  <div className="h-3 w-24 bg-gray-200 dark:bg-neutral-700 rounded" />
                </div>
                <div className="h-7 w-12 bg-gray-200 dark:bg-neutral-700 rounded mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Specialties Section */}
        <div className="bg-card rounded-xl border border-border/40 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 bg-gray-200 dark:bg-neutral-700 rounded" />
            <div className="h-6 w-28 bg-gray-200 dark:bg-neutral-700 rounded" />
          </div>
          <div className="flex flex-wrap gap-2">
            {[100, 120, 90, 140, 110].map((width, i) => (
              <div
                key={i}
                className="h-8 bg-gray-200 dark:bg-neutral-700 rounded-full"
                style={{ width: `${width}px` }}
              />
            ))}
          </div>
        </div>

        {/* Certifications Section */}
        <div className="bg-card rounded-xl border border-border/40 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 bg-gray-200 dark:bg-neutral-700 rounded" />
            <div className="h-6 w-32 bg-gray-200 dark:bg-neutral-700 rounded" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-neutral-700" />
                <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded" style={{ width: `${150 + i * 30}px` }} />
              </div>
            ))}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-card rounded-xl border border-border/40 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 bg-gray-200 dark:bg-neutral-700 rounded" />
            <div className="h-6 w-20 bg-gray-200 dark:bg-neutral-700 rounded" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b border-border/40 last:border-0 pb-4 last:pb-0">
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-700" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-4 w-24 bg-gray-200 dark:bg-neutral-700 rounded" />
                      <div className="h-5 w-20 bg-gray-200 dark:bg-neutral-700 rounded-full" />
                    </div>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <div key={s} className="w-4 h-4 bg-gray-200 dark:bg-neutral-700 rounded" />
                      ))}
                      <div className="h-4 w-16 bg-gray-200 dark:bg-neutral-700 rounded ml-2" />
                    </div>
                  </div>
                </div>
                <div className="ml-13 space-y-1">
                  <div className="h-4 w-full bg-gray-200 dark:bg-neutral-700 rounded" />
                  <div className="h-4 w-2/3 bg-gray-200 dark:bg-neutral-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hire Button */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border/40 p-4 -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="max-w-4xl mx-auto">
            <div className="h-14 w-full bg-gray-200 dark:bg-neutral-700 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
