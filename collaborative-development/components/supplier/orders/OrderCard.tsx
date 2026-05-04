// src/components/supplier/orders/OrderCard.tsx
"use client";

import { useState } from "react";
import { Building2, MapPin, Phone, Check } from "lucide-react";
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

  const statusSteps = [
    "pending",
    "confirmed",
    "preparing",
    "ready_for_delivery",
    "out_for_delivery",
    "delivered",
  ];
  const currentStepIndex = statusSteps.indexOf(order.status);

  return (
    <div className={styles.orderCard}>
      <div className={styles.cardHeader} onClick={() => setIsExpanded(!isExpanded)}>
        <div className={styles.cardInfo}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className={styles.entityNumber}>Order #{order.order_number}</span>
            <span className={`${styles.statusBadge} ${styles[statusColors[order.status as keyof typeof statusColors]]}`}>
              {order.status.replace(/_/g, " ").toUpperCase()}
            </span>
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

          {showActions && onAssignTransporter && transporters && (
            <div className={styles.detailBlock}>
              <h4 className={styles.detailTitle}>Delivery Assignment</h4>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#8a849c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Delivery Status:
                  </span>
                  <span className={`${styles.statusBadge} ${
                    order.delivery_status === 'delivered' ? styles.badgeSuccess 
                    : order.delivery_status === 'in_transit' ? styles.badgePrimary 
                    : order.delivery_status === 'accepted' ? styles.badgeInfo
                    : order.delivery_status === 'pending_acceptance' ? styles.badgeWarning
                    : order.delivery_status === 'rejected' ? styles.badgeDanger
                    : styles.badgeSecondary
                  }`}>
                    {(order.delivery_status || 'NOT ASSIGNED').replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {showActions && onStatusChange && (
            <div className={styles.detailBlock}>
              <h4 className={styles.detailTitle}>Order Progress</h4>
              <div className={styles.stepperContainer}>
                <div className={styles.stepLine}>
                  <div 
                    className={styles.stepLineProgress} 
                    style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                  />
                </div>
                {statusSteps.map((step, idx) => {
                  const isCompleted = idx <= currentStepIndex;
                  const isActive = step === order.status;
                  return (
                    <div key={step} className={styles.stepWrapper}>
                      <button
                        className={`${styles.stepCircle} ${isCompleted ? styles.stepCircleCompleted : ""} ${isActive ? styles.stepCircleActive : ""}`}
                        onClick={() => onStatusChange(step)}
                        disabled={idx < currentStepIndex}
                        title={`Set status to ${step.replace(/_/g, " ").toUpperCase()}`}
                      >
                        {isCompleted && !isActive ? <Check size={18} strokeWidth={3} /> : (idx + 1)}
                      </button>
                      <span className={`${styles.stepLabel} ${isActive ? styles.stepLabelActive : ""}`}>
                        {step.replace(/_/g, " ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
