// src/components/driver/trips/TripCard.tsx
"use client";

import { useState } from "react";
import { MapPin, Phone, Package, DollarSign } from "lucide-react";
import styles from "@/components/layout/PortalLayout.module.css";

interface TripCardProps {
  trip: {
    id: string;
    status: string;
    delivery_charge: number;
    assigned_at: string;
    pickup_address?: string;
    orders: {
      order_number: string;
      customer_name: string;
      customer_phone: string;
      total_amount: number;
      delivery_address: string;
      organizations: {
        name: string;
        address: string;
        phone: string;
      };
    };
  };
  onAccept?: () => void;
  onReject?: () => void;
  onComplete?: () => void;
  showActions?: boolean;
}

export default function TripCard({ trip, onAccept, onReject, onComplete, showActions = false }: TripCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusColors = {
    assigned: "badge-warning",
    accepted: "badge-info",
    in_transit: "badge-primary",
    delivered: "badge-success",
    cancelled: "badge-danger",
  };

  const statusText = {
    assigned: "Pending Acceptance",
    accepted: "Accepted - Awaiting Pickup",
    in_transit: "In Transit",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  return (
    <div className={styles.tripCard}>
      <div className={styles.cardHeader} onClick={() => setIsExpanded(!isExpanded)}>
        <div className={styles.cardInfo}>
          <span className={styles.entityNumber}>Order #{trip.orders?.order_number || "N/A"}</span>
          <span className={`${styles.statusBadge} ${styles[statusColors[trip.status as keyof typeof statusColors]]}`}>
            {statusText[trip.status as keyof typeof statusText]}
          </span>
        </div>
        <div className={styles.cardMeta}>
          <span>
            <DollarSign size={14} /> Rs. {trip.delivery_charge?.toLocaleString() || "0"}
          </span>
        </div>
      </div>

      {isExpanded && trip.orders && (
        <div className={styles.cardDetails}>
          <div className={styles.detailBlock}>
            <h4 className={styles.detailTitle}>
              <MapPin size={16} /> Pickup Location
            </h4>
            <p className={styles.detailText}><strong>{trip.orders.organizations?.name || "Unknown"}</strong></p>
            <p className={styles.detailText}>{trip.pickup_address || trip.orders.organizations?.address || "No address"}</p>
            <p className={styles.detailText}><Phone size={14} /> {trip.orders.organizations?.phone || "N/A"}</p>
          </div>

          <div className={styles.detailBlock}>
            <h4 className={styles.detailTitle}>
              <MapPin size={16} /> Delivery Location
            </h4>
            <p className={styles.detailText}><strong>{trip.orders.customer_name || "Unknown"}</strong></p>
            <p className={styles.detailText}>{trip.orders.delivery_address || "No address"}</p>
            <p className={styles.detailText}><Phone size={14} /> {trip.orders.customer_phone || "N/A"}</p>
          </div>

          <div className={styles.detailBlock}>
            <h4 className={styles.detailTitle}>
              <Package size={16} /> Order Summary
            </h4>
            <p className={styles.detailText}>Total Order Value: Rs. {trip.orders.total_amount?.toLocaleString() || "0"}</p>
            <p className={styles.detailText}>Delivery Charge: Rs. {trip.delivery_charge?.toLocaleString() || "0"}</p>
            <p className={styles.detailText}>Total Earnings: Rs. {(trip.delivery_charge || 0).toLocaleString()}</p>
          </div>

          {showActions && trip.status === "assigned" && (
            <div className={styles.actionRow}>
              <button className={styles.successButton} onClick={onAccept} type="button">
                Accept Trip
              </button>
              <button className={styles.dangerButton} onClick={onReject} type="button">
                Reject
              </button>
            </div>
          )}

          {showActions && trip.status === "accepted" && (
            <div className={styles.actionRow}>
              <button className={styles.secondaryButton} onClick={onComplete} type="button">
                Confirm Pickup
              </button>
            </div>
          )}

          {showActions && trip.status === "in_transit" && (
            <div className={styles.actionRow}>
              <button className={styles.actionButton} onClick={onComplete} type="button">
                Mark as Delivered
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
