"use client";

import { useRef, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Download, Share2 } from "lucide-react";
import { getReferralLink, APP_NAME } from "@/lib/config";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralCode: string;
}

export function QRCodeModal({ isOpen, onClose, referralCode }: QRCodeModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const referralLink = getReferralLink(referralCode);

  // Handle dialog open/close
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  // Handle backdrop click to close
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  // Handle ESC key
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  // Download QR code as PNG
  const handleDownload = useCallback(() => {
    const svg = document.getElementById("referral-qr-code");
    if (!svg) return;

    // Create canvas and draw SVG
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size with padding
    const size = 320;
    const padding = 32;
    canvas.width = size + padding * 2;
    canvas.height = size + padding * 2;

    // Fill white background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Convert SVG to image and draw
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, padding, padding, size, size);
      
      // Download
      const link = document.createElement("a");
      link.download = `${APP_NAME.toLowerCase()}-referral-${referralCode}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, [referralCode]);

  // Share QR code (Web Share API)
  const handleShare = useCallback(async () => {
    const shareText = `Scan this QR code to join me on ${APP_NAME}! Or use my referral link: ${referralLink}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join me on ${APP_NAME}!`,
          text: shareText,
          url: referralLink,
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          await navigator.clipboard.writeText(referralLink);
        }
      }
    } else {
      await navigator.clipboard.writeText(referralLink);
    }
  }, [referralLink]);

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="
        m-auto p-0 max-w-sm w-[calc(100%-2rem)] rounded-2xl bg-white shadow-2xl
        backdrop:bg-black/60 backdrop:backdrop-blur-sm
        
        /* Entrance animation with @starting-style */
        [&[open]]:opacity-100 [&[open]]:scale-100 [&[open]]:translate-y-0
        opacity-0 scale-95 translate-y-4
        transition-[opacity,transform,display,overlay] duration-300 ease-out
        [transition-behavior:allow-discrete]
        
        /* Starting style for entrance */
        [@starting-style]:opacity-0 [@starting-style]:scale-95 [@starting-style]:translate-y-4
        
        /* Backdrop animation */
        [&::backdrop]:opacity-100 [&::backdrop]:transition-opacity [&::backdrop]:duration-300
        [&::backdrop]:[@starting-style]:opacity-0
        
        /* Dark mode */
        dark:bg-gray-900 dark:shadow-black/50
      "
    >
      <div className="relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="
            absolute top-4 right-4 z-10
            w-8 h-8 flex items-center justify-center
            rounded-full bg-gray-100 hover:bg-gray-200
            transition-colors duration-150
            focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2
            dark:bg-gray-800 dark:hover:bg-gray-700
          "
          aria-label="Close"
        >
          <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Content */}
        <div className="p-6 pt-12">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Share via QR Code
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Friends can scan this to join {APP_NAME}
            </p>
          </div>

          {/* QR Code */}
          <div className="
            flex items-center justify-center p-6 mb-4
            bg-white dark:bg-white rounded-xl border border-gray-100 dark:border-gray-200
            shadow-inner
          ">
            <QRCodeSVG
              id="referral-qr-code"
              value={referralLink}
              size={200}
              level="H"
              includeMargin={false}
              bgColor="#FFFFFF"
              fgColor="#1F2937"
            />
          </div>

          {/* Referral code display */}
          <div className="text-center mb-6">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Referral Code</p>
            <code className="text-lg font-mono font-bold text-amber-700 dark:text-amber-400 tracking-wider">
              {referralCode}
            </code>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="
                flex-1 flex items-center justify-center gap-2
                px-4 py-3 rounded-xl
                bg-gray-100 text-gray-700 font-medium
                hover:bg-gray-200 active:scale-[0.98]
                transition-all duration-200
                [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]
                focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2
                dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700
              "
            >
              <Download className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleShare}
              className="
                flex-1 flex items-center justify-center gap-2
                px-4 py-3 rounded-xl
                bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium
                hover:from-amber-600 hover:to-orange-600 active:scale-[0.98]
                transition-all duration-200
                [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]
                shadow-lg shadow-amber-500/25
                focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2
              "
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
