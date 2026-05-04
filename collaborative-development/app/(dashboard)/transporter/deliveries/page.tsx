"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Clock, Calendar, Edit2 } from "lucide-react"; 
import styles from "@/components/layout/PortalLayout.module.css";
import { toast } from "sonner";

export default function TransporterDeliveriesPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  /* State to track if we are editing an existing delivery */
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    destination: "",
    product: "",
    priority: "Medium",
    eta: "",
    due_time: "",
    delivery_status: "not_assigned"
  });

  const supabase = createClient();

  /* Fetch all deliveries associated with the current transporter */
  const getHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("transporter_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) setHistory(data);
  };

  useEffect(() => { getHistory(); }, []);

  /* Opens the modal in edit mode and populates it with existing delivery data */
  const handleOpenEditModal = (order: any) => {
    setEditingId(order.id);
    setFormData({
      destination: order.delivery_address || "",
      product: order.product_name || "",
      priority: order.priority || "Medium",
      eta: order.eta || "",
      due_time: order.due_time || "",
      delivery_status: order.delivery_status || "not_assigned"
    });
    setIsModalOpen(true);
  };

  /* Handles the quick status change dropdown in the table */
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ delivery_status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
      toast.success("Status updated");
      getHistory(); 
    } catch (error) {
      toast.error("Update failed");
    }
  };



  /* Handles Update for existing orders (e.g. updating ETA or Status) */
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          priority: formData.priority,
          eta: formData.eta,
          due_time: formData.due_time,
          delivery_status: formData.delivery_status
        })
        .eq("id", editingId);
      
      if (error) throw error;
      toast.success("Delivery details updated");

      setIsModalOpen(false);
      getHistory(); 
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  /* Visual styling helpers */
  const getPriorityStyles = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return { background: "#fee2e2", color: "#991b1b" };
      case 'medium': return { background: "#fef3c7", color: "#92400e" };
      case 'low': return { background: "#dcfce7", color: "#166534" };
      default: return { background: "#f1f5f9", color: "#475569" };
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'pending_acceptance': return { background: "#fff7ed", color: "#c2410c" };
      case 'accepted': return { background: "#ede9fe", color: "#6d28d9" };
      case 'in_transit': return { background: "#dbeafe", color: "#1e40af" };
      case 'not_assigned': return { background: "#ffedd5", color: "#9a3412" };
      case 'delivered': return { background: "#dcfce7", color: "#166534" };
      case 'rejected': return { background: "#fef2f2", color: "#dc2626" };
      default: return { background: "#f1f5f9", color: "#475569" };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_acceptance': return 'Pending Acceptance';
      case 'accepted': return 'Accepted';
      case 'in_transit': return 'In Transit';
      case 'not_assigned': return 'Not Assigned';
      case 'delivered': return 'Delivered';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  /* Split deliveries into incoming requests and active/past deliveries */
  const activeDeliveries = history.filter(o => !['pending_acceptance'].includes(o.delivery_status));

  return (
    <div className={styles.pageStack} style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#2d1a5a" }}>Deliveries</h2>
      </div>

      {/* EDIT MODAL */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "40px", borderRadius: "24px", width: "100%", maxWidth: "500px" }}>
            <h3 style={{ marginBottom: "24px", color: "#1e1b4b", fontWeight: "700", fontSize: "1.5rem", textAlign: "center" }}>
              Update Delivery Details
            </h3>
            <form onSubmit={handleSubmitOrder} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize: "0.9rem" }}>
                <strong>Destination:</strong> {formData.destination}
              </div>
              <div style={{ padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize: "0.9rem" }}>
                <strong>Product:</strong> {formData.product}
              </div>
              
              <div style={{ display: "flex", gap: "10px" }}>
                <select value={formData.delivery_status} onChange={(e) => setFormData({...formData, delivery_status: e.target.value})} style={{ flex: 1, padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "white" }}>
                  <option value="accepted">Accepted</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontSize: "0.8rem", color: "#64748b", marginLeft: "5px" }}>Due Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={formData.due_time} 
                  onChange={(e) => setFormData({...formData, due_time: e.target.value})} 
                  style={{ padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "white" }} 
                />
              </div>

              <input placeholder="ETA (e.g. 30 min)" value={formData.eta} onChange={(e) => setFormData({...formData, eta: e.target.value})} style={{ padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }} />

              <button type="submit" disabled={loading} style={{ background: "#7c3aed", color: "white", padding: "16px", borderRadius: "12px", border: "none", fontWeight: "700", cursor: "pointer", marginTop: "10px" }}>
                {loading ? "Saving..." : "Update Details"}
              </button>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "0.9rem" }}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* ALL DELIVERIES TABLE */}
      <div style={{ background: "white", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#64748b", fontSize: "0.85rem", borderBottom: "1px solid #f1f5f9" }}>
              <th style={{ padding: "12px" }}>ID</th>
              <th>Destination</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Due Time</th>
              <th>ETA</th>
            </tr>
          </thead>
          <tbody>
            {activeDeliveries.map((order) => (
              <tr key={order.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                {/* Clicking the ID opens the edit modal (only for accepted/in_transit orders) */}
                <td 
                  onClick={() => {
                    if (['accepted', 'in_transit'].includes(order.delivery_status)) {
                      handleOpenEditModal(order);
                    }
                  }}
                  style={{ 
                    padding: "16px 12px", fontWeight: "700", color: "#4338ca", 
                    cursor: ['accepted', 'in_transit'].includes(order.delivery_status) ? "pointer" : "default", 
                    display: "flex", alignItems: "center", gap: "8px" 
                  }}
                >
                  {order.order_number}
                  {['accepted', 'in_transit'].includes(order.delivery_status) && <Edit2 size={12} color="#94a3b8" />}
                </td>
                <td>{order.delivery_address}</td>
                <td>
                  {/* Only allow status dropdown for accepted/in_transit orders */}
                  {['accepted', 'in_transit'].includes(order.delivery_status) ? (
                    <select 
                      value={order.delivery_status} 
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "0.7rem",
                        fontWeight: "700",
                        border: "none",
                        cursor: "pointer",
                        ...getStatusStyles(order.delivery_status)
                      }}
                    >
                      <option value="accepted">Accepted</option>
                      <option value="in_transit">In Transit</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  ) : (
                    <span style={{
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "0.7rem",
                      fontWeight: "700",
                      ...getStatusStyles(order.delivery_status)
                    }}>
                      {getStatusLabel(order.delivery_status)}
                    </span>
                  )}
                </td>
                <td>
                  <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "700", ...getPriorityStyles(order.priority) }}>
                    {order.priority}
                  </span>
                </td>
                <td style={{ color: "#1e1b4b", fontSize: "0.85rem", fontWeight: "500" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Calendar size={14} color="#7c3aed" />
                    {order.due_time ? new Date(order.due_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "N/A"}
                  </div>
                </td>
                <td style={{ color: "#64748b", fontSize: "0.85rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Clock size={14} /> {order.eta || "TBD"}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {activeDeliveries.length === 0 && (
          <p style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>No deliveries yet. Waiting for supplier assignments.</p>
        )}
      </div>
    </div>
  );
}