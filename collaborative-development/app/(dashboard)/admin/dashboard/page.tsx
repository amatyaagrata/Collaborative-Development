"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
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

import Link from "next/link";
import { Users, Package, ShoppingCart, Truck, DollarSign, CheckCircle, UserPlus, Plus, Loader2, PackageOpen } from "lucide-react";
import styles from "@/components/layout/PortalLayout.module.css";

interface DashboardData {
  stats: {
    inventoryValue: string;
    totalStocks: string;
    totalProducts: number;
    totalOrders: number;
    newOrders: string;
    delivered: string;
  };
  productSummary: { quantityInHand: number; toBeReceived: number; percentage: number };
  trendingProducts: AdminTrendingProduct[];
  salesData: AdminSalesDataPoint[];
  userCounts: {
    total: number;
    active: number;
    admins: number;
    suppliers: number;
    transporters: number;
    inventoryManagers: number;
  };
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/stats");
        if (!res.ok) {
          throw new Error(`Failed to fetch stats: ${res.status}`);
        }
        const json = await res.json();
        setData(json);
        setError(null);
      } catch (err) {
        console.error("[ADMIN-DASHBOARD] Failed to load stats:", err);
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // Derive display values from live data, with fallbacks
  const totalUsers = data?.userCounts?.total ?? "—";
  const totalSuppliers = data?.userCounts?.suppliers ?? "—";
  const totalProducts = data?.stats?.totalProducts ?? "—";
  const totalOrders = data?.stats?.totalOrders ?? "—";
  const pendingOrders = data?.stats?.newOrders ?? "—";
  const revenue = data?.stats?.inventoryValue ?? "—";

  return (
    <>
      <WelcomeMessage roleOverride="Admin" />
      
      <div className={styles.pageStack}>
        {/* Loading indicator */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: "#f3e8ff", borderRadius: "8px", color: "#7c3aed", fontSize: "0.85rem", fontWeight: 500 }}>
            <Loader2 size={16} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
            Loading live data from database...
          </div>
        )}

        {/* Error banner */}
        {error && !loading && (
          <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "0.85rem" }}>
            ⚠️ Could not load live data: {error}. Showing placeholder values.
          </div>
        )}

        {/* Stats Grid — 5 cards (no "Total Orgs") */}
        <div className={styles.statsGrid} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <div className={styles.metricCard}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Users size={16} color="#7c3aed"/><h3 className={styles.metricLabel}>Total Users</h3></div>
            <p className={styles.metricValue}>{loading ? "..." : totalUsers}</p>
          </div>
          <div className={styles.metricCard}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><PackageOpen size={16} color="#7c3aed"/><h3 className={styles.metricLabel}>Suppliers</h3></div>
            <p className={styles.metricValue}>{loading ? "..." : totalSuppliers}</p>
          </div>
          <div className={styles.metricCard}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Package size={16} color="#7c3aed"/><h3 className={styles.metricLabel}>Total Products</h3></div>
            <p className={styles.metricValue}>{loading ? "..." : totalProducts}</p>
          </div>
          <div className={styles.metricCard}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><ShoppingCart size={16} color="#7c3aed"/><h3 className={styles.metricLabel}>Total Orders</h3></div>
            <p className={styles.metricValue}>{loading ? "..." : totalOrders}</p>
          </div>
          <div className={styles.metricCard}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Truck size={16} color="#7c3aed"/><h3 className={styles.metricLabel}>Pending Orders</h3></div>
            <p className={styles.metricValue}>{loading ? "..." : pendingOrders}</p>
          </div>
          <div className={styles.metricCard}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><DollarSign size={16} color="#7c3aed"/><h3 className={styles.metricLabel}>Inventory Value</h3></div>
            <p className={styles.metricValue}>{loading ? "..." : revenue}</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginTop: "24px" }}>
          {/* User Breakdown */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>User Breakdown</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px" }}>
              {[
                { label: "Admins", count: data?.userCounts?.admins ?? 0, color: "#7c3aed" },
                { label: "Suppliers", count: data?.userCounts?.suppliers ?? 0, color: "#3b82f6" },
                { label: "Transporters", count: data?.userCounts?.transporters ?? 0, color: "#f59e0b" },
                { label: "Inventory Managers", count: data?.userCounts?.inventoryManagers ?? 0, color: "#10b981" },
              ].map((role) => (
                <div key={role.label} style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: `${role.color}15`, display: "flex", alignItems: "center",
                    justifyContent: "center", color: role.color, fontWeight: 700, fontSize: "0.85rem",
                  }}>
                    {loading ? "…" : role.count}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "#1e293b" }}>{role.label}</p>
                  </div>
                  <div style={{
                    height: 6, flex: 2, background: "#f1f5f9", borderRadius: 3, overflow: "hidden"
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${(data?.userCounts?.total ?? 1) > 0 ? Math.max(((role.count / (data?.userCounts?.total ?? 1)) * 100), 4) : 0}%`,
                      background: role.color,
                      borderRadius: 3,
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "4px", fontSize: "0.8rem", color: "#64748b" }}>
                <span>Total active: {data?.userCounts?.active ?? "—"}</span>
                <span>Total users: {data?.userCounts?.total ?? "—"}</span>
              </div>
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
