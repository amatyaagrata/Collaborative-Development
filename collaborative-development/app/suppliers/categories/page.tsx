"use client";

import { useCallback, useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Plus, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import "./categories.css";

type CategoryRow = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export default function SupplierCategoriesPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load categories: " + error.message);
      setCategories([]);
    } else {
      setCategories((data as CategoryRow[]) || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    Promise.resolve().then(() => fetchCategories());
  }, [fetchCategories]);

  const handleAddClick = () => {
    setFormMode("add");
    setEditingId(null);
    setFormData({ name: "", description: "" });
    setViewMode("form");
  };

  const handleEditClick = (category: CategoryRow) => {
    setFormMode("edit");
    setEditingId(category.id);
    setFormData({ name: category.name, description: category.description || "" });
    setViewMode("form");
  };

  const handleCancelClick = () => setViewMode("list");

  const handleSaveClick = async () => {
    const name = formData.name.trim();
    if (!name) {
      toast.error("Please fill in the Category Name.");
      return;
    }

    const payload = {
      name,
      description: formData.description.trim() ? formData.description.trim() : null,
    };

    if (formMode === "add") {
      const { error } = await supabase.from("categories").insert([payload]);
      if (error) {
        toast.error("Failed to add category: " + error.message);
        return;
      }
      toast.success("Category added successfully!");
    } else if (formMode === "edit" && editingId) {
      const { error } = await supabase.from("categories").update(payload).eq("id", editingId);
      if (error) {
        toast.error("Failed to update category: " + error.message);
        return;
      }
      toast.success("Category updated successfully!");
    }

    setViewMode("list");
    fetchCategories();
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this category?")) return;

    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete category: " + error.message);
      return;
    }

    toast.success("Category deleted.");
    fetchCategories();
  };

  return (
    <AppLayout title={viewMode === "list" ? "Categories" : formMode === "add" ? "Add Category" : "Edit Category"}>
      <div className="categories-content">
        {viewMode === "list" && (
          <>
            <div className="categories-header-row">
              <h2 className="categories-title">Categories List</h2>
              <button className="btn btn-primary" onClick={handleAddClick}>
                <Plus size={18} style={{ marginRight: "8px" }} />
                Add Category
              </button>
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading categories...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="empty-state">
                <Package size={48} />
                <p>No categories found</p>
                <button className="btn btn-primary" onClick={handleAddClick}>
                  Create your first category
                </button>
              </div>
            ) : (
              <div className="categories-grid">
                {categories.map((category) => (
                  <div key={category.id} className="category-card">
                    <div className="category-card-header">
                      <div className="category-icon">
                        <Package size={24} />
                      </div>
                      <div className="category-actions">
                        <button className="categories-action-btn" onClick={() => handleEditClick(category)}>
                          <Pencil size={16} />
                        </button>
                        <button
                          className="categories-action-btn delete"
                          onClick={() => handleDeleteClick(category.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="category-card-body">
                      <h3 className="category-name">{category.name}</h3>
                      <p className="category-description">{category.description || "No description provided"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {viewMode === "form" && (
          <div className="category-form-container">
            <h3 className="form-breadcrumb">Category details</h3>

            <div className="category-form-card">
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input
                  type="text"
                  className="form-input-styled"
                  placeholder="Apparel, Electronics, etc."
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  className="form-input-styled"
                  placeholder="Add details"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="form-actions-row">
                <button className="btn btn-secondary" onClick={handleCancelClick}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSaveClick}>
                  Save Category
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

