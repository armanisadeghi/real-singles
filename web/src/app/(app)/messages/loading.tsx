/**
 * Messages Page Loading State
 * 
 * Shows skeleton for the messages page with:
 * - New Matches horizontal carousel
 * - Messages/Conversations list
 */

function NewMatchesSkeleton() {
  return (
    <div className="flex gap-2.5 overflow-hidden">
      {/* Get Likes skeleton */}
      <div className="flex-shrink-0 w-[72px]">
        <div className="w-[72px] h-[72px] rounded-xl bg-gray-100 dark:bg-neutral-800 animate-pulse" />
        <div className="h-2.5 w-12 mx-auto mt-1.5 rounded bg-gray-100 dark:bg-neutral-800 animate-pulse" />
      </div>
      {/* Match card skeletons */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex-shrink-0 w-[72px]">
          <div className="w-[72px] h-[72px] rounded-xl bg-gray-100 dark:bg-neutral-800 animate-pulse" />
          <div className="h-2.5 w-10 mx-auto mt-1.5 rounded bg-gray-100 dark:bg-neutral-800 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-neutral-800 animate-pulse" />
      <div className="flex-1 min-w-0">
        <div className="h-4 w-24 rounded bg-gray-100 dark:bg-neutral-800 animate-pulse" />
        <div className="h-3 w-40 rounded bg-gray-100 dark:bg-neutral-800 animate-pulse mt-2" />
      </div>
      <div className="h-3 w-8 rounded bg-gray-100 dark:bg-neutral-800 animate-pulse" />
    </div>
  );
}

export default function MessagesLoading() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* New Matches Section Skeleton */}
      <div className="px-4 pt-2 pb-3">
        <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-2">
          New Matches
        </h2>
        <NewMatchesSkeleton />
      </div>

      {/* Messages Section Skeleton */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 px-4 py-2">
          Messages
        </h2>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <ConversationSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
