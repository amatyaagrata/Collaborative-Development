"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Package, Calendar, Hash } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import "./product.css";

interface Product { id: string; name: string; category_id: string | null; categories?: { name: string }; price: number; stock: number; created_at: string; deliveredQty?: number; }

export default function IMProductsPage() {
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const { data: userRow } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('auth_user_id', userData.user?.id || '')
      .single();

    if (userRow?.organization_id) {
      // Step 1: Get orders placed by THIS IM that have been delivered
      const { data: deliveredOrders } = await supabase
        .from("orders")
        .select("id")
        .eq("organization_id", userRow.organization_id)
        .eq("user_id", userRow.id)
        .or("delivery_status.eq.delivered,status.eq.delivered");

      if (deliveredOrders && deliveredOrders.length > 0) {
        const orderIds = deliveredOrders.map(o => o.id);

        // Step 2: Get product IDs and quantities from delivered order items
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("product_id, quantity")
          .in("order_id", orderIds);

        // Aggregate delivered quantities per product
        const productQtyMap: Record<string, number> = {};
        (orderItems || []).forEach(item => {
          if (item.product_id) {
            productQtyMap[item.product_id] = (productQtyMap[item.product_id] || 0) + (item.quantity || 0);
          }
        });

        const productIds = Object.keys(productQtyMap);

        if (productIds.length > 0) {
          // Step 3: Fetch only those delivered products
          const { data: prodData } = await supabase
            .from("products")
            .select("*, categories(name)")
            .in("id", productIds)
            .order("created_at", { ascending: false });

          if (prodData) {
            setProducts(prodData.map(p => ({
              ...p,
              deliveredQty: productQtyMap[p.id] || 0,
            })));
          }
        } else {
          setProducts([]);
        }
      } else {
        setProducts([]);
      }
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredProducts = useMemo(() => {
    return products
      .map((p, index) => ({
        ...p,
        categoryName: p.categories?.name || "Uncategorized",
        isLowStock: p.stock < 10,
        productNumber: `PRD-${(index + 1).toString().padStart(4, '0')}`,
        formattedDate: new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      }))
      .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) || p.productNumber.toLowerCase().includes(searchQuery.toLowerCase()) || p.price.toString().includes(searchQuery));
  }, [products, searchQuery]);

  return (
    <>
      <div className="products-content">
        <div className="products-header-row">
          <div>
            <h2 className="products-title">Inventory</h2>
            <p className="products-subtitle">Products received from delivered orders</p>
          </div>
        </div>

        <div className="products-stats-grid">
          <div className="stat-card">
            <div className="stat-icon"><Package size={24} /></div>
            <div className="stat-info">
              <h3>{filteredProducts.length}</h3>
              <p>Total Products</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><Package size={24} /></div>
            <div className="stat-info">
              <h3>{products.reduce((sum, p) => sum + (p.deliveredQty || p.stock), 0)}</h3>
              <p>Total Delivered Units</p>
            </div>
          </div>
          <div className="stat-card warning">
            <div className="stat-icon"><Package size={24} /></div>
            <div className="stat-info">
              <h3>{products.filter(p => p.stock < 10).length}</h3>
              <p>Low Stock Items</p>
            </div>
          </div>
        </div>

        <div className="products-search-wrapper">
          <Search size={18} className="products-search-icon" />
          <input 
            type="text" 
            className="products-search-input" 
            placeholder="Search by name, ID, category, or price..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <Package size={48} />
            <p>No delivered products yet</p>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 }}>Products will appear here once orders are delivered by a transporter.</p>
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
                  <div className="product-price">Rs. {product.price.toLocaleString()}</div>
                </div>
                <div className="product-card-body">
                  <div className="product-info-row">
                    <span className="info-label">Category:</span>
                    <span className="info-value">{product.categoryName}</span>
                  </div>
                  <div className="product-info-row">
                    <span className="info-label">Stock:</span>
                    <span className={`info-value ${product.isLowStock ? 'stock-low' : 'stock-normal'}`}>
                      {product.stock} units{product.isLowStock && " ⚠️ Low stock!"}
                    </span>
                  </div>
                  <div className="product-info-row">
                    <span className="info-label"><Calendar size={14} />Added:</span>
                    <span className="info-value">{product.formattedDate}</span>
                  </div>
                </div>
                <div className="product-card-footer">
                  <div className="product-uuid">UUID: {product.id.slice(0, 8)}...</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
