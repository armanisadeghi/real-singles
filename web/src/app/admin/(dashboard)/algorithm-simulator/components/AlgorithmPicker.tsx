"use client";

import { Sparkles, Home, Filter, MapPin, Heart, ThumbsUp } from "lucide-react";

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
  description: string;
  icon: React.ReactNode;
  category: "discovery" | "matches";
}

const algorithms: AlgorithmOption[] = [
  {
    id: "discover-profiles",
    name: "Discover Profiles",
    description: "Main discovery grid - profiles for browse/like/pass",
    icon: <Sparkles className="w-4 h-4" />,
    category: "discovery",
  },
  {
    id: "discover-home",
    name: "Home Screen",
    description: "Aggregated home data - top matches preview",
    icon: <Home className="w-4 h-4" />,
    category: "discovery",
  },
  {
    id: "top-matches",
    name: "Top Matches",
    description: "Filtered matches with preference options",
    icon: <Filter className="w-4 h-4" />,
    category: "discovery",
  },
  {
    id: "nearby",
    name: "Nearby",
    description: "Location-based profiles sorted by distance",
    icon: <MapPin className="w-4 h-4" />,
    category: "discovery",
  },
  {
    id: "mutual-matches",
    name: "Mutual Matches",
    description: "Users who both liked each other",
    icon: <Heart className="w-4 h-4" />,
    category: "matches",
  },
  {
    id: "likes-received",
    name: "Likes Received",
    description: "Users who have liked this user (pending action)",
    icon: <ThumbsUp className="w-4 h-4" />,
    category: "matches",
  },
];

interface AlgorithmPickerProps {
  selected: Algorithm;
  onSelect: (algorithm: Algorithm) => void;
}

export function AlgorithmPicker({ selected, onSelect }: AlgorithmPickerProps) {
  const discoveryAlgorithms = algorithms.filter((a) => a.category === "discovery");
  const matchAlgorithms = algorithms.filter((a) => a.category === "matches");

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Select Algorithm</h3>
      
      <div className="space-y-4">
        {/* Discovery Algorithms */}
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Discovery
          </p>
          <div className="grid grid-cols-2 gap-2">
            {discoveryAlgorithms.map((algo) => (
              <button
                key={algo.id}
                onClick={() => onSelect(algo.id)}
                className={`flex items-start gap-2 p-3 rounded-lg border text-left transition-all ${
                  selected === algo.id
                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className={`p-1.5 rounded-md ${
                  selected === algo.id
                    ? "bg-blue-100 text-blue-600"
                    : "bg-slate-100 text-slate-500"
                }`}>
                  {algo.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    selected === algo.id ? "text-blue-900" : "text-slate-900"
                  }`}>
                    {algo.name}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {algo.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Match Algorithms */}
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Matches
          </p>
          <div className="grid grid-cols-2 gap-2">
            {matchAlgorithms.map((algo) => (
              <button
                key={algo.id}
                onClick={() => onSelect(algo.id)}
                className={`flex items-start gap-2 p-3 rounded-lg border text-left transition-all ${
                  selected === algo.id
                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className={`p-1.5 rounded-md ${
                  selected === algo.id
                    ? "bg-blue-100 text-blue-600"
                    : "bg-slate-100 text-slate-500"
                }`}>
                  {algo.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    selected === algo.id ? "text-blue-900" : "text-slate-900"
                  }`}>
                    {algo.name}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {algo.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
