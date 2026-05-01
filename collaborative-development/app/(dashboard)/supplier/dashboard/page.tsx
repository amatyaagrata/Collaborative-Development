"use client";

import React, { useState } from "react";
import { WelcomeMessage } from "@/components/shared/WelcomeMessage";
import { Package, ShoppingCart, Truck, CreditCard, DollarSign, CheckCircle } from "lucide-react";
import styles from "@/components/layout/PortalLayout.module.css";

export default function SupplierDashboardPage() {
  const [loading, setLoading] = useState(false);

  // Fallback mock data
  const stats = { totalProducts: 12, pendingOrders: 5, completedOrders: 34, totalEarnings: 145000 };
  const recentOrders = [
    { id: "ORD-001", org: "Alpha Retail", date: "2026-05-01", amount: 12500, status: "Pending" },
    { id: "ORD-002", org: "Beta Mart", date: "2026-04-29", amount: 34000, status: "Processing" },
    { id: "ORD-003", org: "Gamma Store", date: "2026-04-28", amount: 8900, status: "Completed" },
  ];
  const payments = [
    { status: "Pending", amount: 24500, count: 3 },
    { status: "Processing", amount: 12000, count: 1 },
    { status: "Completed", amount: 145000, count: 12 },
  ];

  if (loading) {
    return <><div className={styles.loadingState}>Loading dashboard...</div></>;
  }

  return (
    <>
      <WelcomeMessage roleOverride="Supplier" />
      <div className={styles.pageStack}>
        <div className={styles.statsGrid}>
          <div className={styles.metricCard}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Package size={16} color="#7c3aed"/><h3 className={styles.metricLabel}>Total Products</h3></div>
            <p className={styles.metricValue}>{stats.totalProducts}</p>
          </div>
          <div className={styles.metricCard}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><ShoppingCart size={16} color="#f59e0b"/><h3 className={styles.metricLabel}>Pending Orders</h3></div>
            <p className={styles.metricValue}>{stats.pendingOrders}</p>
          </div>
          <div className={styles.metricCard}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><CheckCircle size={16} color="#10b981"/><h3 className={styles.metricLabel}>Completed Orders</h3></div>
            <p className={styles.metricValue}>{stats.completedOrders}</p>
          </div>
          <div className={styles.metricCard}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><DollarSign size={16} color="#3b82f6"/><h3 className={styles.metricLabel}>Total Earnings</h3></div>
            <p className={styles.metricValue}>Rs. {stats.totalEarnings.toLocaleString()}</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginTop: "24px" }}>
          {/* Recent Orders */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Recent Orders</h2>
            </div>
            <div className={styles.dataTable} style={{ display: "block" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #f1f5f9", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase" }}>Order ID</th>
                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #f1f5f9", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase" }}>Organization</th>
                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #f1f5f9", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase" }}>Date</th>
                    <th style={{ textAlign: "right", padding: "8px", borderBottom: "1px solid #f1f5f9", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id}>
                      <td style={{ padding: "12px 8px", borderBottom: "1px solid #f1f5f9", fontWeight: 600, color: "#4f46e5" }}>{order.id}</td>
                      <td style={{ padding: "12px 8px", borderBottom: "1px solid #f1f5f9", fontWeight: 500 }}>{order.org}</td>
                      <td style={{ padding: "12px 8px", borderBottom: "1px solid #f1f5f9", color: "#64748b", fontSize: "0.9rem" }}>{order.date}</td>
                      <td style={{ padding: "12px 8px", borderBottom: "1px solid #f1f5f9", textAlign: "right", fontWeight: 600 }}>Rs. {order.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Summary */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Payment Summary</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "8px 0" }}>
              {payments.map(payment => (
                <div key={payment.status} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", background: "#f8fafc", borderRadius: "12px" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "#334155" }}>{payment.status}</p>
                    <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#64748b" }}>{payment.count} invoices</p>
                  </div>
                  <p style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>Rs. {payment.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
