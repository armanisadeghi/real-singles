"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Plus,
  Loader2,
  Gift,
  ShoppingBag,
  ClipboardList,
  DollarSign,
  Globe,
  Truck,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StoreItemsTab } from "@/components/admin/products/StoreItemsTab";
import { OrdersTab } from "@/components/admin/products/OrdersTab";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProductsTab = "rewards" | "store-items" | "orders";

interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  points_cost: number;
  dollar_price: number | null;
  retail_value: number | null;
  category: string | null;
  stock_quantity: number | null;
  is_active: boolean;
  is_public: boolean | null;
  requires_shipping: boolean | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const tabs: { id: ProductsTab; label: string; icon: typeof Gift }[] = [
  { id: "rewards", label: "Reward Products", icon: Gift },
  { id: "store-items", label: "Store Items", icon: ShoppingBag },
  { id: "orders", label: "Orders", icon: ClipboardList },
];

const categoryFilters = [
  { value: "all", label: "All" },
  { value: "gift_card", label: "Gift Cards" },
  { value: "experience", label: "Experiences" },
  { value: "subscription", label: "Subscriptions" },
  { value: "merchandise", label: "Merchandise" },
];

const statusFilters = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const categoryBadgeColors: Record<string, string> = {
  gift_card: "bg-amber-100 text-amber-700",
  experience: "bg-violet-100 text-violet-700",
  subscription: "bg-sky-100 text-sky-700",
  merchandise: "bg-emerald-100 text-emerald-700",
};

const categoryLabels: Record<string, string> = {
  gift_card: "Gift Card",
  experience: "Experience",
  subscription: "Subscription",
  merchandise: "Merchandise",
};

// ---------------------------------------------------------------------------
// Hub content (uses useSearchParams)
// ---------------------------------------------------------------------------

function ProductsHubContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = (searchParams.get("tab") as ProductsTab) || "rewards";

  const setTab = (tab: ProductsTab) => {
    if (tab === "rewards") {
      router.push("/admin/products");
    } else {
      router.push(`/admin/products?tab=${tab}`);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Products"
        subtitle="Manage reward products, store items, and orders"
        variant="hero"
        iconName="gift"
        iconGradient="from-rose-500 to-pink-500"
      />

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-6" aria-label="Products tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "rewards" && <RewardProductsSection />}
      {activeTab === "store-items" && <StoreItemsTab />}
      {activeTab === "orders" && <OrdersTab />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reward Products Section
// ---------------------------------------------------------------------------

function RewardProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") {
        params.set("category", categoryFilter);
      }
      if (statusFilter !== "all") {
        params.set("active", statusFilter === "active" ? "true" : "false");
      }

      const url = `/api/admin/products${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, statusFilter]);

  useEffect(() => {
    setIsLoading(true);
    fetchProducts();
  }, [fetchProducts]);

  const handleToggle = async (productId: string) => {
    setToggling(productId);
    try {
      const res = await fetch(`/api/admin/products/${productId}/toggle`, {
        method: "PATCH",
      });

      if (res.ok) {
        await fetchProducts();
      } else {
        alert("Failed to toggle product status");
      }
    } catch (err) {
      console.error("Error toggling product:", err);
      alert("Failed to toggle product status");
    } finally {
      setToggling(null);
    }
  };

  const activeCount = products.filter((p) => p.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{activeCount}</span> active
          {" / "}
          <span className="font-semibold text-slate-700">{products.length}</span> total products
        </p>
        <Link href="/admin/products/create">
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-6">
        {/* Category filter pills */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">Category</span>
          {categoryFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setCategoryFilter(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                categoryFilter === f.value
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">Status</span>
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                statusFilter === f.value
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : products.length === 0 ? (
        <div
          className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 text-center
            opacity-100 translate-y-0
            [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
            [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
        >
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No products found</h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">
            {categoryFilter !== "all" || statusFilter !== "all"
              ? "Try adjusting your filters to see more products."
              : "Add products that users can redeem with their earned points."}
          </p>
          {categoryFilter === "all" && statusFilter === "all" && (
            <Link href="/admin/products/create">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden group
                opacity-100 translate-y-0
                [transition:opacity_400ms_ease-out,transform_400ms_ease-out,box-shadow_200ms]
                [@starting-style]:opacity-0 [@starting-style]:translate-y-4
                hover:shadow-lg"
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              {product.image_url ? (
                <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <Package className="w-12 h-12 text-slate-400" />
                </div>
              )}
              <div className="p-5">
                {/* Title + Status badge */}
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
                  <span
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold rounded-full shrink-0",
                      product.is_active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {product.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Category + Flags row */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  {product.category && (
                    <span
                      className={cn(
                        "px-2 py-0.5 text-xs font-medium rounded-full",
                        categoryBadgeColors[product.category] || "bg-slate-100 text-slate-600"
                      )}
                    >
                      {categoryLabels[product.category] || product.category}
                    </span>
                  )}
                  {product.is_public && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-600">
                      <Globe className="w-3 h-3" />
                      Public
                    </span>
                  )}
                  {product.requires_shipping && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-orange-50 text-orange-600">
                      <Truck className="w-3 h-3" />
                      Shipping
                    </span>
                  )}
                </div>

                {product.description && (
                  <p className="text-slate-600 text-sm line-clamp-2 mb-4">{product.description}</p>
                )}

                {/* Pricing */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-blue-600">
                      {product.points_cost.toLocaleString()} pts
                    </span>
                    {product.dollar_price && (
                      <span className="flex items-center gap-0.5 text-sm font-medium text-green-600">
                        <DollarSign className="w-3.5 h-3.5" />
                        {Number(product.dollar_price).toFixed(2)}
                      </span>
                    )}
                  </div>
                  {product.retail_value && (
                    <span className="text-sm text-slate-500">
                      ${Number(product.retail_value).toFixed(2)} value
                    </span>
                  )}
                </div>

                {product.stock_quantity !== null && (
                  <div className="text-sm text-slate-500 mb-4">
                    <span className="font-medium">{product.stock_quantity}</span> in stock
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href={`/admin/products/${product.id}/edit`} className="flex-1">
                    <button className="w-full px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                      Edit
                    </button>
                  </Link>
                  <button
                    onClick={() => handleToggle(product.id)}
                    disabled={toggling === product.id}
                    className={cn(
                      "flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                      product.is_active
                        ? "border border-red-200 text-red-700 hover:bg-red-50"
                        : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    )}
                  >
                    {toggling === product.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : product.is_active ? (
                      "Deactivate"
                    ) : (
                      "Activate"
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page entry (wraps with Suspense for useSearchParams)
// ---------------------------------------------------------------------------

export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <ProductsHubContent />
    </Suspense>
  );
}
