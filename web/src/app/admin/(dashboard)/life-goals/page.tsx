"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import type { LifeGoalDefinition } from "@/types";
import { LIFE_GOAL_CATEGORIES } from "@/types";

export default function AdminLifeGoalsPage() {
  const [goals, setGoals] = useState<LifeGoalDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    key: "",
    label: "",
    category: "career",
    description: "",
    icon: "",
    is_active: true,
    display_order: 0,
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    setLoading(true);
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from("life_goal_definitions")
      .select("*")
      .order("category")
      .order("display_order");

    if (error) {
      console.error("Error loading goals:", error);
      setError("Failed to load life goals");
    } else {
      setGoals(data || []);
    }
    setLoading(false);
  };

  const handleEdit = (goal: LifeGoalDefinition) => {
    setEditingId(goal.id);
    setFormData({
      key: goal.key,
      label: goal.label,
      category: goal.category,
      description: goal.description || "",
      icon: goal.icon || "",
      is_active: goal.is_active ?? true,
      display_order: goal.display_order ?? 0,
    });
  };

  const handleSave = async () => {
    if (!formData.key || !formData.label) {
      setError("Key and label are required");
      return;
    }

    setSaving(true);
    setError("");
    const supabase = createClient();

    try {
      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from("life_goal_definitions")
          .update({
            key: formData.key,
            label: formData.label,
            category: formData.category,
            description: formData.description || null,
            icon: formData.icon || null,
            is_active: formData.is_active,
            display_order: formData.display_order,
          })
          .eq("id", editingId);

        if (error) throw error;
        setSuccess("Life goal updated successfully");
      } else {
        // Create new
        const { error } = await supabase
          .from("life_goal_definitions")
          .insert({
            key: formData.key,
            label: formData.label,
            category: formData.category,
            description: formData.description || null,
            icon: formData.icon || null,
            is_active: formData.is_active,
            display_order: formData.display_order,
          });

        if (error) throw error;
        setSuccess("Life goal created successfully");
      }

      await loadGoals();
      cancelEdit();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save life goal";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this life goal?")) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("life_goal_definitions")
      .delete()
      .eq("id", id);

    if (error) {
      setError("Failed to delete life goal");
    } else {
      setSuccess("Life goal deleted successfully");
      await loadGoals();
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("life_goal_definitions")
      .update({ is_active: !currentActive })
      .eq("id", id);

    if (error) {
      setError("Failed to update life goal");
    } else {
      await loadGoals();
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowNewForm(false);
    setFormData({
      key: "",
      label: "",
      category: "career",
      description: "",
      icon: "",
      is_active: true,
      display_order: 0,
    });
  };

  // Group goals by category
  const groupedGoals = goals.reduce((acc, goal) => {
    if (!acc[goal.category]) {
      acc[goal.category] = [];
    }
    acc[goal.category].push(goal);
    return acc;
  }, {} as Record<string, LifeGoalDefinition[]>);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Life Goals</h1>
          <p className="text-sm text-gray-500 mt-1">
            The League model - users select up to 10 goals for matching
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          Add Life Goal
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
          <button onClick={() => setError("")} className="float-right">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
          <button onClick={() => setSuccess("")} className="float-right">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* New/Edit Form */}
      {(showNewForm || editingId) && (
        <div className="mb-6 p-6 bg-white rounded-lg shadow border">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Life Goal" : "New Life Goal"}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Key (unique identifier)
              </label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., start_company"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {LIFE_GOAL_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Label (displayed to users)
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., Start my own company"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
                placeholder="Brief description of this goal..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={cancelEdit}
              className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Goals by Category */}
      {Object.entries(groupedGoals).map(([category, categoryGoals]) => {
        const categoryInfo = LIFE_GOAL_CATEGORIES.find((c) => c.value === category);
        return (
          <div key={category} className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              {categoryInfo?.label || category}
            </h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Key
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Label
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {categoryGoals.map((goal) => (
                    <tr key={goal.id} className={!goal.is_active ? "bg-gray-50" : ""}>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {goal.display_order}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">
                        {goal.key}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {goal.label}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                        {goal.description || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(goal.id, goal.is_active ?? true)}
                          className={`px-2 py-1 text-xs rounded-full ${
                            goal.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {goal.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleEdit(goal)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(goal.id)}
                          className="text-red-600 hover:text-red-900 p-1 ml-2"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {goals.length === 0 && !showNewForm && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No life goals defined yet.</p>
          <button
            onClick={() => setShowNewForm(true)}
            className="mt-4 text-indigo-600 hover:text-indigo-800"
          >
            Add your first life goal
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Statistics</h3>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-gray-500">Total Goals:</span>{" "}
            <span className="font-medium">{goals.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Active:</span>{" "}
            <span className="font-medium text-green-600">
              {goals.filter((g) => g.is_active).length}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Inactive:</span>{" "}
            <span className="font-medium text-gray-600">
              {goals.filter((g) => !g.is_active).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
