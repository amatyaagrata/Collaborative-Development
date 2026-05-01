"use client";

import React from "react";
import { Truck, MapPin, Car } from "lucide-react";

export default function TransporterDeliveriesPage() {
  return (
    <>
      <div style={{ maxWidth: 960, margin: "0 auto", textAlign: "center", padding: "60px 20px" }}>
        <Truck size={48} style={{ margin: "0 auto 16px", color: "#22c55e", opacity: 0.8 }} />
        <h2 style={{ color: "#14532d", margin: "0 0 8px" }}>All Deliveries</h2>
        <p style={{ color: "#15803d" }}>Full delivery history and manifest management coming soon.</p>
      </div>
    </>
  );
}
