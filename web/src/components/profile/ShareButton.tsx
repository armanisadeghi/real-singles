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
          "inline-flex items-center justify-center gap-1",
          "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 font-medium rounded-full",
          "hover:bg-gray-200 dark:hover:bg-neutral-700 hover:text-gray-900 dark:hover:text-gray-100",
          "transition-all duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
          "active:scale-[0.97]",
          className
        )}
        title="Share Profile"
      >
        <Share2 className="w-3.5 h-3.5" />
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
