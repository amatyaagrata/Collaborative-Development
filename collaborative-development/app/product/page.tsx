"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import {
  Pencil, Trash2, Plus, Search,
  SlidersHorizontal, Image as ImageIcon,
} from "lucide-react";
import "./product.css";

// ─── Types ─────────────────────────────────────────────────────
interface Product {
  id: number;
  name: string;
  productId: string;
  category: string;
  price: number;
  stock: number;
  stockAlert: number;
  details: string;
}

// ─── Dummy Data ────────────────────────────────────────────────
const initialProducts: Product[] = [
  { id: 1, name: "Product", productId: "#1234", category: "Bed", price: 1000, stock: 67, stockAlert: 10, details: "" },
  { id: 2, name: "Product", productId: "#1234", category: "Bed", price: 1000, stock: 67, stockAlert: 10, details: "" },
  { id: 3, name: "Product", productId: "#1234", category: "Bed", price: 1000, stock: 67, stockAlert: 10, details: "" },
  { id: 4, name: "Product", productId: "#1234", category: "Bed", price: 1000, stock: 67, stockAlert: 10, details: "" },
  { id: 5, name: "Product", productId: "#1234", category: "Bed", price: 1000, stock: 67, stockAlert: 10, details: "" },
  { id: 6, name: "Product", productId: "#1234", category: "Bed", price: 1000, stock: 67, stockAlert: 10, details: "" },
  { id: 7, name: "Product", productId: "#1234", category: "Bed", price: 1000, stock: 67, stockAlert: 10, details: "" },
  { id: 8, name: "Product", productId: "#1234", category: "Bed", price: 1000, stock: 6767, stockAlert: 10, details: "" },
  { id: 9, name: "Product", productId: "#1234", category: "Bed", price: 1000, stock: 67, stockAlert: 10, details: "" },
];

export default function ProductPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<number | null>(null);
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

  // TODO: GET /products from backend

  // ─── Filtered Products ───────────────────────────────────────
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.productId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── Handlers ────────────────────────────────────────────────
  const handleAddClick = () => {
    setFormMode("add");
    setFormData({ name: "", productId: "", category: "", price: "", stock: "", stockAlert: "", details: "" });
    setViewMode("form");
  };

  const handleEditClick = (product: Product) => {
    setFormMode("edit");
    setEditingId(product.id);
    setFormData({
      name: product.name,
      productId: product.productId,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      stockAlert: product.stockAlert.toString(),
      details: product.details,
    });
    setViewMode("form");
  };

  const handleDeleteClick = (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProduct(id);
    }
  };

  const handleCancelClick = () => {
    setViewMode("list");
  };

  const handleSaveClick = () => {
    if (!formData.name || !formData.category) {
      alert("Please fill in the required fields (Name and Category).");
      return;
    }

    if (formMode === "add") {
      addProduct();
    } else if (formMode === "edit" && editingId !== null) {
      updateProduct(editingId);
    }

    setViewMode("list");
  };

  // ─── CRUD Functions (Ready for Backend) ──────────────────────
  const addProduct = () => {
    // TODO: POST /products
    const newProduct: Product = {
      id: Date.now(),
      name: formData.name,
      productId: formData.productId || `#${Math.floor(Math.random() * 9999)}`,
      category: formData.category,
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock) || 0,
      stockAlert: parseInt(formData.stockAlert) || 10,
      details: formData.details,
    };
    setProducts([...products, newProduct]);
  };

  const updateProduct = (id: number) => {
    // TODO: PUT /products/:id
    const updatedProducts = products.map((p) =>
      p.id === id
        ? {
            ...p,
            name: formData.name,
            productId: formData.productId,
            category: formData.category,
            price: parseFloat(formData.price) || 0,
            stock: parseInt(formData.stock) || 0,
            stockAlert: parseInt(formData.stockAlert) || 10,
            details: formData.details,
          }
        : p
    );
    setProducts(updatedProducts);
  };

  const deleteProduct = (id: number) => {
    // TODO: DELETE /products/:id
    setProducts(products.filter((p) => p.id !== id));
  };

  // ─── Dynamic Header Title ───────────────────────────────────
  const headerTitle =
    viewMode === "list"
      ? "Product"
      : formMode === "add"
      ? "New Product"
      : "Edit Product";

  return (
    <AppLayout title={headerTitle}>
      <div className="product-content">

        {/* ═══ LIST VIEW ═══ */}
        {viewMode === "list" && (
          <>
            <div className="product-header-row">
              <h2 className="product-title">All product</h2>
            </div>

            {/* Toolbar: Search + Filter + Add */}
            <div className="product-toolbar">
              <div className="product-search-wrapper">
                <Search size={16} className="product-search-icon" />
                <input
                  type="text"
                  className="product-search-input"
                  placeholder="Search"
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

            {/* Product Table */}
            <div className="product-table-card">
              <div className="product-table-wrapper">
                <table className="product-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>
                        <input type="checkbox" className="product-checkbox" />
                      </th>
                      <th>Product</th>
                      <th>Product Id</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#8c8a94" }}>
                          No products found
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => (
                        <tr key={product.id}>
                          <td>
                            <input type="checkbox" className="product-checkbox" />
                          </td>
                          <td style={{ fontWeight: 600 }}>{product.name}</td>
                          <td>{product.productId}</td>
                          <td>{product.category}</td>
                          <td>${product.price.toLocaleString()}</td>
                          <td>
                            <span className={product.stock > 100 ? "stock-low" : "stock-normal"}>
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

        {/* ═══ FORM VIEW (ADD / EDIT) ═══ */}
        {viewMode === "form" && (
          <div className="product-form-container">
            <h3 className="product-form-breadcrumb">Product details</h3>

            <div className="product-form-card">
              {/* Row 1: Product Name + Product ID */}
              <div className="product-form-row">
                <div className="product-form-group">
                  <label className="product-form-label">Product Name</label>
                  <input
                    type="text"
                    className="product-form-input"
                    placeholder="Product Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="product-form-group">
                  <label className="product-form-label">Product ID</label>
                  <input
                    type="text"
                    className="product-form-input"
                    placeholder="#364738"
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 2: Category + Price */}
              <div className="product-form-row">
                <div className="product-form-group">
                  <label className="product-form-label">Category</label>
                  <input
                    type="text"
                    className="product-form-input"
                    placeholder="Category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <div className="product-form-group">
                  <label className="product-form-label">Price</label>
                  <input
                    type="text"
                    className="product-form-input"
                    placeholder="$.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 3: Product Quantity + Stock Alert */}
              <div className="product-form-row">
                <div className="product-form-group">
                  <label className="product-form-label">Product Quantity</label>
                  <input
                    type="text"
                    className="product-form-input"
                    placeholder="Product Quantity"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  />
                </div>
                <div className="product-form-group">
                  <label className="product-form-label">Stock Alert</label>
                  <input
                    type="text"
                    className="product-form-input"
                    placeholder="Enter Stock Alert"
                    value={formData.stockAlert}
                    onChange={(e) => setFormData({ ...formData, stockAlert: e.target.value })}
                  />
                </div>
              </div>

              {/* Details Textarea (full width) */}
              <div className="product-form-group" style={{ marginBottom: 24 }}>
                <label className="product-form-label">Details</label>
                <textarea
                  className="product-form-textarea"
                  placeholder="Enter product details..."
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                />
              </div>

              {/* Upload Images */}
              <div className="product-form-group">
                <label className="product-form-label">Upload Images</label>
                <div className="product-upload-area">
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "#b5b3bb" }}>
                    <ImageIcon size={24} />
                    <span style={{ fontSize: "12px" }}>Click or drag</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="product-form-actions">
                <button className="product-btn product-btn-secondary" onClick={handleCancelClick}>
                  Cancel
                </button>
                <button className="product-btn product-btn-primary" onClick={handleSaveClick}>
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
