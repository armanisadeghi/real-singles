"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Upload, X, Package } from "lucide-react";
import { AdminPageHeader, AdminButton } from "@/components/admin/AdminPageHeader";
import { IMAGE_ACCEPT_STRING } from "@/lib/supabase/storage";

interface ProductFormData {
  name: string;
  description: string;
  points_cost: string;
  dollar_price: string;
  retail_value: string;
  category: string;
  stock_quantity: string;
  is_active: boolean;
  is_public: boolean;
  requires_shipping: boolean;
}

export default function AdminCreateProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    points_cost: "",
    dollar_price: "",
    retail_value: "",
    category: "gift_card",
    stock_quantity: "",
    is_active: true,
    is_public: false,
    requires_shipping: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when field changes
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    // At least one price must be set
    const hasPointsPrice = formData.points_cost && !isNaN(Number(formData.points_cost)) && Number(formData.points_cost) > 0;
    const hasDollarPrice = formData.dollar_price && !isNaN(Number(formData.dollar_price)) && Number(formData.dollar_price) > 0;
    
    if (!hasPointsPrice && !hasDollarPrice) {
      newErrors.points_cost = "At least one price (points or dollars) is required";
    }
    if (formData.points_cost && isNaN(Number(formData.points_cost))) {
      newErrors.points_cost = "Points cost must be a number";
    }
    if (formData.dollar_price && isNaN(Number(formData.dollar_price))) {
      newErrors.dollar_price = "Dollar price must be a number";
    }
    if (formData.retail_value && isNaN(Number(formData.retail_value))) {
      newErrors.retail_value = "Retail value must be a number";
    }
    if (formData.stock_quantity && isNaN(Number(formData.stock_quantity))) {
      newErrors.stock_quantity = "Stock quantity must be a number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl: string | null = null;

      // Upload image if provided
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", imageFile);
        uploadFormData.append("bucket", "products");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageUrl = uploadData.path;
        } else {
          const errorData = await uploadRes.json();
          console.error("Upload failed:", errorData);
          throw new Error(errorData.error || "Failed to upload image");
        }
      }

      // Create product
      const productData = {
        name: formData.name,
        description: formData.description || null,
        image_url: imageUrl,
        points_cost: formData.points_cost ? Number(formData.points_cost) : 0,
        dollar_price: formData.dollar_price ? Number(formData.dollar_price) : null,
        retail_value: formData.retail_value ? Number(formData.retail_value) : null,
        category: formData.category || null,
        stock_quantity: formData.stock_quantity ? Number(formData.stock_quantity) : null,
        is_active: formData.is_active,
        is_public: formData.is_public,
        requires_shipping: formData.requires_shipping,
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create product");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      console.error("Error creating product:", error);
      alert(error instanceof Error ? error.message : "Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Create Product"
        subtitle="Add a new product to the rewards shop"
      >
        <Link href="/admin/products">
          <AdminButton variant="secondary">
            Cancel
          </AdminButton>
        </Link>
      </AdminPageHeader>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="p-6 space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Product Image
            </label>
            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-48 h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500">Click to upload image</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG, GIF up to 10MB</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept={IMAGE_ACCEPT_STRING}
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-slate-900 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., $50 Amazon Gift Card"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-slate-900 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Product description..."
            />
          </div>

          {/* Pricing Section */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Pricing</h3>
            <p className="text-sm text-slate-500 mb-4">
              Set at least one price. Products can be purchased with points, dollars, or either.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="points_cost" className="block text-sm font-semibold text-slate-900 mb-2">
                  Points Cost
                </label>
                <input
                  type="number"
                  id="points_cost"
                  name="points_cost"
                  value={formData.points_cost}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1000"
                />
                {errors.points_cost && <p className="mt-1 text-sm text-red-600">{errors.points_cost}</p>}
              </div>

              <div>
                <label htmlFor="dollar_price" className="block text-sm font-semibold text-slate-900 mb-2">
                  Dollar Price ($)
                </label>
                <input
                  type="number"
                  id="dollar_price"
                  name="dollar_price"
                  value={formData.dollar_price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="9.99"
                />
                {errors.dollar_price && <p className="mt-1 text-sm text-red-600">{errors.dollar_price}</p>}
              </div>

              <div>
                <label htmlFor="retail_value" className="block text-sm font-semibold text-slate-900 mb-2">
                  Retail Value ($)
                </label>
                <input
                  type="number"
                  id="retail_value"
                  name="retail_value"
                  value={formData.retail_value}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="50.00"
                />
                <p className="mt-1 text-xs text-slate-400">Display value for reference</p>
                {errors.retail_value && <p className="mt-1 text-sm text-red-600">{errors.retail_value}</p>}
              </div>
            </div>
          </div>

          {/* Category and Stock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-slate-900 mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="gift_card">Gift Card</option>
                <option value="merchandise">Merchandise</option>
                <option value="experience">Experience</option>
                <option value="subscription">Subscription</option>
              </select>
            </div>

            <div>
              <label htmlFor="stock_quantity" className="block text-sm font-semibold text-slate-900 mb-2">
                Stock Quantity
              </label>
              <input
                type="number"
                id="stock_quantity"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Leave empty for unlimited"
              />
              {errors.stock_quantity && <p className="mt-1 text-sm text-red-600">{errors.stock_quantity}</p>}
            </div>
          </div>

          {/* Settings */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                  Active (visible in rewards shop)
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_public"
                  name="is_public"
                  checked={formData.is_public}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_public" className="text-sm font-medium text-slate-700">
                  Public (visible on public store page without login)
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requires_shipping"
                  name="requires_shipping"
                  checked={formData.requires_shipping}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="requires_shipping" className="text-sm font-medium text-slate-700">
                  Requires shipping (collect shipping address)
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <Link href="/admin/products">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Product"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
