"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Gift, Star, ShoppingBag, Sparkles, History, AlertCircle, CheckCircle } from "lucide-react";
import { ProductCard, Product } from "@/components/rewards/ProductCard";
import { PointsBalance, PointsHistory } from "@/components/rewards/PointsBalance";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductCardSkeleton, Skeleton } from "@/components/ui/LoadingSkeleton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { cn, formatPoints } from "@/lib/utils";

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

export default function RewardsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [showHistory, setShowHistory] = useState(false);
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
      const [productsRes, pointsRes, transactionsRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/points"),
        fetch("/api/points/transactions"),
      ]);

      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
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

        <button
          onClick={() => setShowHistory(!showHistory)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
            showHistory
              ? "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400"
              : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
          )}
        >
          <History className="w-4 h-4" />
          {showHistory ? "View Shop" : "Points History"}
        </button>
      </div>

      {/* Points Balance */}
      {loading ? (
        <Skeleton className="h-24 w-full rounded-2xl mb-6" />
      ) : (
        <PointsBalance balance={userPoints} className="mb-6" />
      )}

      {showHistory ? (
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
