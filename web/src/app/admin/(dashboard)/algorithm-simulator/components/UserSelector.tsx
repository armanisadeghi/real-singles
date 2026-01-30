"use client";

import { useState, useEffect, useRef } from "react";
import { Search, User, Check, X, ChevronRight, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserOption {
  user_id: string;
  email: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  looking_for: string[] | null;
  city: string | null;
  state: string | null;
  can_start_matching: boolean | null;
  status: string | null;
  profile_image_url: string | null;
}

interface UserFilters {
  minAge?: number;
  maxAge?: number;
  minHeight?: number;
  maxHeight?: number;
  maxDistanceMiles?: number;
  bodyTypes?: string[];
  ethnicities?: string[];
  religions?: string[];
  educationLevels?: string[];
  zodiacSigns?: string[];
  smoking?: string;
  drinking?: string;
  marijuana?: string;
  hasKids?: string;
  wantsKids?: string;
}

interface UserSelectorProps {
  selectedUser: UserOption | null;
  onSelectUser: (user: UserOption | null, filters?: UserFilters | null) => void;
  initialUserId?: string | null;
}

export function UserSelector({ selectedUser, onSelectUser, initialUserId }: UserSelectorProps) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!initialUserId);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch initial user if initialUserId is provided
  useEffect(() => {
    if (!initialUserId || selectedUser) return;

    const fetchInitialUser = async () => {
      setInitialLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("user_id", initialUserId);

        const response = await fetch(`/api/admin/algorithm-simulator?${params}`);
        const data = await response.json();
        
        if (data.success && data.users.length > 0) {
          // Pass both user and their saved filters
          onSelectUser(data.users[0], data.userFilters || null);
        }
      } catch (error) {
        console.error("Failed to fetch initial user:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialUser();
  }, [initialUserId, selectedUser, onSelectUser]);

  // Fetch filters when selecting a user from dropdown
  const handleSelectUser = async (user: UserOption) => {
    setIsOpen(false);
    setSearch("");
    
    // Fetch the user's filters
    try {
      const params = new URLSearchParams();
      params.set("user_id", user.user_id);
      
      const response = await fetch(`/api/admin/algorithm-simulator?${params}`);
      const data = await response.json();
      
      if (data.success) {
        onSelectUser(user, data.userFilters || null);
      } else {
        onSelectUser(user, null);
      }
    } catch (error) {
      console.error("Failed to fetch user filters:", error);
      onSelectUser(user, null);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        params.set("limit", "20");

        const response = await fetch(`/api/admin/algorithm-simulator?${params}`);
        const data = await response.json();
        
        if (data.success) {
          setUsers(data.users);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getUserDisplayName = (user: UserOption) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) return user.first_name;
    if (user.display_name) return user.display_name;
    return user.email;
  };

  const formatGender = (gender: string | null) => {
    if (!gender) return "Unknown";
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  const formatLookingFor = (lookingFor: string[] | null) => {
    if (!lookingFor || lookingFor.length === 0) return "Not set";
    return lookingFor.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(", ");
  };

  if (initialLoading) {
    return (
      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="w-16 h-16 rounded-2xl bg-slate-200 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (selectedUser) {
    return (
      <div className="animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/60">
          {/* User Avatar */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden shadow-lg shadow-blue-500/20">
              {selectedUser.profile_image_url ? (
                <img
                  src={selectedUser.profile_image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            {selectedUser.can_start_matching && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>
          
          {/* User Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-lg truncate">
              {getUserDisplayName(selectedUser)}
            </p>
            <p className="text-sm text-slate-500 truncate">{selectedUser.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className={cn(
                "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold",
                selectedUser.gender === "male" 
                  ? "bg-blue-100 text-blue-700" 
                  : selectedUser.gender === "female"
                  ? "bg-pink-100 text-pink-700"
                  : "bg-slate-100 text-slate-700"
              )}>
                {formatGender(selectedUser.gender)}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">
                {formatLookingFor(selectedUser.looking_for)}
              </span>
            </div>
            {selectedUser.city && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5" />
                {selectedUser.city}, {selectedUser.state}
              </div>
            )}
          </div>
          
          {/* Clear Button */}
          <button
            onClick={() => onSelectUser(null)}
            className={cn(
              "p-2.5 rounded-xl transition-all duration-200",
              "text-slate-400 hover:text-red-500",
              "bg-white/60 hover:bg-red-50",
              "border border-transparent hover:border-red-200",
              "[transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
              "hover:scale-110"
            )}
            title="Clear selection"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors",
          isOpen ? "text-blue-500" : "text-slate-400"
        )} />
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className={cn(
            "w-full pl-12 pr-4 py-3.5 rounded-xl text-sm",
            "bg-slate-50 border-2 border-transparent",
            "placeholder:text-slate-400",
            "focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10",
            "outline-none transition-all duration-200"
          )}
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className={cn(
          "absolute z-20 mt-2 w-full",
          "bg-white border border-slate-200 rounded-xl",
          "shadow-xl shadow-slate-200/50",
          "max-h-[400px] overflow-hidden",
          "animate-in fade-in slide-in-from-top-2 duration-200"
        )}>
          {loading && users.length === 0 ? (
            <div className="flex items-center justify-center gap-3 p-8 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Searching users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                <User className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-700">No users found</p>
              <p className="text-xs text-slate-500 mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[380px]">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                <p className="text-xs font-medium text-slate-500">
                  {users.length} user{users.length !== 1 ? 's' : ''} found
                </p>
              </div>
              {users.map((user, index) => (
                <button
                  key={user.user_id}
                  onClick={() => handleSelectUser(user)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3",
                    "hover:bg-blue-50/50 transition-colors",
                    "text-left group",
                    index !== users.length - 1 && "border-b border-slate-100"
                  )}
                >
                  <div className="relative shrink-0">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden",
                      "bg-gradient-to-br",
                      user.gender === "male" 
                        ? "from-blue-400 to-indigo-500" 
                        : user.gender === "female"
                        ? "from-pink-400 to-rose-500"
                        : "from-slate-400 to-slate-500"
                    )}>
                      {user.profile_image_url ? (
                        <img
                          src={user.profile_image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-white" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                      {getUserDisplayName(user)}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
                        user.gender === "male" 
                          ? "bg-blue-100 text-blue-700" 
                          : user.gender === "female"
                          ? "bg-pink-100 text-pink-700"
                          : "bg-slate-100 text-slate-700"
                      )}>
                        {formatGender(user.gender)}
                      </span>
                      {user.can_start_matching ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                          <Check className="w-3 h-3" />
                          Eligible
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-amber-600">Incomplete</span>
                      )}
                      {user.city && (
                        <span className="text-xs text-slate-400 truncate">
                          {user.city}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
