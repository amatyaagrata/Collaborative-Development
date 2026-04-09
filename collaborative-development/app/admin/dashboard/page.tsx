"use client";

import dynamic from "next/dynamic";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import {
  adminStats,
  adminProductSummary,
  adminTrendingProducts,
  adminSalesData,
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

export default function AdminDashboardPage() {
  return (
    <AdminLayout title="Dashboard">
      <div className="admin-dashboard-content">

        {/* ─── Activity Section ─────────────────────────────── */}
        <div className="admin-activity-card">
          <h2 className="admin-activity-header">Activity</h2>
          <div className="admin-stat-cards-grid">
            <AdminStatCard
              label="Inventory Value"
              value={adminStats.inventoryValue}
              delay={0}
            />
            <AdminStatCard
              label="Total Stocks"
              value={adminStats.totalStocks}
              delay={50}
            />
            <AdminStatCard
              label="New Orders"
              value={adminStats.newOrders}
              delay={100}
            />
            <AdminStatCard
              label="Delivered"
              value={adminStats.delivered}
              delay={150}
            />
          </div>
        </div>

        {/* ─── Charts Row ───────────────────────────────────── */}
        <div className="admin-charts-row">

          {/* Product Summary (Donut Chart) */}
          <AdminDashboardCharts
            productSummary={adminProductSummary}
            salesData={adminSalesData}
          />

          {/* Trending Products Table */}
          <div className="admin-chart-card admin-trending-card" style={{ animationDelay: "250ms" }}>
            <div className="admin-trending-header">
              <h3 className="admin-chart-card-title">Tranding Product</h3>
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
                  {adminTrendingProducts.map((item) => (
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
                  {adminTrendingProducts.length === 0 && (
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
