import { createAdminClient } from "@/lib/supabase/admin";

async function getProducts() {
  const supabase = createAdminClient();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return products || [];
}

export default async function AdminProductsPage() {
  const products = await getProducts();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reward Products</h1>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
          Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden">
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-gray-600 text-sm mt-1">{product.description}</p>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-lg font-bold text-indigo-600">
                  {product.points_cost} points
                </span>
                {product.retail_value && (
                  <span className="text-sm text-gray-500">
                    ${product.retail_value} value
                  </span>
                )}
              </div>
              {product.stock_quantity !== null && (
                <div className="mt-2 text-sm text-gray-500">
                  Stock: {product.stock_quantity}
                </div>
              )}
              <div className="mt-4 flex space-x-2">
                <button className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
                  Edit
                </button>
                <button className="px-3 py-1 border border-red-300 text-red-700 text-sm rounded hover:bg-red-50">
                  {product.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
