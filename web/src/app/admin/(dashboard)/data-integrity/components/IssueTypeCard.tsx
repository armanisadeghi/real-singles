"use client";

import Link from "next/link";
import { ArrowRight, Wrench, ImageOff, User, Images, Heart } from "lucide-react";

interface IssueItem {
  label: string;
  count: number;
  severity: "critical" | "warning" | "info";
}

interface IssueTypeCardProps {
  title: string;
  description: string;
  iconName: "image-off" | "user" | "images" | "heart";
  iconColor: string;
  iconBg: string;
  count: number;
  criticalCount: number;
  href: string;
  issues: IssueItem[];
  autoFixable: number;
}

const iconMap = {
  "image-off": ImageOff,
  "user": User,
  "images": Images,
  "heart": Heart,
};

export function IssueTypeCard({
  title,
  description,
  iconName,
  iconColor,
  iconBg,
  count,
  criticalCount,
  href,
  issues,
  autoFixable,
}: IssueTypeCardProps) {
  const Icon = iconMap[iconName];
  const hasIssues = count > 0;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}
            >
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
          </div>
          {hasIssues ? (
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              {criticalCount > 0 && (
                <p className="text-xs text-red-600">
                  {criticalCount} critical
                </p>
              )}
            </div>
          ) : (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
              All Good
            </span>
          )}
        </div>
      </div>

      {/* Issues breakdown */}
      <div className="px-5 py-3 space-y-2">
        {issues.map((issue) => (
          <div
            key={issue.label}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-gray-600">{issue.label}</span>
            <span
              className={`font-medium ${
                issue.count === 0
                  ? "text-gray-300"
                  : issue.severity === "critical"
                    ? "text-red-600"
                    : issue.severity === "warning"
                      ? "text-amber-600"
                      : "text-blue-600"
              }`}
            >
              {issue.count}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        {autoFixable > 0 ? (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <Wrench className="w-3.5 h-3.5" />
            {autoFixable} auto-fixable
          </span>
        ) : (
          <span className="text-xs text-gray-400">Manual review required</span>
        )}
        <Link
          href={href}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
        >
          View Details
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
