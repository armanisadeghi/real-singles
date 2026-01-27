"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, LogOut } from "lucide-react";

interface AdminUserDropdownProps {
  email: string;
  role: string;
  onSignOut: () => void;
}

export function AdminUserDropdown({
  email,
  role,
  onSignOut,
}: AdminUserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Extract display name from email (before @)
  const displayName = email.split("@")[0];
  // Capitalize first letter
  const formattedName =
    displayName.charAt(0).toUpperCase() + displayName.slice(1);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
          {formattedName.charAt(0).toUpperCase()}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
          <div className="px-3 py-2.5 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{formattedName}</p>
            <p className="text-xs text-gray-500 truncate">{email}</p>
            <span className="inline-block mt-1 px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded capitalize">
              {role}
            </span>
          </div>
          <div className="p-1">
            <form action={onSignOut}>
              <button
                type="submit"
                className="w-full flex items-center gap-2 px-2.5 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
