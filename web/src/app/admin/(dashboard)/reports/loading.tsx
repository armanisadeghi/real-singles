import { Skeleton } from "@/components/ui/LoadingSkeleton";

export default function ReportsLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-36 mb-6" />

      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-6 w-48 mt-2" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-8 w-20 rounded" />
              <Skeleton className="h-8 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
