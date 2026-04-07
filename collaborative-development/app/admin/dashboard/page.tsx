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
  adminApplications,
} from "@/lib/data/adminDashboardData";
import "./dashboard.css";

const PIE_COLORS = ["hsl(270, 70%, 45%)", "hsl(260, 20%, 92%)"];

export default function AdminDashboardPage() {
  const { quantityInHand, toBeReceived } = adminProductSummary;
  const total = quantityInHand + toBeReceived;
  const percentage = total > 0 ? Math.round((quantityInHand / total) * 100) : 0;

  const pieData = [
    { name: "In Hand", value: quantityInHand },
    { name: "To Receive", value: toBeReceived },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="admin-dashboard-content">

        {/* ─── Activity Section ─────────────────────────────── */}
        <div className="admin-activity-card">
          <h2 className="admin-activity-header">Activity</h2>
          <div className="admin-stat-cards-grid">
            <AdminStatCard
              label="Inventory Revenue"
              value={adminStats.inventoryRevenue}
              delay={0}
            />
            <AdminStatCard
              label="Active Users"
              value={adminStats.activeUsers.toString()}
              delay={50}
            />
            <AdminStatCard
              label="Inactive Users"
              value={adminStats.inactiveUsers.toString()}
              delay={100}
            />
            <AdminStatCard
              label="Application Count"
              value={adminApplications.length.toString()}
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
              <div className="admin-sales-chart-legend-row">
                <span className="admin-sales-legend-dot"></span>
                <span className="admin-sales-legend-label">Sales</span>
                <span className="admin-sales-chart-subtitle">
                  Total sales and purchases statistics on week
                </span>
              </div>
            </div>
            <span className="admin-period-badge">Week ▾</span>
          </div>

          <div className="admin-sales-chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={adminSalesData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(260, 15%, 90%)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "hsl(250, 10%, 45%)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "hsl(250, 10%, 45%)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `₹${value.toLocaleString()}`}
                />
                <Tooltip
                  formatter={(value) => [`₹${Number(value).toLocaleString()}`]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(260, 15%, 90%)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    fontSize: "13px",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Sales" fill="hsl(270, 70%, 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Purchase" fill="hsl(260, 20%, 85%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
