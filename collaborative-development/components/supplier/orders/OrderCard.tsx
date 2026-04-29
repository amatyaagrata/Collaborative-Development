// src/components/supplier/orders/OrderCard.tsx
"use client";

import { useState } from "react";
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
  };
  onView?: () => void;
  onStatusChange?: (status: string) => void;
  showActions?: boolean;
}

export default function OrderCard({ order, onView, onStatusChange, showActions = false }: OrderCardProps) {
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
          <span className={styles.entityNumber}>Order #{order.order_number}</span>
          <span className={`${styles.statusBadge} ${styles[statusColors[order.status as keyof typeof statusColors]]}`}>
            {order.status.toUpperCase()}
          </span>
        </div>
        <div className={styles.cardMeta}>
          <span>
            {new Date(order.created_at).toLocaleString()}
          </span>
          <span>Rs. {order.total_amount.toLocaleString()}</span>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.cardDetails}>
          <div className={styles.detailBlock}>
            <h4 className={styles.detailTitle}>Organization Details</h4>
            <p className={styles.detailText}><strong>Name:</strong> {order.organizations?.name}</p>
            <p className={styles.detailText}><strong>Address:</strong> {order.organizations?.address}</p>
            <p className={styles.detailText}><strong>Phone:</strong> {order.organizations?.phone}</p>
          </div>

          <div className={styles.detailBlock}>
            <h4 className={styles.detailTitle}>Delivery Address</h4>
            <p className={styles.detailText}>{order.delivery_address}</p>
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

          {showActions && onStatusChange && (
            <div className={styles.detailBlock}>
              <h4 className={styles.detailTitle}>Update Status</h4>
              <div className={styles.statusGrid}>
                {statusSteps.map((step, idx) => (
                  <button
                    key={step}
                    className={`${styles.statusStep} ${idx <= currentStepIndex ? styles.statusStepCompleted : ""} ${order.status === step ? styles.statusStepActive : ""}`}
                    onClick={() => onStatusChange(step)}
                    disabled={idx < currentStepIndex}
                  >
                    {step}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.actionRow}>
            <button className={styles.actionButton} onClick={onView} type="button">
              View Full Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
