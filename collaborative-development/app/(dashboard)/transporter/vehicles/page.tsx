"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Car, Plus, CheckCircle, XCircle } from "lucide-react";
import styles from "@/components/layout/PortalLayout.module.css";
import { toast } from "sonner";

/**
 * Schema: vehicles(id, driver_id → drivers.id, vehicle_type, plate_number, capacity, is_available)
 * drivers.id = users.id (same UUID per schema: `CREATE TABLE drivers (id UUID PRIMARY KEY REFERENCES users(id)`)
 */
interface Vehicle {
  id: string;
  driver_id: string;
  vehicle_type: 'truck' | 'van' | 'bike' | 'car';
  plate_number: string;
  capacity: string | null;
  is_available: boolean;
  created_at: string;
}

export default function TransporterVehiclesPage() {
  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [driverId, setDriverId] = useState<string | null>(null);

  const [newVehicle, setNewVehicle] = useState({
    vehicle_type: "truck" as Vehicle["vehicle_type"],
    plate_number: "",
    capacity: "",
  });

  const supabase = createClient();

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "truck": return { bg: "#f0f4ff", text: "#3730a3" };
      case "van":   return { bg: "#f0fdf4", text: "#166534" };
      case "bike":  return { bg: "#fff7ed", text: "#9a3412" };
      case "car":   return { bg: "#fdf4ff", text: "#7e22ce" };
      default:      return { bg: "#f1f5f9", text: "#64748b" };
    }
  };

  /** drivers.id = users.id (schema: `CREATE TABLE drivers (id UUID PRIMARY KEY REFERENCES users(id))`) */
  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get the user's id from the users table — this IS the driver_id
      const { data: userRow } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (!userRow) return;

      setDriverId(userRow.id);

      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("driver_id", userRow.id)
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
    if (!driverId) { toast.error("User session not loaded"); return; }
    if (!newVehicle.plate_number.trim()) { toast.error("Plate number is required"); return; }

    const { error } = await supabase.from("vehicles").insert([{
      driver_id: driverId,
      vehicle_type: newVehicle.vehicle_type,
      plate_number: newVehicle.plate_number.trim().toUpperCase(),
      capacity: newVehicle.capacity.trim() || null,
      is_available: true,
    }]);

    if (error) {
      toast.error(error.message.includes("unique") ? "Plate number already registered" : "Error: " + error.message);
    } else {
      toast.success("Vehicle added to fleet");
      setNewVehicle({ vehicle_type: "truck", plate_number: "", capacity: "" });
      setShowAddForm(false);
      fetchVehicles();
    }
  };

  const toggleAvailability = async (vehicleId: string, current: boolean) => {
    const { error } = await supabase
      .from("vehicles")
      .update({ is_available: !current })
      .eq("id", vehicleId);

    if (error) toast.error("Failed to update availability");
    else {
      toast.success(`Vehicle marked as ${!current ? "available" : "unavailable"}`);
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
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "800", color: "#94a3b8", marginBottom: "4px" }}>VEHICLE TYPE</label>
              <select
                value={newVehicle.vehicle_type}
                onChange={e => setNewVehicle({ ...newVehicle, vehicle_type: e.target.value as Vehicle["vehicle_type"] })}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
              >
                <option value="truck">Truck</option>
                <option value="van">Van</option>
                <option value="bike">Bike</option>
                <option value="car">Car</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "800", color: "#94a3b8", marginBottom: "4px" }}>CAPACITY (optional)</label>
              <input
                placeholder="e.g. 5 tons"
                value={newVehicle.capacity}
                onChange={e => setNewVehicle({ ...newVehicle, capacity: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
              />
            </div>
            <button type="submit" style={{ background: "#10b981", color: "white", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>
              Register
            </button>
          </form>
        </div>
      )}

      {loading && <p style={{ textAlign: "center", color: "#94a3b8" }}>Loading fleet...</p>}

      {/* Fleet grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
        {fleet.map((v) => {
          const colors = getTypeStyles(v.vehicle_type);
          return (
            <div key={v.id} style={{ background: "white", padding: "24px", borderRadius: "24px", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div style={{ background: colors.bg, padding: "12px", borderRadius: "14px" }}>
                  <Car size={24} color={colors.text} />
                </div>
                <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "0.7rem", fontWeight: "800", background: colors.bg, color: colors.text, textTransform: "uppercase" }}>
                  {v.vehicle_type}
                </span>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#1e1b4b", margin: 0 }}>{v.plate_number}</h3>
                <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: "0.85rem" }}>
                  {v.capacity ? `Capacity: ${v.capacity}` : "Capacity not specified"}
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "8px 14px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "700",
                  background: v.is_available ? "#dcfce7" : "#fef2f2",
                  color: v.is_available ? "#166534" : "#dc2626",
                }}>
                  {v.is_available ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  {v.is_available ? "Available" : "Unavailable"}
                </div>
                <button
                  onClick={() => toggleAvailability(v.id, v.is_available)}
                  style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "6px 12px", fontSize: "0.75rem", cursor: "pointer", background: "transparent", color: "#64748b", fontWeight: 600 }}
                >
                  Toggle
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && fleet.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
          <Car size={48} style={{ opacity: 0.3, margin: "0 auto 12px" }} />
          <p style={{ fontWeight: 600 }}>No vehicles registered yet</p>
          <p style={{ fontSize: "0.85rem" }}>Click "Add Vehicle" to register your first vehicle.</p>
        </div>
      )}
    </div>
  );
}