"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Car, Battery, Fuel, Settings, Activity, AlertTriangle, Plus } from "lucide-react";
import styles from "@/components/layout/PortalLayout.module.css";
import { toast } from "sonner";

export default function TransporterVehiclesPage() {
  const [fleet, setFleet] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  /* Form state object to track vehicle metrics and identity without price data */
  const [newVehicle, setNewVehicle] = useState({ 
    license: "", 
    model: "", 
    status: "Active",
    health: "Good",
    battery: "100",
    fuel: "100"
  });
  
  const supabase = createClient();

  /* Returns visual color configurations based on current deployment status */
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Active": return { bg: "#f0fdf4", text: "#16a34a" };      /* Green styling */
      case "Pending": return { bg: "#fef2f2", text: "#dc2626" };     /* Red styling */
      case "In Transit": return { bg: "#fff7ed", text: "#ea580c" };  /* Orange styling */
      default: return { bg: "#f1f5f9", text: "#64748b" };
    }
  };

  /* Requests all vehicle records from the database for the active user */
  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from("vehicles").select("*").eq("transporter_id", user.id);
      if (error) throw error;
      setFleet(data || []);
    } catch (error: any) {
      toast.error("Could not load fleet data");
    } finally {
      setLoading(false);
    }
  };

  /* Submits the formatted vehicle data to the backend database */
  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("vehicles").insert([{ 
      license_plate: newVehicle.license, 
      model: newVehicle.model, 
      status: newVehicle.status,
      health: newVehicle.health,
      battery_level: `${newVehicle.battery}%`,
      fuel_level: `${newVehicle.fuel}%`,
      transporter_id: user.id,
    }]);

    if (error) {
      toast.error("Error: " + error.message);
    } else {
      toast.success("Vehicle added to fleet");
      setNewVehicle({ license: "", model: "", status: "Active", health: "Good", battery: "100", fuel: "100" });
      setShowAddForm(false);
      fetchVehicles();
    }
  };

  /* Trigger data fetch on initial component mount */
  useEffect(() => { fetchVehicles(); }, []);

  return (
    <div className={styles.pageStack} style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#1e1b4b" }}>Fleet Tracking</h2>
          <p style={{ color: "#64748b" }}>Real time unit management</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} style={{ background: "#7c3aed", color: "white", border: "none", padding: "12px 24px", borderRadius: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          <Plus size={20} /> {showAddForm ? "Close" : "Add Vehicle"}
        </button>
      </div>

      {/* Input section for adding new assets to the transporter fleet */}
      {showAddForm && (
        <div style={{ background: "white", padding: "24px", borderRadius: "20px", marginBottom: "32px", border: "1px solid #e2e8f0" }}>
          <form onSubmit={handleAddVehicle} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "800", color: "#94a3b8", marginBottom: "4px" }}>PLATE & MODEL</label>
              <input required placeholder="Plate" value={newVehicle.license} onChange={e => setNewVehicle({...newVehicle, license: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "8px" }} />
              <input required placeholder="Model" value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "800", color: "#94a3b8", marginBottom: "4px" }}>LEVELS (%)</label>
              <input type="number" placeholder="Battery %" value={newVehicle.battery} onChange={e => setNewVehicle({...newVehicle, battery: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "8px" }} />
              <input type="number" placeholder="Fuel %" value={newVehicle.fuel} onChange={e => setNewVehicle({...newVehicle, fuel: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "800", color: "#94a3b8", marginBottom: "4px" }}>STATUS & HEALTH</label>
              <select value={newVehicle.status} onChange={e => setNewVehicle({...newVehicle, status: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "8px" }}>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="In Transit">In Transit</option>
              </select>
              <select value={newVehicle.health} onChange={e => setNewVehicle({...newVehicle, health: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <option value="Good">Good</option>
                <option value="Checkup">Checkup</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <button type="submit" style={{ background: "#10b981", color: "white", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "700" }}>Register</button>
            </div>
          </form>
        </div>
      )}

      {/* Grid container for displaying all vehicle data cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
        {fleet.map((v) => {
          const colors = getStatusStyles(v.status);
          return (
            <div key={v.id} style={{ background: "white", padding: "24px", borderRadius: "24px", border: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                <div style={{ background: colors.bg, padding: "12px", borderRadius: "14px" }}>
                  <Car size={24} color={colors.text} />
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#1e1b4b" }}>{v.license_plate}</h3>
                <p style={{ color: "#64748b" }}>{v.model}</p>
              </div>

              {/* Visualization of core performance metrics */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "12px", textAlign: "center" }}>
                  <Battery size={16} color="#10b981" style={{ margin: "0 auto 4px" }} />
                  <div style={{ fontSize: "0.9rem", fontWeight: "700" }}>{v.battery_level}</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "12px", textAlign: "center" }}>
                  <Fuel size={16} color="#3b82f6" style={{ margin: "0 auto 4px" }} />
                  <div style={{ fontSize: "0.9rem", fontWeight: "700" }}>{v.fuel_level}</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "12px", textAlign: "center" }}>
                  <Activity size={16} color="#7c3aed" style={{ margin: "0 auto 4px" }} />
                  <div style={{ fontSize: "0.9rem", fontWeight: "700" }}>{v.health}</div>
                </div>
              </div>

              {/* Visual status tag using dynamic theme colors */}
              <div style={{ 
                marginTop: "20px", padding: "10px", borderRadius: "10px", fontSize: "0.8rem", fontWeight: "800", textAlign: "center",
                background: colors.bg, color: colors.text 
              }}>
                {v.status.toUpperCase()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}