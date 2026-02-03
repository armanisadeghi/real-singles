export default function ReferLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 animate-pulse">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto bg-gray-200 dark:bg-neutral-700 rounded-full mb-4" />
        <div className="h-8 w-40 mx-auto bg-gray-200 dark:bg-neutral-700 rounded mb-2" />
        <div className="h-4 w-72 mx-auto bg-gray-100 dark:bg-neutral-800 rounded" />
      </div>

      {/* Referral code */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 mb-6">
        <div className="h-4 w-24 bg-gray-200 dark:bg-neutral-700 rounded mb-3" />
        <div className="flex items-center gap-2">
          <div className="flex-1 h-12 bg-gray-100 dark:bg-neutral-800 rounded-xl" />
          <div className="h-12 w-12 bg-gray-200 dark:bg-neutral-700 rounded-xl" />
        </div>
      </div>

      {/* Share options */}
      <div className="h-5 w-16 bg-gray-200 dark:bg-neutral-700 rounded mb-3" />
      <div className="flex gap-3 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="w-14 h-14 bg-gray-200 dark:bg-neutral-700 rounded-full"
          />
        ))}
      </div>

      {/* Stats */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4">
        <div className="h-5 w-24 bg-gray-200 dark:bg-neutral-700 rounded mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="h-10 w-12 mx-auto bg-gray-200 dark:bg-neutral-700 rounded mb-1" />
            <div className="h-3 w-20 mx-auto bg-gray-100 dark:bg-neutral-800 rounded" />
          </div>
          <div className="text-center">
            <div className="h-10 w-16 mx-auto bg-gray-200 dark:bg-neutral-700 rounded mb-1" />
            <div className="h-3 w-24 mx-auto bg-gray-100 dark:bg-neutral-800 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
