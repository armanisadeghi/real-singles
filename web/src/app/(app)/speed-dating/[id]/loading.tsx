export default function SpeedDatingDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 animate-pulse">
      {/* Hero image */}
      <div className="aspect-video bg-gray-200 dark:bg-neutral-700 rounded-2xl mb-6" />

      {/* Title and meta */}
      <div className="mb-6">
        <div className="h-8 w-3/4 bg-gray-200 dark:bg-neutral-700 rounded mb-3" />
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-200 dark:bg-neutral-700 rounded" />
            <div className="h-4 w-28 bg-gray-100 dark:bg-neutral-800 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-200 dark:bg-neutral-700 rounded" />
            <div className="h-4 w-20 bg-gray-100 dark:bg-neutral-800 rounded" />
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-100 dark:bg-neutral-800 rounded-xl p-4">
          <div className="h-4 w-20 bg-gray-200 dark:bg-neutral-700 rounded mb-2" />
          <div className="h-6 w-12 bg-gray-200 dark:bg-neutral-700 rounded" />
        </div>
        <div className="bg-gray-100 dark:bg-neutral-800 rounded-xl p-4">
          <div className="h-4 w-24 bg-gray-200 dark:bg-neutral-700 rounded mb-2" />
          <div className="h-6 w-16 bg-gray-200 dark:bg-neutral-700 rounded" />
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <div className="h-5 w-24 bg-gray-200 dark:bg-neutral-700 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-100 dark:bg-neutral-800 rounded" />
          <div className="h-4 w-full bg-gray-100 dark:bg-neutral-800 rounded" />
          <div className="h-4 w-2/3 bg-gray-100 dark:bg-neutral-800 rounded" />
        </div>
      </div>

      {/* Action button */}
      <div className="h-12 w-full bg-gray-200 dark:bg-neutral-700 rounded-full" />
    </div>
  );
}
