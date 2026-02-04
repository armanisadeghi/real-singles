"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Package, Clock, CheckCircle, XCircle, Truck, ArrowLeft, Gift } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/LoadingSkeleton";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  product_name: string | null;
  item_name: string | null;
  image_url: string | null;
  points_spent: number;
  dollar_amount: number | null;
  payment_method: "points" | "stripe" | "both" | null;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  is_gift: boolean;
  gift_message: string | null;
  tracking_number: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string; bgColor: string }> = {
  pending: { label: "Pending", icon: Clock, color: "text-yellow-600", bgColor: "bg-yellow-50" },
  processing: { label: "Processing", icon: Package, color: "text-blue-600", bgColor: "bg-blue-50" },
  shipped: { label: "Shipped", icon: Truck, color: "text-purple-600", bgColor: "bg-purple-50" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-50" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-red-600", bgColor: "bg-red-50" },
};

function OrderCard({ order }: { order: Order }) {
  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const productName = order.product_name || order.item_name || "Unknown Item";

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm dark:shadow-black/20 overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex gap-4">
          {/* Image */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-neutral-800">
            {order.image_url ? (
              <img
                src={order.image_url}
                alt={productName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                {productName}
              </h3>
              {order.is_gift && (
                <span className="flex items-center gap-1 px-2 py-1 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded-full text-xs font-medium flex-shrink-0">
                  <Gift className="w-3 h-3" />
                  Gift
                </span>
              )}
            </div>

            {/* Payment info */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
              {order.payment_method === "points" || order.payment_method === "both" ? (
                <span>{order.points_spent?.toLocaleString()} pts</span>
              ) : null}
              {order.payment_method === "both" && <span>+</span>}
              {(order.payment_method === "stripe" || order.payment_method === "both") && order.dollar_amount ? (
                <span>${Number(order.dollar_amount).toFixed(2)}</span>
              ) : null}
            </div>

            {/* Order date */}
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Ordered {new Date(order.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Status and tracking */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2">
          <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full", status.bgColor, "dark:bg-opacity-20")}>
            <StatusIcon className={cn("w-4 h-4", status.color)} />
            <span className={cn("text-sm font-medium", status.color)}>{status.label}</span>
          </div>

          {order.tracking_number && order.status === "shipped" && (
            <a
              href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${order.tracking_number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-pink-600 dark:text-pink-400 hover:underline"
            >
              Track Package
            </a>
          )}
        </div>

        {/* Gift message */}
        {order.is_gift && order.gift_message && (
          <div className="mt-4 p-3 bg-pink-50 dark:bg-pink-900/10 rounded-lg">
            <p className="text-sm text-pink-700 dark:text-pink-300 italic">
              &ldquo;{order.gift_message}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    if (filter === "active") return ["pending", "processing", "shipped"].includes(order.status);
    if (filter === "completed") return ["delivered", "cancelled"].includes(order.status);
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/rewards"
          className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Order History</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View and track your purchases
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { value: "all", label: "All Orders" },
          { value: "active", label: "Active" },
          { value: "completed", label: "Completed" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as typeof filter)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              filter === tab.value
                ? "bg-pink-500 text-white"
                : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 rounded-xl p-4 sm:p-6">
              <div className="flex gap-4">
                <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          type="rewards"
          title={filter === "all" ? "No orders yet" : `No ${filter} orders`}
          description={
            filter === "all"
              ? "Your order history will appear here after you make a purchase"
              : `You don't have any ${filter} orders right now`
          }
          actionLabel="Browse Rewards"
          actionHref="/rewards"
        />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
