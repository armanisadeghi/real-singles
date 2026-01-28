import { Skeleton } from "@/components/ui/LoadingSkeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Welcome Header Skeleton */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="relative">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <Skeleton className="h-4 w-48 bg-slate-700" />
              <Skeleton className="h-10 w-64 bg-slate-700" />
              <Skeleton className="h-4 w-80 bg-slate-700" />
            </div>
            <div className="hidden lg:flex items-center gap-3">
              <div className="text-right space-y-1">
                <Skeleton className="h-9 w-20 bg-slate-700 ml-auto" />
                <Skeleton className="h-4 w-24 bg-slate-700" />
              </div>
              <Skeleton className="w-12 h-12 rounded-xl bg-slate-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Primary Stat */}
        <div className="col-span-2 lg:col-span-1 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="w-10 h-10 rounded-xl bg-white/20" />
            </div>
            <Skeleton className="h-10 w-24 bg-white/20" />
            <Skeleton className="h-4 w-20 bg-white/20" />
          </div>
        </div>

        {/* Other Stats */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl bg-white border border-slate-200/80 p-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="w-9 h-9 rounded-lg" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="w-5 h-5" />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="space-y-1">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-36" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>

          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Stats Row Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl bg-white border border-slate-200/80 p-4 flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
