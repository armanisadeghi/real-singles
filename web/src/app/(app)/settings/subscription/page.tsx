"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Crown,
  Star,
  Check,
  Sparkles,
  Loader2,
  ExternalLink,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  dollar_price_monthly: number;
  dollar_price_yearly: number | null;
  tier_level: number;
  features: Record<string, number | boolean>;
}

interface SubscriptionData {
  currentTier: string;
  expiresAt: string | null;
  subscription: {
    id: string;
    status: string;
    billing_interval: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    subscription_plans: SubscriptionPlan;
  } | null;
  plans: SubscriptionPlan[];
}

const planIcons: Record<string, typeof Star> = {
  free: Star,
  premium: Crown,
  vip: Sparkles,
};

const planColors: Record<string, string> = {
  free: "from-gray-400 to-gray-600",
  premium: "from-pink-500 to-purple-600",
  vip: "from-yellow-400 to-orange-500",
};

const featureLabels: Record<string, string> = {
  likes_per_day: "Likes per day",
  superlikes_per_day: "Super likes per day",
  can_see_likes: "See who likes you",
  can_rewind: "Rewind last swipe",
  boosts_per_month: "Profile boosts per month",
  read_receipts: "Read receipts",
  priority_likes: "Priority likes",
  matchmaker_access: "Matchmaker access",
};

function formatFeatureValue(value: number | boolean): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === -1) return "Unlimited";
  return value.toString();
}

export default function SubscriptionSettingsPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Check for success/canceled parameters
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setMessage({ type: "success", text: "Your subscription has been activated!" });
      window.history.replaceState({}, "", "/settings/subscription");
    } else if (searchParams.get("canceled") === "true") {
      setMessage({ type: "error", text: "Subscription checkout was canceled." });
      window.history.replaceState({}, "", "/settings/subscription");
    }
  }, [searchParams]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/subscriptions");
      if (res.ok) {
        const result = await res.json();
        setData(result.data);
      }
    } catch (error) {
      console.error("Error fetching subscription data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubscribe = async (planId: string) => {
    setSubscribing(planId);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingInterval }),
      });

      const result = await res.json();

      if (res.ok && result.success && result.data?.url) {
        window.location.href = result.data.url;
      } else {
        setMessage({ type: "error", text: result.msg || "Failed to start checkout" });
      }
    } catch (error) {
      console.error("Subscription error:", error);
      setMessage({ type: "error", text: "Failed to start checkout" });
    } finally {
      setSubscribing(null);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/subscriptions/portal", {
        method: "POST",
      });

      const result = await res.json();

      if (res.ok && result.success && result.data?.url) {
        window.location.href = result.data.url;
      } else {
        setMessage({ type: "error", text: result.msg || "Failed to open subscription portal" });
      }
    } catch (error) {
      console.error("Portal error:", error);
      setMessage({ type: "error", text: "Failed to open subscription portal" });
    } finally {
      setPortalLoading(false);
    }
  };

  const currentPlan = data?.plans.find(
    (p) => p.name.toLowerCase() === data.currentTier?.toLowerCase()
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/settings"
          className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Subscription</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your subscription plan
          </p>
        </div>
      </div>

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

      {loading ? (
        <div className="space-y-6">
          <div className="h-32 bg-gray-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-gray-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Current Plan */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm dark:shadow-black/20 p-6 mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Current Plan
                </h2>
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = planIcons[data?.currentTier || "free"] || Star;
                    const colorClass = planColors[data?.currentTier || "free"] || planColors.free;
                    return (
                      <div className={cn("p-2 rounded-lg bg-gradient-to-br text-white", colorClass)}>
                        <Icon className="w-5 h-5" />
                      </div>
                    );
                  })()}
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 capitalize">
                    {data?.currentTier || "Free"}
                  </span>
                </div>

                {data?.subscription && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {data.subscription.cancel_at_period_end ? (
                      <span className="text-yellow-600 dark:text-yellow-400">
                        Cancels on{" "}
                        {new Date(data.subscription.current_period_end).toLocaleDateString()}
                      </span>
                    ) : (
                      <>
                        Renews{" "}
                        {new Date(data.subscription.current_period_end).toLocaleDateString()}
                        {" · "}
                        {data.subscription.billing_interval === "year" ? "Yearly" : "Monthly"}
                      </>
                    )}
                  </p>
                )}
              </div>

              {data?.subscription && (
                <button
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-neutral-800 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  {portalLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  Manage
                </button>
              )}
            </div>
          </div>

          {/* Billing Interval Toggle */}
          {data?.currentTier === "free" && (
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center bg-gray-100 dark:bg-neutral-800 rounded-full p-1">
                <button
                  onClick={() => setBillingInterval("month")}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                    billingInterval === "month"
                      ? "bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 shadow-sm"
                      : "text-gray-600 dark:text-gray-400"
                  )}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingInterval("year")}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                    billingInterval === "year"
                      ? "bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 shadow-sm"
                      : "text-gray-600 dark:text-gray-400"
                  )}
                >
                  Yearly
                  <span className="ml-1 text-green-600 dark:text-green-400">Save 50%</span>
                </button>
              </div>
            </div>
          )}

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data?.plans.map((plan) => {
              const Icon = planIcons[plan.name.toLowerCase()] || Star;
              const colorClass = planColors[plan.name.toLowerCase()] || planColors.free;
              const isCurrentPlan = plan.name.toLowerCase() === data.currentTier;
              const price = billingInterval === "year" && plan.dollar_price_yearly
                ? plan.dollar_price_yearly / 12
                : plan.dollar_price_monthly;

              return (
                <div
                  key={plan.id}
                  className={cn(
                    "bg-white dark:bg-neutral-900 rounded-xl shadow-sm dark:shadow-black/20 overflow-hidden",
                    isCurrentPlan && "ring-2 ring-pink-500"
                  )}
                >
                  {/* Plan Header */}
                  <div className={cn("p-6 bg-gradient-to-br text-white", colorClass)}>
                    <Icon className="w-8 h-8 mb-2" />
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-sm opacity-90 mt-1">{plan.description}</p>
                    )}
                    <div className="mt-4">
                      <span className="text-3xl font-bold">${price.toFixed(2)}</span>
                      <span className="text-sm opacity-80">/mo</span>
                      {billingInterval === "year" && plan.dollar_price_yearly && (
                        <p className="text-xs opacity-75 mt-1">
                          Billed ${plan.dollar_price_yearly.toFixed(2)}/year
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="p-6">
                    <ul className="space-y-3">
                      {Object.entries(plan.features).map(([key, value]) => (
                        <li key={key} className="flex items-center gap-2 text-sm">
                          <Check
                            className={cn(
                              "w-4 h-4 flex-shrink-0",
                              value ? "text-green-500" : "text-gray-300"
                            )}
                          />
                          <span className="text-gray-700 dark:text-gray-300">
                            {featureLabels[key] || key}:{" "}
                            <span className="font-medium">
                              {formatFeatureValue(value)}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Action Button */}
                    <div className="mt-6">
                      {isCurrentPlan ? (
                        <button
                          disabled
                          className="w-full py-3 rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 font-medium cursor-not-allowed"
                        >
                          Current Plan
                        </button>
                      ) : plan.dollar_price_monthly === 0 ? (
                        <button
                          disabled
                          className="w-full py-3 rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 font-medium cursor-not-allowed"
                        >
                          Free
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSubscribe(plan.id)}
                          disabled={!!subscribing}
                          className={cn(
                            "w-full py-3 rounded-lg font-medium transition-all",
                            "bg-gradient-to-r",
                            colorClass,
                            "text-white hover:opacity-90 active:scale-98 disabled:opacity-50"
                          )}
                        >
                          {subscribing === plan.id ? (
                            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                          ) : currentPlan && currentPlan.tier_level > plan.tier_level ? (
                            "Downgrade"
                          ) : (
                            "Upgrade"
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
