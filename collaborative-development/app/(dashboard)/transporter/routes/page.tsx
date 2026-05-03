"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { MapPin, Navigation2, Clock, Package } from "lucide-react";
import styles from "@/components/layout/PortalLayout.module.css";

export default function TransporterRoutesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const supabase = createClient();

  const fetchActiveRoutes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("transporter_id", user.id)
      .neq("delivery_status", "delivered") // Only show active/pending routes
      .order("created_at", { ascending: true });

    if (!error && data) {
      setOrders(data);
      if (data.length > 0) setSelectedAddress(data[0].delivery_address);
    }
  };

  useEffect(() => {
    fetchActiveRoutes();
  }, []);

  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(selectedAddress || "Kathmandu")}&output=embed`;

  return (
    <div className={styles.pageStack} style={{ padding: "20px" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#2d1a5a", marginBottom: "24px" }}>
        Optimized Routing & Map
      </h2>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "24px", height: "calc(100vh - 180px)" }}>
        
        {/* LIVE MAP INTERFACE */}
        <div style={{ position: "relative", background: "#f1f5f9", borderRadius: "20px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
          {selectedAddress ? (
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0 }}
              src={mapUrl}
              allowFullScreen
            ></iframe>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b" }}>
              <MapPin size={48} color="#7c3aed" />
              <p style={{ marginTop: "12px", fontWeight: 600 }}>No active routes found</p>
            </div>
          )}
        </div>

        {/* DAILY MANIFEST SIDEBAR */}
        <div style={{ background: "white", padding: "24px", borderRadius: "20px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" }}>
          <h3 style={{ marginBottom: "20px", fontSize: "1.1rem", fontWeight: "700", color: "#1e1b4b" }}>Daily Manifest</h3>
          
          <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
            {orders.length === 0 && (
              <p style={{ color: "#94a3b8", fontSize: "0.9rem", textAlign: "center", marginTop: "20px" }}>
                Add deliveries in the "Deliveries" tab to see them here.
              </p>
            )}

            {orders.map((order) => (
              <div 
                key={order.id} 
                onClick={() => setSelectedAddress(order.delivery_address)}
                style={{ 
                  padding: "16px", 
                  cursor: "pointer",
                  borderLeft: selectedAddress === order.delivery_address ? "4px solid #7c3aed" : "4px solid #f1f5f9", 
                  background: selectedAddress === order.delivery_address ? "#f5f3ff" : "#fbfcfd", 
                  marginBottom: "12px", 
                  borderRadius: "8px",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1e1b4b" }}>{order.delivery_address}</div>
                  <div style={{ fontSize: "0.7rem", fontWeight: "800", color: "#7c3aed" }}>{order.order_number}</div>
                </div>
                
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Package size={14} /> {order.product_name || "General Cargo"}
                </div>
                
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Clock size={14} /> ETA: {order.eta}
                </div>

                <div style={{ 
                  marginTop: "10px", 
                  fontSize: "0.65rem", 
                  fontWeight: "800", 
                  textTransform: "uppercase",
                  color: order.delivery_status === "in_transit" ? "#7c3aed" : "#94a3b8" 
                }}>
                  {order.delivery_status === "not_assigned" ? "Pending" : "In Transit"}
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedAddress)}`, '_blank')}
            disabled={!selectedAddress}
            style={{ 
              width: "100%", 
              marginTop: "20px", 
              background: selectedAddress ? "#7c3aed" : "#e2e8f0", 
              color: "white", 
              border: "none", 
              padding: "14px", 
              borderRadius: "12px", 
              fontWeight: 600, 
              cursor: selectedAddress ? "pointer" : "not-allowed", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: "8px" 
            }}
          >
            <Navigation2 size={18} /> Start Navigation
          </button>
        </div>

      </div>
    </div>
  );
}