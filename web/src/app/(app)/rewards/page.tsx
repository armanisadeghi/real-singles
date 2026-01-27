"use client";

import { useState, useEffect, useCallback } from "react";
import { Gift, Star, ShoppingBag, Sparkles, History } from "lucide-react";
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
  type: "referral" | "review" | "event" | "redemption" | "admin_adjustment";
  amount: number;
  description?: string | null;
  created_at: string;
}

export default function RewardsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [showHistory, setShowHistory] = useState(false);
  const [redeemingProduct, setRedeemingProduct] = useState<Product | null>(null);
  const [redeeming, setRedeeming] = useState(false);

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

  const handleRedeem = async () => {
    if (!redeemingProduct) return;

    setRedeeming(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: redeemingProduct.id }),
      });

      if (res.ok) {
        // Refresh data
        await fetchData();
        setRedeemingProduct(null);
      } else {
        const error = await res.json();
        alert(error.message || "Failed to redeem product");
      }
    } catch (error) {
      console.error("Error redeeming product:", error);
      alert("Failed to redeem product");
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rewards Shop</h1>
          <p className="text-sm text-gray-500 mt-1">
            Redeem your points for exclusive rewards
          </p>
        </div>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
            showHistory
              ? "bg-pink-100 text-pink-700"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-4">Transaction History</h2>
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
            style={{
              touchAction: 'pan-x',
              overscrollBehaviorX: 'contain',
              WebkitOverflowScrolling: 'touch'
            }}
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
                      : "bg-white text-gray-700 hover:bg-gray-100 border"
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
                  onRedeem={() => setRedeemingProduct(product)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Redeem Confirmation Modal */}
      <ConfirmModal
        isOpen={!!redeemingProduct}
        onClose={() => setRedeemingProduct(null)}
        onConfirm={handleRedeem}
        title="Redeem Reward"
        message={
          redeemingProduct
            ? `Are you sure you want to redeem "${redeemingProduct.name}" for ${formatPoints(redeemingProduct.points_cost)} points?`
            : ""
        }
        confirmLabel="Redeem"
        variant="success"
        loading={redeeming}
      />
    </div>
  );
}
