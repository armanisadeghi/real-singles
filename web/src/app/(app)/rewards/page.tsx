"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Gift, Star, ShoppingBag, Sparkles, History, AlertCircle, CheckCircle, Zap, Heart, Package } from "lucide-react";
import { ProductCard, Product } from "@/components/rewards/ProductCard";
import { PointsBalance, PointsHistory } from "@/components/rewards/PointsBalance";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductCardSkeleton, Skeleton } from "@/components/ui/LoadingSkeleton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { cn, formatPoints } from "@/lib/utils";

type ViewMode = "shop" | "powerups" | "history";
type Category = "all" | "gift_card" | "merchandise" | "experience" | "subscription";

const categories: { value: Category; label: string; icon: typeof Gift }[] = [
  { value: "all", label: "All", icon: Gift },
  { value: "gift_card", label: "Gift Cards", icon: Gift },
  { value: "merchandise", label: "Merchandise", icon: ShoppingBag },
  { value: "experience", label: "Experiences", icon: Sparkles },
  { value: "subscription", label: "Subscriptions", icon: Star },
];

interface PointsTransaction {
  id: string;
  type: "referral" | "review" | "event" | "redemption" | "admin_adjustment" | "purchase";
  amount: number;
  description?: string | null;
  created_at: string;
}

interface DigitalItem {
  id: string;
  item_type: string;
  name: string;
  description: string | null;
  quantity: number;
  dollar_price: number | null;
  points_cost: number | null;
  is_active: boolean;
}

export default function RewardsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [digitalItems, setDigitalItems] = useState<DigitalItem[]>([]);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("shop");
  const [redeemingProduct, setRedeemingProduct] = useState<Product | null>(null);
  const [buyingProduct, setBuyingProduct] = useState<Product | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Check for checkout canceled parameter
  useEffect(() => {
    if (searchParams.get("canceled") === "true") {
      setMessage({ type: "error", text: "Checkout was canceled. Your order was not placed." });
      // Clear the parameter from URL
      window.history.replaceState({}, "", "/rewards");
    }
  }, [searchParams]);

  const fetchData = useCallback(async () => {
    try {
      const [productsRes, digitalRes, pointsRes, transactionsRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/store/items?type=digital"),
        fetch("/api/points"),
        fetch("/api/points/transactions"),
      ]);

      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }

      if (digitalRes.ok) {
        const data = await digitalRes.json();
        setDigitalItems(data.data?.filter((item: DigitalItem) => item.is_active) || []);
      }

      if (pointsRes.ok) {
        const data = await pointsRes.json();
        setUserPoints(data.balance || 0);
      }

      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching rewards data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle points-based redemption
  const handleRedeem = async () => {
    if (!redeemingProduct) return;

    setRedeeming(true);
    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ type: "product", id: redeemingProduct.id, quantity: 1 }],
          paymentMethod: "points",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ type: "success", text: `Successfully redeemed ${redeemingProduct.name}!` });
        await fetchData();
        setRedeemingProduct(null);
      } else {
        setMessage({ type: "error", text: data.msg || "Failed to redeem product" });
      }
    } catch (error) {
      console.error("Error redeeming product:", error);
      setMessage({ type: "error", text: "Failed to redeem product" });
    } finally {
      setRedeeming(false);
    }
  };

  // Handle Stripe-based purchase
  const handleBuy = async () => {
    if (!buyingProduct) return;

    setRedeeming(true);
    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ type: "product", id: buyingProduct.id, quantity: 1 }],
          paymentMethod: "stripe",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.data.url;
      } else {
        setMessage({ type: "error", text: data.msg || "Failed to create checkout session" });
        setBuyingProduct(null);
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      setMessage({ type: "error", text: "Failed to create checkout session" });
      setBuyingProduct(null);
    } finally {
      setRedeeming(false);
    }
  };

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Message Banner */}
      {message && (
        <div
          className={cn(
            "flex items-center gap-3 p-4 rounded-xl mb-6",
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
          )}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="flex-1">{message.text}</p>
          <button
            onClick={() => setMessage(null)}
            className="text-current opacity-60 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Rewards Shop</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Redeem your points or purchase exclusive rewards
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("shop")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
              viewMode === "shop"
                ? "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400"
                : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
            )}
          >
            <ShoppingBag className="w-4 h-4" />
            Shop
          </button>
          <button
            onClick={() => setViewMode("powerups")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
              viewMode === "powerups"
                ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
            )}
          >
            <Zap className="w-4 h-4" />
            Power-Ups
          </button>
          <button
            onClick={() => setViewMode("history")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
              viewMode === "history"
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
            )}
          >
            <History className="w-4 h-4" />
            History
          </button>
        </div>
      </div>

      {/* Points Balance */}
      {loading ? (
        <Skeleton className="h-24 w-full rounded-2xl mb-6" />
      ) : (
        <PointsBalance balance={userPoints} className="mb-6" />
      )}

      {viewMode === "history" ? (
        /* Points History View */
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm dark:shadow-black/20 p-4">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Transaction History</h2>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <PointsHistory transactions={transactions} />
          )}
        </div>
      ) : viewMode === "powerups" ? (
        /* Power-Ups View */
        <div className="space-y-6">
          {/* Quick Links to dedicated pages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/boost"
              className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-1">Profile Boost</h3>
                <p className="text-white/80 text-sm">Get seen by 10x more people</p>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-125" />
            </Link>
            
            <Link
              href="/superlikes"
              className="group relative overflow-hidden bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl p-6 text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 fill-white" />
                </div>
                <h3 className="text-xl font-bold mb-1">Super Likes</h3>
                <p className="text-white/80 text-sm">Stand out from the crowd</p>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-125" />
            </Link>
          </div>

          {/* All Digital Items */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              All Power-Ups
            </h2>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-xl" />
                ))}
              </div>
            ) : digitalItems.length === 0 ? (
              <EmptyState
                type="rewards"
                title="No power-ups available"
                description="Check back later for new power-ups"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {digitalItems.map((item) => {
                  const canAffordPoints = userPoints >= (item.points_cost || Infinity);
                  const hasPointsPrice = item.points_cost !== null && item.points_cost > 0;
                  const hasDollarPrice = item.dollar_price !== null && item.dollar_price > 0;
                  const itemIcon = item.item_type === "boost" ? Zap : 
                                   item.item_type === "superlike_pack" ? Heart :
                                   item.item_type === "points_pack" ? Star : Package;
                  const ItemIcon = itemIcon;
                  const gradientClass = item.item_type === "boost" ? "from-purple-500/20 to-pink-500/20" :
                                        item.item_type === "superlike_pack" ? "from-pink-500/20 to-rose-500/20" :
                                        "from-amber-500/20 to-orange-500/20";
                  const iconColor = item.item_type === "boost" ? "text-purple-500" :
                                    item.item_type === "superlike_pack" ? "text-pink-500" :
                                    "text-amber-500";

                  return (
                    <div
                      key={item.id}
                      className="border border-gray-200 dark:border-neutral-700 rounded-xl p-4 bg-white dark:bg-neutral-800"
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0", gradientClass)}>
                          <ItemIcon className={cn("w-5 h-5", iconColor, item.item_type === "superlike_pack" && "fill-pink-500")} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="flex items-center gap-2 mt-3">
                        {hasPointsPrice && (
                          <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                            {item.points_cost?.toLocaleString()} pts
                          </span>
                        )}
                        {hasPointsPrice && hasDollarPrice && (
                          <span className="text-gray-300 dark:text-gray-600 text-xs">or</span>
                        )}
                        {hasDollarPrice && (
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                            ${item.dollar_price?.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        {hasPointsPrice && (
                          <Link
                            href={item.item_type === "boost" ? "/boost" : item.item_type === "superlike_pack" ? "/superlikes" : "/rewards"}
                            className={cn(
                              "flex-1 px-3 py-2 rounded-lg text-xs font-medium text-center transition-colors",
                              canAffordPoints
                                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50"
                                : "bg-gray-100 dark:bg-neutral-700 text-gray-400 dark:text-gray-500"
                            )}
                          >
                            {canAffordPoints ? "Use Points" : "Need more pts"}
                          </Link>
                        )}
                        {hasDollarPrice && (
                          <Link
                            href={item.item_type === "boost" ? "/boost" : item.item_type === "superlike_pack" ? "/superlikes" : "/rewards"}
                            className="flex-1 px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-medium text-center hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                          >
                            Buy
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Shop View */
        <>
          {/* Category Tabs */}
          <div
            className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide"
          >
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm"
                      : "bg-white dark:bg-neutral-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              type="rewards"
              title="No products available"
              description="Check back later for new rewards"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  userPoints={userPoints}
                  onRedeem={product.points_cost ? () => setRedeemingProduct(product) : undefined}
                  onBuy={product.dollar_price ? () => setBuyingProduct(product) : undefined}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Redeem with Points Confirmation Modal */}
      <ConfirmModal
        isOpen={!!redeemingProduct}
        onClose={() => setRedeemingProduct(null)}
        onConfirm={handleRedeem}
        title="Redeem with Points"
        message={
          redeemingProduct
            ? `Are you sure you want to redeem "${redeemingProduct.name}" for ${formatPoints(redeemingProduct.points_cost)} points?`
            : ""
        }
        confirmLabel="Redeem"
        variant="success"
        loading={redeeming}
      />

      {/* Buy with Stripe Confirmation Modal */}
      <ConfirmModal
        isOpen={!!buyingProduct}
        onClose={() => setBuyingProduct(null)}
        onConfirm={handleBuy}
        title="Purchase with Card"
        message={
          buyingProduct
            ? `You will be redirected to complete your purchase of "${buyingProduct.name}" for $${buyingProduct.dollar_price?.toFixed(2) || "0.00"}.`
            : ""
        }
        confirmLabel="Continue to Checkout"
        variant="info"
        loading={redeeming}
      />
    </div>
  );
}
