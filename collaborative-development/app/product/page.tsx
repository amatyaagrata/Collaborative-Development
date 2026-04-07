"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import "./product.css";

interface Product {
  id: string; // UUID from Supabase
  name: string;
  category_id?: string | null;
  supplier_id?: string | null;
  price: number;
  stock: number;
  created_at: string;
  // Local UI mock fields for compatibility
  productId?: string;
  category?: string;
  stockAlert?: number;
  details?: string;
}

export default function ProductPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    productId: "",
    category: "",
    price: "",
    stock: "",
    stockAlert: "",
    details: "",
  });

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to fetch products: " + error.message);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    Promise.resolve().then(() => fetchProducts());
  }, [fetchProducts]);

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddClick = () => {
    setFormMode("add");
    setFormData({ name: "", productId: "", category: "General", price: "0", stock: "0", stockAlert: "10", details: "" });
    setViewMode("form");
  };

  const handleEditClick = (product: Product) => {
    setFormMode("edit");
    setEditingId(product.id);
    setFormData({
      name: product.name,
      productId: product.productId || "",
      category: product.category || "General",
      price: product.price.toString(),
      stock: product.stock.toString(),
      stockAlert: (product.stockAlert || 10).toString(),
      details: product.details || "",
    });
    setViewMode("form");
  };

  const handleCancelClick = () => {
    setViewMode("list");
  };

  // Function to handle stock change with validation
  const handleStockChange = (newStockValue: number, originalStock?: number) => {
    // Prevent decreasing stock in edit mode
    if (formMode === "edit" && originalStock !== undefined && newStockValue < originalStock) {
      toast.error(`Stock cannot be decreased! Current stock: ${originalStock}`);
      return false;
    }
    
    // Ensure stock is not negative
    if (newStockValue < 0) {
      toast.error("Stock cannot be negative!");
      return false;
    }
    
    setFormData({ ...formData, stock: newStockValue.toString() });
    return true;
  };

  const handleSaveClick = async () => {
    if (!formData.name) {
      toast.error("Please fill in the required Product Name.");
      return;
    }

    const currentStock = parseInt(formData.stock, 10) || 0;
    
    // For edit mode, check if stock is being decreased
    if (formMode === "edit" && editingId !== null) {
      const originalProduct = products.find(p => p.id === editingId);
      if (originalProduct && currentStock < originalProduct.stock) {
        toast.error(`Stock cannot be decreased! Current stock: ${originalProduct.stock}, Attempted: ${currentStock}`);
        return;
      }
    }

    // Validate stock is not negative
    if (currentStock < 0) {
      toast.error("Stock cannot be negative!");
      return;
    }

    const payload = {
      name: formData.name,
      price: parseFloat(formData.price) || 0,
      stock: currentStock,
    };

    if (formMode === "add") {
      const { error } = await supabase.from("products").insert([payload]);
      if (error) {
        toast.error("Error adding product: " + error.message);
        return;
      }
      toast.success("Product added successfully!");
    } else if (formMode === "edit" && editingId !== null) {
      const { error } = await supabase.from("products").update(payload).eq("id", editingId);
      if (error) {
        toast.error("Error updating product: " + error.message);
        return;
      }
      toast.success("Product updated successfully!");
    }

    setLoading(true);
    fetchProducts();
    setViewMode("list");
  };

  const handleDeleteClick = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this product?")) {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete product: " + error.message);
      } else {
        toast.success("Product deleted successfully.");
        setLoading(true);
        fetchProducts(); // Refresh list
      }
    }
  };

  const headerTitle = viewMode === "list" ? "Product" : formMode === "add" ? "New Product" : "Edit Product";

  return (
    <AppLayout title={headerTitle}>
      <div className="product-content">
        {viewMode === "list" && (
          <>
            <div className="product-header-row">
              <h2 className="product-title">All product</h2>
            </div>

            <div className="product-toolbar">
              <div className="product-search-wrapper">
                <Search size={16} className="product-search-icon" />
                <input
                  type="text"
                  className="product-search-input"
                  placeholder="Search products by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="product-toolbar-actions">
                <button className="product-add-btn" onClick={handleAddClick}>
                  <Plus size={16} />
                  Add now
                </button>
              </div>
            </div>

            <div className="product-table-card">
              <div className="product-table-wrapper">
                <table className="product-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>
                        <input type="checkbox" className="product-checkbox" />
                      </th>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#8c8a94" }}>Loading live products from database...</td>
                      </tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#8c8a94" }}>No products found</td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => (
                        <tr key={product.id}>
                          <td>
                            <input type="checkbox" className="product-checkbox" />
                           </td>
                          <td style={{ fontWeight: 600 }}>{product.name}</td>
                          <td>{product.category || "General"}</td>
                          <td>Rs. {product.price.toLocaleString()}</td>
                          <td>
                            <span className={product.stock > 10 ? "stock-normal" : "stock-low"}>
                              {product.stock}
                            </span>
                          </td>
                          <td>
                            <div className="product-action-buttons">
                              <button className="product-action-btn" onClick={() => handleEditClick(product)}>
                                <Pencil size={16} />
                              </button>
                              <button className="product-action-btn delete" onClick={() => handleDeleteClick(product.id)}>
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
          <div className="product-form-container">
            <h3 className="product-form-breadcrumb">Product details</h3>

            <div className="product-form-card">
              <div className="product-form-row">
                <div className="product-form-group">
                  <label className="product-form-label">Product Name *</label>
                  <input
                    type="text"
                    className="product-form-input"
                    placeholder="Product Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="product-form-group">
                  <label className="product-form-label">Price (Rs.)</label>
                  <input
                    type="number"
                    className="product-form-input"
                    placeholder="1000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    min="0"
                  />
                </div>
              </div>

              <div className="product-form-row">
                <div className="product-form-group">
                  <label className="product-form-label">Available Stock</label>
                  <input
                    type="number"
                    className="product-form-input"
                    placeholder="50"
                    value={formData.stock}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (!isNaN(value)) {
                        const originalProduct = formMode === "edit" && editingId !== null
                          ? products.find(p => p.id === editingId)
                          : null;
                        handleStockChange(value, originalProduct?.stock);
                      } else {
                        setFormData({ ...formData, stock: "0" });
                      }
                    }}
                    min="0"
                  />
                </div>
              </div>

              <div className="product-form-actions">
                <button className="product-btn product-btn-secondary" onClick={handleCancelClick}>
                  Cancel
                </button>
                <button className="product-btn product-btn-primary" onClick={handleSaveClick}>
                  Save Base Product
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}