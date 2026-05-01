"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { WelcomeMessage } from "@/components/shared/WelcomeMessage";
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
  () => import("@/components/admin/AdminDashboardCharts").then((mod) => mod.AdminDashboardCharts),
  { ssr: false, loading: () => <div className="admin-chart-card">Loading charts...</div> }
);

interface DashboardStats { inventoryValue: string; totalStocks: string; newOrders: string; delivered: string; }
interface ProductSummary { quantityInHand: number; toBeReceived: number; percentage: number; }

import Link from "next/link";
import { Users, Building2, Package, ShoppingCart, Truck, DollarSign, CheckCircle, UserPlus, Plus } from "lucide-react";
import styles from "@/components/layout/PortalLayout.module.css";

export default function AdminDashboardPage() {
  const [isLive, setIsLive] = useState(false);

  // Fallback mock data
  const stats = { totalUsers: 42, totalOrgs: 12, totalProducts: 156, totalOrders: 89, activeDeliveries: 7, revenue: "124,500" };
  
  const recentActivity = [
    { id: 1, type: "signup", text: "New user John Doe signed up", time: "2h ago" },
    { id: 2, type: "order", text: "Order #1042 placed by Org A", time: "5h ago" },
    { id: 3, type: "delivery", text: "Delivery #D-12 arrived at warehouse", time: "1d ago" }
  ];

  useEffect(() => {
    setIsLive(true);
  }, []);

  return (
    <>
      <WelcomeMessage roleOverride="Admin" />
      
      <div className={styles.pageStack}>
        <div className={styles.statsGrid} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <div className={styles.metricCard}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Users size={16} color="#7c3aed"/><h3 className={styles.metricLabel}>Total Users</h3></div>
            <p className={styles.metricValue}>{stats.totalUsers}</p>
          </div>
          <div className={styles.metricCard}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Building2 size={16} color="#7c3aed"/><h3 className={styles.metricLabel}>Total Orgs</h3></div>
            <p className={styles.metricValue}>{stats.totalOrgs}</p>
          </div>
          <div className={styles.metricCard}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Package size={16} color="#7c3aed"/><h3 className={styles.metricLabel}>Total Products</h3></div>
            <p className={styles.metricValue}>{stats.totalProducts}</p>
          </div>
          <div className={styles.metricCard}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><ShoppingCart size={16} color="#7c3aed"/><h3 className={styles.metricLabel}>Total Orders</h3></div>
            <p className={styles.metricValue}>{stats.totalOrders}</p>
          </div>
          <div className={styles.metricCard}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Truck size={16} color="#7c3aed"/><h3 className={styles.metricLabel}>Active Deliveries</h3></div>
            <p className={styles.metricValue}>{stats.activeDeliveries}</p>
          </div>
          <div className={styles.metricCard}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><DollarSign size={16} color="#7c3aed"/><h3 className={styles.metricLabel}>Revenue</h3></div>
            <p className={styles.metricValue}>Rs. {stats.revenue}</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginTop: "24px" }}>
          {/* Recent Activity */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Recent Activity</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px" }}>
              {recentActivity.map(act => (
                <div key={act.id} style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "16px", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f3e8ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed" }}>
                    {act.type === "signup" ? <UserPlus size={18} /> : act.type === "order" ? <ShoppingCart size={18} /> : <Truck size={18} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "#1e293b" }}>{act.text}</p>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b" }}>{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Quick Actions</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px" }}>
              <Link href="/admin/requests" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "#f8fafc", borderRadius: 8, textDecoration: "none", color: "#334155", fontWeight: 600, fontSize: "0.875rem", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e => e.currentTarget.style.background="#f8fafc"}>
                <CheckCircle size={18} color="#10b981" /> Approve Requests
              </Link>
              <Link href="/admin/users" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "#f8fafc", borderRadius: 8, textDecoration: "none", color: "#334155", fontWeight: 600, fontSize: "0.875rem", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e => e.currentTarget.style.background="#f8fafc"}>
                <UserPlus size={18} color="#3b82f6" /> Add User
              </Link>
              <Link href="/admin/products" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "#f8fafc", borderRadius: 8, textDecoration: "none", color: "#334155", fontWeight: 600, fontSize: "0.875rem", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e => e.currentTarget.style.background="#f8fafc"}>
                <Plus size={18} color="#f59e0b" /> Add Product
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
