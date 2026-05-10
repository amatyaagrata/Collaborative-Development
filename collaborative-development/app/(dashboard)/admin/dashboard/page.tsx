"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { WelcomeMessage } from "@/components/shared/WelcomeMessage";
import { createClient } from "@/lib/supabase/client";
import "./dashboard.css";

const AdminDashboardCharts = dynamic(
  () => import("@/components/admin/AdminDashboardCharts").then((mod) => mod.AdminDashboardCharts),
  { ssr: false, loading: () => <div className="admin-chart-card">Loading charts...</div> }
);

import Link from "next/link";
import { Users, Building2, Package, ShoppingCart, Truck, DollarSign, CheckCircle, UserPlus, Plus, Loader2 } from "lucide-react";
import styles from "@/components/layout/PortalLayout.module.css";

export default function AdminDashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    totalUsers: 0, 
    totalOrgs: 0, 
    totalProducts: 0, 
    totalOrders: 0, 
    activeDeliveries: 0, 
    revenue: 0 
  });
  
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [usersRes, orgsRes, productsRes, ordersRes] = await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }),
        supabase.from("organizations").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, total_amount, status, delivery_status")
      ]);

      const allOrders = ordersRes.data || [];
      const totalRevenue = allOrders
        .filter(o => o.status === "delivered")
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);
      
      const activeDeliveries = allOrders
        .filter(o => o.delivery_status === "in_transit")
        .length;

      setStats({
        totalUsers: usersRes.count || 0,
        totalOrgs: orgsRes.count || 0,
        totalProducts: productsRes.count || 0,
        totalOrders: allOrders.length,
        activeDeliveries,
        revenue: totalRevenue
      });

      // Fetch recent orders as activity
      const { data: recentOrders } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          created_at,
          status,
          organizations:organization_id ( name )
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentOrders) {
        setRecentActivity((recentOrders as any[]).map(o => ({
          id: o.id,
          type: "order",
          text: `Order #${o.order_number || o.id.slice(0, 8)} placed by ${o.organizations?.name || "Unknown Org"}`,
          time: new Date(o.created_at).toLocaleDateString()
        })));
      }

    } catch (err) {
      console.error("Admin dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) return <div className={styles.loadingState}><Loader2 className="animate-spin" /> Updating admin overview...</div>;

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
            <p className={styles.metricValue}>Rs. {stats.revenue.toLocaleString()}</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginTop: "24px" }}>
          {/* Recent Activity */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Recent Activity</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px" }}>
              {recentActivity.length > 0 ? recentActivity.map(act => (
                <div key={act.id} style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "16px", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f3e8ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed" }}>
                    {act.type === "signup" ? <UserPlus size={18} /> : act.type === "order" ? <ShoppingCart size={18} /> : <Truck size={18} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "#1e293b" }}>{act.text}</p>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b" }}>{act.time}</p>
                  </div>
                </div>
              )) : (
                <div className={styles.emptyState}>No recent activity found.</div>
              )}
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
