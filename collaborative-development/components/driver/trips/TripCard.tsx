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
    picked_up: "badge-primary",
    delivered: "badge-success",
    rejected: "badge-danger",
  };

  const statusText = {
    assigned: "Pending Acceptance",
    accepted: "Accepted - Awaiting Pickup",
    picked_up: "Picked Up - In Transit",
    delivered: "Delivered",
    rejected: "Rejected",
  };

  return (
    <div className="trip-card">
      <div className="trip-card-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="trip-info">
          <span className="order-number">Order #{trip.orders.order_number}</span>
          <span className={`trip-status ${statusColors[trip.status as keyof typeof statusColors]}`}>
            {statusText[trip.status as keyof typeof statusText]}
          </span>
        </div>
        <div className="trip-meta">
          <span className="delivery-charge">
            <DollarSign size={14} /> Rs. {trip.delivery_charge.toLocaleString()}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="trip-card-details">
          {/* Pickup Location */}
          <div className="detail-section">
            <h4>
              <MapPin size={16} /> Pickup Location
            </h4>
            <p><strong>{trip.orders.organizations.name}</strong></p>
            <p>{trip.pickup_address || trip.orders.organizations.address}</p>
            <p><Phone size={14} /> {trip.orders.organizations.phone}</p>
          </div>

          {/* Delivery Location */}
          <div className="detail-section">
            <h4>
              <MapPin size={16} /> Delivery Location
            </h4>
            <p><strong>{trip.orders.customer_name}</strong></p>
            <p>{trip.orders.delivery_address}</p>
            <p><Phone size={14} /> {trip.orders.customer_phone}</p>
          </div>

          {/* Order Summary */}
          <div className="detail-section">
            <h4>
              <Package size={16} /> Order Summary
            </h4>
            <p>Total Order Value: Rs. {trip.orders.total_amount.toLocaleString()}</p>
            <p>Delivery Charge: Rs. {trip.delivery_charge.toLocaleString()}</p>
            <p>Total Earnings: Rs. {(trip.delivery_charge).toLocaleString()}</p>
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

          {showActions && trip.status === "picked_up" && (
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