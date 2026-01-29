"use client";

import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Image,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchEligibility {
  can_match: boolean;
  reasons: string[];
  profile_complete: boolean;
  has_photos: boolean;
  is_verified: boolean;
  is_photo_verified: boolean;
  account_status: string;
  profile_hidden: boolean;
}

interface EligibilityPanelProps {
  eligibility: MatchEligibility;
}

export function EligibilityPanel({ eligibility }: EligibilityPanelProps) {
  const checks = [
    {
      label: "Profile Complete",
      passed: eligibility.profile_complete,
      icon: User,
    },
    {
      label: "Has Photos",
      passed: eligibility.has_photos,
      icon: Image,
    },
    {
      label: "Account Active",
      passed: eligibility.account_status === "active",
      icon: Shield,
      detail: eligibility.account_status !== "active" ? eligibility.account_status : undefined,
    },
    {
      label: "Profile Visible",
      passed: !eligibility.profile_hidden,
      icon: eligibility.profile_hidden ? EyeOff : Eye,
      detail: eligibility.profile_hidden ? "Hidden/Paused" : undefined,
    },
    {
      label: "Identity Verified",
      passed: eligibility.is_verified,
      icon: Shield,
      optional: true,
    },
    {
      label: "Photo Verified",
      passed: eligibility.is_photo_verified,
      icon: Image,
      optional: true,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">Match Eligibility</h3>
        <div
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium",
            eligibility.can_match
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
          )}
        >
          {eligibility.can_match ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Can Match
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4" />
              Cannot Match
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {checks.map((check) => (
          <div
            key={check.label}
            className={cn(
              "flex items-center justify-between py-2 px-3 rounded-lg",
              check.passed
                ? "bg-emerald-50"
                : check.optional
                  ? "bg-slate-50"
                  : "bg-red-50"
            )}
          >
            <div className="flex items-center gap-2">
              <check.icon
                className={cn(
                  "w-4 h-4",
                  check.passed
                    ? "text-emerald-600"
                    : check.optional
                      ? "text-slate-400"
                      : "text-red-600"
                )}
              />
              <span
                className={cn(
                  "text-sm font-medium",
                  check.passed
                    ? "text-emerald-700"
                    : check.optional
                      ? "text-slate-500"
                      : "text-red-700"
                )}
              >
                {check.label}
                {check.optional && (
                  <span className="text-xs text-slate-400 ml-1">(optional)</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {check.detail && (
                <span className="text-xs text-slate-500">{check.detail}</span>
              )}
              {check.passed ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : check.optional ? (
                <span className="w-4 h-4 rounded-full bg-slate-300" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
            </div>
          </div>
        ))}
      </div>

      {eligibility.reasons.length > 0 && (
        <div className="mt-4 p-3 bg-amber-50 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-700 mb-1">
                Issues preventing matching:
              </p>
              <ul className="text-sm text-amber-600 space-y-0.5">
                {eligibility.reasons.map((reason, i) => (
                  <li key={i}>• {reason}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
