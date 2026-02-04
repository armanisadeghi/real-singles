"use client";

import { useState, useEffect } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CheckCircle, XCircle, Loader2, FileText, Award } from "lucide-react";

interface Application {
  id: string;
  user_id: string;
  display_name: string;
  profile_image_url: string;
  bio: string;
  specialties: string[];
  years_experience: number;
  certifications: string[];
  application_notes: string;
  created_at: string;
}

export default function MatchmakerApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // TODO: Fetch pending applications
    setLoading(false);
  }, []);

  const handleApprove = async (applicationId: string) => {
    setActionLoading(applicationId);
    // TODO: Call API to approve
    setTimeout(() => {
      setActionLoading(null);
      // Remove from list
      setApplications(applications.filter((a) => a.id !== applicationId));
    }, 1000);
  };

  const handleReject = async (applicationId: string) => {
    const reason = rejectionReason[applicationId];
    if (!reason || reason.trim().length < 10) {
      alert("Please provide a rejection reason (min 10 characters)");
      return;
    }

    setActionLoading(applicationId);
    // TODO: Call API to reject
    setTimeout(() => {
      setActionLoading(null);
      setApplications(applications.filter((a) => a.id !== applicationId));
    }, 1000);
  };

  const formatSpecialty = (specialty: string) => {
    return specialty
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Matchmaker Applications"
        subtitle="Review and approve pending matchmaker applications"
        variant="hero"
        iconName="check-circle"
        iconGradient="from-amber-500 to-orange-500"
      />

      {/* Applications List */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm text-gray-500">No pending applications</p>
          </div>
        ) : (
          applications.map((app) => (
            <div
              key={app.id}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 flex items-center justify-center overflow-hidden">
                    {app.profile_image_url ? (
                      <img
                        src={app.profile_image_url}
                        alt={app.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {app.display_name?.charAt(0) || "?"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {app.display_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Applied {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {app.years_experience} years experience
                  </span>
                </div>
              </div>

              {/* Application Details */}
              <div className="p-6 space-y-4">
                {/* Bio */}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Bio
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {app.bio}
                  </p>
                </div>

                {/* Specialties */}
                {app.specialties.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Specialties
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {app.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="px-2 py-1 bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full"
                        >
                          {formatSpecialty(specialty)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {app.certifications.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      Certifications
                    </p>
                    <ul className="space-y-1">
                      {app.certifications.map((cert, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                        >
                          <div className="w-1 h-1 rounded-full bg-amber-500" />
                          {cert}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Application Notes */}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Why they want to be a matchmaker
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {app.application_notes}
                  </p>
                </div>

                {/* Rejection Reason Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Rejection Reason (if rejecting)
                  </label>
                  <textarea
                    value={rejectionReason[app.id] || ""}
                    onChange={(e) =>
                      setRejectionReason({ ...rejectionReason, [app.id]: e.target.value })
                    }
                    placeholder="Provide a reason for rejection..."
                    className="w-full h-20 px-3 py-2 bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handleReject(app.id)}
                    disabled={actionLoading === app.id}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 dark:border-neutral-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-950/50 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === app.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="w-5 h-5" />
                        Reject
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleApprove(app.id)}
                    disabled={actionLoading === app.id}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === app.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Approve
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
