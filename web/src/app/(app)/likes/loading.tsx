/**
 * New Matches Page Loading State
 * 
 * Shows skeleton for the new matches page with:
 * - Tab navigation (already visible as static tabs)
 * - Card list skeleton
 */

function TabsSkeleton() {
  return (
    <div className="flex gap-2 p-1 bg-gray-100/80 dark:bg-neutral-800/80 rounded-full">
      {["New Matches", "Likes Sent", "Matches"].map((tab) => (
        <div
          key={tab}
          className="flex-1 py-2 px-4 rounded-full text-center text-sm font-medium text-gray-400 dark:text-gray-500"
        >
          {tab}
        </div>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="flex items-center gap-4 p-3 bg-white dark:bg-neutral-900 rounded-xl animate-pulse">
      <div className="w-[72px] h-[72px] rounded-lg bg-gray-100 dark:bg-neutral-800" />
      <div className="flex-1">
        <div className="h-4 w-24 bg-gray-100 dark:bg-neutral-800 rounded" />
        <div className="h-3 w-32 bg-gray-100 dark:bg-neutral-800 rounded mt-2" />
        <div className="h-3 w-20 bg-gray-100 dark:bg-neutral-800 rounded mt-2" />
      </div>
      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-800" />
    </div>
  );
}

export default function LikesLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 pt-4">
      {/* Tab Navigation Skeleton */}
      <div className="mb-4">
        <TabsSkeleton />
      </div>

      {/* Cards Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
