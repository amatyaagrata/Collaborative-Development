"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus, ArrowLeft, Package, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import "./categories.css";

interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category_id: string;
  created_at: string;
}

export default function CategoriesPage() {
  const supabase = createClient();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selected category and its products
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Form states
  const [viewMode, setViewMode] = useState<"list" | "form" | "products">("list");
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Failed to load categories: " + error.message);
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  }, [supabase]);

  const fetchProductsByCategory = useCallback(async (categoryId: string) => {
    setLoadingProducts(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category_id", categoryId)
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Failed to load products: " + error.message);
      setCategoryProducts([]);
    } else {
      setCategoryProducts(data || []);
    }
    setLoadingProducts(false);
  }, [supabase]);

  useEffect(() => {
    Promise.resolve().then(() => fetchCategories());
  }, [fetchCategories]);

  useEffect(() => {
    async function guardManagerAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      const role = user?.user_metadata?.role;
      if (role === "inventory manager") {
        router.push("/product");
      }
    }
    void guardManagerAccess();
  }, [router, supabase]);

  const handleAddClick = () => {
    setFormMode("add");
    setFormData({ name: "", description: "" });
    setViewMode("form");
  };

  const handleEditClick = (category: Category) => {
    setFormMode("edit");
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description || "",
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

  // Handle category card click - show products in that category
  const handleCategoryClick = async (category: Category) => {
    setSelectedCategory(category);
    await fetchProductsByCategory(category.id);
    setViewMode("products");
  };

  // Handle back to categories list
  const handleBackToList = () => {
    setSelectedCategory(null);
    setCategoryProducts([]);
    setViewMode("list");
  };

  // Get total products count for a category
  const getProductCount = async (categoryId: string): Promise<number> => {
    const { count, error } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("category_id", categoryId);
    
    if (error) return 0;
    return count || 0;
  };

  return (
    <AppLayout title={viewMode === "list" ? "Categories" : viewMode === "products" ? `${selectedCategory?.name} Products` : formMode === "add" ? "Add Category" : "Edit Category"}>
      <div className="categories-content">
        
        {/* LIST VIEW - Categories as Cards */}
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
                  <div 
                    key={category.id} 
                    className="category-card"
                    onClick={() => handleCategoryClick(category)}
                  >
                    <div className="category-card-header">
                      <div className="category-icon">
                        <Package size={24} />
                      </div>
                      <div className="category-actions">
                        <button 
                          className="categories-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(category);
                          }}
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          className="categories-action-btn delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(category.id);
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="category-card-body">
                      <h3 className="category-name">{category.name}</h3>
                      <p className="category-description">
                        {category.description || "No description provided"}
                      </p>
                    </div>
                    
                    <div className="category-card-footer">
                      <div className="category-stats">
                        <Package size={14} />
                        <span>View Products</span>
                      </div>
                      <ChevronRight size={16} className="arrow-icon" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* PRODUCTS VIEW - Show all products in selected category */}
        {viewMode === "products" && selectedCategory && (
          <>
            <div className="products-header-row">
              <button className="btn btn-secondary" onClick={handleBackToList}>
                <ArrowLeft size={18} style={{ marginRight: "8px" }} />
                Back to Categories
              </button>
              <h2 className="products-title">{selectedCategory.name} - Products</h2>
              <p className="products-subtitle">{categoryProducts.length} products in this category</p>
            </div>

            {loadingProducts ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading products...</p>
              </div>
            ) : categoryProducts.length === 0 ? (
              <div className="empty-state">
                <Package size={48} />
                <p>No products found in this category</p>
                <p className="empty-subtitle">Add products to {selectedCategory.name} to see them here</p>
              </div>
            ) : (
              <div className="products-grid">
                {categoryProducts.map((product) => (
                  <div key={product.id} className="product-card">
                    <div className="product-card-header">
                      <h4 className="product-name">{product.name}</h4>
                      <div className="product-price">Rs. {product.price.toLocaleString()}</div>
                    </div>
                    
                    <div className="product-card-body">
                      <div className="product-info-row">
                        <span className="info-label">Stock:</span>
                        <span className={`info-value ${product.stock <= 10 ? 'stock-low' : 'stock-normal'}`}>
                          {product.stock} units
                        </span>
                      </div>
                      <div className="product-info-row">
                        <span className="info-label">Added:</span>
                        <span className="info-value">
                          {new Date(product.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="product-card-footer">
                      <div className="product-id-badge">
                        ID: {product.id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* FORM VIEW - Add/Edit Category */}
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
