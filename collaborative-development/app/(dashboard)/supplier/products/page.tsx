"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Package, Loader2, Plus, Edit2, Trash2, AlertCircle, DollarSign, Box, Truck, Hash, Calendar } from "lucide-react";
import { toast } from "sonner";

interface SupplierProduct {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  sku: string;
  category: string;
  is_available: boolean;
  created_at: string;
}

export default function SupplierProductsPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SupplierProduct | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    price: "",
    stock_quantity: "",
    category: "",
    is_available: true,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: supplier } = await supabase
        .from("suppliers")
        .select("id")
        .eq("email", user.email)
        .single();
      
      if (!supplier) {
        setLoading(false);
        return;
      }
      
      setSupplierId(supplier.id);
      
      const { data, error } = await supabase
        .from("supplier_products")
        .select("*")
        .eq("supplier_id", supplier.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setProducts(data || []);
      
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      toast.error("Valid price is required");
      return;
    }

    const stockQuantity = parseInt(formData.stock_quantity);
    if (isNaN(stockQuantity) || stockQuantity < 0) {
      toast.error("Valid stock quantity is required");
      return;
    }

    if (!supplierId) {
      toast.error("Supplier profile not found");
      return;
    }

    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    const { data: supplier } = await supabase
      .from("suppliers")
      .select("org_id")
      .eq("email", user?.email)
      .single();

    const payload = {
      supplier_id: supplierId,
      org_id: supplier?.org_id,
      name: formData.name.trim(),
      sku: formData.sku.trim() || null,
      price: price,
      stock_quantity: stockQuantity,
      min_stock_level: 5,
      unit: "pcs",
      category: formData.category.trim() || null,
      is_available: formData.is_available,
    };

    const { error } = await supabase
      .from("supplier_products")
      .insert([payload]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Product added!");
      setShowModal(false);
      fetchProducts();
      setFormData({
        name: "",
        sku: "",
        price: "",
        stock_quantity: "",
        category: "",
        is_available: true,
      });
    }
    setSubmitting(false);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      toast.error("Valid price is required");
      return;
    }

    const stockQuantity = parseInt(formData.stock_quantity);
    if (isNaN(stockQuantity) || stockQuantity < 0) {
      toast.error("Valid stock quantity is required");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from("supplier_products")
      .update({
        name: formData.name.trim(),
        sku: formData.sku.trim() || null,
        price: price,
        stock_quantity: stockQuantity,
        category: formData.category.trim() || null,
        is_available: formData.is_available,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingProduct.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Product updated!");
      setShowModal(false);
      setEditingProduct(null);
      fetchProducts();
    }
    setSubmitting(false);
  };

  const handleDeleteProduct = async (product: SupplierProduct) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;

    const { error } = await supabase
      .from("supplier_products")
      .delete()
      .eq("id", product.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Product deleted!");
      fetchProducts();
    }
  };

  const toggleAvailability = async (product: SupplierProduct) => {
    const { error } = await supabase
      .from("supplier_products")
      .update({ is_available: !product.is_available })
      .eq("id", product.id);

    if (error) {
      toast.error(error.message);
    } else {
      setProducts(prev => prev.map(p =>
        p.id === product.id ? { ...p, is_available: !p.is_available } : p
      ));
      toast.success(`Product ${!product.is_available ? "available" : "unavailable"}`);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalStock = products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);
  const totalValue = products.reduce((sum, p) => sum + ((p.stock_quantity || 0) * (p.price || 0)), 0);
  const lowStockCount = products.filter(p => (p.stock_quantity || 0) < 10).length;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f8fafc" }}>
        <Loader2 size={40} className="animate-spin" color="#7c3aed" />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1e1b4b", margin: "0 0 4px 0" }}>My Products</h1>
        <p style={{ color: "#64748b", margin: 0 }}>Products I can supply to inventory managers</p>
      </div>

      {/* Stats Cards - Purple Theme */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "white", borderRadius: "16px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px", border: "1px solid #e2e8f0" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3e8ff" }}>
            <Package size={22} color="#7c3aed" />
          </div>
          <div>
            <p style={{ fontSize: "12px", fontWeight: "500", color: "#64748b", margin: "0 0 4px 0" }}>Total Products</p>
            <p style={{ fontSize: "24px", fontWeight: "700", color: "#1e1b4b", margin: 0 }}>{products.length}</p>
          </div>
        </div>
        
        <div style={{ background: "white", borderRadius: "16px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px", border: "1px solid #e2e8f0" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3e8ff" }}>
            <Box size={22} color="#7c3aed" />
          </div>
          <div>
            <p style={{ fontSize: "12px", fontWeight: "500", color: "#64748b", margin: "0 0 4px 0" }}>Total Stock</p>
            <p style={{ fontSize: "24px", fontWeight: "700", color: "#1e1b4b", margin: 0 }}>{totalStock} units</p>
          </div>
        </div>
        
        <div style={{ borderRadius: "16px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px", border: "1px solid #e2e8f0", background: lowStockCount > 0 ? "#fef2f2" : "white" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: lowStockCount > 0 ? "#fee2e2" : "#f3e8ff" }}>
            <AlertCircle size={22} color={lowStockCount > 0 ? "#dc2626" : "#7c3aed"} />
          </div>
          <div>
            <p style={{ fontSize: "12px", fontWeight: "500", color: "#64748b", margin: "0 0 4px 0" }}>Low Stock Items</p>
            <p style={{ fontSize: "24px", fontWeight: "700", color: lowStockCount > 0 ? "#dc2626" : "#1e1b4b", margin: 0 }}>{lowStockCount}</p>
          </div>
        </div>
        
        <div style={{ background: "white", borderRadius: "16px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px", border: "1px solid #e2e8f0" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3e8ff" }}>
            <DollarSign size={22} color="#7c3aed" />
          </div>
          <div>
            <p style={{ fontSize: "12px", fontWeight: "500", color: "#64748b", margin: "0 0 4px 0" }}>Total Value</p>
            <p style={{ fontSize: "24px", fontWeight: "700", color: "#1e1b4b", margin: 0 }}>₹{totalValue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Search and Add Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
          <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Search products by name, SKU, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: "12px 16px 12px 44px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "14px", outline: "none", background: "white" }}
          />
        </div>
        
        <button
          onClick={() => {
            setEditingProduct(null);
            setFormData({
              name: "",
              sku: "",
              price: "",
              stock_quantity: "",
              category: "",
              is_available: true,
            });
            setShowModal(true);
          }}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: "#7c3aed", color: "white", border: "none", borderRadius: "12px", fontWeight: 600, cursor: "pointer" }}
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", background: "white", borderRadius: "20px", border: "1px solid #e2e8f0" }}>
          <Package size={48} style={{ margin: "0 auto 12px", color: "#cbd5e1" }} />
          <p style={{ fontWeight: 500, marginBottom: "8px" }}>No products found</p>
          <p style={{ color: "#64748b", fontSize: "14px" }}>Click "Add Product" to add items to your catalog</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
          {filteredProducts.map((product) => (
            <div key={product.id} style={{ background: "white", borderRadius: "20px", border: "1px solid #e2e8f0", overflow: "hidden", transition: "all 0.2s" }}>
              {/* Product Header - Purple Gradient */}
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", background: "linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    {product.sku && (
                      <span style={{ fontWeight: 600, color: "#7c3aed", background: "#f3e8ff", padding: "6px 12px", borderRadius: "10px", fontSize: "13px" }}>
                        <Hash size={14} style={{ display: "inline", marginRight: "4px" }} />{product.sku}
                      </span>
                    )}
                    <span style={{ 
                      padding: "4px 10px", 
                      borderRadius: "20px", 
                      fontSize: "11px", 
                      fontWeight: 600,
                      background: product.is_available ? "#dcfce7" : "#fee2e2",
                      color: product.is_available ? "#16a34a" : "#dc2626"
                    }}>
                      {product.is_available ? "Available" : "Unavailable"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button 
                      onClick={() => {
                        setEditingProduct(product);
                        setFormData({
                          name: product.name,
                          sku: product.sku || "",
                          price: product.price.toString(),
                          stock_quantity: product.stock_quantity.toString(),
                          category: product.category || "",
                          is_available: product.is_available,
                        });
                        setShowModal(true);
                      }}
                      style={{ padding: "6px", background: "#f1f5f9", border: "none", borderRadius: "6px", cursor: "pointer", color: "#64748b" }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(product)}
                      style={{ padding: "6px", background: "#fee2e2", border: "none", borderRadius: "6px", cursor: "pointer", color: "#dc2626" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#1e1b4b", margin: "8px 0 4px 0" }}>{product.name}</h3>
                <p style={{ fontSize: "24px", fontWeight: "bold", color: "#7c3aed", margin: "8px 0 0 0" }}>₹{product.price?.toLocaleString()}</p>
              </div>
              
              {/* Product Body */}
              <div style={{ padding: "16px 24px", background: "#fafbfc" }}>
                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Box size={14} color="#7c3aed" />
                    <span style={{ fontSize: "13px", color: "#475569" }}>Stock: {product.stock_quantity} units</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Truck size={14} color="#7c3aed" />
                    <span style={{ fontSize: "13px", color: "#475569" }}>Ready to supply</span>
                  </div>
                </div>
                
                {product.category && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
                    <Package size={14} color="#7c3aed" />
                    <span style={{ fontSize: "13px", color: "#64748b" }}>Category: {product.category}</span>
                  </div>
                )}
                
                {product.created_at && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                    <Calendar size={14} color="#7c3aed" />
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>Added: {new Date(product.created_at).toLocaleDateString()}</span>
                  </div>
                )}
                
                {product.stock_quantity <= 10 && (
                  <div style={{ marginTop: "16px", padding: "10px", background: "#fef2f2", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", border: "1px solid #fecaca" }}>
                    <AlertCircle size={14} color="#dc2626" />
                    <span style={{ fontSize: "12px", fontWeight: 500, color: "#dc2626" }}>Low stock alert! Only {product.stock_quantity} units available</span>
                  </div>
                )}
              </div>

              {/* Footer with Toggle Button */}
              <div style={{ padding: "12px 24px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "white" }}>
                <button
                  onClick={() => toggleAvailability(product)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 16px",
                    borderRadius: "30px",
                    border: "none",
                    cursor: "pointer",
                    background: product.is_available ? "#dcfce7" : "#fee2e2",
                    transition: "all 0.2s",
                    fontWeight: 600,
                    fontSize: "12px"
                  }}
                >
                  {product.is_available ? (
                    <>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a" }} />
                      <span style={{ color: "#16a34a" }}>Available</span>
                    </>
                  ) : (
                    <>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#dc2626" }} />
                      <span style={{ color: "#dc2626" }}>Unavailable</span>
                    </>
                  )}
                </button>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>ID: {product.id.slice(0, 8)}...</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Product Modal - Purple Theme */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: "24px", width: "90%", maxWidth: "550px", maxHeight: "90vh", overflow: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #e2e8f0", background: "#faf5ff" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#1e1b4b", margin: 0 }}>{editingProduct ? "Edit Product" : "Add New Product"}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "#f1f5f9", border: "none", width: "32px", height: "32px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>×</button>
            </div>
            <div style={{ padding: "24px" }}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#1e1b4b", marginBottom: "8px" }}>Product Name *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  placeholder="Enter product name"
                  style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "14px", outline: "none" }}
                />
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#1e1b4b", marginBottom: "8px" }}>SKU</label>
                  <input 
                    type="text" 
                    value={formData.sku} 
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })} 
                    placeholder="Optional"
                    style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "14px", outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#1e1b4b", marginBottom: "8px" }}>Category</label>
                  <input 
                    type="text" 
                    value={formData.category} 
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })} 
                    placeholder="e.g., Electronics"
                    style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "14px", outline: "none" }}
                  />
                </div>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#1e1b4b", marginBottom: "8px" }}>Price (₹) *</label>
                  <input 
                    type="number" 
                    value={formData.price} 
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })} 
                    placeholder="0.00"
                    style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "14px", outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#1e1b4b", marginBottom: "8px" }}>Stock Quantity *</label>
                  <input 
                    type="number" 
                    value={formData.stock_quantity} 
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })} 
                    placeholder="0"
                    style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "14px", outline: "none" }}
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: "24px", padding: "12px", background: "#fef3c7", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                <input 
                  type="checkbox" 
                  checked={formData.is_available} 
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })} 
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
                <label style={{ fontSize: "13px", color: "#d97706", cursor: "pointer", fontWeight: 500 }}>Mark as available for inventory managers</label>
              </div>
              
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button 
                  onClick={() => setShowModal(false)} 
                  style={{ padding: "12px 24px", border: "1px solid #e2e8f0", background: "white", borderRadius: "12px", fontWeight: 600, cursor: "pointer", color: "#64748b" }}
                >
                  Cancel
                </button>
                <button 
                  onClick={editingProduct ? handleUpdateProduct : handleAddProduct} 
                  disabled={submitting} 
                  style={{ padding: "12px 28px", border: "none", background: "#7c3aed", color: "white", borderRadius: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {submitting ? "Saving..." : (editingProduct ? "Update Product" : "Add Product")}
                </button>
              </div>
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
    </div>
  );
}