"use client";

import { useState, useEffect } from "react";
import { Search, User, Check, X } from "lucide-react";

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

interface UserSelectorProps {
  selectedUser: UserOption | null;
  onSelectUser: (user: UserOption | null) => void;
}

export function UserSelector({ selectedUser, onSelectUser }: UserSelectorProps) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Select User to Simulate</h3>
      
      {selectedUser ? (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden shrink-0">
            {selectedUser.profile_image_url ? (
              <img
                src={selectedUser.profile_image_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 truncate">
              {getUserDisplayName(selectedUser)}
            </p>
            <p className="text-xs text-slate-500 truncate">{selectedUser.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {formatGender(selectedUser.gender)}
              </span>
              <span className="text-xs text-slate-500">
                → {formatLookingFor(selectedUser.looking_for)}
              </span>
            </div>
          </div>
          <button
            onClick={() => onSelectUser(null)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>

          {isOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  Loading...
                </div>
              ) : users.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  No users found
                </div>
              ) : (
                users.map((user) => (
                  <button
                    key={user.user_id}
                    onClick={() => {
                      onSelectUser(user);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center overflow-hidden shrink-0">
                      {user.profile_image_url ? (
                        <img
                          src={user.profile_image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {getUserDisplayName(user)}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                          user.gender === "male" ? "bg-blue-100 text-blue-700" :
                          user.gender === "female" ? "bg-pink-100 text-pink-700" :
                          "bg-slate-100 text-slate-700"
                        }`}>
                          {formatGender(user.gender)}
                        </span>
                        {user.can_start_matching ? (
                          <span className="inline-flex items-center gap-0.5 text-xs text-green-600">
                            <Check className="w-3 h-3" />
                            Can match
                          </span>
                        ) : (
                          <span className="text-xs text-amber-600">Incomplete</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
