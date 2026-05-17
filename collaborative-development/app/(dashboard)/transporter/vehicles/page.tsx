"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Car, Plus } from "lucide-react";
import styles from "@/components/layout/PortalLayout.module.css";
import { toast } from "sonner";

/**
 * Schema: vehicles(id, license_plate, model, status, health, battery_level, fuel_level, transporter_id → users.id)
 */
interface Vehicle {
  id: string;
  plate_number: string;
  model: string;
  vehicle_type: string;
  driver_id: string | null;
  created_at: string;
  updated_at?: string;
}

export default function TransporterVehiclesPage() {
  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [transporterId, setTransporterId] = useState<string | null>(null);

  const [newVehicle, setNewVehicle] = useState({
    plate_number: "",
    model: "",
    vehicle_type: "truck",
  });

  const supabase = createClient();

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Resolve internal user id from the users table
      const { data: userRow } = await supabase
        .from("users")
        .select("id, org_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!userRow) return;

      // Now resolve the actual driver_id from the drivers table
      const { data: driverRow } = await supabase
        .from("drivers")
        .select("id")
        .eq("user_id", userRow.id)
        .single();

      if (!driverRow) {
        toast.error("Driver profile not found");
        return;
      }
      
      setTransporterId(driverRow.id);

      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("driver_id", driverRow.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFleet((data as Vehicle[]) || []);
    } catch {
      toast.error("Could not load fleet data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transporterId) { toast.error("User session not loaded"); return; }
    if (!newVehicle.plate_number.trim()) { toast.error("Plate number is required"); return; }
    if (!newVehicle.model.trim()) { toast.error("Vehicle model/name is required"); return; }

    const { data: userRow } = await supabase
      .from("users")
      .select("id, org_id")
      .eq("auth_user_id", (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!userRow) { toast.error("User profile not found"); return; }

    // Resolve driver id
    const { data: driverRow } = await supabase
      .from("drivers")
      .select("id")
      .eq("user_id", userRow.id)
      .single();

    if (!driverRow) { toast.error("Driver profile not found"); return; }

    const { error } = await supabase.from("vehicles").insert([{
      driver_id: driverRow.id,
      org_id: userRow.org_id,
      plate_number: newVehicle.plate_number.trim().toUpperCase(),
      model: newVehicle.model.trim(),
      vehicle_type: newVehicle.vehicle_type,
    }]);

    if (error) {
      toast.error("Error: " + error.message);
    } else {
      toast.success("Vehicle added to fleet");
      setNewVehicle({ plate_number: "", model: "", vehicle_type: "truck" });
      setShowAddForm(false);
      fetchVehicles();
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  return (
    <div className={styles.pageStack} style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#1e1b4b" }}>My Fleet</h2>
          <p style={{ color: "#64748b" }}>Manage your registered vehicles</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} style={{ background: "#7c3aed", color: "white", border: "none", padding: "12px 24px", borderRadius: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          <Plus size={20} /> {showAddForm ? "Cancel" : "Add Vehicle"}
        </button>
      </div>

      {/* Add vehicle form */}
      {showAddForm && (
        <div style={{ background: "white", padding: "24px", borderRadius: "20px", marginBottom: "32px", border: "1px solid #e2e8f0" }}>
          <form onSubmit={handleAddVehicle} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", alignItems: "end" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "800", color: "#94a3b8", marginBottom: "4px" }}>PLATE NUMBER *</label>
              <input
                required
                placeholder="e.g. BA 1 PA 1234"
                value={newVehicle.plate_number}
                onChange={e => setNewVehicle({ ...newVehicle, plate_number: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "800", color: "#94a3b8", marginBottom: "4px" }}>MODEL / NAME *</label>
              <input
                required
                placeholder="e.g. Tata 407"
                value={newVehicle.model}
                onChange={e => setNewVehicle({ ...newVehicle, model: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "800", color: "#94a3b8", marginBottom: "4px" }}>VEHICLE TYPE *</label>
              <select
                required
                value={newVehicle.vehicle_type}
                onChange={e => setNewVehicle({ ...newVehicle, vehicle_type: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white" }}
              >
                <option value="truck">Truck</option>
                <option value="van">Van</option>
                <option value="bike">Bike</option>
                <option value="car">Car</option>
              </select>
            </div>
            <button type="submit" style={{ background: "#10b981", color: "white", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>
              Register
            </button>
          </form>
        </div>
      )}

      {loading && <p style={{ textAlign: "center", color: "#94a3b8" }}>Loading vehicles...</p>}

      {/* Registered fleet vehicles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
        {fleet.map((v) => (
            <div key={v.id} style={{ background: "white", padding: "24px", borderRadius: "24px", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div style={{ background: "#f1f5f9", padding: "12px", borderRadius: "14px" }}>
                  <Car size={24} color="#0f172a" />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#1e1b4b", margin: 0 }}>{v.plate_number}</h3>
                <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: "0.85rem" }}>{v.model} • <span style={{ textTransform: "capitalize" }}>{v.vehicle_type}</span></p>
              </div>
            </div>
        ))}
      </div>

      {!loading && fleet.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
          <Car size={48} style={{ opacity: 0.3, margin: "0 auto 12px" }} />
          <p style={{ fontWeight: 600 }}>No vehicles registered yet</p>
          <p style={{ fontSize: "0.85rem" }}>Click “Add Vehicle” to register your first vehicle.</p>
        </div>
      )}
    </div>
  );
}
