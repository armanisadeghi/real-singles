import Link from "next/link";
import Image from "next/image";
import { Gift, Star, ShoppingBag, Sparkles, ArrowRight, CheckCircle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveStorageUrl } from "@/lib/supabase/url-utils";

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
}

const categoryIcons: Record<string, typeof Gift> = {
  gift_card: Gift,
  merchandise: ShoppingBag,
  experience: Sparkles,
  subscription: Star,
};

const categoryColors: Record<string, string> = {
  gift_card: "from-green-400 to-emerald-600",
  merchandise: "from-blue-400 to-indigo-600",
  experience: "from-purple-400 to-pink-600",
  subscription: "from-orange-400 to-red-600",
};

async function getPublicProducts(): Promise<Product[]> {
  const supabase = createAdminClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, description, image_url, points_cost, dollar_price, retail_value, category, stock_quantity")
    .eq("is_active", true)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error || !products) {
    console.error("Error fetching public products:", error);
    return [];
  }

  // Resolve image URLs
  const productsWithUrls = await Promise.all(
    products.map(async (product) => ({
      ...product,
      image_url: product.image_url
        ? await resolveStorageUrl(supabase, product.image_url, { bucket: "products" })
        : null,
    }))
  );

  return productsWithUrls;
}

function ProductCard({ product }: { product: Product }) {
  const categoryKey = product.category || "gift_card";
  const Icon = categoryIcons[categoryKey] || Gift;
  const colorClass = categoryColors[categoryKey] || "from-pink-400 to-purple-600";
  const inStock = product.stock_quantity === null || product.stock_quantity > 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
      {/* Image */}
      <div className="aspect-square relative">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${colorClass}`}
          >
            <Icon className="w-16 h-16 text-white/80" />
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 rounded-full text-xs font-medium text-white bg-black/40 backdrop-blur-sm capitalize">
            {(product.category || "gift_card").replace("_", " ")}
          </span>
        </div>

        {/* Out of stock */}
        {!inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-lg text-gray-900 group-hover:text-pink-600 transition-colors line-clamp-1">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-sm text-gray-500 mt-2 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Pricing */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {product.points_cost > 0 && (
            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold text-yellow-700">
                {product.points_cost.toLocaleString()}
              </span>
              <span className="text-xs text-yellow-600">pts</span>
            </div>
          )}

          {product.points_cost > 0 && product.dollar_price && (
            <span className="text-gray-300">or</span>
          )}

          {product.dollar_price && (
            <span className="font-semibold text-green-600">
              ${product.dollar_price.toFixed(2)}
            </span>
          )}
        </div>

        {product.retail_value && (
          <p className="text-xs text-gray-400 mt-2">
            ${product.retail_value.toFixed(2)} retail value
          </p>
        )}
      </div>
    </div>
  );
}

export default async function PublicStorePage() {
  const products = await getPublicProducts();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              RealSingles Rewards Store
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Earn points by being active in our community and redeem them for amazing rewards.
              From gift cards to exclusive experiences, we have something for everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-pink-600 rounded-full font-semibold hover:bg-pink-50 transition-colors"
              >
                Join Now to Start Earning
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/20 text-white rounded-full font-semibold hover:bg-white/30 transition-colors backdrop-blur-sm"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How to Earn Points
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { title: "Sign Up", desc: "Create your account and complete your profile", points: "100 pts" },
              { title: "Refer Friends", desc: "Invite friends who sign up and complete their profile", points: "500 pts" },
              { title: "Attend Events", desc: "Join our singles events and speed dating sessions", points: "50-200 pts" },
              { title: "Write Reviews", desc: "Share your experience with the community", points: "25-100 pts" },
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-6 text-center shadow-sm">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-pink-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 mb-3">{item.desc}</p>
                <span className="inline-flex items-center gap-1 text-yellow-600 font-semibold">
                  <Star className="w-4 h-4 fill-yellow-500" />
                  {item.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Featured Rewards
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Browse our selection of rewards. Sign up to redeem with points or purchase directly.
            </p>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16">
              <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Coming Soon
              </h3>
              <p className="text-gray-500">
                Our rewards store is being stocked with amazing products. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="text-center mt-12">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-semibold hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              Sign Up to Unlock All Rewards
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            Join thousands of singles who are earning rewards while finding meaningful connections.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-pink-500 text-white rounded-full font-semibold hover:bg-pink-600 transition-colors"
            >
              Create Free Account
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition-colors"
            >
              Learn More About RealSingles
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
