// src/components/supplier/orders/OrderCard.tsx
"use client";

import { useState } from "react";

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
      product_name: string;
      quantity: number;
      unit_price: number;
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
    ready: "badge-success",
    delivered: "badge-secondary",
  };

  const statusSteps = ["pending", "confirmed", "preparing", "ready", "delivered"];
  const currentStepIndex = statusSteps.indexOf(order.status);

  return (
    <div className="order-card">
      <div className="order-card-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="order-info">
          <span className="order-number">Order #{order.order_number}</span>
          <span className={`order-status ${statusColors[order.status as keyof typeof statusColors]}`}>
            {order.status.toUpperCase()}
          </span>
        </div>
        <div className="order-meta">
          <span className="order-date">
            {new Date(order.created_at).toLocaleString()}
          </span>
          <span className="order-amount">Rs. {order.total_amount.toLocaleString()}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="order-card-details">
          {/* Organization Details */}
          <div className="detail-section">
            <h4>Organization Details</h4>
            <p><strong>Name:</strong> {order.organizations?.name}</p>
            <p><strong>Address:</strong> {order.organizations?.address}</p>
            <p><strong>Phone:</strong> {order.organizations?.phone}</p>
          </div>

          {/* Delivery Address */}
          <div className="detail-section">
            <h4>Delivery Address</h4>
            <p>{order.delivery_address}</p>
          </div>

          {/* Order Items */}
          <div className="detail-section">
            <h4>Order Items</h4>
            <table className="items-table">
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
                    <td>{item.product_name}</td>
                    <td>{item.quantity}</td>
                    <td>Rs. {(item.unit_price || 0).toLocaleString()}</td>
                    <td>Rs. {((item.quantity || 0) * (item.unit_price || 0)).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Status Update Actions */}
          {showActions && onStatusChange && (
            <div className="detail-section">
              <h4>Update Status</h4>
              <div className="status-buttons">
                {statusSteps.map((step, idx) => (
                  <button
                    key={step}
                    className={`status-btn ${idx <= currentStepIndex ? "completed" : ""} ${order.status === step ? "active" : ""}`}
                    onClick={() => onStatusChange(step)}
                    disabled={idx < currentStepIndex}
                  >
                    {step}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="card-actions">
            <button className="view-details-btn" onClick={onView}>
              View Full Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}