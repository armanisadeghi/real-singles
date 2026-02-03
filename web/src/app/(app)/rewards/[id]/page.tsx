"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, Gift, ShoppingBag, Sparkles, Check } from "lucide-react";
import { PointsBalance } from "@/components/rewards/PointsBalance";
import { Skeleton } from "@/components/ui/LoadingSkeleton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { cn, formatPoints } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  category: "gift_card" | "merchandise" | "experience" | "subscription";
  points_cost: number;
  retail_value?: number | null;
  image_url?: string | null;
  is_active: boolean;
  quantity_available?: number | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

const categoryIcons = {
  gift_card: Gift,
  merchandise: ShoppingBag,
  experience: Sparkles,
  subscription: Star,
};

const categoryColors = {
  gift_card: "from-green-400 to-emerald-600",
  merchandise: "from-blue-400 to-indigo-600",
  experience: "from-purple-400 to-pink-600",
  subscription: "from-orange-400 to-red-600",
};

export default function ProductDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [productRes, pointsRes] = await Promise.all([
        fetch(`/api/products/${id}`),
        fetch("/api/points"),
      ]);

      if (productRes.ok) {
        const data = await productRes.json();
        setProduct(data.product);
      }

      if (pointsRes.ok) {
        const data = await pointsRes.json();
        setUserPoints(data.balance || 0);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRedeem = async () => {
    if (!product) return;

    setRedeeming(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id }),
      });

      if (res.ok) {
        setRedeemed(true);
        setShowConfirm(false);
        // Refresh points
        const pointsRes = await fetch("/api/points");
        if (pointsRes.ok) {
          const data = await pointsRes.json();
          setUserPoints(data.balance || 0);
        }
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Product Not Found
        </h1>
        <Link
          href="/rewards"
          className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 font-medium"
        >
          Back to Rewards Shop
        </Link>
      </div>
    );
  }

  const Icon = categoryIcons[product.category] || Gift;
  const canAfford = userPoints >= product.points_cost;
  const inStock =
    product.quantity_available == null || product.quantity_available > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Success message */}
      {redeemed && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
            <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="font-medium text-green-800 dark:text-green-300">Successfully Redeemed!</p>
            <p className="text-sm text-green-600 dark:text-green-400">
              Check your email for redemption details.
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="aspect-square rounded-xl overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={cn(
                "w-full h-full flex items-center justify-center bg-gradient-to-br",
                categoryColors[product.category]
              )}
            >
              <Icon className="w-24 h-24 text-white/80" />
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="mb-4">
            <span
              className={cn(
                "inline-block px-3 py-1 rounded-full text-sm font-medium",
                "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300"
              )}
            >
              {product.category.replace("_", " ")}
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {product.name}
          </h1>

          <div className="flex items-center gap-2 mb-4">
            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatPoints(product.points_cost)}
            </span>
            <span className="text-gray-500 dark:text-gray-400">points</span>
          </div>

          {product.retail_value && (
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Retail value: ${product.retail_value.toFixed(2)}
            </p>
          )}

          {product.description && (
            <p className="text-gray-600 dark:text-gray-400 mb-6">{product.description}</p>
          )}

          {/* Stock status */}
          {product.quantity_available !== null && (
            <p
              className={cn(
                "text-sm font-medium mb-4",
                inStock ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}
            >
              {inStock
                ? `${product.quantity_available} in stock`
                : "Out of stock"}
            </p>
          )}

          {/* Points balance */}
          <PointsBalance balance={userPoints} size="sm" className="mb-6" />

          {/* Redeem button */}
          <button
            onClick={() => setShowConfirm(true)}
            disabled={!canAfford || !inStock || !product.is_active || redeemed}
            className={cn(
              "w-full py-3 rounded-xl font-semibold text-lg transition-all",
              canAfford && inStock && product.is_active && !redeemed
                ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 shadow-lg hover:shadow-xl active:scale-[0.98]"
                : "bg-gray-200 dark:bg-neutral-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            )}
          >
            {redeemed
              ? "Already Redeemed"
              : !inStock
              ? "Out of Stock"
              : !canAfford
              ? `Need ${formatPoints(product.points_cost - userPoints)} more points`
              : "Redeem Now"}
          </button>

          {!canAfford && !redeemed && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3">
              Earn more points by referring friends, leaving reviews, and
              attending events!
            </p>
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleRedeem}
        title="Confirm Redemption"
        message={`You're about to redeem "${product.name}" for ${formatPoints(product.points_cost)} points. This action cannot be undone.`}
        confirmLabel="Redeem"
        variant="success"
        loading={redeeming}
      />
    </div>
  );
}
