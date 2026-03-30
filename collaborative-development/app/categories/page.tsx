"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Pencil, Trash2, Plus, Image as ImageIcon } from "lucide-react";
import "./categories.css";

// Dummy data type
interface Category {
  id: number;
  name: string;
  description: string;
  date: string;
  status: "Active" | "Inactive";
}

const initialCategories: Category[] = [
  { id: 1, name: "Electronics", description: "All electronic devices and accessories", date: "2023-10-15", status: "Active" },
  { id: 2, name: "Furniture", description: "Office and home furniture", date: "2023-11-02", status: "Active" },
  { id: 3, name: "Stationery", description: "Pens, papers, and office supplies", date: "2024-01-20", status: "Inactive" },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    status: "Active" as "Active" | "Inactive",
  });

  // TODO: GET /categories from backend

  const handleAddClick = () => {
    setFormMode("add");
    setFormData({ name: "", description: "", date: "", status: "Active" });
    setViewMode("form");
  };

  const handleEditClick = (category: Category) => {
    setFormMode("edit");
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description,
      date: category.date,
      status: category.status,
    });
    setViewMode("form");
  };

  const handleDeleteClick = (id: number) => {
    if (confirm("Are you sure you want to delete this category?")) {
      deleteCategory(id);
    }
  };

  const handleCancelClick = () => {
    setViewMode("list");
  };

  const handleSaveClick = () => {
    if (!formData.name || !formData.date) {
      alert("Please fill in the required fields (Name and Date).");
      return;
    }

    if (formMode === "add") {
      addCategory();
    } else if (formMode === "edit" && editingId !== null) {
      updateCategory(editingId);
    }
    
    setViewMode("list");
  };

  // CRUD Simulation Functions
  const addCategory = () => {
    // TODO: POST /categories
    const newCategory: Category = {
      id: Date.now(),
      name: formData.name,
      description: formData.description || "No description provided",
      date: formData.date,
      status: formData.status,
    };
    setCategories([...categories, newCategory]);
  };

  const updateCategory = (id: number) => {
    // TODO: PUT /categories/:id
    const updatedCategories = categories.map((cat) =>
      cat.id === id
        ? {
            ...cat,
            name: formData.name,
            description: formData.description || "No description provided",
            date: formData.date,
            status: formData.status,
          }
        : cat
    );
    setCategories(updatedCategories);
  };

  const deleteCategory = (id: number) => {
    // TODO: DELETE /categories/:id
    const remainingCategories = categories.filter((cat) => cat.id !== id);
    setCategories(remainingCategories);
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
                    {categories.length === 0 ? (
                       <tr>
                         <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "#8c8a94" }}>No categories found</td>
                       </tr>
                    ) : (
                      categories.map((cat) => (
                        <tr key={cat.id}>
                          <td style={{ fontWeight: 600, color: "#000000" }}>{cat.name}</td>
                          <td style={{ color: "#000000" }}>{cat.description}</td>
                          <td>
                            <span className={`category-status-badge ${cat.status === "Active" ? "category-status-active" : "category-status-inactive"}`}>
                              {cat.status}
                            </span>
                          </td>
                          <td style={{ color: "#000000" }}>{cat.date}</td>
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
                <label className="form-label">Category Name</label>
                <input
                  type="text"
                  className="form-input-styled"
                  placeholder="Add Category"
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

              <div className="form-group">
                <label className="form-label">Created on</label>
                <input
                  type="date"
                  className="form-input-styled"
                  placeholder="Add date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-input-styled"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as "Active" | "Inactive" })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Upload Images</label>
                <div className="image-upload-area">
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#b5b3bb' }}>
                    <ImageIcon size={24} />
                    <span style={{ fontSize: '12px' }}>Click or drag</span>
                  </div>
                </div>
              </div>

              <div className="form-actions-row">
                <button className="btn btn-secondary" onClick={handleCancelClick}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSaveClick}>
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
