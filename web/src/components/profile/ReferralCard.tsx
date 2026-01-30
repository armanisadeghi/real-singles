"use client";

import { useState } from "react";
import { Gift, Copy, CheckCircle, Share2, QrCode } from "lucide-react";
import Link from "next/link";
import { getReferralLink, APP_NAME } from "@/lib/config";
import { QRCodeModal } from "./QRCodeModal";

interface ReferralCardProps {
  referralCode: string;
}

export function ReferralCard({ referralCode }: ReferralCardProps) {
  const [copied, setCopied] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const link = getReferralLink(referralCode);
    const shareText = `Hey! I've been using ${APP_NAME} to meet amazing people. Join me using my referral link!`;
    
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
          await navigator.clipboard.writeText(link);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }
    } else {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <section className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-5 h-5 text-amber-600" />
          <h3 className="text-sm font-semibold text-amber-800">Referral Code</h3>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-amber-200">
          <code className="flex-1 font-mono text-amber-900 font-medium">{referralCode}</code>
          <button 
            onClick={handleCopy}
            className="p-1 hover:bg-amber-50 rounded transition-colors"
            title="Copy code"
          >
            {copied ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4 text-amber-600" />
            )}
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all"
          >
            <Share2 className="w-4 h-4" />
            Share Link
          </button>
          <button
            onClick={() => setShowQRModal(true)}
            className="flex items-center justify-center w-10 h-10 bg-white text-amber-700 rounded-lg border border-amber-200 hover:bg-amber-50 transition-all"
            title="Show QR Code"
          >
            <QrCode className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-amber-700">
            Share to earn points when friends sign up!
          </p>
          <Link
            href="/refer"
            className="text-xs font-medium text-amber-600 hover:text-amber-800 transition-colors"
          >
            View Stats →
          </Link>
        </div>
      </section>

      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        referralCode={referralCode}
      />
    </>
  );
}
