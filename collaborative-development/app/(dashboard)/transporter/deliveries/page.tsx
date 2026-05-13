"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle, XCircle, Truck, Package, MapPin, Building2,
  Calendar, ChevronDown, ChevronUp, Check, AlertTriangle, Filter,
} from "lucide-react";
import styles from "@/components/layout/PortalLayout.module.css";
import { toast } from "sonner";

/* ── Types ───────────────────────────────────────────────────── */

interface WorkOrder {
  id: string;
  order_number: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  delivery_status: string;
  delivery_address: string;
  total_amount: number;
  organization_name: string;
  organization_address: string;
  organization_phone: string;
  supplier_name: string;
  vehicle_plate: string;
  vehicle_model: string;
  items: Array<{
    name: string;
    quantity: number;
    unit_price: number;
  }>;
}

type FilterTab = "all" | "pending" | "active" | "completed";

/* ── Stepper Steps ───────────────────────────────────────────── */

const STEPS = [
  { key: "pending_acceptance", label: "Pending" },
  { key: "accepted",          label: "Accepted" },
  { key: "in_transit",        label: "In Transit" },
  { key: "delivered",         label: "Delivered" },
];

/* ── Page Component ──────────────────────────────────────────── */

export default function TransporterWorkPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const supabase = createClient();

  /* ── Fetch ─────────────────────────────────────────────────── */

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
        total_amount,
        organizations:organizations!organization_id ( name, address, phone ),
        suppliers:suppliers!supplier_id ( name ),
        vehicle:vehicles!vehicle_id ( license_plate, model ),
        order_items (
          quantity,
          unit_price,
          products:products!product_id ( name )
        )
      `)
      .eq("transporter_id", userRow.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Failed to load work orders");
      return;
    }

    const mapped: WorkOrder[] = (data ?? []).map((row: any) => ({
      id: row.id,
      order_number: row.order_number,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      delivery_status: row.delivery_status || "not_assigned",
      delivery_address: row.delivery_address || row.organizations?.address || "N/A",
      total_amount: row.total_amount || 0,
      organization_name: row.organizations?.name ?? "N/A",
      organization_address: row.organizations?.address ?? "N/A",
      organization_phone: row.organizations?.phone ?? "N/A",
      supplier_name: row.suppliers?.name ?? "N/A",
      vehicle_plate: row.vehicle?.license_plate ?? "",
      vehicle_model: row.vehicle?.model ?? "",
      items: (row.order_items || []).map((item: any) => ({
        name: item.products?.name || "Unknown Product",
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    }));

    setOrders(mapped);
  }, [supabase]);

  /* ── Status Update ─────────────────────────────────────────── */

  const updateDeliveryStatus = async (
    orderId: string,
    nextDeliveryStatus: "accepted" | "rejected" | "in_transit" | "delivered"
  ) => {
    const update: Record<string, string> = {
      delivery_status: nextDeliveryStatus,
      updated_at: new Date().toISOString(),
    };

    if (nextDeliveryStatus === "accepted")   update.status = "accepted";
    if (nextDeliveryStatus === "rejected")   update.status = "accepted";
    if (nextDeliveryStatus === "in_transit") update.status = "in_transit";
    if (nextDeliveryStatus === "delivered")  update.status = "delivered";

    const { error } = await supabase.from("orders").update(update).eq("id", orderId);

    if (error) {
      toast.error("Update failed: " + error.message);
      return;
    }

    const labels: Record<string, string> = {
      accepted: "Delivery accepted!",
      rejected: "Delivery rejected.",
      in_transit: "Transit started!",
      delivered: "Order marked as delivered!",
    };
    toast.success(labels[nextDeliveryStatus]);
    fetchOrders();
  };

  /* ── Realtime ──────────────────────────────────────────────── */

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchOrders();
      setLoading(false);
    })();

    const channel = supabase
      .channel("realtime_transporter_work")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchOrders())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchOrders]);

  /* ── Filtering ─────────────────────────────────────────────── */

  const filteredOrders = useMemo(() => {
    const visible = orders.filter(o => o.delivery_status !== "not_assigned");
    switch (activeTab) {
      case "pending":
        return visible.filter(o => o.delivery_status === "pending_acceptance");
      case "active":
        return visible.filter(o => ["accepted", "in_transit"].includes(o.delivery_status));
      case "completed":
        return visible.filter(o => ["delivered", "rejected"].includes(o.delivery_status));
      default:
        return visible;
    }
  }, [orders, activeTab]);

  /* ── Counts for tabs ───────────────────────────────────────── */

  const counts = useMemo(() => {
    const visible = orders.filter(o => o.delivery_status !== "not_assigned");
    return {
      all: visible.length,
      pending: visible.filter(o => o.delivery_status === "pending_acceptance").length,
      active: visible.filter(o => ["accepted", "in_transit"].includes(o.delivery_status)).length,
      completed: visible.filter(o => ["delivered", "rejected"].includes(o.delivery_status)).length,
    };
  }, [orders]);

  /* ── Step Index Helper ─────────────────────────────────────── */

  const getStepIndex = (ds: string) => {
    if (ds === "delivered") return 3;
    if (ds === "in_transit") return 2;
    if (ds === "accepted") return 1;
    return 0;
  };

  /* ── Render ────────────────────────────────────────────────── */

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all",       label: "All" },
    { key: "pending",   label: "Pending" },
    { key: "active",    label: "Active" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <div className={styles.pageStack} style={{ padding: "24px" }}>
      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1e1b4b", margin: 0 }}>Deliveries</h2>
        <p style={{ color: "#64748b", margin: "4px 0 0" }}>View and manage your assigned deliveries</p>
      </div>

      {/* ── Filter Tabs ─────────────────────────────────────── */}
      <div style={{
        display: "flex", gap: "8px", marginBottom: "28px", flexWrap: "wrap",
      }}>
        {tabs.map(tab => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "10px 20px",
                borderRadius: "12px",
                border: active ? "2px solid #7c3aed" : "1px solid #e2e8f0",
                background: active ? "linear-gradient(135deg, #7c3aed, #6d28d9)" : "white",
                color: active ? "white" : "#64748b",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {tab.label}
              <span style={{
                background: active ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                padding: "2px 8px",
                borderRadius: "8px",
                fontSize: "0.75rem",
                fontWeight: 800,
              }}>
                {counts[tab.key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Loading ──────────────────────────────────────────── */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
          <p style={{ fontWeight: 600 }}>Loading work orders...</p>
        </div>
      )}

      {/* ── Empty State ──────────────────────────────────────── */}
      {!loading && filteredOrders.length === 0 && (
        <div style={{
          textAlign: "center", padding: "60px", color: "#94a3b8",
          background: "white", borderRadius: "20px", border: "1px solid #f1f5f9",
        }}>
          <Package size={48} style={{ opacity: 0.3, margin: "0 auto 12px" }} />
          <p style={{ fontWeight: 600 }}>No deliveries found</p>
          <p style={{ fontSize: "0.85rem" }}>
            {activeTab === "all"
              ? "Waiting for supplier to assign orders to you."
              : `No ${activeTab} deliveries at the moment.`}
          </p>
        </div>
      )}

      {/* ── Order Cards ──────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {filteredOrders.map(order => {
          const isExpanded = expandedId === order.id;
          const stepIndex = getStepIndex(order.delivery_status);
          const isRejected = order.delivery_status === "rejected";

          return (
            <div
              key={order.id}
              style={{
                background: "white",
                borderRadius: "20px",
                border: isRejected
                  ? "2px solid #fecaca"
                  : order.delivery_status === "pending_acceptance"
                  ? "2px solid #fed7aa"
                  : "1px solid #f1f5f9",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                overflow: "hidden",
                transition: "all 0.2s",
              }}
            >
              {/* ── Card Header ──────────────────────────────── */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
                style={{
                  padding: "20px 24px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 800, color: "#4338ca", fontSize: "1rem" }}>
                      Order #{order.order_number || order.id.slice(0, 8)}
                    </span>
                    <span style={{
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      background: isRejected ? "#fef2f2"
                        : order.delivery_status === "pending_acceptance" ? "#fff7ed"
                        : order.delivery_status === "accepted" ? "#ede9fe"
                        : order.delivery_status === "in_transit" ? "#dbeafe"
                        : order.delivery_status === "delivered" ? "#dcfce7"
                        : "#f1f5f9",
                      color: isRejected ? "#dc2626"
                        : order.delivery_status === "pending_acceptance" ? "#c2410c"
                        : order.delivery_status === "accepted" ? "#6d28d9"
                        : order.delivery_status === "in_transit" ? "#1d4ed8"
                        : order.delivery_status === "delivered" ? "#166534"
                        : "#475569",
                    }}>
                      {isRejected ? "Rejected" : order.delivery_status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", color: "#64748b", fontSize: "0.85rem", flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Building2 size={14} color="#7c3aed" /> {order.organization_name}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <MapPin size={14} color="#7c3aed" /> {order.delivery_address}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ fontWeight: 800, fontSize: "1.15rem", color: "#22054f" }}>
                    Rs. {order.total_amount.toLocaleString()}
                  </span>
                  {isExpanded
                    ? <ChevronUp size={20} color="#94a3b8" />
                    : <ChevronDown size={20} color="#94a3b8" />}
                </div>
              </div>

              {/* ── Status Stepper (always visible) ──────────── */}
              {!isRejected && (
                <div style={{ padding: "0 24px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", position: "relative", padding: "0 4px" }}>
                    {STEPS.map((step, idx) => {
                      const isCompleted = idx <= stepIndex;
                      const isCurrent = idx === stepIndex;
                      return (
                        <div key={step.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1, position: "relative" }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.7rem", fontWeight: 700,
                            color: "white",
                            background: isCompleted ? "#7c3aed" : "#ddd6fe",
                            boxShadow: isCurrent ? "0 0 0 4px rgba(124,58,237,0.2)" : "none",
                            transition: "all 0.3s",
                          }}>
                            {isCompleted ? <Check size={14} strokeWidth={3} /> : idx + 1}
                          </div>
                          <span style={{
                            fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase",
                            color: isCompleted ? "#4338ca" : "#94a3b8",
                            marginTop: "6px", textAlign: "center",
                          }}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                    {/* Background line */}
                    <div style={{
                      position: "absolute", top: "14px", left: "10%", right: "10%",
                      height: 3, background: "#ede9fe", borderRadius: 4, zIndex: 0,
                    }} />
                    {/* Progress fill */}
                    <div style={{
                      position: "absolute", top: "14px", left: "10%",
                      width: `${Math.max(0, stepIndex / (STEPS.length - 1)) * 80}%`,
                      height: 3, borderRadius: 4, zIndex: 0,
                      background: "#7c3aed",
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>
              )}

              {/* ── Action Buttons (always visible) ──────────── */}
              <div style={{ padding: "0 24px 20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {order.delivery_status === "pending_acceptance" && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateDeliveryStatus(order.id, "accepted"); }}
                      style={{
                        flex: 1, minWidth: "140px",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                        padding: "12px 20px", borderRadius: "12px", border: "none",
                        background: "linear-gradient(135deg, #10b981, #059669)",
                        color: "white", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
                        transition: "transform 0.15s",
                      }}
                    >
                      <CheckCircle size={18} /> Accept Delivery
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateDeliveryStatus(order.id, "rejected"); }}
                      style={{
                        flex: 1, minWidth: "140px",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                        padding: "12px 20px", borderRadius: "12px",
                        border: "2px solid #fca5a5", background: "white",
                        color: "#dc2626", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
                        transition: "transform 0.15s",
                      }}
                    >
                      <XCircle size={18} /> Reject
                    </button>
                  </>
                )}

                {order.delivery_status === "accepted" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); updateDeliveryStatus(order.id, "in_transit"); }}
                    style={{
                      flex: 1, minWidth: "200px",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                      padding: "12px 20px", borderRadius: "12px", border: "none",
                      background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                      color: "white", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
                    }}
                  >
                    <Truck size={18} /> Start Transit
                  </button>
                )}

                {order.delivery_status === "in_transit" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); updateDeliveryStatus(order.id, "delivered"); }}
                    style={{
                      flex: 1, minWidth: "200px",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                      padding: "12px 20px", borderRadius: "12px", border: "none",
                      background: "linear-gradient(135deg, #059669, #047857)",
                      color: "white", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
                    }}
                  >
                    <CheckCircle size={18} /> Mark as Delivered
                  </button>
                )}

                {order.delivery_status === "delivered" && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "10px 20px", borderRadius: "12px",
                    background: "#dcfce7", color: "#166534",
                    fontWeight: 700, fontSize: "0.85rem",
                  }}>
                    <CheckCircle size={16} /> Delivery Completed
                  </div>
                )}

                {order.delivery_status === "rejected" && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "10px 20px", borderRadius: "12px",
                    background: "#fef2f2", color: "#dc2626",
                    fontWeight: 700, fontSize: "0.85rem",
                    border: "1px solid #fecaca",
                  }}>
                    <AlertTriangle size={16} /> Rejected — Waiting for reassignment
                  </div>
                )}
              </div>

              {/* ── Expanded Details ─────────────────────────── */}
              {isExpanded && (
                <div style={{
                  padding: "0 24px 24px",
                  borderTop: "1px solid #f1f5f9",
                  marginTop: "4px",
                  paddingTop: "20px",
                }}>
                  {/* Info Grid */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "16px",
                    marginBottom: "20px",
                  }}>
                    <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: "12px" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>Supplier</span>
                      <p style={{ margin: "4px 0 0", fontWeight: 700, color: "#1e1b4b" }}>{order.supplier_name}</p>
                    </div>
                    <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: "12px" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>Vehicle</span>
                      <p style={{ margin: "4px 0 0", fontWeight: 700, color: "#1e1b4b" }}>
                        {order.vehicle_plate ? `${order.vehicle_plate} • ${order.vehicle_model}` : "Not assigned"}
                      </p>
                    </div>
                    <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: "12px" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>Ordered</span>
                      <p style={{ margin: "4px 0 0", fontWeight: 700, color: "#1e1b4b", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Calendar size={14} color="#7c3aed" />
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: "12px" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>Organization Phone</span>
                      <p style={{ margin: "4px 0 0", fontWeight: 700, color: "#1e1b4b" }}>{order.organization_phone}</p>
                    </div>
                  </div>

                  {/* Items Table */}
                  {order.items.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: "0.8rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: "10px" }}>
                        Items ({order.items.length})
                      </h4>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ textAlign: "left", borderBottom: "2px solid #f1f5f9" }}>
                            <th style={{ padding: "10px 12px", fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Product</th>
                            <th style={{ padding: "10px 12px", fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Qty</th>
                            <th style={{ padding: "10px 12px", fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Unit Price</th>
                            <th style={{ padding: "10px 12px", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textAlign: "right" }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: "1px solid #f8fafc" }}>
                              <td style={{ padding: "10px 12px", fontWeight: 600, color: "#1e1b4b" }}>{item.name}</td>
                              <td style={{ padding: "10px 12px", color: "#475569" }}>{item.quantity}</td>
                              <td style={{ padding: "10px 12px", color: "#475569" }}>Rs. {item.unit_price.toLocaleString()}</td>
                              <td style={{ padding: "10px 12px", fontWeight: 700, color: "#22054f", textAlign: "right" }}>
                                Rs. {(item.quantity * item.unit_price).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
