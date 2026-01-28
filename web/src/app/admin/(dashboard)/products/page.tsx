import { createAdminClient } from "@/lib/supabase/admin";
import { Package, Plus } from "lucide-react";
import { AdminPageHeader, AdminLinkButton } from "@/components/admin/AdminPageHeader";

interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  points_cost: number;
  retail_value: number | null;
  stock_quantity: number | null;
  is_active: boolean;
}

async function getProducts(): Promise<Product[]> {
  const supabase = createAdminClient();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return (products || []) as Product[];
}

export default async function AdminProductsPage() {
  const products = await getProducts();
  const activeCount = products.filter((p) => p.is_active).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Reward Products"
        subtitle="Manage products users can redeem with points"
        variant="hero"
        iconName="gift"
        iconGradient="from-rose-500 to-pink-500"
        stat={{
          value: activeCount,
          label: "Active Products",
        }}
      >
        <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors">
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </AdminPageHeader>

      {products.length === 0 ? (
        <div 
          className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 text-center
            opacity-100 translate-y-0
            [transition:opacity_400ms_ease-out,transform_400ms_ease-out]
            [@starting-style]:opacity-0 [@starting-style]:translate-y-4"
        >
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No products yet</h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">
            Add products that users can redeem with their earned points.
          </p>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            Add Product
          </button>
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
                <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <Package className="w-12 h-12 text-slate-400" />
                </div>
              )}
              <div className="p-5">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full shrink-0 ${
                    product.is_active 
                      ? "bg-emerald-100 text-emerald-800" 
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    {product.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                {product.description && (
                  <p className="text-slate-600 text-sm line-clamp-2 mb-4">{product.description}</p>
                )}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold text-blue-600">
                    {product.points_cost.toLocaleString()} pts
                  </span>
                  {product.retail_value && (
                    <span className="text-sm text-slate-500">
                      ${product.retail_value.toFixed(2)} value
                    </span>
                  )}
                </div>
                {product.stock_quantity !== null && (
                  <div className="text-sm text-slate-500 mb-4">
                    <span className="font-medium">{product.stock_quantity}</span> in stock
                  </div>
                )}
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                    Edit
                  </button>
                  <button className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    product.is_active 
                      ? "border border-red-200 text-red-700 hover:bg-red-50" 
                      : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  }`}>
                    {product.is_active ? "Deactivate" : "Activate"}
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
