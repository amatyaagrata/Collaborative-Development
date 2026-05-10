"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { MapPin, Navigation2, Clock, Package, Loader2 } from "lucide-react";
import styles from "@/components/layout/PortalLayout.module.css";
import { toast } from "sonner";

export default function SupplierRoutesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchRoutes = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userRow } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (!userRow) return;

      const { data: supplierRow } = await supabase
        .from("suppliers")
        .select("id")
        .eq("user_id", userRow.id)
        .single();

      if (!supplierRow) return;

      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          status,
          created_at,
          organizations:organization_id (
            name,
            address
          )
        `)
        .eq("supplier_id", supplierRow.id)
        .not("status", "eq", "delivered")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((o: any) => ({
        id: o.id,
        order_number: o.order_number ?? o.id.slice(0, 8),
        status: o.status,
        destination_name: o.organizations?.name || "N/A",
        destination_address: o.organizations?.address || "",
      }));

      setOrders(mapped);
      if (mapped.length > 0 && !selectedAddress) {
        const firstWithAddress = mapped.find(m => m.destination_address);
        if (firstWithAddress) setSelectedAddress(firstWithAddress.destination_address);
      }
    } catch (err) {
      console.error("Error fetching routes:", err);
      toast.error("Failed to load delivery routes");
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedAddress]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(selectedAddress || "Kathmandu")}&output=embed`;

  return (
    <div className={styles.pageStack} style={{ padding: "20px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#2d1a5a", margin: 0 }}>
          Delivery Routes
        </h2>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "4px" }}>
          Monitor the delivery destinations for your active orders.
        </p>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "24px", height: "calc(100vh - 200px)" }}>
        
        {/* MAP INTERFACE */}
        <div style={{ position: "relative", background: "#f1f5f9", borderRadius: "20px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <Loader2 className="animate-spin" size={32} color="#7c3aed" />
            </div>
          ) : selectedAddress ? (
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
              <p style={{ marginTop: "12px", fontWeight: 600 }}>No active delivery addresses found</p>
            </div>
          )}
        </div>

        {/* ORDER LIST SIDEBAR */}
        <div style={{ background: "white", padding: "24px", borderRadius: "20px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" }}>
          <h3 style={{ marginBottom: "20px", fontSize: "1.1rem", fontWeight: "700", color: "#1e1b4b" }}>Active Orders</h3>
          
          <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
            {!loading && orders.length === 0 && (
              <p style={{ color: "#94a3b8", fontSize: "0.9rem", textAlign: "center", marginTop: "20px" }}>
                No active orders with routes to display.
              </p>
            )}

            {orders.map((order) => (
              <div 
                key={order.id} 
                onClick={() => order.destination_address && setSelectedAddress(order.destination_address)}
                style={{ 
                  padding: "16px", 
                  cursor: order.destination_address ? "pointer" : "default",
                  borderLeft: selectedAddress === order.destination_address ? "4px solid #7c3aed" : "4px solid #f1f5f9", 
                  background: selectedAddress === order.destination_address ? "#f5f3ff" : "#fbfcfd", 
                  marginBottom: "12px", 
                  borderRadius: "8px",
                  transition: "all 0.2s ease",
                  opacity: order.destination_address ? 1 : 0.6
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1e1b4b" }}>
                    {order.destination_name}
                  </div>
                  <div style={{ fontSize: "0.7rem", fontWeight: "800", color: "#7c3aed" }}>
                    #{order.order_number}
                  </div>
                </div>

                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <MapPin size={14} /> {order.destination_address || "No address provided"}
                </div>

                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Clock size={14} /> Status: <span style={{ textTransform: "capitalize" }}>{order.status?.replace(/_/g, " ")}</span>
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
            <Navigation2 size={18} /> View on Google Maps
          </button>
        </div>

      </div>
    </div>
  );
}
