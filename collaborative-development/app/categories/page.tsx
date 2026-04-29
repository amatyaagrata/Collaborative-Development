"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import "./categories.css";

interface Category {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export default function CategoriesPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
  });

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase.from("categories").select("*").order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load categories: " + error.message);
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    Promise.resolve().then(() => fetchCategories());
  }, [fetchCategories]);

  const handleAddClick = () => {
    setFormMode("add");
    setFormData({ name: "", description: "", is_active: true });
    setViewMode("form");
  };

  const handleEditClick = (category: Category) => {
    setFormMode("edit");
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description || "",
      is_active: category.is_active ?? true,
    });
    setViewMode("form");
  };

  const handleCancelClick = () => {
    setViewMode("list");
  };

  const handleSaveClick = async () => {
    if (!formData.name) {
      toast.error("Please fill in the Category Name.");
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description || null,
      is_active: formData.is_active,
    };

    if (formMode === "add") {
      const { error } = await supabase.from("categories").insert([payload]);
      if (error) {
        toast.error("Failed to add category: " + error.message);
        return;
      }
      toast.success("Category added successfully!");
    } else if (formMode === "edit" && editingId !== null) {
      const { error } = await supabase.from("categories").update(payload).eq("id", editingId);
      if (error) {
        toast.error("Failed to update category: " + error.message);
        return;
      }
      toast.success("Category updated successfully!");
    }
    
    setLoading(true);
    fetchCategories();
    setViewMode("list");
  };

  const handleDeleteClick = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this category?")) {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete category: " + error.message);
      } else {
        toast.success("Category deleted.");
        setLoading(true);
        fetchCategories();
      }
    }
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

            <div className="categories-table-card">
              <div className="categories-table-wrapper">
                <table className="categories-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Created On</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                       <tr>
                         <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "#8c8a94" }}>Loading from Supabase...</td>
                       </tr>
                    ) : categories.length === 0 ? (
                       <tr>
                         <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "#8c8a94" }}>No categories found</td>
                       </tr>
                    ) : (
                      categories.map((cat) => (
                        <tr key={cat.id}>
                          <td style={{ fontWeight: 600, color: "#000000" }}>{cat.name}</td>
                          <td style={{ color: "#000000" }}>{cat.description || "N/A"}</td>
                          <td>
                            <span className={`category-status-badge ${cat.is_active !== false ? "category-status-active" : "category-status-inactive"}`}>
                              {cat.is_active !== false ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td style={{ color: "#000000" }}>
                            {new Date(cat.created_at).toLocaleDateString()}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button className="categories-action-btn" onClick={() => handleEditClick(cat)}>
                                <Pencil size={16} />
                              </button>
                              <button className="categories-action-btn delete" onClick={() => handleDeleteClick(cat.id)}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  className="form-input-styled"
                  placeholder="Add details"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: "10px", marginTop: "10px" }}>
                <input
                  type="checkbox"
                  id="category-active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
                <label htmlFor="category-active" className="form-label" style={{ marginBottom: 0, cursor: "pointer" }}>
                  Active Status (Visible in inventory manager)
                </label>
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
