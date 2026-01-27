"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle,
  ExternalLink,
  User,
  Search,
  Filter,
  AlertTriangle,
  AlertCircle,
  Calendar,
  Heart,
  Mail,
} from "lucide-react";
import type { DataIntegrityIssue } from "@/lib/services/data-integrity";

interface ProfileIssuesListProps {
  issues: DataIntegrityIssue[];
}

type ProfileIssueType =
  | "all"
  | "missing_gender"
  | "missing_looking_for"
  | "missing_dob"
  | "missing_first_name";

export function ProfileIssuesList({ issues }: ProfileIssuesListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<ProfileIssueType>("all");

  // Group issues by user so we can show all issues for a user in one row
  const issuesByUser = useMemo(() => {
    const grouped = new Map<
      string,
      {
        userId: string;
        userEmail: string;
        firstName: string | null;
        lastName: string | null;
        createdAt: string;
        issues: DataIntegrityIssue[];
      }
    >();

    for (const issue of issues) {
      const existing = grouped.get(issue.userId);
      if (existing) {
        existing.issues.push(issue);
      } else {
        grouped.set(issue.userId, {
          userId: issue.userId,
          userEmail: issue.userEmail,
          firstName: issue.firstName,
          lastName: issue.lastName,
          createdAt: issue.createdAt,
          issues: [issue],
        });
      }
    }

    return Array.from(grouped.values());
  }, [issues]);

  // Filter and search
  const filteredUsers = useMemo(() => {
    return issuesByUser.filter((user) => {
      const matchesSearch =
        searchQuery === "" ||
        user.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.firstName &&
          user.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.lastName &&
          user.lastName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFilter =
        filterType === "all" ||
        user.issues.some((i) => i.issueType === filterType);

      return matchesSearch && matchesFilter;
    });
  }, [issuesByUser, searchQuery, filterType]);

  // Count by issue type
  const countByType = useMemo(() => {
    const counts: Record<ProfileIssueType, number> = {
      all: issues.length,
      missing_gender: 0,
      missing_looking_for: 0,
      missing_dob: 0,
      missing_first_name: 0,
    };

    for (const issue of issues) {
      if (issue.issueType in counts) {
        counts[issue.issueType as ProfileIssueType]++;
      }
    }

    return counts;
  }, [issues]);

  function getIssueIcon(type: string) {
    switch (type) {
      case "missing_gender":
        return <User className="w-3 h-3" />;
      case "missing_looking_for":
        return <Heart className="w-3 h-3" />;
      case "missing_dob":
        return <Calendar className="w-3 h-3" />;
      case "missing_first_name":
        return <User className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  }

  function getIssueLabel(type: string) {
    switch (type) {
      case "missing_gender":
        return "Gender";
      case "missing_looking_for":
        return "Looking For";
      case "missing_dob":
        return "DOB";
      case "missing_first_name":
        return "First Name";
      default:
        return type;
    }
  }

  if (issues.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          All Profiles Complete
        </h3>
        <p className="text-gray-500">
          All users have the required profile fields filled out.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as ProfileIssueType)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Issues ({countByType.all})</option>
              <option value="missing_gender">
                Missing Gender ({countByType.missing_gender})
              </option>
              <option value="missing_looking_for">
                Missing Looking For ({countByType.missing_looking_for})
              </option>
              <option value="missing_dob">
                Missing DOB ({countByType.missing_dob})
              </option>
              <option value="missing_first_name">
                Missing First Name ({countByType.missing_first_name})
              </option>
            </select>
          </div>
        </div>

        {/* Export / Contact Button */}
        <button
          onClick={() => {
            // Export emails for contacting
            const emails = filteredUsers.map((u) => u.userEmail).join(", ");
            navigator.clipboard.writeText(emails);
            alert(
              `Copied ${filteredUsers.length} email addresses to clipboard`
            );
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          <Mail className="w-4 h-4" />
          Copy Emails ({filteredUsers.length})
        </button>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Missing Fields
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const hasCritical = user.issues.some(
                  (i) =>
                    i.issueType === "missing_gender" ||
                    i.issueType === "missing_looking_for" ||
                    i.issueType === "missing_dob"
                );

                return (
                  <tr key={user.userId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.firstName || "Unknown"} {user.lastName || ""}
                          </p>
                          <p className="text-xs text-gray-500">
                            {user.userEmail}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {user.issues.map((issue, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                              issue.severity === "critical"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {getIssueIcon(issue.issueType)}
                            {getIssueLabel(issue.issueType)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {hasCritical ? (
                        <span className="inline-flex items-center gap-1 text-sm text-red-600">
                          <AlertTriangle className="w-4 h-4" />
                          Cannot match
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm text-amber-600">
                          <AlertCircle className="w-4 h-4" />
                          Degraded
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        href={`/admin/users/${user.userId}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Edit User
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state for filtered results */}
        {filteredUsers.length === 0 && issuesByUser.length > 0 && (
          <div className="p-8 text-center text-gray-500">
            No users match your search or filter criteria.
          </div>
        )}
      </div>
    </div>
  );
}
