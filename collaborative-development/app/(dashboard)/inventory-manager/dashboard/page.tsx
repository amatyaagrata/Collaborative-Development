"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { WelcomeMessage } from "@/components/shared/WelcomeMessage";
import { StatCard } from "@/components/dashboard/StatCard";
import { TrendingProductsTable } from "@/components/dashboard/TrendingProductsTable";
import { createClient } from "@/lib/supabase/client";
import { useProducts } from "@/lib/supabase/hooks/useProducts";
import { useOrders } from "@/lib/supabase/hooks/useOrders";
import "./dashboard.css";

const ProductSummaryChart = dynamic(
  () => import("@/components/dashboard/ProductSummaryChart").then((mod) => mod.ProductSummaryChart),
  { ssr: false, loading: () => <div className="chart-card">Loading chart...</div> }
);

const SalesPurchaseChart = dynamic(
  () => import("@/components/dashboard/SalesPurchaseChart").then((mod) => mod.SalesPurchaseChart),
  { ssr: false, loading: () => <div className="chart-card sales-chart-card">Loading chart...</div> }
);

import { Package, AlertTriangle, AlertCircle, DollarSign } from "lucide-react";
import styles from "@/components/layout/PortalLayout.module.css";

export default function IMDashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalProducts: 0, lowStock: 0, outOfStock: 0, totalValue: 0 });
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get user's org_id
        const { data: userRow } = await supabase
          .from("users")
          .select("id, org_id")
          .eq("auth_user_id", user.id)
          .single();

        if (!userRow?.org_id) return;

        // Fetch delivered products directly from products table for THIS organization
        const { data: prodData } = await supabase
          .from("products")
          .select(`
            id,
            name,
            sku,
            selling_price,
            current_stock,
            min_stock_level,
            suppliers:supplier_id (name),
            categories:category_id (name),
            order_items!inner(
              purchase_orders!inner(status)
            )
          `)
          .eq("org_id", userRow.org_id)
          .eq("order_items.purchase_orders.status", "delivered");

        // Aggregate and de-duplicate products
        const rawProducts = prodData || [];
        const uniqueProducts: Record<string, any> = {};
        rawProducts.forEach((p: any) => {
          if (!uniqueProducts[p.id]) {
            uniqueProducts[p.id] = {
              id: p.id,
              name: p.name,
              sku: p.sku || "",
              price: Number(p.selling_price || 0),
              stock: Number(p.current_stock || 0),
              min_stock_level: Number(p.min_stock_level || 0),
              suppliers: Array.isArray(p.suppliers) ? p.suppliers[0] : p.suppliers,
              categories: Array.isArray(p.categories) ? p.categories[0] : p.categories
            };
          }
        });

        const inventory = Object.values(uniqueProducts);
        const totalProducts = inventory.length;
        const lowStock = inventory.filter(p => p.stock > 0 && p.stock <= 10).length;
        const outOfStock = inventory.filter(p => p.stock === 0).length;
        const totalValue = inventory.reduce((acc, p) => acc + p.price * p.stock, 0);

        setStats({ totalProducts, lowStock, outOfStock, totalValue });
        setLowStockItems(inventory.filter(p => p.stock <= 10).sort((a, b) => a.stock - b.stock));
        setProducts(inventory);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [supabase]);

  if (loading) {
    return (
      <>
        <div className={styles.loadingState}>Loading dashboard...</div>
      </>
    );
  }

  return (
    <>
      <WelcomeMessage roleOverride="Inventory Manager" />
      <div className={styles.pageStack}>
        <div className={styles.statsGrid}>
          <div className={styles.metricCard}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Package size={16} color="#7c3aed"/><h3 className={styles.metricLabel}>Total Products</h3></div>
            <p className={styles.metricValue}>{stats.totalProducts}</p>
          </div>
          <div className={styles.metricCard}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><AlertTriangle size={16} color="#f59e0b"/><h3 className={styles.metricLabel}>Low Stock</h3></div>
            <p className={styles.metricValue}>{stats.lowStock}</p>
          </div>
          <div className={styles.metricCard}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><AlertCircle size={16} color="#ef4444"/><h3 className={styles.metricLabel}>Out of Stock</h3></div>
            <p className={styles.metricValue}>{stats.outOfStock}</p>
          </div>
          <div className={styles.metricCard}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><DollarSign size={16} color="#10b981"/><h3 className={styles.metricLabel}>Total Value</h3></div>
            <p className={styles.metricValue}>Rs. {stats.totalValue.toLocaleString()}</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "24px" }}>
          {/* Product Summary */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Top Products</h2>
            </div>
            <TrendingProductsTable products={products.slice(0, 5)} />
          </div>

          {/* Stock Alerts */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Stock Alerts</h2>
            </div>
            {lowStockItems.length > 0 ? (
              <div className={styles.dataTable} style={{ display: "block" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #f1f5f9", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase" }}>Product</th>
                      <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #f1f5f9", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase" }}>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.slice(0, 5).map(item => (
                      <tr key={item.id}>
                        <td style={{ padding: "12px 8px", borderBottom: "1px solid #f1f5f9", fontWeight: 500 }}>{item.name}</td>
                        <td style={{ padding: "12px 8px", borderBottom: "1px solid #f1f5f9", textAlign: "right" }}>
                          <span className={item.stock === 0 ? styles.badgeDanger : styles.badgeWarning}>{item.stock}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.emptyState}>No low stock items!</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
