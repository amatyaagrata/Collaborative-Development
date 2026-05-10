"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Clock, Calendar } from "lucide-react";
import styles from "@/components/layout/PortalLayout.module.css";
import { toast } from "sonner";

interface Delivery {
  id: string; // purchase_order id
  order_number: string | null;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  notes: string | null;
  assignment_id: string;
  assignment_status: string;
  supplier_name: string;
  delivery_address: string;
}

export default function TransporterDeliveriesPage() {
  const [history, setHistory] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  /** Fetch purchase_orders assigned to this driver via order_driver_assignments */
  const getHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userRow } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!userRow) return;

    const { data, error } = await supabase
      .from("order_driver_assignments")
      .select(`
        id,
        status,
        purchase_orders (
          id,
          order_number,
          status,
          priority,
          created_at,
          updated_at,
          notes,
          suppliers ( name, address )
        )
      `)
      .eq("driver_id", userRow.id)
      .order("assigned_at", { ascending: false });

    if (!error && data) {
      const mapped: Delivery[] = data
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
          supplier_name: row.purchase_orders.suppliers?.name ?? "N/A",
          delivery_address: row.purchase_orders.suppliers?.address ?? "N/A",
        }));
      setHistory(mapped);
    }
  };

  useEffect(() => { getHistory(); }, []);

  /** Update purchase_order status (for accepted drivers updating progress) */
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("purchase_orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
      toast.success("Status updated");
      getHistory();
    } catch {
      toast.error("Update failed");
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'pending':          return { background: "#fff7ed", color: "#c2410c" };
      case 'accepted':         return { background: "#ede9fe", color: "#6d28d9" };
      case 'driver_assigned':  return { background: "#dbeafe", color: "#1e40af" };
      case 'in_transit':       return { background: "#dbeafe", color: "#1d4ed8" };
      case 'delivered':        return { background: "#dcfce7", color: "#166534" };
      case 'rejected':         return { background: "#fef2f2", color: "#dc2626" };
      case 'ended':            return { background: "#f1f5f9", color: "#475569" };
      default:                 return { background: "#f1f5f9", color: "#475569" };
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':   return { background: "#fee2e2", color: "#991b1b" };
      case 'medium': return { background: "#fef3c7", color: "#92400e" };
      case 'low':    return { background: "#dcfce7", color: "#166534" };
      default:       return { background: "#f1f5f9", color: "#475569" };
    }
  };

  // Show all except purely pending-assignment orders
  const activeDeliveries = history.filter(o => o.assignment_status !== 'pending');

  return (
    <div className={styles.pageStack} style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#2d1a5a" }}>Deliveries</h2>
      </div>

      <div style={{ background: "white", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#64748b", fontSize: "0.85rem", borderBottom: "1px solid #f1f5f9" }}>
              <th style={{ padding: "12px" }}>Order #</th>
              <th>Supplier</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {activeDeliveries.map((order) => (
              <tr key={order.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                <td style={{ padding: "16px 12px", fontWeight: "700", color: "#4338ca" }}>
                  {order.order_number || `#${order.id.slice(0, 8)}`}
                </td>
                <td style={{ padding: "12px" }}>{order.supplier_name}</td>
                <td style={{ padding: "12px" }}>
                  {['driver_assigned', 'in_transit'].includes(order.status) ? (
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                      style={{ padding: "6px 12px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: "700", border: "none", cursor: "pointer", ...getStatusStyles(order.status) }}
                    >
                      <option value="driver_assigned">Driver Assigned</option>
                      <option value="in_transit">In Transit</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  ) : (
                    <span style={{ padding: "6px 12px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: "700", ...getStatusStyles(order.status) }}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  )}
                </td>
                <td style={{ padding: "12px" }}>
                  <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "700", ...getPriorityStyles(order.priority) }}>
                    {order.priority}
                  </span>
                </td>
                <td style={{ color: "#64748b", fontSize: "0.85rem", padding: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Calendar size={14} color="#7c3aed" />
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {activeDeliveries.length === 0 && (
          <p style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
            No deliveries yet. Waiting for supplier assignments.
          </p>
        )}
      </div>
    </div>
  );
}