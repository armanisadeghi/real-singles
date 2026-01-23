"use client";

import Link from "next/link";
import { Star, Gift, ShoppingBag, Sparkles } from "lucide-react";
import { cn, formatPoints } from "@/lib/utils";

export interface Product {
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

interface ProductCardProps {
  product: Product;
  userPoints?: number;
  onRedeem?: (productId: string) => void;
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
  loading = false,
}: ProductCardProps) {
  const canAfford = userPoints >= product.points_cost;
  const Icon = categoryIcons[product.category] || Gift;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
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
        {product.quantity_available !== null &&
          product.quantity_available <= 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Out of Stock</span>
            </div>
          )}
      </div>

      {/* Content */}
      <div className="p-4">
        <Link href={`/rewards/${product.id}`}>
          <h3 className="font-semibold text-gray-900 hover:text-pink-600 transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>

        {product.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Price info */}
        <div className="flex items-center justify-between mt-4">
          <div>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-bold text-gray-900">
                {formatPoints(product.points_cost)}
              </span>
              <span className="text-sm text-gray-500">pts</span>
            </div>
            {product.retail_value && (
              <p className="text-xs text-gray-400 mt-0.5">
                ${product.retail_value.toFixed(2)} value
              </p>
            )}
          </div>

          {onRedeem && (
            <button
              onClick={() => onRedeem(product.id)}
              disabled={!canAfford || loading || !product.is_active}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                canAfford && product.is_active
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 active:scale-95"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              {loading ? "..." : canAfford ? "Redeem" : "Not enough pts"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
