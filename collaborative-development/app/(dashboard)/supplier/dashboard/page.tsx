"use client";

import React, { useState, useEffect, useCallback } from "react";
import { WelcomeMessage } from "@/components/shared/WelcomeMessage";
import { Package, ShoppingCart, Truck, CreditCard, DollarSign, CheckCircle, Loader2, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import styles from "@/components/layout/PortalLayout.module.css";

interface DashboardStats {
  totalProducts: number;
  pendingOrders: number;
  completedOrders: number;
  totalEarnings: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  org: string;
  date: string;
  amount: number;
  status: string;
}

interface PaymentItem {
  status: string;
  amount: number;
  count: number;
}

export default function SupplierDashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({ totalProducts: 0, pendingOrders: 0, completedOrders: 0, totalEarnings: 0 });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: userRow } = await supabase
        .from("users")
        .select("id, organization_id")
        .eq("auth_user_id", authUser.id)
        .single();

      if (!userRow) return;

      const { data: supplierRow } = await supabase
        .from("suppliers")
        .select("id")
        .eq("user_id", userRow.id)
        .single();

      const resolvedSupplierId = supplierRow?.id;
      if (!resolvedSupplierId) {
        setLoading(false);
        return;
      }

      // 1. Fetch Stats — using purchase_orders (correct table per schema)
      const [productsRes, pendingRes, completedRes] = await Promise.all([
        supabase.from("supplier_products").select("id", { count: "exact", head: true }).eq("supplier_id", resolvedSupplierId),
        supabase.from("purchase_orders").select("id", { count: "exact", head: true }).eq("supplier_id", resolvedSupplierId).eq("status", "pending"),
        supabase.from("purchase_orders").select("id", { count: "exact", head: true }).eq("supplier_id", resolvedSupplierId).eq("status", "delivered")
      ]);

      const totalEarnings = 0; // purchase_orders has no total_amount column

      setStats({
        totalProducts: productsRes.count || 0,
        pendingOrders: pendingRes.count || 0,
        completedOrders: completedRes.count || 0,
        totalEarnings
      });

      // 2. Fetch Recent Orders from purchase_orders
      const { data: ordersData } = await supabase
        .from("purchase_orders")
        .select("id, order_number, status, created_at, priority")
        .eq("supplier_id", resolvedSupplierId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (ordersData) {
        setRecentOrders(ordersData.map(o => ({
          id: o.id,
          order_number: o.order_number ?? o.id.slice(0, 8),
          org: o.priority ?? "medium",
          date: new Date(o.created_at).toLocaleDateString(),
          amount: 0,
          status: o.status
        })));
      }

      // 3. Payment Summary grouped by status from purchase_orders
      const { data: allOrders } = await supabase
        .from("purchase_orders")
        .select("status")
        .eq("supplier_id", resolvedSupplierId);

      if (allOrders) {
        const summaryMap: Record<string, { amount: number; count: number }> = {
          "pending":   { amount: 0, count: 0 },
          "accepted":  { amount: 0, count: 0 },
          "delivered": { amount: 0, count: 0 },
        };

        allOrders.forEach(o => {
          const key = ["delivered", "ended"].includes(o.status) ? "delivered"
            : ["accepted", "driver_assigned", "in_transit"].includes(o.status) ? "accepted"
            : "pending";
          if (!summaryMap[key]) summaryMap[key] = { amount: 0, count: 0 };
          summaryMap[key].count += 1;
        });

        setPayments([
          { status: "Pending",  amount: 0, count: summaryMap["pending"].count },
          { status: "In Progress", amount: 0, count: summaryMap["accepted"].count },
          { status: "Completed", amount: 0, count: summaryMap["delivered"].count },
        ]);
      }

    } catch (err) {
      console.error("Dashboard fetch error:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", color: "#64748b" }}>
        <Loader2 size={40} className="spin" style={{ marginBottom: "16px", color: "#7c3aed" }} />
        <p style={{ fontWeight: 500 }}>Updating dashboard with live data...</p>
        <style jsx global>{` .spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } } `}</style>
      </div>
    );
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
              {recentOrders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                  <Inbox size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
                  <p>No orders found yet.</p>
                </div>
              ) : (
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
                        <td style={{ padding: "12px 8px", borderBottom: "1px solid #f1f5f9", fontWeight: 600, color: "#4f46e5" }}>#{order.order_number}</td>
                        <td style={{ padding: "12px 8px", borderBottom: "1px solid #f1f5f9", fontWeight: 500 }}>{order.org}</td>
                        <td style={{ padding: "12px 8px", borderBottom: "1px solid #f1f5f9", color: "#64748b", fontSize: "0.9rem" }}>{order.date}</td>
                        <td style={{ padding: "12px 8px", borderBottom: "1px solid #f1f5f9", textAlign: "right", fontWeight: 600 }}>Rs. {order.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
                    <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#64748b" }}>{payment.count} orders</p>
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

