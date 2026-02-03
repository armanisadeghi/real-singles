/**
 * Explore Page Loading State
 * 
 * Shows skeleton for events and speed dating sections.
 */

function CardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[280px] sm:w-[300px] bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden animate-pulse">
      {/* Image */}
      <div className="aspect-[16/10] bg-gray-100 dark:bg-neutral-800" />
      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 bg-gray-100 dark:bg-neutral-800 rounded" />
        <div className="h-4 w-full bg-gray-100 dark:bg-neutral-800 rounded" />
        <div className="h-4 w-2/3 bg-gray-100 dark:bg-neutral-800 rounded" />
        <div className="flex gap-3">
          <div className="h-3 w-20 bg-gray-100 dark:bg-neutral-800 rounded" />
          <div className="h-3 w-16 bg-gray-100 dark:bg-neutral-800 rounded" />
        </div>
      </div>
    </div>
  );
}

function SectionSkeleton({ title }: { title: string }) {
  return (
    <section>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        </div>
        <div className="h-4 w-16 bg-gray-100 dark:bg-neutral-800 rounded animate-pulse" />
      </div>
      
      {/* Cards row */}
      <div className="flex gap-4 overflow-hidden">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </section>
  );
}

export default function ExploreLoading() {
  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-8">
        <SectionSkeleton title="Events" />
        <SectionSkeleton title="Virtual Speed Dating" />
        
        {/* Videos Coming Soon placeholder */}
        <section>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Videos</h2>
          </div>
          <div className="h-40 rounded-2xl border border-dashed border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900/50 animate-pulse" />
        </section>
      </div>
    </div>
  );
}
