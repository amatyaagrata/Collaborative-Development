// src/components/supplier/orders/OrderCard.tsx
"use client";

import { useState } from "react";
import { Building2, MapPin, Phone, Check, Truck, AlertTriangle } from "lucide-react";
import styles from "@/components/layout/PortalLayout.module.css";

interface OrderCardProps {
  order: {
    id: string;
    order_number: string;
    status: string;
    created_at: string;
    delivery_address: string;
    total_amount: number;
    organizations: {
      name: string;
      address: string;
      phone: string;
    };
    order_items: Array<{
      product_name?: string;
      quantity: number;
      unit_price: number;
      products?: {
        name?: string;
      };
    }>;
    transporter_id?: string;
    delivery_status?: string;
    transporter?: {
      name: string;
    };
  };
  onView?: () => void;
  onStatusChange?: (status: string) => void;
  transporters?: { id: string; name: string }[];
  onAssignTransporter?: (transporterId: string) => void;
  showActions?: boolean;
}

export default function OrderCard({ 
  order, 
  onView, 
  onStatusChange, 
  transporters,
  onAssignTransporter,
  showActions = false 
}: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusColors = {
    pending: "badge-warning",
    confirmed: "badge-info",
    preparing: "badge-primary",
    ready_for_delivery: "badge-success",
    out_for_delivery: "badge-success",
    delivered: "badge-secondary",
  };

  /* ── Unified steps: order lifecycle + delivery lifecycle ── */
  const unifiedSteps = [
    { key: "pending",             label: "Pending",           type: "order" },
    { key: "confirmed",           label: "Confirmed",         type: "order" },
    { key: "preparing",           label: "Preparing",         type: "order" },
    { key: "ready_for_delivery",  label: "Ready",             type: "order" },
    { key: "assigned",            label: "Assigned",          type: "delivery" },
    { key: "accepted",            label: "Accepted",          type: "delivery" },
    { key: "in_transit",          label: "In Transit",        type: "delivery" },
    { key: "delivered",           label: "Delivered",         type: "both" },
  ];

  /* Determine which step we are at */
  const getActiveIndex = () => {
    const ds = order.delivery_status || "not_assigned";
    const os = order.status;

    if (ds === "delivered" || os === "delivered") return 7;
    if (ds === "in_transit") return 6;
    if (ds === "accepted" || os === "out_for_delivery") return 5;
    if (ds === "pending_acceptance") return 4;

    // Order-only statuses
    const orderMap: Record<string, number> = {
      ready_for_delivery: 3,
      preparing: 2,
      confirmed: 1,
      pending: 0,
    };
    return orderMap[os] ?? 0;
  };

  const activeIndex = getActiveIndex();
  const isRejected = order.delivery_status === "rejected";

  return (
    <div className={styles.orderCard}>
      <div className={styles.cardHeader} onClick={() => setIsExpanded(!isExpanded)}>
        <div className={styles.cardInfo}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className={styles.entityNumber}>Order #{order.order_number}</span>
            <span className={`${styles.statusBadge} ${styles[statusColors[order.status as keyof typeof statusColors]]}`}>
              {order.status.replace(/_/g, " ").toUpperCase()}
            </span>
            {isRejected && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                padding: "3px 10px", borderRadius: "20px", fontSize: "0.7rem",
                fontWeight: 700, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca"
              }}>
                <AlertTriangle size={12} /> DRIVER REJECTED
              </span>
            )}
          </div>
          <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#6008f8", marginTop: "4px" }}>
            {order.organizations?.name || "Unknown Organization"}
          </span>
        </div>
        <div className={styles.cardMeta} style={{ alignItems: "flex-end", justifyContent: "center" }}>
          <span style={{ fontWeight: 800, fontSize: "1.25rem", color: "#22054f" }}>
            Rs. {order.total_amount.toLocaleString()}
          </span>
          <span style={{ color: "#6b7280", fontSize: "0.85rem" }}>
            {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.cardDetails}>
          <div className={styles.detailBlock}>
            <h4 className={styles.detailTitle}>Organization Details</h4>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <div className={styles.infoIconWrapper}><Building2 size={20} /></div>
                <div className={styles.infoContent}>
                  <span className={styles.infoContentLabel}>Name</span>
                  <span className={styles.infoContentValue}>{order.organizations?.name || "N/A"}</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoIconWrapper}><MapPin size={20} /></div>
                <div className={styles.infoContent}>
                  <span className={styles.infoContentLabel}>Address</span>
                  <span className={styles.infoContentValue}>{order.organizations?.address || "N/A"}</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoIconWrapper}><Phone size={20} /></div>
                <div className={styles.infoContent}>
                  <span className={styles.infoContentLabel}>Phone</span>
                  <span className={styles.infoContentValue}>{order.organizations?.phone || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.detailBlock}>
            <h4 className={styles.detailTitle}>Order Items</h4>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {(order.order_items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.product_name || item.products?.name || "Unknown Product"}</td>
                    <td>{item.quantity}</td>
                    <td>Rs. {(item.unit_price || 0).toLocaleString()}</td>
                    <td>Rs. {((item.quantity || 0) * (item.unit_price || 0)).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Transporter Assignment (inline with card) ── */}
          {showActions && onAssignTransporter && transporters && (
            <div className={styles.detailBlock}>
              <h4 className={styles.detailTitle}>
                <Truck size={16} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
                Assign Driver
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <select
                    style={{ width: '100%', padding: '10px 16px', borderRadius: '8px', border: '1px solid rgba(34,5,79,0.1)', background: '#f9f8fc', color: '#22054f', fontWeight: 600, fontSize: '0.9rem' }}
                    value={order.transporter_id || ""}
                    onChange={(e) => onAssignTransporter(e.target.value)}
                  >
                    <option value="">-- Select a Transporter --</option>
                    {transporters.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#8a849c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Status:
                  </span>
                  <span style={{
                    padding: "4px 12px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 700,
                    background: isRejected ? "#fef2f2" : order.delivery_status === "pending_acceptance" ? "#fffbeb" : order.delivery_status === "accepted" ? "#eff6ff" : order.delivery_status === "in_transit" ? "#f0f9ff" : order.delivery_status === "delivered" ? "#f0fdf4" : "#f8fafc",
                    color: isRejected ? "#dc2626" : order.delivery_status === "pending_acceptance" ? "#d97706" : order.delivery_status === "accepted" ? "#2563eb" : order.delivery_status === "in_transit" ? "#0284c7" : order.delivery_status === "delivered" ? "#16a34a" : "#64748b",
                    border: `1px solid ${isRejected ? "#fecaca" : "transparent"}`
                  }}>
                    {isRejected ? "⚠ REJECTED — Reassign above" : (order.delivery_status || 'NOT ASSIGNED').replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── Single Unified Progress Tracker ── */}
          {showActions && onStatusChange && (
            <div className={styles.detailBlock}>
              <h4 className={styles.detailTitle}>Order & Delivery Progress</h4>
              <div style={{ padding: "20px 12px 12px", background: "#f8fafc", borderRadius: "14px", marginTop: "8px" }}>
                {/* Stepper */}
                <div style={{ display: "flex", justifyContent: "space-between", position: "relative", padding: "0 8px" }}>
                  {unifiedSteps.map((step, idx) => {
                    const isCompleted = idx <= activeIndex && !isRejected;
                    const isCurrent = idx === activeIndex && !isRejected;
                    const isDeliveryStep = step.type === "delivery" || step.type === "both";
                    const isOrderStep = step.type === "order";
                    /* A rejected step shows at the 'assigned' position */
                    const isRejectedStep = isRejected && idx === 4;
                    const canClick = isOrderStep && idx > activeIndex;

                    return (
                      <div key={step.key} style={{
                        display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
                        zIndex: 1, position: "relative", flex: 1
                      }}>
                        <button
                          onClick={() => {
                            if (canClick && onStatusChange) onStatusChange(step.key);
                          }}
                          disabled={!canClick}
                          title={canClick ? `Set status to ${step.label}` : isDeliveryStep ? "Updated by transporter" : ""}
                          style={{
                            width: "28px", height: "28px", borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.7rem", fontWeight: 700, border: "none",
                            cursor: canClick ? "pointer" : "default",
                            transition: "all 0.3s",
                            color: "white",
                            background: isRejectedStep ? "#dc2626"
                              : isCompleted ? "#7c3aed"
                              : "#ddd6fe",
                            boxShadow: isCurrent ? "0 0 0 4px rgba(124,58,237,0.2)"
                              : isRejectedStep ? "0 0 0 4px rgba(220,38,38,0.2)"
                              : "none",
                          }}
                        >
                          {isRejectedStep ? <AlertTriangle size={14} />
                            : isCompleted ? <Check size={14} strokeWidth={3} />
                            : idx + 1}
                        </button>
                        <span style={{
                          fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase",
                          textAlign: "center", lineHeight: "1.2",
                          color: isRejectedStep ? "#dc2626" : isCompleted ? "#4338ca" : "#94a3b8"
                        }}>
                          {isRejectedStep ? "Rejected" : step.label}
                        </span>
                        {isDeliveryStep && !isRejectedStep && (
                          <span style={{
                            fontSize: "0.5rem", color: "#a78bfa", fontWeight: 600,
                            marginTop: "-4px"
                          }}>
                            (driver)
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {/* Background connector line */}
                  <div style={{
                    position: "absolute", top: "14px", left: "6%", right: "6%",
                    height: "3px", background: "#ede9fe", borderRadius: "4px", zIndex: 0
                  }} />
                  {/* Progress fill */}
                  <div style={{
                    position: "absolute", top: "14px", left: "6%",
                    width: `${Math.max(0, activeIndex / (unifiedSteps.length - 1)) * 88}%`,
                    height: "3px", borderRadius: "4px", zIndex: 0,
                    background: isRejected ? "linear-gradient(90deg, #7c3aed 80%, #dc2626 100%)" : "#7c3aed",
                    transition: "width 0.5s ease"
                  }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
