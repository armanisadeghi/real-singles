"use client";

import { Star, TrendingUp, Gift, Calendar, Users } from "lucide-react";
import { cn, formatPoints } from "@/lib/utils";

interface PointsBalanceProps {
  balance: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function PointsBalance({
  balance,
  className,
  size = "md",
}: PointsBalanceProps) {
  const sizes = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const textSizes = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-4xl",
  };

  return (
    <div
      className={cn(
        "bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-2xl text-white",
        sizes[size],
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "rounded-full bg-white/20 flex items-center justify-center",
            iconSizes[size]
          )}
        >
          <Star
            className={cn(
              "text-white",
              size === "sm" ? "w-4 h-4" : size === "md" ? "w-6 h-6" : "w-8 h-8"
            )}
          />
        </div>
        <div>
          <p className="text-white/80 text-sm font-medium">Your Points</p>
          <p className={cn("font-bold", textSizes[size])}>
            {formatPoints(balance)}
          </p>
        </div>
      </div>
    </div>
  );
}

interface PointsHistoryItem {
  id: string;
  type: "referral" | "review" | "event" | "redemption" | "admin_adjustment" | "purchase" | "subscription_bonus" | "daily_login" | "profile_completion" | "first_match";
  amount: number;
  description?: string | null;
  created_at: string;
}

interface PointsHistoryProps {
  transactions: PointsHistoryItem[];
}

const transactionConfig: Record<string, { icon: typeof Users; color: string; bg: string }> = {
  referral: { icon: Users, color: "text-green-500 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30" },
  review: { icon: Star, color: "text-yellow-500 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
  event: { icon: Calendar, color: "text-purple-500 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30" },
  redemption: { icon: Gift, color: "text-pink-500 dark:text-pink-400", bg: "bg-pink-100 dark:bg-pink-900/30" },
  admin_adjustment: { icon: TrendingUp, color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
  purchase: { icon: Gift, color: "text-green-500 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30" },
  subscription_bonus: { icon: Star, color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
  daily_login: { icon: Calendar, color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
  profile_completion: { icon: Users, color: "text-teal-500 dark:text-teal-400", bg: "bg-teal-100 dark:bg-teal-900/30" },
  first_match: { icon: Users, color: "text-pink-500 dark:text-pink-400", bg: "bg-pink-100 dark:bg-pink-900/30" },
};

export function PointsHistory({ transactions }: PointsHistoryProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Star className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
        <p>No transactions yet</p>
        <p className="text-sm mt-1">
          Earn points by referring friends, leaving reviews, and more!
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-neutral-700">
      {transactions.map((tx) => {
        const config = transactionConfig[tx.type] || transactionConfig.referral;
        const Icon = config.icon;
        const isPositive = tx.amount > 0;

        return (
          <div key={tx.id} className="flex items-center gap-4 py-3">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                config.bg
              )}
            >
              <Icon className={cn("w-5 h-5", config.color)} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                {tx.type.replace("_", " ")}
              </p>
              {tx.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{tx.description}</p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {new Date(tx.created_at).toLocaleDateString()}
              </p>
            </div>

            <div
              className={cn(
                "font-bold shrink-0",
                isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}
            >
              {isPositive ? "+" : ""}
              {formatPoints(tx.amount)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
