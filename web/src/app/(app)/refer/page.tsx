"use client";

import { useState, useEffect } from "react";
import { Gift, Copy, Share2, Users, Trophy, CheckCircle, ArrowLeft } from "lucide-react";
import { getReferralLink, APP_NAME } from "@/lib/config";
import { useRouter } from "next/navigation";

interface ReferralStats {
  total_referrals: number;
  completed_referrals: number;
  pending_referrals: number;
  total_points_earned: number;
}

interface ReferralData {
  referral_code: string;
  referral_link: string;
  stats: ReferralStats;
  referrals: Array<{
    ReferralID: string;
    ReferredUserName: string;
    ReferredUserImage: string;
    Status: string;
    PointsAwarded: number;
    CreatedAt: string;
  }>;
}

export default function ReferPage() {
  const router = useRouter();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      setError(null);
      const response = await fetch("/api/referrals");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.msg || "Failed to load referral data");
      }
    } catch (error) {
      console.error("Failed to fetch referral data:", error);
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!data?.referral_code) return;
    await navigator.clipboard.writeText(data.referral_code);
    setCopied("code");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyLink = async () => {
    if (!data?.referral_code) return;
    const link = getReferralLink(data.referral_code);
    await navigator.clipboard.writeText(link);
    setCopied("link");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleShare = async () => {
    if (!data?.referral_code) return;
    
    const link = getReferralLink(data.referral_code);
    const shareText = `Hey! I've been using ${APP_NAME} to meet amazing people. Join me using my referral link and get started today!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join me on ${APP_NAME}!`,
          text: shareText,
          url: link,
        });
      } catch (error) {
        // User cancelled or share failed - fall back to copy
        if ((error as Error).name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      // Fallback for browsers without Web Share API
      handleCopyLink();
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchReferralData();
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full mb-4">
          <Gift className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Invite Friends</h1>
        <p className="text-gray-600">
          Share your referral link and earn points when friends sign up!
        </p>
      </div>

      {/* Referral Code Card */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 mb-6 border border-amber-100">
        <p className="text-sm font-medium text-amber-800 mb-2">Your Referral Code</p>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 bg-white rounded-xl px-4 py-3 border border-amber-200">
            <code className="text-xl font-mono font-bold text-amber-900 tracking-wider">
              {data?.referral_code || "—"}
            </code>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center justify-center w-12 h-12 bg-white rounded-xl border border-amber-200 hover:bg-amber-50 transition-colors"
            title="Copy code"
          >
            {copied === "code" ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <Copy className="w-5 h-5 text-amber-600" />
            )}
          </button>
        </div>

        {/* Referral Link */}
        <p className="text-sm font-medium text-amber-800 mb-2">Your Referral Link</p>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 bg-white rounded-xl px-4 py-3 border border-amber-200 overflow-hidden">
            <p className="text-sm text-gray-600 truncate">
              {data?.referral_code ? getReferralLink(data.referral_code) : "—"}
            </p>
          </div>
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center w-12 h-12 bg-white rounded-xl border border-amber-200 hover:bg-amber-50 transition-colors"
            title="Copy link"
          >
            {copied === "link" ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <Copy className="w-5 h-5 text-amber-600" />
            )}
          </button>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/25"
        >
          <Share2 className="w-5 h-5" />
          Share with Friends
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-indigo-500" />
            <span className="text-sm text-gray-500">Total Referrals</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {data?.stats.total_referrals || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-gray-500">Points Earned</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {data?.stats.total_points_earned || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-500">Completed</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {data?.stats.completed_referrals || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-4 rounded-full border-2 border-yellow-500" />
            <span className="text-sm text-gray-500">Pending</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {data?.stats.pending_referrals || 0}
          </p>
        </div>
      </div>

      {/* Recent Referrals */}
      {data?.referrals && data.referrals.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent Referrals</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {data.referrals.slice(0, 5).map((referral) => (
              <div key={referral.ReferralID} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    {referral.ReferredUserImage ? (
                      <img
                        src={referral.ReferredUserImage}
                        alt={referral.ReferredUserName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <Users className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{referral.ReferredUserName}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(referral.CreatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    referral.Status === "rewarded" 
                      ? "bg-green-100 text-green-800"
                      : referral.Status === "completed"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {referral.Status}
                  </span>
                  {referral.PointsAwarded > 0 && (
                    <p className="text-sm text-amber-600 mt-1">+{referral.PointsAwarded} pts</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="mt-8 bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">How it works</h3>
        <ol className="space-y-3">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-medium">1</span>
            <p className="text-gray-600">Share your unique referral link with friends</p>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-medium">2</span>
            <p className="text-gray-600">They sign up using your link</p>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-medium">3</span>
            <p className="text-gray-600">You both earn points when they complete their profile!</p>
          </li>
        </ol>
      </div>
    </div>
  );
}
