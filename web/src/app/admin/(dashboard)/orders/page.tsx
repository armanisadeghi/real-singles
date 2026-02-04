"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  DollarSign,
  Star,
  Gift,
  Search,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  user_id: string;
  product_id: string | null;
  purchasable_item_id: string | null;
  points_spent: number;
  dollar_amount: number | null;
  payment_method: string | null;
  status: string;
  is_gift: boolean;
  gift_message: string | null;
  tracking_number: string | null;
  shipping_name: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_zip: string | null;
  created_at: string;
  product_image_url: string | null;
  users: { id: string; email: string; display_name: string | null } | null;
  products: { id: string; name: string; image_url: string | null } | null;
  purchasable_items: { id: string; name: string; image_url: string | null } | null;
  payments: { id: string; amount_cents: number; status: string; stripe_payment_intent_id: string | null } | null;
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string; bgColor: string }> = {
  pending: { label: "Pending", icon: Clock, color: "text-yellow-700", bgColor: "bg-yellow-100" },
  processing: { label: "Processing", icon: Package, color: "text-blue-700", bgColor: "bg-blue-100" },
  shipped: { label: "Shipped", icon: Truck, color: "text-purple-700", bgColor: "bg-purple-100" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "text-green-700", bgColor: "bg-green-100" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-red-700", bgColor: "bg-red-100" },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      let url = "/api/admin/orders?limit=100";
      if (statusFilter !== "all") {
        url += `&status=${statusFilter}`;
      }
      if (paymentFilter !== "all") {
        url += `&payment_method=${paymentFilter}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, paymentFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, status: string, trackingNumber?: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, tracking_number: trackingNumber }),
      });

      if (res.ok) {
        fetchOrders();
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error("Error updating order:", error);
    } finally {
      setUpdating(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const productName = order.products?.name || order.purchasable_items?.name || "";
    const userEmail = order.users?.email || "";
    const userName = order.users?.display_name || "";
    return (
      productName.toLowerCase().includes(searchLower) ||
      userEmail.toLowerCase().includes(searchLower) ||
      userName.toLowerCase().includes(searchLower) ||
      order.id.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Orders"
        subtitle="Manage customer orders and fulfillment"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(statusConfig)
          .filter(([key]) => key !== "cancelled")
          .map(([key, config]) => {
            const Icon = config.icon;
            const count = stats[key as keyof typeof stats] || 0;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={cn(
                  "p-4 rounded-xl border transition-all",
                  statusFilter === key
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", config.bgColor)}>
                    <Icon className={cn("w-5 h-5", config.color)} />
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold text-slate-900">{count}</p>
                    <p className="text-sm text-slate-500">{config.label}</p>
                  </div>
                </div>
              </button>
            );
          })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          {Object.entries(statusConfig).map(([key, config]) => (
            <option key={key} value={key}>
              {config.label}
            </option>
          ))}
        </select>

        {/* Payment Filter */}
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Payments</option>
          <option value="points">Points Only</option>
          <option value="stripe">Stripe Only</option>
          <option value="both">Points + Stripe</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-slate-500 mt-2">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No orders found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => {
                const status = statusConfig[order.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                const productName = order.products?.name || order.purchasable_items?.name || "Unknown";

                return (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {order.product_image_url ? (
                          <img
                            src={order.product_image_url}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Package className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900 line-clamp-1">
                            {productName}
                          </p>
                          <p className="text-xs text-slate-500 font-mono">
                            #{order.id.slice(0, 8)}
                          </p>
                          {order.is_gift && (
                            <span className="inline-flex items-center gap-1 text-xs text-pink-600">
                              <Gift className="w-3 h-3" />
                              Gift
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-900">
                        {order.users?.display_name || "Unknown"}
                      </p>
                      <p className="text-xs text-slate-500">{order.users?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {(order.payment_method === "points" || order.payment_method === "both") && order.points_spent > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="w-3.5 h-3.5 text-yellow-500" />
                            <span>{order.points_spent.toLocaleString()}</span>
                          </div>
                        )}
                        {(order.payment_method === "stripe" || order.payment_method === "both") && order.dollar_amount && (
                          <div className="flex items-center gap-1 text-sm">
                            <DollarSign className="w-3.5 h-3.5 text-green-500" />
                            <span>${Number(order.dollar_amount).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                          status.bgColor,
                          status.color
                        )}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={updateOrderStatus}
          updating={updating}
        />
      )}
    </div>
  );
}

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onUpdate: (orderId: string, status: string, trackingNumber?: string) => void;
  updating: boolean;
}

function OrderDetailModal({ order, onClose, onUpdate, updating }: OrderDetailModalProps) {
  const [newStatus, setNewStatus] = useState(order.status);
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || "");

  const productName = order.products?.name || order.purchasable_items?.name || "Unknown";
  const hasShipping = order.shipping_name || order.shipping_address;

  const handleSave = () => {
    onUpdate(order.id, newStatus, trackingNumber || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Order Details</h2>
              <p className="text-sm text-slate-500 font-mono">#{order.id}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Product Info */}
          <div className="flex items-start gap-4">
            {order.product_image_url ? (
              <img
                src={order.product_image_url}
                alt=""
                className="w-20 h-20 rounded-lg object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-slate-900">{productName}</h3>
              {order.is_gift && (
                <span className="inline-flex items-center gap-1 text-sm text-pink-600 mt-1">
                  <Gift className="w-4 h-4" />
                  Gift Order
                </span>
              )}
              <div className="mt-2 flex flex-wrap gap-3 text-sm">
                {order.points_spent > 0 && (
                  <span className="flex items-center gap-1 text-slate-600">
                    <Star className="w-4 h-4 text-yellow-500" />
                    {order.points_spent.toLocaleString()} points
                  </span>
                )}
                {order.dollar_amount && (
                  <span className="flex items-center gap-1 text-slate-600">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    ${Number(order.dollar_amount).toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-medium text-slate-900 mb-2">Customer</h4>
            <p className="text-slate-700">{order.users?.display_name || "Unknown"}</p>
            <p className="text-sm text-slate-500">{order.users?.email}</p>
          </div>

          {/* Shipping Info */}
          {hasShipping && (
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 mb-2">Shipping Address</h4>
              <p className="text-slate-700">{order.shipping_name}</p>
              <p className="text-sm text-slate-500">
                {order.shipping_address}
                <br />
                {order.shipping_city}, {order.shipping_state} {order.shipping_zip}
              </p>
            </div>
          )}

          {/* Gift Message */}
          {order.is_gift && order.gift_message && (
            <div className="bg-pink-50 rounded-lg p-4">
              <h4 className="font-medium text-pink-900 mb-2">Gift Message</h4>
              <p className="text-pink-700 italic">&ldquo;{order.gift_message}&rdquo;</p>
            </div>
          )}

          {/* Status Update */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Order Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            {hasShipping && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Payment Info */}
          {order.payments?.stripe_payment_intent_id && (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">Stripe Payment</span>
              <a
                href={`https://dashboard.stripe.com/payments/${order.payments.stripe_payment_intent_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                View in Stripe
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updating}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {updating ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
