"use client";

import React from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
} from "recharts";
import {
  adminStats,
  adminProductSummary,
  adminTrendingProducts,
  adminSalesData,
} from "@/lib/data/adminDashboardData";
import "./dashboard.css";

const PIE_COLORS = ["hsl(255, 78%, 60%)", "hsl(255, 60%, 94%)"];

export default function AdminDashboardPage() {
  const { quantityInHand, toBeReceived, percentage } = adminProductSummary;

  const pieData = [
    { name: "In Hand", value: percentage },
    { name: "Remaining", value: 100 - percentage },
  ];

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
          <div className="admin-chart-card" style={{ animationDelay: "200ms" }}>
            <h3 className="admin-chart-card-title">Product Summary</h3>
            <div className="admin-product-summary-content">
              <div className="admin-donut-chart-container">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                      strokeWidth={0}
                    >
                      {pieData.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="admin-donut-center-label">
                  <span>{percentage}%</span>
                </div>
              </div>

              <div className="admin-product-summary-stats">
                <div className="admin-summary-stat">
                  <p className="admin-summary-stat-value">{quantityInHand.toLocaleString()}</p>
                  <p className="admin-summary-stat-label">Quantity in hand</p>
                </div>
                <div className="admin-summary-stat">
                  <p className="admin-summary-stat-value">{toBeReceived.toLocaleString()}</p>
                  <p className="admin-summary-stat-label">To be received</p>
                </div>
              </div>
            </div>
          </div>

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

        {/* ─── Sales & Purchase Chart ───────────────────────── */}
        <div className="admin-chart-card admin-sales-chart-card" style={{ animationDelay: "300ms" }}>
          <div className="admin-sales-chart-header">
            <div>
              <h3 className="admin-chart-card-title">Sales &amp; Purchase</h3>
              <div className="admin-sales-chart-legend-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#525252' }}>Sales</span>
                <span style={{ fontSize: '13px', color: '#888' }}>
                  Total sales and purchases statistics on week
                </span>
              </div>
            </div>
            <div className="admin-period-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>
              <span>Week</span>
              <span style={{ fontSize: '10px' }}>▼</span>
            </div>
          </div>

          <div className="admin-sales-chart-container" style={{ marginTop: '30px' }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={adminSalesData} barGap={12}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#888" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#888" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    fontSize: "13px",
                  }}
                />
                <Bar dataKey="Sales" fill="hsl(255, 78%, 60%)" radius={[2, 2, 0, 0]} barSize={12} />
                <Bar dataKey="Purchase" fill="hsl(255, 60%, 90%)" radius={[2, 2, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
