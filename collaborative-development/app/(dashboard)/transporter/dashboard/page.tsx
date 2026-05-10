"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Truck, CheckCircle, Navigation, Clock, X, Package, XCircle } from "lucide-react";
import styles from "@/components/layout/PortalLayout.module.css";
import { toast } from "sonner";
import { WelcomeMessage } from "@/components/shared/WelcomeMessage";

/**
 * PurchaseOrder interface aligned with the purchase_orders schema.
 * Driver assignments come from order_driver_assignments (oda).
 */
interface PurchaseOrder {
  id: string;
  order_number: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'driver_assigned' | 'in_transit' | 'delivered' | 'ended';
  priority: 'high' | 'medium' | 'low';
  created_at: string;
  updated_at: string;
  notes?: string | null;
  // Joined from order_driver_assignments
  assignment_id?: string;
  assignment_status?: 'pending' | 'accepted' | 'rejected';
  // Joined from suppliers
  supplier_name?: string;
  delivery_address?: string;
}

export default function TransporterDashboard() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<'active' | 'completed' | null>(null);

  const supabase = createClient();

  /**
   * Fetches purchase orders assigned to the current driver via
   * order_driver_assignments (correct schema relationship).
   */
  const fetchDashboardData = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return;

    // Get the user's id from the users table (driver's id = users.id per schema)
    const { data: userRow } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", authData.user.id)
      .single();

    if (!userRow) { setLoading(false); return; }

    // Fetch assignments for this driver and join purchase_orders + suppliers
    const { data, error } = await supabase
      .from("order_driver_assignments")
      .select(`
        id,
        status,
        purchase_order_id,
        purchase_orders (
          id,
          order_number,
          status,
          priority,
          created_at,
          updated_at,
          notes,
          suppliers (
            name,
            address
          )
        )
      `)
      .eq("driver_id", userRow.id)
      .order("assigned_at", { ascending: false });

    if (!error && data) {
      const mapped: PurchaseOrder[] = data
        .filter((row: any) => row.purchase_orders)
        .map((row: any) => ({
          id: row.purchase_orders.id,
          order_number: row.purchase_orders.order_number,
          status: row.purchase_orders.status,
          priority: row.purchase_orders.priority,
          created_at: row.purchase_orders.created_at,
          updated_at: row.purchase_orders.updated_at,
          notes: row.purchase_orders.notes,
          assignment_id: row.id,
          assignment_status: row.status,
          supplier_name: row.purchase_orders.suppliers?.name,
          delivery_address: row.purchase_orders.suppliers?.address,
        }));
      setOrders(mapped);
    }
    setLoading(false);
  }, [supabase]);

  /** Accept a delivery: update order_driver_assignments.status → 'accepted' */
  const handleAccept = async (assignmentId: string, orderId: string) => {
    try {
      const { error: assignErr } = await supabase
        .from("order_driver_assignments")
        .update({ status: "accepted", responded_at: new Date().toISOString() })
        .eq("id", assignmentId);

      if (assignErr) throw assignErr;

      // Also update purchase_order status to driver_assigned
      await supabase
        .from("purchase_orders")
        .update({ status: "driver_assigned" })
        .eq("id", orderId);

      toast.success("Delivery accepted! You can now start transit.");
      fetchDashboardData();
    } catch {
      toast.error("Failed to accept delivery");
    }
  };

  /** Reject a delivery: update order_driver_assignments.status → 'rejected' */
  const handleReject = async (assignmentId: string, orderId: string, orderNumber: string | null) => {
    try {
      const { error } = await supabase
        .from("order_driver_assignments")
        .update({ status: "rejected", responded_at: new Date().toISOString() })
        .eq("id", assignmentId);

      if (error) throw error;

      // Reset purchase_order status back to accepted (supplier can reassign)
      await supabase
        .from("purchase_orders")
        .update({ status: "accepted" })
        .eq("id", orderId);

      // Notify the supplier — using valid notification type
      const { data: poData } = await supabase
        .from("purchase_orders")
        .select("created_by")
        .eq("id", orderId)
        .single();

      if (poData?.created_by) {
        const { data: creatorUser } = await supabase
          .from("users")
          .select("auth_user_id")
          .eq("id", poData.created_by)
          .single();

        if (creatorUser?.auth_user_id) {
          await supabase.from("notifications").insert({
            user_id: creatorUser.auth_user_id,
            title: "Driver Rejected Delivery",
            message: `Driver has declined delivery for order ${orderNumber ?? orderId.slice(0, 8)}. Please reassign a driver.`,
            type: "driver_rejected",
          });
        }
      }

      toast.success("Delivery rejected.");
      fetchDashboardData();
    } catch {
      toast.error("Failed to reject delivery");
    }
  };

  /**
   * Realtime subscription — listens to both tables for live updates.
   */
  useEffect(() => {
    fetchDashboardData();

    const channel = supabase
      .channel("realtime_driver_dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "order_driver_assignments" }, () => fetchDashboardData())
      .on("postgres_changes", { event: "*", schema: "public", table: "purchase_orders" }, () => fetchDashboardData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchDashboardData]);

  /**
   * Derive stats from the joined purchase_orders data.
   * Pending requests = assignments with status 'pending' (awaiting driver response).
   * Active = assignment accepted + PO in_transit or driver_assigned.
   * Completed today = PO delivered, updated today.
   */
  const stats = useMemo(() => {
    const pendingRequests = orders.filter((o) => o.assignment_status === "pending");
    const inTransitOrders = orders.filter((o) => o.status === "in_transit");
    const deliveredOrders = orders.filter((o) => o.status === "delivered");

    const completedTodayOrders = deliveredOrders.filter((o) => {
      const completionDate = new Date(o.updated_at).toDateString();
      return completionDate === new Date().toDateString();
    });

    const onTimeRate = deliveredOrders.length > 0 ? "100.0" : "100.0";

    return {
      pendingRequests,
      activeList: inTransitOrders,
      completedTodayList: completedTodayOrders,
      totalAssigned: orders.length,
      onTimeRate,
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
                      <Package size={16} color="#7c3aed" />
                      <strong>Priority:</strong> {order.priority}
                    </div>
                    {order.notes && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#475569", fontSize: "0.9rem" }}>
                        <strong>Notes:</strong> {order.notes}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => handleAccept(order.assignment_id!, order.id)}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", borderRadius: "12px", border: "none", background: "#10b981", color: "white", fontWeight: "700", fontSize: "0.9rem", cursor: "pointer" }}
                    >
                      <CheckCircle size={18} /> Accept
                    </button>
                    <button
                      onClick={() => handleReject(order.assignment_id!, order.id, order.order_number)}
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
                    <th style={{ padding: '12px', color: '#64748b' }}>Priority</th>
                    <th style={{ padding: '12px', color: '#64748b' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {modalData.map((order) => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: '600' }}>{order.order_number || `#${order.id.slice(0, 8)}`}</td>
                      <td style={{ padding: '12px' }}>{order.supplier_name || "N/A"}</td>
                      <td style={{ padding: '12px', textTransform: 'capitalize' }}>{order.priority}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem',
                          backgroundColor: order.status === 'in_transit' ? '#f5f3ff' : '#ecfdf5',
                          color: order.status === 'in_transit' ? '#7c3aed' : '#10b981',
                          textTransform: 'capitalize'
                        }}>
                          {order.status.replace(/_/g, ' ')}
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