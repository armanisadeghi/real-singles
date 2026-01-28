import { Skeleton } from "@/components/ui/LoadingSkeleton";

interface AdminLoadingSkeletonProps {
  /** Type of page to show skeleton for */
  variant?: "list" | "detail" | "form" | "grid" | "settings";
  /** Whether to show a hero section */
  showHero?: boolean;
}

export function AdminLoadingSkeleton({ 
  variant = "list", 
  showHero = true 
}: AdminLoadingSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Hero Skeleton */}
      {showHero && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8">
          <div className="relative flex items-start justify-between gap-4">
            <div className="space-y-3">
              <Skeleton className="h-8 w-48 bg-slate-700" />
              <Skeleton className="h-4 w-72 bg-slate-700" />
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right space-y-1">
                <Skeleton className="h-8 w-16 bg-slate-700 ml-auto" />
                <Skeleton className="h-4 w-24 bg-slate-700" />
              </div>
              <Skeleton className="w-12 h-12 rounded-xl bg-slate-700" />
            </div>
          </div>
        </div>
      )}

      {/* Content Skeleton based on variant */}
      {variant === "list" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-slate-200/80 flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          
          {/* Table Rows */}
          <div className="divide-y divide-slate-200/60">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      )}

      {variant === "detail" && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-start gap-6">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-200/80 space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-3">
              <Skeleton className="h-5 w-32" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {variant === "form" && (
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      )}

      {variant === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {variant === "settings" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
