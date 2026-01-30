"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { QRCodeModal } from "./QRCodeModal";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  referralCode: string;
  className?: string;
  /** "always" | "never" | "responsive" (hidden on mobile, shown on sm+) */
  labelVisibility?: "always" | "never" | "responsive";
}

export function ShareButton({ 
  referralCode, 
  className, 
  labelVisibility = "never" 
}: ShareButtonProps) {
  const [showQRModal, setShowQRModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowQRModal(true)}
        className={cn(
          "inline-flex items-center justify-center gap-1.5",
          "bg-gray-100 text-gray-600 font-medium rounded-full",
          "hover:bg-gray-200 hover:text-gray-900",
          "transition-all duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
          "active:scale-[0.97]",
          className
        )}
        title="Share Profile"
      >
        <Share2 className="w-4 h-4" />
        {labelVisibility === "always" && <span>Share</span>}
        {labelVisibility === "responsive" && <span className="hidden sm:inline">Share</span>}
      </button>

      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        referralCode={referralCode}
      />
    </>
  );
}
