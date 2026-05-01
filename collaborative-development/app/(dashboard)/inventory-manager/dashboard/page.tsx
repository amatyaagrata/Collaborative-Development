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
  const { data: products, loading: productsLoading } = useProducts();
  
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10).length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const totalValue = products.reduce((acc, p) => acc + p.price * p.stock, 0);
    return { totalProducts, lowStock, outOfStock, totalValue };
  }, [products]);

  const lowStockItems = useMemo(() => {
    return products.filter(p => p.stock <= 10).sort((a, b) => a.stock - b.stock);
  }, [products]);

  if (productsLoading) {
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
