"use client";

/**
 * Super Likes Page
 * 
 * Allows users to purchase super like packs using points or dollars.
 * Shows current super like balance and available packages.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Heart, 
  ArrowLeft, 
  Star, 
  DollarSign,
  Check,
  Loader2,
  AlertCircle,
  Sparkles,
  TrendingUp,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface SuperLikeItem {
  id: string;
  item_type: string;
  name: string;
  description: string | null;
  quantity: number;
  dollar_price: number | null;
  points_cost: number | null;
  is_active: boolean;
}

interface UserSuperLikeStatus {
  superlike_balance: number;
  daily_superlikes_remaining: number;
  points_balance: number;
}

export default function SuperLikesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [superLikeItems, setSuperLikeItems] = useState<SuperLikeItem[]>([]);
  const [userStatus, setUserStatus] = useState<UserSuperLikeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SuperLikeItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"points" | "stripe">("points");
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Check URL params for success/cancel messages
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    
    if (success === "true") {
      setMessage({ type: "success", text: "Super Likes added to your account!" });
    } else if (canceled === "true") {
      setMessage({ type: "error", text: "Purchase was canceled." });
    }
  }, [searchParams]);

  // Fetch superlike items and user status
  const fetchData = useCallback(async () => {
    try {
      const [itemsRes, userRes] = await Promise.all([
        fetch("/api/store/items?type=superlike_pack"),
        fetch("/api/users/me")
      ]);

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setSuperLikeItems(itemsData.data?.filter((item: SuperLikeItem) => item.item_type === "superlike_pack" && item.is_active) || []);
      }

      if (userRes.ok) {
        const userData = await userRes.json();
        setUserStatus({
          superlike_balance: userData.data?.superlike_balance || 0,
          daily_superlikes_remaining: userData.data?.daily_superlikes_remaining || 0,
          points_balance: userData.data?.points_balance || 0
        });
      }
    } catch (error) {
      console.error("Failed to fetch superlike data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate total available superlikes
  const totalSuperlikes = (userStatus?.superlike_balance || 0) + (userStatus?.daily_superlikes_remaining || 0);

  // Handle purchase
  const handlePurchase = async () => {
    if (!selectedItem) return;
    
    setPurchasing(true);
    setShowConfirm(false);

    try {
      const response = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ type: "purchasable_item", id: selectedItem.id, quantity: 1 }],
          paymentMethod: paymentMethod
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "Purchase failed");
      }

      if (paymentMethod === "stripe" && data.data?.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.data.checkoutUrl;
      } else {
        // Points purchase completed
        setMessage({ type: "success", text: `${selectedItem.quantity} Super Likes added!` });
        fetchData(); // Refresh data
      }
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Purchase failed" 
      });
    } finally {
      setPurchasing(false);
      setSelectedItem(null);
    }
  };

  // Open purchase modal
  const openPurchaseModal = (item: SuperLikeItem, method: "points" | "stripe") => {
    setSelectedItem(item);
    setPaymentMethod(method);
    setShowConfirm(true);
  };

  // Get badge for best value
  const getBestValueIndex = () => {
    if (superLikeItems.length <= 1) return -1;
    let bestIndex = -1;
    let bestValue = 0;
    
    superLikeItems.forEach((item, index) => {
      const pricePerUnit = (item.dollar_price || 0) / item.quantity;
      if (bestIndex === -1 || (pricePerUnit > 0 && pricePerUnit < bestValue)) {
        bestValue = pricePerUnit;
        bestIndex = index;
      }
    });
    
    return bestIndex;
  };

  const bestValueIndex = getBestValueIndex();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
      {/* Back button */}
      <Link
        href="/discover"
        className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-5 sm:mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Discover
      </Link>

      {/* Messages */}
      {message && (
        <div
          className={cn(
            "mb-6 p-4 rounded-xl flex items-center gap-3",
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
          )}
        >
          {message.type === "success" ? (
            <Check className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="text-sm">{message.text}</p>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto text-current opacity-60 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Super Likes
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Stand out from the crowd and let them know you're really interested!
        </p>
      </div>

      {/* Current Super Like Balance */}
      <div className="mb-8 p-4 sm:p-5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Heart className="w-6 h-6 fill-white" />
            </div>
            <div>
              <p className="text-white/80 text-sm">Your Super Likes</p>
              <p className="font-bold text-2xl">{totalSuperlikes}</p>
            </div>
          </div>
          {userStatus && userStatus.daily_superlikes_remaining > 0 && (
            <div className="text-right">
              <p className="text-white/60 text-xs">Daily free</p>
              <p className="font-semibold">{userStatus.daily_superlikes_remaining}</p>
            </div>
          )}
        </div>
      </div>

      {/* Points Balance */}
      <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Star className="w-5 h-5 text-amber-500" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Your Points</span>
        </div>
        <span className="font-bold text-amber-600 dark:text-amber-400">
          {userStatus?.points_balance.toLocaleString() || 0}
        </span>
      </div>

      {/* Benefits */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        <div className="text-center p-3 bg-gray-50 dark:bg-neutral-900 rounded-xl">
          <Sparkles className="w-6 h-6 text-pink-500 mx-auto mb-2" />
          <p className="text-xs text-gray-600 dark:text-gray-400">3x more likely to match</p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-neutral-900 rounded-xl">
          <TrendingUp className="w-6 h-6 text-rose-500 mx-auto mb-2" />
          <p className="text-xs text-gray-600 dark:text-gray-400">Stand out instantly</p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-neutral-900 rounded-xl">
          <MessageCircle className="w-6 h-6 text-purple-500 mx-auto mb-2" />
          <p className="text-xs text-gray-600 dark:text-gray-400">Get noticed first</p>
        </div>
      </div>

      {/* Super Like Packages */}
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Get More Super Likes
      </h2>

      {superLikeItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Heart className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p>No packages available right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {superLikeItems.map((item, index) => {
            const canAffordPoints = (userStatus?.points_balance || 0) >= (item.points_cost || Infinity);
            const hasPointsPrice = item.points_cost !== null && item.points_cost > 0;
            const hasDollarPrice = item.dollar_price !== null && item.dollar_price > 0;
            const isBestValue = index === bestValueIndex && superLikeItems.length > 1;

            return (
              <div
                key={item.id}
                className={cn(
                  "relative border rounded-xl p-4 sm:p-5 bg-white dark:bg-neutral-800 transition-all",
                  isBestValue 
                    ? "border-pink-500 ring-2 ring-pink-500/20" 
                    : "border-gray-200 dark:border-neutral-700"
                )}
              >
                {/* Best Value Badge */}
                {isBestValue && (
                  <div className="absolute -top-3 left-4 px-3 py-1 bg-pink-500 text-white text-xs font-semibold rounded-full">
                    Best Value
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {item.name}
                      </h3>
                      <span className="px-2 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 text-xs font-medium rounded-full">
                        ×{item.quantity}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {item.description}
                      </p>
                    )}
                    
                    {/* Pricing */}
                    <div className="flex items-center gap-3 mt-3">
                      {hasPointsPrice && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-500" />
                          <span className="font-bold text-gray-900 dark:text-gray-100">
                            {item.points_cost?.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-500">pts</span>
                        </div>
                      )}
                      {hasPointsPrice && hasDollarPrice && (
                        <span className="text-gray-300 dark:text-gray-600">or</span>
                      )}
                      {hasDollarPrice && (
                        <div className="flex items-center gap-0.5">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <span className="font-bold text-gray-900 dark:text-gray-100">
                            {item.dollar_price?.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {hasDollarPrice && (
                        <span className="text-xs text-gray-400">
                          (${(item.dollar_price! / item.quantity).toFixed(2)}/each)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  {hasPointsPrice && (
                    <button
                      onClick={() => openPurchaseModal(item, "points")}
                      disabled={!canAffordPoints || purchasing}
                      className={cn(
                        "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                        canAffordPoints
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 active:scale-95"
                          : "bg-gray-100 dark:bg-neutral-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                      )}
                    >
                      {canAffordPoints ? "Use Points" : "Not enough points"}
                    </button>
                  )}
                  {hasDollarPrice && (
                    <button
                      onClick={() => openPurchaseModal(item, "stripe")}
                      disabled={purchasing}
                      className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 active:scale-95 transition-all"
                    >
                      Buy ${item.dollar_price?.toFixed(2)}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Earn More Points Link */}
      <div className="mt-8 text-center">
        <Link
          href="/rewards"
          className="text-sm text-pink-600 dark:text-pink-400 hover:underline"
        >
          Earn more points in the Rewards Store →
        </Link>
      </div>

      {/* Purchase Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => {
          setShowConfirm(false);
          setSelectedItem(null);
        }}
        onConfirm={handlePurchase}
        title={paymentMethod === "points" ? "Confirm Purchase" : "Continue to Checkout"}
        message={
          selectedItem
            ? paymentMethod === "points"
              ? `Use ${selectedItem.points_cost?.toLocaleString()} points to get ${selectedItem.quantity} Super Likes?`
              : `You'll be redirected to complete your purchase of "${selectedItem.name}" for $${selectedItem.dollar_price?.toFixed(2)}.`
            : ""
        }
        confirmLabel={paymentMethod === "points" ? "Get Super Likes" : "Continue to Checkout"}
        variant={paymentMethod === "points" ? "warning" : "info"}
        loading={purchasing}
      />
    </div>
  );
}
