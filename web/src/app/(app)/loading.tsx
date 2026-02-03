/**
 * Root App Loading State
 * 
 * Shows a minimal loading skeleton while the app layout or pages load.
 * This provides instant visual feedback instead of a blank screen.
 */

export default function AppLoading() {
  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-neutral-950 animate-pulse">
      {/* Content area placeholder */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Header placeholder */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-neutral-800" />
          <div className="flex-1">
            <div className="h-5 w-32 bg-gray-200 dark:bg-neutral-800 rounded" />
            <div className="h-3 w-24 bg-gray-200 dark:bg-neutral-800 rounded mt-2" />
          </div>
        </div>

        {/* Card skeletons */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-neutral-900 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-neutral-800" />
              <div className="flex-1">
                <div className="h-4 w-28 bg-gray-100 dark:bg-neutral-800 rounded" />
                <div className="h-3 w-20 bg-gray-100 dark:bg-neutral-800 rounded mt-2" />
              </div>
            </div>
            <div className="h-4 w-full bg-gray-100 dark:bg-neutral-800 rounded" />
            <div className="h-4 w-3/4 bg-gray-100 dark:bg-neutral-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
