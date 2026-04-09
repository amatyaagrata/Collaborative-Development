// src/components/driver/trips/TripCard.tsx
"use client";

import { useState } from "react";
import { MapPin, Phone, Package, DollarSign } from "lucide-react";

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
    <div className="trip-card">
      <div className="trip-card-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="trip-info">
          <span className="order-number">Order #{trip.orders?.order_number || "N/A"}</span>
          <span className={`trip-status ${statusColors[trip.status as keyof typeof statusColors]}`}>
            {statusText[trip.status as keyof typeof statusText]}
          </span>
        </div>
        <div className="trip-meta">
          <span className="delivery-charge">
            <DollarSign size={14} /> Rs. {trip.delivery_charge?.toLocaleString() || "0"}
          </span>
        </div>
      </div>

      {isExpanded && trip.orders && (
        <div className="trip-card-details">
          {/* Pickup Location */}
          <div className="detail-section">
            <h4>
              <MapPin size={16} /> Pickup Location
            </h4>
            <p><strong>{trip.orders.organizations?.name || "Unknown"}</strong></p>
            <p>{trip.pickup_address || trip.orders.organizations?.address || "No address"}</p>
            <p><Phone size={14} /> {trip.orders.organizations?.phone || "N/A"}</p>
          </div>

          {/* Delivery Location */}
          <div className="detail-section">
            <h4>
              <MapPin size={16} /> Delivery Location
            </h4>
            <p><strong>{trip.orders.customer_name || "Unknown"}</strong></p>
            <p>{trip.orders.delivery_address || "No address"}</p>
            <p><Phone size={14} /> {trip.orders.customer_phone || "N/A"}</p>
          </div>

          {/* Order Summary */}
          <div className="detail-section">
            <h4>
              <Package size={16} /> Order Summary
            </h4>
            <p>Total Order Value: Rs. {trip.orders.total_amount?.toLocaleString() || "0"}</p>
            <p>Delivery Charge: Rs. {trip.delivery_charge?.toLocaleString() || "0"}</p>
            <p>Total Earnings: Rs. {(trip.delivery_charge || 0).toLocaleString()}</p>
          </div>

          {/* Action Buttons */}
          {showActions && trip.status === "assigned" && (
            <div className="action-buttons">
              <button className="accept-btn" onClick={onAccept}>
                Accept Trip
              </button>
              <button className="reject-btn" onClick={onReject}>
                Reject
              </button>
            </div>
          )}

          {showActions && trip.status === "accepted" && (
            <div className="action-buttons">
              <button className="pickup-btn" onClick={onComplete}>
                Confirm Pickup
              </button>
            </div>
          )}

          {showActions && trip.status === "in_transit" && (
            <div className="action-buttons">
              <button className="complete-btn" onClick={onComplete}>
                Mark as Delivered
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
