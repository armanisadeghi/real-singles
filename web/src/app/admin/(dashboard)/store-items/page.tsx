"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  Zap,
  Gift,
  Eye,
  Heart,
  Undo2,
  Sparkles,
  DollarSign,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { AdminPageHeader, AdminButton } from "@/components/admin/AdminPageHeader";
import { cn } from "@/lib/utils";

interface PurchasableItem {
  id: string;
  item_type: string;
  name: string;
  description: string | null;
  image_url: string | null;
  quantity: number;
  duration_hours: number | null;
  points_cost: number | null;
  dollar_price: number | null;
  is_active: boolean;
  is_public: boolean;
  display_order: number;
  created_at: string;
}

const itemTypeConfig: Record<string, { label: string; icon: typeof Star; color: string }> = {
  superlike_pack: { label: "Super Likes", icon: Star, color: "bg-yellow-100 text-yellow-700" },
  boost: { label: "Boost", icon: Zap, color: "bg-purple-100 text-purple-700" },
  points_pack: { label: "Points Pack", icon: Gift, color: "bg-green-100 text-green-700" },
  matchmaker_session: { label: "Matchmaker", icon: Heart, color: "bg-pink-100 text-pink-700" },
  read_receipts: { label: "Read Receipts", icon: Eye, color: "bg-blue-100 text-blue-700" },
  see_likes: { label: "See Likes", icon: Eye, color: "bg-indigo-100 text-indigo-700" },
  unlimited_likes: { label: "Unlimited Likes", icon: Heart, color: "bg-red-100 text-red-700" },
  rewind: { label: "Rewind", icon: Undo2, color: "bg-orange-100 text-orange-700" },
  spotlight: { label: "Spotlight", icon: Sparkles, color: "bg-amber-100 text-amber-700" },
};

export default function AdminStoreItemsPage() {
  const [items, setItems] = useState<PurchasableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [editingItem, setEditingItem] = useState<PurchasableItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const url =
        filter === "all"
          ? "/api/admin/purchasable-items"
          : `/api/admin/purchasable-items?type=${filter}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const toggleActive = async (item: PurchasableItem) => {
    try {
      const res = await fetch(`/api/admin/purchasable-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !item.is_active }),
      });

      if (res.ok) {
        fetchItems();
      }
    } catch (error) {
      console.error("Error toggling item:", error);
    }
  };

  const deleteItem = async (item: PurchasableItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/purchasable-items/${item.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchItems();
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const itemTypes = Object.keys(itemTypeConfig);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Store Items"
        subtitle="Manage purchasable items like superlikes, boosts, and points packs"
      >
        <AdminButton onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </AdminButton>
      </AdminPageHeader>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          )}
        >
          All Items
        </button>
        {itemTypes.map((type) => {
          const config = itemTypeConfig[type];
          return (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                filter === type
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              )}
            >
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-slate-500 mt-2">Loading items...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center">
            <Gift className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No items found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-blue-600 hover:underline"
            >
              Create your first item
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Pricing
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const typeConfig = itemTypeConfig[item.item_type] || {
                  label: item.item_type,
                  icon: Gift,
                  color: "bg-gray-100 text-gray-700",
                };
                const TypeIcon = typeConfig.icon;

                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            typeConfig.color
                          )}
                        >
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{item.name}</p>
                          <p className="text-sm text-slate-500 line-clamp-1">
                            {item.description || "No description"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium",
                          typeConfig.color
                        )}
                      >
                        {typeConfig.label}
                      </span>
                      {item.quantity > 1 && (
                        <span className="ml-2 text-xs text-slate-500">
                          ×{item.quantity}
                        </span>
                      )}
                      {item.duration_hours && (
                        <span className="ml-2 text-xs text-slate-500">
                          {item.duration_hours}h
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {item.points_cost && (
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="w-3.5 h-3.5 text-yellow-500" />
                            <span>{item.points_cost.toLocaleString()} pts</span>
                          </div>
                        )}
                        {item.dollar_price && (
                          <div className="flex items-center gap-1 text-sm">
                            <DollarSign className="w-3.5 h-3.5 text-green-500" />
                            <span>${Number(item.dollar_price).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(item)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                          item.is_active
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        )}
                      >
                        {item.is_active ? (
                          <>
                            <ToggleRight className="w-4 h-4" />
                            Active
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteItem(item)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingItem) && (
        <ItemModal
          item={editingItem}
          onClose={() => {
            setShowCreateModal(false);
            setEditingItem(null);
          }}
          onSave={() => {
            setShowCreateModal(false);
            setEditingItem(null);
            fetchItems();
          }}
        />
      )}
    </div>
  );
}

interface ItemModalProps {
  item: PurchasableItem | null;
  onClose: () => void;
  onSave: () => void;
}

function ItemModal({ item, onClose, onSave }: ItemModalProps) {
  const [formData, setFormData] = useState({
    item_type: item?.item_type || "superlike_pack",
    name: item?.name || "",
    description: item?.description || "",
    quantity: item?.quantity?.toString() || "1",
    duration_hours: item?.duration_hours?.toString() || "",
    points_cost: item?.points_cost?.toString() || "",
    dollar_price: item?.dollar_price?.toString() || "",
    is_active: item?.is_active ?? true,
    is_public: item?.is_public ?? true,
    display_order: item?.display_order?.toString() || "0",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        item_type: formData.item_type,
        name: formData.name,
        description: formData.description || null,
        quantity: parseInt(formData.quantity) || 1,
        duration_hours: formData.duration_hours ? parseInt(formData.duration_hours) : null,
        points_cost: formData.points_cost ? parseInt(formData.points_cost) : null,
        dollar_price: formData.dollar_price ? parseFloat(formData.dollar_price) : null,
        is_active: formData.is_active,
        is_public: formData.is_public,
        display_order: parseInt(formData.display_order) || 0,
      };

      const url = item
        ? `/api/admin/purchasable-items/${item.id}`
        : "/api/admin/purchasable-items";

      const res = await fetch(url, {
        method: item ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save item");
        return;
      }

      onSave();
    } catch (err) {
      console.error("Error saving item:", err);
      setError("Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const itemTypes = Object.entries(itemTypeConfig);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">
              {item ? "Edit Item" : "Create Item"}
            </h2>
          </div>

          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Item Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Item Type
              </label>
              <select
                value={formData.item_type}
                onChange={(e) =>
                  setFormData({ ...formData, item_type: e.target.value })
                }
                disabled={!!item}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              >
                {itemTypes.map(([type, config]) => (
                  <option key={type} value={type}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 5 Super Likes"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe what this item does..."
              />
            </div>

            {/* Quantity and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  min="1"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Items in pack
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  value={formData.duration_hours}
                  onChange={(e) =>
                    setFormData({ ...formData, duration_hours: e.target.value })
                  }
                  min="0"
                  step="0.5"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="For boosts"
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Points Cost
                </label>
                <input
                  type="number"
                  value={formData.points_cost}
                  onChange={(e) =>
                    setFormData({ ...formData, points_cost: e.target.value })
                  }
                  min="0"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Dollar Price
                </label>
                <input
                  type="number"
                  value={formData.dollar_price}
                  onChange={(e) =>
                    setFormData({ ...formData, dollar_price: e.target.value })
                  }
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="4.99"
                />
              </div>
            </div>

            {/* Status toggles */}
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) =>
                    setFormData({ ...formData, is_public: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Public</span>
              </label>
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Display Order
              </label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({ ...formData, display_order: e.target.value })
                }
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
              <p className="text-xs text-slate-500 mt-1">
                Lower numbers appear first
              </p>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : item ? "Save Changes" : "Create Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
