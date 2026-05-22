"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Package, Loader2, Plus, Edit2, Trash2, AlertCircle, DollarSign, Box, Calendar, Hash } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  selling_price: number;
  current_stock: number;
  min_stock_level: number;
  sku: string;
  category_id: string;
  categories: { name: string };
  created_at: string;
}

export default function InventoryManagerProductsPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: userRow } = await supabase
        .from("users")
        .select("org_id")
        .eq("auth_user_id", user.id)
        .single();
      
      if (userRow?.org_id) {
        setOrgId(userRow.org_id);
        
        const { data, error } = await supabase
          .from("products")
          .select(`
            id,
            name,
            selling_price,
            current_stock,
            min_stock_level,
            sku,
            category_id,
            created_at,
            categories:category_id (name)
          `)
          .eq("org_id", userRow.org_id)
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        setProducts(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalStock = products.reduce((sum, p) => sum + (p.current_stock || 0), 0);
  const totalValue = products.reduce((sum, p) => sum + ((p.current_stock || 0) * (p.selling_price || 0)), 0);
  const lowStockCount = products.filter(p => (p.current_stock || 0) < (p.min_stock_level || 10)).length;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Loader2 size={40} className="animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1e1b4b", margin: "0 0 4px 0" }}>Inventory Products</h1>
        <p style={{ color: "#64748b", margin: 0 }}>Products currently in your warehouse stock</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "white", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: "12px", color: "#64748b" }}>Total Products</p>
          <p style={{ fontSize: "28px", fontWeight: "bold", color: "#1e1b4b" }}>{products.length}</p>
        </div>
        <div style={{ background: "white", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: "12px", color: "#64748b" }}>Total Stock</p>
          <p style={{ fontSize: "28px", fontWeight: "bold", color: "#1e1b4b" }}>{totalStock} units</p>
        </div>
        <div style={{ background: "white", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0", background: lowStockCount > 0 ? "#fef2f2" : "white" }}>
          <p style={{ fontSize: "12px", color: "#64748b" }}>Low Stock Items</p>
          <p style={{ fontSize: "28px", fontWeight: "bold", color: lowStockCount > 0 ? "#dc2626" : "#1e1b4b" }}>{lowStockCount}</p>
        </div>
        <div style={{ background: "white", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: "12px", color: "#64748b" }}>Total Value</p>
          <p style={{ fontSize: "28px", fontWeight: "bold", color: "#10b981" }}>₹{totalValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ position: "relative", maxWidth: "400px" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: "10px 12px 10px 38px", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "14px", outline: "none" }}
          />
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", background: "white", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <Package size={48} style={{ margin: "0 auto 12px", color: "#cbd5e1" }} />
          <p>No products found in inventory</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {filteredProducts.map((product) => (
            <div key={product.id} style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", background: "linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#7c3aed", background: "#f3e8ff", padding: "4px 10px", borderRadius: "20px" }}>
                    {product.sku || "No SKU"}
                  </span>
                  <span style={{ 
                    padding: "4px 10px", 
                    borderRadius: "20px", 
                    fontSize: "11px", 
                    fontWeight: 600,
                    background: product.current_stock === 0 ? "#fee2e2" : product.current_stock < (product.min_stock_level || 10) ? "#fef3c7" : "#dcfce7",
                    color: product.current_stock === 0 ? "#dc2626" : product.current_stock < (product.min_stock_level || 10) ? "#d97706" : "#16a34a"
                  }}>
                    {product.current_stock === 0 ? "Out of Stock" : product.current_stock < (product.min_stock_level || 10) ? "Low Stock" : "In Stock"}
                  </span>
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: "8px 0 4px 0" }}>{product.name}</h3>
                <p style={{ fontSize: "20px", fontWeight: "bold", color: "#7c3aed", margin: "8px 0 0 0" }}>₹{product.selling_price?.toLocaleString()}</p>
              </div>
              <div style={{ padding: "16px 20px", background: "#fafbfc" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Box size={14} color="#64748b" />
                    <span style={{ fontSize: "13px" }}>Stock: {product.current_stock} units</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Calendar size={14} color="#64748b" />
                    <span style={{ fontSize: "13px" }}>Added: {new Date(product.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {product.categories?.name && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #e2e8f0" }}>
                    <Hash size={14} color="#64748b" />
                    <span style={{ fontSize: "13px", color: "#64748b" }}>Category: {product.categories.name}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
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