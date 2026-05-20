"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Package, Calendar, Hash, AlertCircle, Loader2, X, Edit2, Trash2, DollarSign, Box, Tag, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import "./product.css";

interface Product { 
  id: string; 
  name: string; 
  category_id: string | null; 
  categories?: { name: string }; 
  selling_price: number;
  current_stock: number;
  min_stock_level: number;
  created_at: string; 
  updated_at?: string;
  description?: string;
}

export default function IMProductsPage() {
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    selling_price: "",
    current_stock: "",
    min_stock_level: ""
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("Auth error:", authError);
        toast.error("Please log in again");
        setLoading(false);
        return;
      }

      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('id, org_id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError) {
        console.error("User fetch error:", userError);
        toast.error("Failed to load user profile");
        setLoading(false);
        return;
      }

      if (!userRow?.org_id) {
        console.log("No organization found for user");
        setProducts([]);
        setLoading(false);
        return;
      }

      const { data: prodData, error: prodError } = await supabase
        .from("products")
        .select(`
          id,
          name,
          category_id,
          selling_price,
          current_stock,
          min_stock_level,
          created_at,
          updated_at,
          categories:category_id (name)
        `)
        .eq("org_id", userRow.org_id)
        .order("created_at", { ascending: false });

      if (prodError) {
        console.error("Products fetch error:", prodError);
        toast.error("Failed to load products");
        setProducts([]);
      } else {
        console.log("Products loaded:", prodData?.length || 0);
        const mapped = (prodData || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          category_id: p.category_id,
          selling_price: p.selling_price,
          current_stock: p.current_stock,
          min_stock_level: p.min_stock_level,
          created_at: p.created_at,
          updated_at: p.updated_at,
          categories: Array.isArray(p.categories) ? p.categories[0] : p.categories
        })) as Product[];
        setProducts(mapped);
      }

    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredProducts = useMemo(() => {
    return products
      .map((p, index) => ({
        ...p,
        categoryName: p.categories?.name || "Uncategorized",
        isLowStock: (p.current_stock || 0) < (p.min_stock_level || 10),
        productNumber: `PRD-${(index + 1).toString().padStart(4, '0')}`,
        formattedDate: p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A',
        stockStatus: (p.current_stock || 0) === 0 ? "Out of Stock" : 
                     (p.current_stock || 0) < (p.min_stock_level || 10) ? "Low Stock" : "In Stock",
        stockValue: ((p.current_stock || 0) * (p.selling_price || 0))
      }))
      .filter((p) => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.productNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.selling_price.toString().includes(searchQuery)
      );
  }, [products, searchQuery]);

  const totalStock = products.reduce((sum, p) => sum + (p.current_stock || 0), 0);
  const lowStockCount = products.filter(p => (p.current_stock || 0) < (p.min_stock_level || 10)).length;
  const totalValue = products.reduce((sum, p) => sum + ((p.current_stock || 0) * (p.selling_price || 0)), 0);

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setIsEditing(false);
    setEditFormData({
      name: product.name,
      selling_price: product.selling_price.toString(),
      current_stock: product.current_stock.toString(),
      min_stock_level: product.min_stock_level?.toString() || "10"
    });
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveEdit = async () => {
    if (!selectedProduct) return;

    if (!editFormData.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    const sellingPrice = parseFloat(editFormData.selling_price);
    if (isNaN(sellingPrice) || sellingPrice < 0) {
      toast.error("Valid selling price is required");
      return;
    }

    const currentStock = parseInt(editFormData.current_stock);
    if (isNaN(currentStock) || currentStock < 0) {
      toast.error("Valid stock quantity is required");
      return;
    }

    const minStockLevel = parseInt(editFormData.min_stock_level);
    if (isNaN(minStockLevel) || minStockLevel < 0) {
      toast.error("Valid minimum stock level is required");
      return;
    }

    try {
      const { error } = await supabase
        .from("products")
        .update({
          name: editFormData.name.trim(),
          selling_price: sellingPrice,
          current_stock: currentStock,
          min_stock_level: minStockLevel,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedProduct.id);

      if (error) {
        toast.error("Failed to update product: " + error.message);
        return;
      }

      toast.success("Product updated successfully!");
      
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === selectedProduct.id 
            ? { 
                ...p, 
                name: editFormData.name.trim(),
                selling_price: sellingPrice,
                current_stock: currentStock,
                min_stock_level: minStockLevel,
                updated_at: new Date().toISOString()
              }
            : p
        )
      );

      setSelectedProduct({
        ...selectedProduct,
        name: editFormData.name.trim(),
        selling_price: sellingPrice,
        current_stock: currentStock,
        min_stock_level: minStockLevel,
        updated_at: new Date().toISOString()
      });
      
      setIsEditing(false);
    } catch (err) {
      console.error("Update error:", err);
      toast.error("An unexpected error occurred");
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    
    if (!confirm(`Are you sure you want to delete "${selectedProduct.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", selectedProduct.id);

      if (error) {
        toast.error("Failed to delete product: " + error.message);
        return;
      }

      toast.success("Product deleted successfully!");
      setProducts(prevProducts => prevProducts.filter(p => p.id !== selectedProduct.id));
      handleCloseModal();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("An unexpected error occurred");
    }
  };

  return (
    <>
      <div className="products-content">
        <div className="products-header-row">
          <div>
            <h2 className="products-title">Inventory</h2>
            <p className="products-subtitle">Manage your product inventory</p>
          </div>
        </div>

        <div className="products-stats-grid">
          <div className="stat-card">
            <div className="stat-icon"><Package size={24} /></div>
            <div className="stat-info">
              <h3>{products.length}</h3>
              <p>Total Products</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><Package size={24} /></div>
            <div className="stat-info">
              <h3>{totalStock}</h3>
              <p>Total Stock Units</p>
            </div>
          </div>
          <div className="stat-card warning">
            <div className="stat-icon"><AlertCircle size={24} /></div>
            <div className="stat-info">
              <h3>{lowStockCount}</h3>
              <p>Low Stock Items</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><Package size={24} /></div>
            <div className="stat-info">
              <h3>₹{totalValue.toLocaleString()}</h3>
              <p>Total Value</p>
            </div>
          </div>
        </div>

        <div className="products-search-wrapper">
          <Search size={18} className="products-search-icon" />
          <input 
            type="text" 
            className="products-search-input" 
            placeholder="Search by name, category, or price..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </div>

        {loading ? (
          <div className="loading-container">
            <Loader2 size={32} className="animate-spin" />
            <p>Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <Package size={48} />
            <p>No products found</p>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 }}>Products will appear here once added to your inventory.</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                className="product-card"
                onClick={() => handleProductClick(product)}
                style={{ cursor: "pointer" }}
              >
                <div className="product-card-header">
                  <div className="product-badges">
                    <span className="product-id-badge-large"><Hash size={14} />{product.productNumber}</span>
                    <span className={`stock-badge ${product.stockStatus.toLowerCase().replace(' ', '-')}`}>
                      {product.stockStatus}
                    </span>
                  </div>
                  <h4 className="product-name">{product.name}</h4>
                  <div className="product-price">₹{product.selling_price.toLocaleString()}</div>
                </div>
                <div className="product-card-body">
                  <div className="product-info-row">
                    <span className="info-label">Category:</span>
                    <span className="info-value">{product.categoryName}</span>
                  </div>
                  <div className="product-info-row">
                    <span className="info-label">Stock:</span>
                    <span className={`info-value ${product.isLowStock ? 'stock-low' : 'stock-normal'}`}>
                      {product.current_stock || 0} units{product.isLowStock && " ⚠️"}
                    </span>
                  </div>
                  <div className="product-info-row">
                    <span className="info-label">Min Stock Level:</span>
                    <span className="info-value">{product.min_stock_level || 10} units</span>
                  </div>
                  <div className="product-info-row">
                    <span className="info-label"><Calendar size={14} />Added:</span>
                    <span className="info-value">{product.formattedDate}</span>
                  </div>
                </div>
                <div className="product-card-footer">
                  <div className="product-uuid">ID: {product.id.slice(0, 8)}...</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  {isEditing ? "Edit Product" : selectedProduct.name}
                </h3>
                {!isEditing && (
                  <span className={`modal-stock-badge ${selectedProduct.stockStatus.toLowerCase().replace(' ', '-')}`}>
                    {selectedProduct.stockStatus}
                  </span>
                )}
              </div>
              <button className="modal-close" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {!isEditing ? (
                <>
                  <div className="modal-product-code">
                    <Hash size={16} />
                    <span>Product Code: {selectedProduct.productNumber}</span>
                  </div>

                  <div className="modal-details-grid">
                    <div className="detail-card">
                      <div className="detail-icon"><Package size={20} /></div>
                      <div className="detail-content">
                        <label>Current Stock</label>
                        <div className="detail-value">{selectedProduct.current_stock || 0} units</div>
                        {selectedProduct.isLowStock && (
                          <div className="detail-warning">Minimum stock level: {selectedProduct.min_stock_level || 10} units</div>
                        )}
                      </div>
                    </div>

                    <div className="detail-card">
                      <div className="detail-icon"><DollarSign size={20} /></div>
                      <div className="detail-content">
                        <label>Selling Price</label>
                        <div className="detail-value">₹{selectedProduct.selling_price.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="detail-card">
                      <div className="detail-icon"><Box size={20} /></div>
                      <div className="detail-content">
                        <label>Stock Value</label>
                        <div className="detail-value">₹{selectedProduct.stockValue.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="detail-card">
                      <div className="detail-icon"><Tag size={20} /></div>
                      <div className="detail-content">
                        <label>Category</label>
                        <div className="detail-value">{selectedProduct.categoryName}</div>
                      </div>
                    </div>
                  </div>

                  <div className="detail-info-row">
                    <label>Product ID (UUID)</label>
                    <div className="detail-uuid">{selectedProduct.id}</div>
                  </div>

                  <div className="detail-info-row">
                    <label>Date Added</label>
                    <div className="detail-date">
                      {selectedProduct.formattedDate}
                      {selectedProduct.updated_at && selectedProduct.updated_at !== selectedProduct.created_at && (
                        <span className="detail-updated">
                          (Updated: {new Date(selectedProduct.updated_at).toLocaleDateString()})
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedProduct.min_stock_level && (
                    <div className="detail-info-row">
                      <label>Minimum Stock Level</label>
                      <div className="detail-value-small">{selectedProduct.min_stock_level} units</div>
                    </div>
                  )}

                  <div className="modal-actions">
                    <button className="modal-action-btn edit" onClick={handleEditClick}>
                      <Edit2 size={16} /> Edit Product
                    </button>
                    <button className="modal-action-btn delete" onClick={handleDeleteProduct}>
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="edit-form">
                    <div className="edit-form-group">
                      <label className="edit-form-label">Product Name *</label>
                      <input
                        type="text"
                        name="name"
                        className="edit-form-input"
                        value={editFormData.name}
                        onChange={handleEditFormChange}
                        placeholder="Enter product name"
                      />
                    </div>

                    <div className="edit-form-row">
                      <div className="edit-form-group">
                        <label className="edit-form-label">Selling Price (₹) *</label>
                        <input
                          type="number"
                          name="selling_price"
                          className="edit-form-input"
                          value={editFormData.selling_price}
                          onChange={handleEditFormChange}
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className="edit-form-group">
                        <label className="edit-form-label">Current Stock *</label>
                        <input
                          type="number"
                          name="current_stock"
                          className="edit-form-input"
                          value={editFormData.current_stock}
                          onChange={handleEditFormChange}
                          placeholder="0"
                          min="0"
                          step="1"
                        />
                      </div>
                    </div>

                    <div className="edit-form-group">
                      <label className="edit-form-label">Minimum Stock Level *</label>
                      <input
                        type="number"
                        name="min_stock_level"
                        className="edit-form-input"
                        value={editFormData.min_stock_level}
                        onChange={handleEditFormChange}
                        placeholder="10"
                        min="0"
                        step="1"
                      />
                    </div>

                    <div className="edit-form-info">
                      <p className="edit-form-note">
                        <AlertCircle size={14} />
                        Setting a minimum stock level helps you track when to reorder products
                      </p>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button className="modal-action-btn cancel" onClick={() => setIsEditing(false)}>
                      Cancel
                    </button>
                    <button className="modal-action-btn save" onClick={handleSaveEdit}>
                      <Save size={16} /> Save Changes
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}