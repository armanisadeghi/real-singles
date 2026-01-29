"use client";

import { Sparkles, Home, Filter, MapPin, Heart, ThumbsUp, Zap, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type Algorithm = 
  | "discover-profiles"
  | "discover-home"
  | "top-matches"
  | "nearby"
  | "mutual-matches"
  | "likes-received";

interface AlgorithmOption {
  id: Algorithm;
  name: string;
  shortName: string;
  description: string;
  icon: React.ReactNode;
  category: "discovery" | "matches";
  gradient: string;
}

const algorithms: AlgorithmOption[] = [
  {
    id: "discover-profiles",
    name: "Discover Profiles",
    shortName: "Discover",
    description: "Main discovery grid - profiles for browse/like/pass actions",
    icon: <Sparkles className="w-5 h-5" />,
    category: "discovery",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    id: "discover-home",
    name: "Home Screen",
    shortName: "Home",
    description: "Aggregated home data with top matches preview",
    icon: <Home className="w-5 h-5" />,
    category: "discovery",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "top-matches",
    name: "Top Matches",
    shortName: "Top",
    description: "Filtered matches based on preference options",
    icon: <Zap className="w-5 h-5" />,
    category: "discovery",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    id: "nearby",
    name: "Nearby",
    shortName: "Near",
    description: "Location-based profiles sorted by distance",
    icon: <MapPin className="w-5 h-5" />,
    category: "discovery",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    id: "mutual-matches",
    name: "Mutual Matches",
    shortName: "Mutual",
    description: "Users who both liked each other - established connections",
    icon: <Heart className="w-5 h-5" />,
    category: "matches",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    id: "likes-received",
    name: "Likes Received",
    shortName: "Likes",
    description: "Users who have liked this user, pending user's action",
    icon: <ThumbsUp className="w-5 h-5" />,
    category: "matches",
    gradient: "from-fuchsia-500 to-pink-500",
  },
];

interface AlgorithmPickerProps {
  selected: Algorithm;
  onSelect: (algorithm: Algorithm) => void;
}

export function AlgorithmPicker({ selected, onSelect }: AlgorithmPickerProps) {
  const discoveryAlgorithms = algorithms.filter((a) => a.category === "discovery");
  const matchAlgorithms = algorithms.filter((a) => a.category === "matches");
  const selectedAlgo = algorithms.find((a) => a.id === selected);

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex gap-6">
        {/* Discovery Section */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-600/10">
              <Search className="w-4 h-4 text-violet-600" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Discovery Algorithms
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {discoveryAlgorithms.map((algo) => (
              <AlgorithmButton
                key={algo.id}
                algo={algo}
                isSelected={selected === algo.id}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent" />

        {/* Matches Section */}
        <div className="flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-pink-500/10 to-rose-600/10">
              <Heart className="w-4 h-4 text-pink-600" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Match Algorithms
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {matchAlgorithms.map((algo) => (
              <AlgorithmButton
                key={algo.id}
                algo={algo}
                isSelected={selected === algo.id}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Selected Algorithm Detail Card */}
      {selectedAlgo && (
        <div 
          className={cn(
            "relative overflow-hidden rounded-xl p-4",
            "bg-gradient-to-r",
            selectedAlgo.gradient,
            "shadow-lg",
            // Animation
            "animate-in fade-in slide-in-from-bottom-2 duration-200"
          )}
        >
          <div className="relative z-10 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
              <div className="text-white">
                {selectedAlgo.icon}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-semibold text-white">
                {selectedAlgo.name}
              </h4>
              <p className="text-sm text-white/80 mt-0.5">
                {selectedAlgo.description}
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-medium text-white">Selected</span>
            </div>
          </div>
          
          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/30" />
            <div className="absolute -left-5 -bottom-10 w-32 h-32 rounded-full bg-white/20" />
          </div>
        </div>
      )}
    </div>
  );
}

function AlgorithmButton({
  algo,
  isSelected,
  onSelect,
}: {
  algo: AlgorithmOption;
  isSelected: boolean;
  onSelect: (id: Algorithm) => void;
}) {
  return (
    <button
      onClick={() => onSelect(algo.id)}
      className={cn(
        "group relative flex items-center gap-2 px-4 py-2.5 rounded-xl",
        "font-medium text-sm transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        isSelected ? [
          "bg-gradient-to-r shadow-md",
          algo.gradient,
          "text-white",
          "focus-visible:ring-white",
          "scale-[1.02]",
        ] : [
          "bg-white border border-slate-200",
          "text-slate-700 hover:text-slate-900",
          "hover:border-slate-300 hover:shadow-sm",
          "hover:scale-[1.02]",
          "focus-visible:ring-blue-500",
        ],
        // Spring animation timing
        "[transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]"
      )}
    >
      <span className={cn(
        "transition-colors duration-200",
        isSelected ? "text-white" : "text-slate-500 group-hover:text-slate-700"
      )}>
        {algo.icon}
      </span>
      <span>{algo.name}</span>
    </button>
  );
}
