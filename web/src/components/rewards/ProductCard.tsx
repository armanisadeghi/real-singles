"use client";

import Link from "next/link";
import { Star, Gift, ShoppingBag, Sparkles, DollarSign } from "lucide-react";
import { cn, formatPoints } from "@/lib/utils";

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  category: "gift_card" | "merchandise" | "experience" | "subscription";
  points_cost: number;
  dollar_price?: number | null;
  retail_value?: number | null;
  image_url?: string | null;
  is_active?: boolean;
  in_stock?: boolean;
  stock_quantity?: number | null;
  quantity_available?: number | null;
}

interface ProductCardProps {
  product: Product;
  userPoints?: number;
  onRedeem?: (productId: string) => void;
  onBuy?: (productId: string) => void;
  loading?: boolean;
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

export function ProductCard({
  product,
  userPoints = 0,
  onRedeem,
  onBuy,
  loading = false,
}: ProductCardProps) {
  const canAffordPoints = product.points_cost && userPoints >= product.points_cost;
  const hasDollarPrice = product.dollar_price && product.dollar_price > 0;
  const hasPointsPrice = product.points_cost && product.points_cost > 0;
  const Icon = categoryIcons[product.category] || Gift;
  const isActive = product.is_active !== false;
  const inStock = product.in_stock !== false && (product.stock_quantity === null || (product.stock_quantity ?? 1) > 0);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm dark:shadow-black/20 overflow-hidden hover:shadow-md dark:hover:shadow-black/30 transition-shadow">
      {/* Image */}
      <div className="aspect-square relative">
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
            <Icon className="w-16 h-16 text-white/80" />
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium text-white",
              "bg-black/50 backdrop-blur-sm"
            )}
          >
            {product.category.replace("_", " ")}
          </span>
        </div>

        {/* Out of stock overlay */}
        {!inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <Link href={`/rewards/${product.id}`}>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-pink-600 dark:hover:text-pink-400 transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>

        {product.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Price info */}
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Points price */}
            {hasPointsPrice && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {formatPoints(product.points_cost)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">pts</span>
              </div>
            )}

            {/* Separator */}
            {hasPointsPrice && hasDollarPrice && (
              <span className="text-gray-300 dark:text-gray-600">or</span>
            )}

            {/* Dollar price */}
            {hasDollarPrice && product.dollar_price && (
              <div className="flex items-center gap-0.5">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {product.dollar_price.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {product.retail_value && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              ${product.retail_value.toFixed(2)} value
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          {hasPointsPrice && onRedeem && (
            <button
              onClick={() => onRedeem(product.id)}
              disabled={!canAffordPoints || loading || !isActive || !inStock}
              className={cn(
                "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                canAffordPoints && isActive && inStock
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 active:scale-95"
                  : "bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              )}
            >
              {loading ? "..." : canAffordPoints ? "Use Points" : "Not enough pts"}
            </button>
          )}

          {hasDollarPrice && onBuy && product.dollar_price && (
            <button
              onClick={() => onBuy(product.id)}
              disabled={loading || !isActive || !inStock}
              className={cn(
                "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                isActive && inStock
                  ? "bg-green-500 text-white hover:bg-green-600 active:scale-95"
                  : "bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              )}
            >
              {loading ? "..." : `Buy $${product.dollar_price.toFixed(2)}`}
            </button>
          )}

          {!onRedeem && !onBuy && (
            <Link
              href={`/rewards/${product.id}`}
              className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-center bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 active:scale-95 transition-all"
            >
              View Details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
