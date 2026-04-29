"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import {
  adminStats as fallbackStats,
  adminProductSummary as fallbackProductSummary,
  adminTrendingProducts as fallbackTrendingProducts,
  adminSalesData as fallbackSalesData,
  type AdminTrendingProduct,
  type AdminSalesDataPoint,
} from "@/lib/data/adminDashboardData";
import "./dashboard.css";

const AdminDashboardCharts = dynamic(
  () =>
    import("@/components/admin/AdminDashboardCharts").then(
      (mod) => mod.AdminDashboardCharts
    ),
  {
    ssr: false,
    loading: () => <div className="admin-chart-card">Loading charts...</div>,
  }
);

interface DashboardStats {
  inventoryValue: string;
  totalStocks: string;
  newOrders: string;
  delivered: string;
}

interface ProductSummary {
  quantityInHand: number;
  toBeReceived: number;
  percentage: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(fallbackStats);
  const [productSummary, setProductSummary] = useState<ProductSummary>(fallbackProductSummary);
  const [trendingProducts, setTrendingProducts] = useState<AdminTrendingProduct[]>(fallbackTrendingProducts);
  const [salesData, setSalesData] = useState<AdminSalesDataPoint[]>(fallbackSalesData);
  const [isLive, setIsLive] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const json = await res.json();

      if (!res.ok) {
        console.error("[DASHBOARD] API error:", json.error);
        return; // Keep fallback data
      }

      if (json.stats) setStats(json.stats);
      if (json.productSummary) setProductSummary(json.productSummary);
      if (json.trendingProducts?.length > 0) setTrendingProducts(json.trendingProducts);
      if (json.salesData) setSalesData(json.salesData);
      setIsLive(true);
    } catch (err) {
      console.error("[DASHBOARD] Fetch error:", err);
      // Keep fallback data on error
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <AdminLayout title="Dashboard">
      <div className="admin-dashboard-content">

        {/* ─── Live indicator ─────────────────────────────────── */}
        {isLive && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", fontSize: "12px", color: "#22c55e" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            Live data from Supabase
          </div>
        )}

        {/* ─── Activity Section ─────────────────────────────── */}
        <div className="admin-activity-card">
          <h2 className="admin-activity-header">Activity</h2>
          <div className="admin-stat-cards-grid">
            <AdminStatCard
              label="Inventory Value"
              value={stats.inventoryValue}
              delay={0}
            />
            <AdminStatCard
              label="Total Stocks"
              value={stats.totalStocks}
              delay={50}
            />
            <AdminStatCard
              label="New Orders"
              value={stats.newOrders}
              delay={100}
            />
            <AdminStatCard
              label="Delivered"
              value={stats.delivered}
              delay={150}
            />
          </div>
        </div>

        {/* ─── Charts Row ───────────────────────────────────── */}
        <div className="admin-charts-row">

          {/* Product Summary (Donut Chart) */}
          <AdminDashboardCharts
            productSummary={productSummary}
            salesData={salesData}
          />

          {/* Trending Products Table */}
          <div className="admin-chart-card admin-trending-card" style={{ animationDelay: "250ms" }}>
            <div className="admin-trending-header">
              <h3 className="admin-chart-card-title">Trending Product</h3>
            </div>
            <div className="admin-trending-table-wrapper">
              <table className="admin-trending-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Product</th>
                    <th>Suppliers</th>
                    <th>Product Id</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {trendingProducts.map((item) => (
                    <tr key={item.id}>
                      <td><div className="admin-product-avatar"></div></td>
                      <td className="admin-font-medium">{item.product}</td>
                      <td>{item.suppliers}</td>
                      <td className="admin-text-muted">{item.productId}</td>
                      <td>{item.category}</td>
                      <td>{item.price}</td>
                      <td>{item.quantity}</td>
                    </tr>
                  ))}
                  {trendingProducts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="admin-empty-state">No products yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
