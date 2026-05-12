"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Calendar, CheckCircle, Truck, XCircle } from "lucide-react";
import styles from "@/components/layout/PortalLayout.module.css";
import { toast } from "sonner";

interface DeliveryOrder {
  id: string;
  order_number: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  delivery_status: string;
  organization_name: string;
  delivery_address: string;
}

type OrderRow = {
  id: string;
  order_number: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  delivery_status: string | null;
  delivery_address: string | null;
  organizations?: { name?: string | null; address?: string | null } | null;
};

export default function TransporterDeliveriesPage() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchOrders = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userRow } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!userRow) return;

    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        created_at,
        updated_at,
        delivery_status,
        delivery_address,
        organizations:organization_id ( name, address )
      `)
      .eq("transporter_id", userRow.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Failed to load deliveries");
      return;
    }

    const mapped: DeliveryOrder[] = (data ?? []).map((row) => {
      const o = row as unknown as OrderRow;
      return {
        id: o.id,
        order_number: o.order_number,
        status: o.status,
        created_at: o.created_at,
        updated_at: o.updated_at,
        delivery_status: o.delivery_status || "not_assigned",
        organization_name: o.organizations?.name ?? "N/A",
        delivery_address: o.delivery_address || o.organizations?.address || "N/A",
      };
    });
    setOrders(mapped);
  }, [supabase]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchOrders();
      setLoading(false);
    })();

    const channel = supabase
      .channel("realtime_transporter_deliveries")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchOrders())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchOrders]);

  const updateProgress = async (orderId: string, nextDeliveryStatus: "accepted" | "rejected" | "in_transit" | "delivered") => {
    try {
      const update: Record<string, string> = {
        delivery_status: nextDeliveryStatus,
        updated_at: new Date().toISOString(),
      };

      if (nextDeliveryStatus === "accepted") update.status = "accepted";
      if (nextDeliveryStatus === "rejected") update.status = "accepted";
      if (nextDeliveryStatus === "in_transit") update.status = "in_transit";
      if (nextDeliveryStatus === "delivered") update.status = "delivered";

      const { error } = await supabase.from("orders").update(update).eq("id", orderId);

      if (error) throw error;
      toast.success("Delivery progress updated");
      fetchOrders();
    } catch {
      toast.error("Update failed");
    }
  };

  const getDeliveryStatusStyles = (deliveryStatus: string) => {
    switch (deliveryStatus) {
      case "pending_acceptance": return { background: "#fff7ed", color: "#c2410c" };
      case "accepted":           return { background: "#ede9fe", color: "#6d28d9" };
      case "in_transit":         return { background: "#dbeafe", color: "#1d4ed8" };
      case "delivered":          return { background: "#dcfce7", color: "#166534" };
      case "rejected":           return { background: "#fef2f2", color: "#dc2626" };
      default:                   return { background: "#f1f5f9", color: "#475569" };
    }
  };

  const visibleOrders = useMemo(
    () => orders.filter(o => o.delivery_status !== "not_assigned"),
    [orders]
  );

  return (
    <div className={styles.pageStack} style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#2d1a5a" }}>Deliveries</h2>
      </div>

      <div style={{ background: "white", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}>
        {loading && (
          <p style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
            Loading deliveries...
          </p>
        )}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#64748b", fontSize: "0.85rem", borderBottom: "1px solid #f1f5f9" }}>
              <th style={{ padding: "12px" }}>Order #</th>
              <th>Organization</th>
              <th>Progress</th>
              <th>Date</th>
              <th style={{ textAlign: "right", paddingRight: "12px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && visibleOrders.map((order) => (
              <tr key={order.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                <td style={{ padding: "16px 12px", fontWeight: "700", color: "#4338ca" }}>
                  {order.order_number || `#${order.id.slice(0, 8)}`}
                </td>
                <td style={{ padding: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>{order.organization_name}</span>
                    <span style={{ color: "#64748b", fontSize: "0.85rem" }}>{order.delivery_address}</span>
                  </div>
                </td>
                <td style={{ padding: "12px" }}>
                  <span style={{ padding: "6px 12px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: "800", textTransform: "uppercase", ...getDeliveryStatusStyles(order.delivery_status) }}>
                    {order.delivery_status.replace(/_/g, " ")}
                  </span>
                </td>
                <td style={{ color: "#64748b", fontSize: "0.85rem", padding: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Calendar size={14} color="#7c3aed" />
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td style={{ padding: "12px", textAlign: "right" }}>
                  {order.delivery_status === "pending_acceptance" && (
                    <div style={{ display: "inline-flex", gap: "8px" }}>
                      <button
                        onClick={() => updateProgress(order.id, "accepted")}
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 10px", borderRadius: "10px", border: "none", background: "#10b981", color: "white", fontWeight: 800, cursor: "pointer" }}
                        title="Accept this delivery"
                      >
                        <CheckCircle size={16} /> Accept
                      </button>
                      <button
                        onClick={() => updateProgress(order.id, "rejected")}
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 10px", borderRadius: "10px", border: "1px solid #fecaca", background: "white", color: "#dc2626", fontWeight: 800, cursor: "pointer" }}
                        title="Reject this delivery"
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </div>
                  )}

                  {order.delivery_status === "accepted" && (
                    <button
                      onClick={() => updateProgress(order.id, "in_transit")}
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 10px", borderRadius: "10px", border: "none", background: "#7c3aed", color: "white", fontWeight: 800, cursor: "pointer" }}
                      title="Start delivery transit"
                    >
                      <Truck size={16} /> Start Transit
                    </button>
                  )}

                  {order.delivery_status === "in_transit" && (
                    <button
                      onClick={() => updateProgress(order.id, "delivered")}
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 10px", borderRadius: "10px", border: "none", background: "#059669", color: "white", fontWeight: 800, cursor: "pointer" }}
                      title="Mark as delivered"
                    >
                      <CheckCircle size={16} /> Delivered
                    </button>
                  )}

                  {["delivered", "rejected"].includes(order.delivery_status) && (
                    <span style={{ color: "#94a3b8", fontSize: "0.8rem", fontWeight: 700 }}>
                      No actions
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && visibleOrders.length === 0 && (
          <p style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
            No deliveries yet. Waiting for supplier assignments.
          </p>
        )}
      </div>
    </div>
  );
}
