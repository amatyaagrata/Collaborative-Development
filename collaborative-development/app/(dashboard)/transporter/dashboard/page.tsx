"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Truck, CheckCircle, Navigation, Clock, X, Package, XCircle } from "lucide-react";
import styles from "@/components/layout/PortalLayout.module.css";
import { toast } from "sonner";
import { WelcomeMessage } from "@/components/shared/WelcomeMessage";

/**
 * Order interface aligned with the V3 schema.
 */
interface Order {
  id: string;
  order_number: string | null;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  notes?: string | null;
  delivery_status: string;
  supplier_name?: string;
  delivery_address?: string;
}

export default function TransporterDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<'active' | 'completed' | null>(null);

  const supabase = createClient();

  /**
   * Fetches orders assigned to the current driver directly from the orders table.
   */
  const fetchDashboardData = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return;

    // Get the user's id from the users table
    const { data: userRow } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", authData.user.id)
      .single();

    if (!userRow) { setLoading(false); return; }

    // Fetch orders where this user is the transporter
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        created_at,
        updated_at,
        notes,
        delivery_status,
        suppliers:supplier_id (
          name,
          address
        )
      `)
      .eq("transporter_id", userRow.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const mapped: Order[] = (data as any[]).map((o: any) => ({
        id: o.id,
        order_number: o.order_number,
        status: o.status,
        priority: "medium", // Default since priority was removed in V3
        created_at: o.created_at,
        updated_at: o.updated_at,
        notes: o.notes,
        delivery_status: o.delivery_status || "not_assigned",
        supplier_name: o.suppliers?.name,
        delivery_address: o.suppliers?.address,
      }));
      setOrders(mapped);
    }
    setLoading(false);
  }, [supabase]);

  /** Accept a delivery: update delivery_status to 'accepted' */
  const handleAccept = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          delivery_status: "accepted", 
          status: "accepted",
          updated_at: new Date().toISOString() 
        })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Delivery accepted! You can now start transit.");
      fetchDashboardData();
    } catch (err: any) {
      toast.error("Failed to accept delivery: " + err.message);
    }
  };

  /** Reject a delivery: update delivery_status to 'rejected' */
  const handleReject = async (orderId: string, orderNumber: string | null) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          delivery_status: "rejected", 
          status: "accepted", // Reset order status so supplier can reassign
          updated_at: new Date().toISOString() 
        })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Delivery rejected.");
      fetchDashboardData();
    } catch (err: any) {
      toast.error("Failed to reject delivery: " + err.message);
    }
  };

  /** Start Transit: update delivery_status to 'in_transit' */
  const handleStartTransit = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          delivery_status: "in_transit",
          status: "in_transit",
          updated_at: new Date().toISOString() 
        })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Transit started!");
      fetchDashboardData();
    } catch (err: any) {
      toast.error("Failed to start transit: " + err.message);
    }
  };

  /** Mark as Delivered: update status to 'delivered' */
  const handleMarkDelivered = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          delivery_status: "delivered",
          status: "delivered",
          updated_at: new Date().toISOString() 
        })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Order marked as delivered!");
      fetchDashboardData();
    } catch (err: any) {
      toast.error("Failed to mark delivered: " + err.message);
    }
  };

  /**
   * Realtime subscription
   */
  useEffect(() => {
    fetchDashboardData();

    const channel = supabase
      .channel("realtime_driver_dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchDashboardData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchDashboardData]);

  /**
   * Derive stats from live data.
   */
  const stats = useMemo(() => {
    const pendingRequests = orders.filter((o) => o.delivery_status === "pending_acceptance");
    const activeList = orders.filter((o) => ["accepted", "in_transit"].includes(o.delivery_status));
    const deliveredOrders = orders.filter((o) => o.delivery_status === "delivered");

    const completedTodayList = deliveredOrders.filter((o) => {
      const completionDate = new Date(o.updated_at).toDateString();
      return completionDate === new Date().toDateString();
    });

    return {
      pendingRequests,
      activeList,
      completedTodayList,
      totalAssigned: orders.length,
      onTimeRate: "100.0",
    };
  }, [orders]);

  const modalData = modalType === 'active' ? stats.activeList : stats.completedTodayList;

  if (loading) return <div className={styles.loadingState}>Refreshing metrics...</div>;

  return (
    <>
      <WelcomeMessage roleOverride="Driver / Transporter" />

      <div className={styles.pageStack}>
        {/* INCOMING DELIVERY REQUESTS */}
        {stats.pendingRequests.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#c2410c", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Package size={20} /> Incoming Requests ({stats.pendingRequests.length})
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
              {stats.pendingRequests.map((order) => (
                <div key={order.id} style={{
                  background: "white", padding: "24px", borderRadius: "20px",
                  border: "2px solid #fed7aa", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <span style={{ fontWeight: "800", color: "#4338ca", fontSize: "1rem" }}>
                      {order.order_number || `#${order.id.slice(0, 8)}`}
                    </span>
                    <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: "700", background: "#fff7ed", color: "#c2410c" }}>
                      Awaiting Response
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#475569", fontSize: "0.9rem" }}>
                      <Truck size={16} color="#7c3aed" />
                      <strong>Supplier:</strong> {order.supplier_name || "N/A"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#475569", fontSize: "0.9rem" }}>
                      <Navigation size={16} color="#7c3aed" />
                      <strong>Address:</strong> {order.delivery_address || "N/A"}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => handleAccept(order.id)}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", borderRadius: "12px", border: "none", background: "#10b981", color: "white", fontWeight: "700", fontSize: "0.9rem", cursor: "pointer" }}
                    >
                      <CheckCircle size={18} /> Accept
                    </button>
                    <button
                      onClick={() => handleReject(order.id, order.order_number)}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", borderRadius: "12px", border: "2px solid #fca5a5", background: "white", color: "#dc2626", fontWeight: "700", fontSize: "0.9rem", cursor: "pointer" }}
                    >
                      <XCircle size={18} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STATS GRID */}
        <div className={styles.statsGrid}>
          <div onClick={() => setModalType('active')} className={`${styles.metricCard} ${styles.clickableCard}`} style={{ cursor: 'pointer' }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Truck size={18} color="#7c3aed" />
              <h3 className={styles.metricLabel}>Active Deliveries</h3>
            </div>
            <p className={styles.metricValue}>{stats.activeList.length}</p>
          </div>

          <div onClick={() => setModalType('completed')} className={`${styles.metricCard} ${styles.clickableCard}`} style={{ cursor: 'pointer' }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle size={18} color="#10b981" />
              <h3 className={styles.metricLabel}>Completed Today</h3>
            </div>
            <p className={styles.metricValue}>{stats.completedTodayList.length}</p>
          </div>

          <div className={styles.metricCard}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Navigation size={18} color="#3b82f6" />
              <h3 className={styles.metricLabel}>Total Assigned</h3>
            </div>
            <p className={styles.metricValue}>{stats.totalAssigned}</p>
          </div>

          <div className={styles.metricCard}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={18} color="#f59e0b" />
              <h3 className={styles.metricLabel}>On-Time Rate</h3>
            </div>
            <p className={styles.metricValue}>{stats.onTimeRate}%</p>
          </div>
        </div>

        {/* ACTIVE LIST (Simplified view) */}
        {stats.activeList.length > 0 && (
          <div style={{ marginTop: "24px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1e1b4b", marginBottom: "16px" }}>In Progress</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
              {stats.activeList.map((order) => (
                <div key={order.id} style={{ background: "white", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <span style={{ fontWeight: 700 }}>#{order.order_number}</span>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{order.delivery_status.toUpperCase()}</span>
                  </div>
                  <p style={{ margin: "0 0 16px", fontSize: "0.9rem", color: "#475569" }}>
                    <strong>To:</strong> {order.delivery_address}
                  </p>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {order.delivery_status === "accepted" && (
                      <button onClick={() => handleStartTransit(order.id)} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", background: "#7c3aed", color: "white", fontWeight: 600 }}>Start Transit</button>
                    )}
                    {order.delivery_status === "in_transit" && (
                      <button onClick={() => handleMarkDelivered(order.id)} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", background: "#10b981", color: "white", fontWeight: 600 }}>Mark Delivered</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL */}
        {modalType && (
          <div
            onClick={() => setModalType(null)}
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '800px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '80vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e1b4b" }}>
                  {modalType === 'active' ? 'Active Deliveries' : 'Completed Today'}
                </h2>
                <button onClick={() => setModalType(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                  <X size={24} color="#64748b" />
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: '12px', color: '#64748b' }}>Order #</th>
                    <th style={{ padding: '12px', color: '#64748b' }}>Supplier</th>
                    <th style={{ padding: '12px', color: '#64748b' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {modalData.map((order) => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: '600' }}>{order.order_number || `#${order.id.slice(0, 8)}`}</td>
                      <td style={{ padding: '12px' }}>{order.supplier_name || "N/A"}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem',
                          backgroundColor: order.delivery_status === 'in_transit' ? '#f5f3ff' : '#ecfdf5',
                          color: order.delivery_status === 'in_transit' ? '#7c3aed' : '#10b981',
                          textTransform: 'capitalize'
                        }}>
                          {order.delivery_status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {modalData.length === 0 && (
                <p style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No records found.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
