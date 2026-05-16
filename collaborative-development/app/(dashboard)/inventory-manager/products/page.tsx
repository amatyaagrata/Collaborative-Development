"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Package, Calendar, Hash, AlertCircle, Loader2 } from "lucide-react";
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
}

export default function IMProductsPage() {
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("Auth error:", authError);
        toast.error("Please log in again");
        setLoading(false);
        return;
      }

      // Get user's organization - FIXED: use org_id
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

      // ONLY SHOW PRODUCTS THAT HAVE BEEN DELIVERED VIA PURCHASE ORDERS
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
          categories:category_id (name),
          order_items!inner(
            purchase_orders!inner(status)
          )
        `)
        .eq("org_id", userRow.org_id)
        .eq("order_items.purchase_orders.status", "delivered")
        .order("created_at", { ascending: false });

      if (prodError) {
        // If error is PGRST204 (No results because of !inner), it's not a real error for the user
        if (prodError.code === 'PGRST204' || prodError.message?.includes('0 rows')) {
          setProducts([]);
        } else {
          console.error("Products fetch error:", prodError);
          toast.error("Failed to load products");
          setProducts([]);
        }
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
        isLowStock: p.current_stock < (p.min_stock_level || 10),
        productNumber: `PRD-${(index + 1).toString().padStart(4, '0')}`,
        formattedDate: new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      }))
      .filter((p) => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.productNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.selling_price.toString().includes(searchQuery)
      );
  }, [products, searchQuery]);

  const totalStock = products.reduce((sum, p) => sum + (p.current_stock || 0), 0);
  const lowStockCount = products.filter(p => p.current_stock < (p.min_stock_level || 10)).length;
  const totalValue = products.reduce((sum, p) => sum + ((p.current_stock || 0) * (p.selling_price || 0)), 0);

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
              <div key={product.id} className="product-card">
                <div className="product-card-header">
                  <div className="product-badges">
                    <span className="product-id-badge-large"><Hash size={14} />{product.productNumber}</span>
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
                      {product.current_stock} units{product.isLowStock && " ⚠️ Low stock!"}
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