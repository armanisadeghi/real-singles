"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, ArrowRight, Loader2 } from "lucide-react";

interface OrderDetails {
  orderId: string;
  productName: string;
  amount: number;
  status: string;
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID found");
      setLoading(false);
      return;
    }

    // Verify the checkout session
    const verifySession = async () => {
      try {
        const res = await fetch(`/api/checkout/success?session_id=${sessionId}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setOrderDetails(data.data);
        } else {
          setError(data.msg || "Could not verify your order");
        }
      } catch (err) {
        console.error("Error verifying session:", err);
        setError("Could not verify your order");
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-pink-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Confirming your order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Order Status Unknown
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {error}. Don&apos;t worry - if your payment was successful, you&apos;ll see the order in your history.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/orders"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-xl font-medium hover:bg-pink-600 transition-colors"
            >
              View Orders
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/rewards"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
            >
              Back to Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md mx-auto text-center">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-once">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Order Confirmed!
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Thank you for your purchase. Your order has been successfully placed.
        </p>

        {orderDetails && (
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 mb-8 text-left shadow-sm dark:shadow-black/20">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Order Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Order ID</span>
                <span className="font-mono text-gray-900 dark:text-gray-100">
                  {orderDetails.orderId.slice(0, 8)}...
                </span>
              </div>
              {orderDetails.productName && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Item</span>
                  <span className="text-gray-900 dark:text-gray-100">{orderDetails.productName}</span>
                </div>
              )}
              {orderDetails.amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Amount Paid</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    ${(orderDetails.amount / 100).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                  {orderDetails.status}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/orders"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-xl font-medium hover:bg-pink-600 transition-colors"
          >
            View Orders
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/rewards"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
