"use client";

/**
 * MatchCelebrationModal Component
 * 
 * Shows a celebration when two users match (mutual like).
 * Displays both profile photos, confetti animation, and options to
 * start a conversation or keep browsing.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchCelebrationModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Current user's profile image */
  currentUserImage?: string | null;
  /** Current user's name */
  currentUserName?: string;
  /** Matched user's profile image */
  matchedUserImage?: string | null;
  /** Matched user's name */
  matchedUserName?: string;
  /** Conversation ID to navigate to */
  conversationId?: string | null;
  /** Called when user wants to keep browsing */
  onClose: () => void;
  /** Called when user starts a conversation */
  onStartChat?: () => void;
}

// Heart particle for the celebration animation
function HeartParticle({ delay, left }: { delay: number; left: number }) {
  return (
    <div
      className="absolute text-2xl animate-float-up pointer-events-none"
      style={{
        left: `${left}%`,
        animationDelay: `${delay}s`,
        bottom: "-20px",
      }}
    >
      💖
    </div>
  );
}

// Confetti piece component
function ConfettiPiece({ delay, left, color }: { delay: number; left: number; color: string }) {
  return (
    <div
      className="absolute w-3 h-3 rounded-sm animate-confetti-fall pointer-events-none"
      style={{
        left: `${left}%`,
        animationDelay: `${delay}s`,
        top: "-20px",
        backgroundColor: color,
        transform: `rotate(${Math.random() * 360}deg)`,
      }}
    />
  );
}

export function MatchCelebrationModal({
  isOpen,
  currentUserImage,
  currentUserName = "You",
  matchedUserImage,
  matchedUserName = "Someone",
  conversationId,
  onClose,
  onStartChat,
}: MatchCelebrationModalProps) {
  const router = useRouter();
  const [showContent, setShowContent] = useState(false);

  // Animate content appearance
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  // Handle starting a chat
  const handleStartChat = () => {
    if (onStartChat) {
      onStartChat();
    } else if (conversationId) {
      router.push(`/chats/${conversationId}`);
    }
    onClose();
  };

  if (!isOpen) return null;

  // Generate confetti pieces
  const confettiColors = ["#FF6B9D", "#FFB3D1", "#FF85B3", "#FFC2D9", "#E91E8C", "#F06EAA"];
  const confettiPieces = Array.from({ length: 30 }, (_, i) => ({
    delay: Math.random() * 2,
    left: Math.random() * 100,
    color: confettiColors[i % confettiColors.length],
  }));

  // Generate heart particles
  const heartParticles = Array.from({ length: 12 }, (_, i) => ({
    delay: Math.random() * 3,
    left: 10 + Math.random() * 80,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Confetti animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confettiPieces.map((piece, i) => (
          <ConfettiPiece key={i} {...piece} />
        ))}
      </div>

      {/* Heart particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {heartParticles.map((heart, i) => (
          <HeartParticle key={i} {...heart} />
        ))}
      </div>

      {/* Modal content */}
      <div
        className={cn(
          "relative bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl",
          "transform transition-all duration-500",
          showContent ? "scale-100 opacity-100" : "scale-75 opacity-0"
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <div className="p-8 text-center">
          {/* Sparkle decoration */}
          <div className="absolute top-6 left-6">
            <Sparkles className="w-6 h-6 text-white/60 animate-pulse" />
          </div>
          <div className="absolute bottom-20 right-6">
            <Sparkles className="w-5 h-5 text-white/60 animate-pulse" style={{ animationDelay: "0.5s" }} />
          </div>

          {/* Profile photos */}
          <div className="flex items-center justify-center mb-6">
            {/* Current user photo */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                {currentUserImage ? (
                  <img
                    src={currentUserImage}
                    alt={currentUserName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center text-3xl">
                    👤
                  </div>
                )}
              </div>
            </div>

            {/* Heart connector */}
            <div className="mx-[-12px] z-10 relative">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <span className="text-2xl">💕</span>
              </div>
            </div>

            {/* Matched user photo */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                {matchedUserImage ? (
                  <img
                    src={matchedUserImage}
                    alt={matchedUserName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center text-3xl">
                    👤
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Headline */}
          <h2 className="text-3xl font-bold text-white mb-2">
            It's a Match!
          </h2>
          <p className="text-white/90 mb-8">
            You and <span className="font-semibold">{matchedUserName}</span> liked each other
          </p>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={handleStartChat}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-pink-600 rounded-full font-semibold hover:bg-pink-50 transition-colors shadow-lg"
            >
              <MessageCircle className="w-5 h-5" />
              Send a Message
            </button>

            <button
              onClick={onClose}
              className="w-full px-6 py-3 text-white/90 rounded-full font-medium hover:bg-white/10 transition-colors"
            >
              Keep Browsing
            </button>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes float-up {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-400px) scale(0.5);
          }
        }
        .animate-float-up {
          animation: float-up 4s ease-out forwards;
        }

        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(600px) rotate(720deg);
          }
        }
        .animate-confetti-fall {
          animation: confetti-fall 3s ease-in forwards;
        }
      `}</style>
    </div>
  );
}

export default MatchCelebrationModal;
