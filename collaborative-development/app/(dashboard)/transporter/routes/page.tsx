"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { MapPin, Navigation2, Clock, Package, Loader2 } from "lucide-react";
import styles from "@/components/layout/PortalLayout.module.css";
import { toast } from "sonner";

export default function TransporterRoutesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchActiveRoutes = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("Auth error:", authError);
        setLoading(false);
        return;
      }

      console.log("Transporter user:", user.email);

      // Get the driver ID from users table
      const { data: driverData, error: driverError } = await supabase
        .from("drivers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (driverError) {
        console.error("Driver fetch error:", driverError);
        setLoading(false);
        return;
      }

      if (!driverData) {
        console.log("No driver profile found for user");
        setOrders([]);
        setLoading(false);
        return;
      }

      console.log("Driver ID found:", driverData.id);

      // Fetch active assignments for this driver from order_driver_assignments
      const { data: assignments, error: assignError } = await supabase
        .from("order_driver_assignments")
        .select(`
          id,
          status,
          purchase_order_id,
          assigned_at,
          purchase_orders:purchase_order_id (
            id,
            order_number,
            status,
            total_amount,
            expected_delivery_date,
            organizations:org_id (
              name,
              address
            )
          )
        `)
        .eq("driver_id", driverData.id)
        .in("status", ["accepted", "pending"])
        .order("assigned_at", { ascending: true });

      if (assignError) {
        console.error("Assignments fetch error:", assignError);
        toast.error("Failed to load active routes");
        setOrders([]);
        setLoading(false);
        return;
      }

      console.log("Assignments found:", assignments?.length || 0);

      // Map the data
      const mapped = (assignments || [])
        .filter(a => a.purchase_orders)
        .map((a: any) => ({
          id: a.purchase_order_id,
          order_number: a.purchase_orders.order_number ?? a.purchase_order_id.slice(0, 8),
          status: a.purchase_orders.status,
          destination_name: a.purchase_orders.organizations?.name || "N/A",
          destination_address: a.purchase_orders.organizations?.address || "",
          assignment_status: a.status,
          assigned_at: a.assigned_at,
        }));

      setOrders(mapped);
      
      if (mapped.length > 0 && !selectedAddress) {
        const firstWithAddress = mapped.find(m => m.destination_address);
        if (firstWithAddress) setSelectedAddress(firstWithAddress.destination_address);
      }
    } catch (err) {
      console.error("Error fetching transporter routes:", err);
      toast.error("Failed to load active routes");
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedAddress]);

  useEffect(() => {
    fetchActiveRoutes();
  }, [fetchActiveRoutes]);

  const mapUrl = selectedAddress 
    ? `https://www.google.com/maps?q=${encodeURIComponent(selectedAddress)}&output=embed`
    : "";

  return (
    <div className={styles.pageStack} style={{ padding: "20px" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#2d1a5a", marginBottom: "24px" }}>
        Active Delivery Routes
      </h2>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "24px", height: "calc(100vh - 180px)" }}>
        
        {/* LIVE MAP INTERFACE */}
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
              <p style={{ marginTop: "12px", fontWeight: 600 }}>No active routes found</p>
              <p style={{ fontSize: "0.85rem", marginTop: "4px" }}>Select a delivery from the manifest</p>
            </div>
          )}
        </div>

        {/* DAILY MANIFEST SIDEBAR */}
        <div style={{ background: "white", padding: "24px", borderRadius: "20px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" }}>
          <h3 style={{ marginBottom: "20px", fontSize: "1.1rem", fontWeight: "700", color: "#1e1b4b" }}>Daily Manifest</h3>
          
          <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
            {!loading && orders.length === 0 && (
              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <Package size={40} style={{ margin: "0 auto 12px", color: "#cbd5e1" }} />
                <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                  Active deliveries will appear here once assigned and accepted.
                </p>
              </div>
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
                  transition: "all 0.2s ease"
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
            <Navigation2 size={18} /> Start Navigation
          </button>
        </div>

      </div>
    </div>
  );
}