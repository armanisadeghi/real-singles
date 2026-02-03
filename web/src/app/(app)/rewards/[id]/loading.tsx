export default function RewardDetailLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 animate-pulse">
      {/* Product image */}
      <div className="aspect-square bg-gray-200 dark:bg-neutral-700 rounded-2xl mb-6" />

      {/* Product info */}
      <div className="mb-6">
        <div className="h-8 w-3/4 bg-gray-200 dark:bg-neutral-700 rounded mb-3" />
        <div className="h-6 w-24 bg-pink-100 dark:bg-pink-900/30 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-100 dark:bg-neutral-800 rounded" />
          <div className="h-4 w-full bg-gray-100 dark:bg-neutral-800 rounded" />
          <div className="h-4 w-2/3 bg-gray-100 dark:bg-neutral-800 rounded" />
        </div>
      </div>

      {/* Redeem button */}
      <div className="h-14 w-full bg-gray-200 dark:bg-neutral-700 rounded-full" />
    </div>
  );
}
