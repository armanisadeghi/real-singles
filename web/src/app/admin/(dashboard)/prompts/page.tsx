"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Edit2, Trash2, Save, X, ChevronUp, ChevronDown } from "lucide-react";
import type { PromptDefinition } from "@/types";
import { PROMPT_CATEGORIES } from "@/types";

export default function AdminPromptsPage() {
  const [prompts, setPrompts] = useState<PromptDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    key: "",
    prompt_text: "",
    placeholder_text: "",
    category: "general",
    max_length: 200,
    is_active: true,
    is_required: false,
    display_order: 0,
    icon: "",
  });

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    setLoading(true);
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from("prompt_definitions")
      .select("*")
      .order("category")
      .order("display_order");

    if (error) {
      console.error("Error loading prompts:", error);
      setError("Failed to load prompts");
    } else {
      setPrompts(data || []);
    }
    setLoading(false);
  };

  const handleEdit = (prompt: PromptDefinition) => {
    setEditingId(prompt.id);
    setFormData({
      key: prompt.key,
      prompt_text: prompt.prompt_text,
      placeholder_text: prompt.placeholder_text || "",
      category: prompt.category,
      max_length: prompt.max_length ?? 200,
      is_active: prompt.is_active ?? true,
      is_required: prompt.is_required ?? false,
      display_order: prompt.display_order ?? 0,
      icon: prompt.icon || "",
    });
  };

  const handleSave = async () => {
    if (!formData.key || !formData.prompt_text) {
      setError("Key and prompt text are required");
      return;
    }

    setSaving(true);
    setError("");
    const supabase = createClient();

    try {
      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from("prompt_definitions")
          .update({
            key: formData.key,
            prompt_text: formData.prompt_text,
            placeholder_text: formData.placeholder_text || null,
            category: formData.category,
            max_length: formData.max_length,
            is_active: formData.is_active,
            is_required: formData.is_required,
            display_order: formData.display_order,
            icon: formData.icon || null,
          })
          .eq("id", editingId);

        if (error) throw error;
        setSuccess("Prompt updated successfully");
      } else {
        // Create new
        const { error } = await supabase
          .from("prompt_definitions")
          .insert({
            key: formData.key,
            prompt_text: formData.prompt_text,
            placeholder_text: formData.placeholder_text || null,
            category: formData.category,
            max_length: formData.max_length,
            is_active: formData.is_active,
            is_required: formData.is_required,
            display_order: formData.display_order,
            icon: formData.icon || null,
          });

        if (error) throw error;
        setSuccess("Prompt created successfully");
      }

      await loadPrompts();
      cancelEdit();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save prompt";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this prompt?")) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("prompt_definitions")
      .delete()
      .eq("id", id);

    if (error) {
      setError("Failed to delete prompt");
    } else {
      setSuccess("Prompt deleted successfully");
      await loadPrompts();
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("prompt_definitions")
      .update({ is_active: !currentActive })
      .eq("id", id);

    if (error) {
      setError("Failed to update prompt");
    } else {
      await loadPrompts();
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowNewForm(false);
    setFormData({
      key: "",
      prompt_text: "",
      placeholder_text: "",
      category: "general",
      max_length: 200,
      is_active: true,
      is_required: false,
      display_order: 0,
      icon: "",
    });
  };

  // Group prompts by category
  const groupedPrompts = prompts.reduce((acc, prompt) => {
    if (!acc[prompt.category]) {
      acc[prompt.category] = [];
    }
    acc[prompt.category].push(prompt);
    return acc;
  }, {} as Record<string, PromptDefinition[]>);

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
        <h1 className="text-2xl font-bold text-gray-900">Profile Prompts</h1>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          Add Prompt
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
            {editingId ? "Edit Prompt" : "New Prompt"}
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
                placeholder="e.g., ideal_first_date"
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
                {PROMPT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prompt Text
              </label>
              <input
                type="text"
                value={formData.prompt_text}
                onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., My ideal first date"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Placeholder Text
              </label>
              <input
                type="text"
                value={formData.placeholder_text}
                onChange={(e) => setFormData({ ...formData, placeholder_text: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., Describe your perfect first date..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Length
              </label>
              <input
                type="number"
                value={formData.max_length}
                onChange={(e) => setFormData({ ...formData, max_length: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
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
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_required}
                  onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Required</span>
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

      {/* Prompts by Category */}
      {Object.entries(groupedPrompts).map(([category, categoryPrompts]) => {
        const categoryInfo = PROMPT_CATEGORIES.find((c) => c.value === category);
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
                      Prompt Text
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
                  {categoryPrompts.map((prompt) => (
                    <tr key={prompt.id} className={!prompt.is_active ? "bg-gray-50" : ""}>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {prompt.display_order}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">
                        {prompt.key}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {prompt.prompt_text}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(prompt.id, prompt.is_active ?? true)}
                          className={`px-2 py-1 text-xs rounded-full ${
                            prompt.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {prompt.is_active ? "Active" : "Inactive"}
                        </button>
                        {prompt.is_required && (
                          <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            Required
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleEdit(prompt)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(prompt.id)}
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

      {prompts.length === 0 && !showNewForm && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No prompts defined yet.</p>
          <button
            onClick={() => setShowNewForm(true)}
            className="mt-4 text-indigo-600 hover:text-indigo-800"
          >
            Add your first prompt
          </button>
        </div>
      )}
    </div>
  );
}
