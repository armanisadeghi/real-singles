export default function AlgorithmSimulatorLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="animate-pulse">
        <div className="h-32 bg-slate-200 rounded-2xl"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-32 bg-slate-200 rounded-xl animate-pulse"></div>
            <div className="h-32 bg-slate-200 rounded-xl animate-pulse"></div>
          </div>
          <div className="h-24 bg-slate-200 rounded-xl animate-pulse"></div>
        </div>

        {/* Right column */}
        <div className="h-64 bg-slate-200 rounded-xl animate-pulse"></div>
      </div>
    </div>
  );
}
