"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PlusCircle, Clock } from "lucide-react"; 
import styles from "@/components/layout/PortalLayout.module.css";
import { toast } from "sonner";

export default function TransporterDeliveriesPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    destination: "",
    product: "",
    priority: "Medium",
    eta: "",
    delivery_status: "not_assigned"
  });

  const supabase = createClient();

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

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { count } = await supabase
        .from("orders")
        .select('*', { count: 'exact', head: true });

      const nextId = (count || 0) + 1;
      const serialOrderNumber = `D${nextId.toString().padStart(4, '0')}`;

      const { error } = await supabase.from("orders").insert([{ 
        order_number: serialOrderNumber, 
        delivery_address: formData.destination,
        product_name: formData.product,
        priority: formData.priority, 
        eta: formData.eta || "TBD", 
        delivery_status: formData.delivery_status,
        status: "pending", 
        transporter_id: user?.id, 
        quantity: 1,
        total_amount: 0
      }]);

      if (error) throw error;
      
      toast.success(`Assigned as ${serialOrderNumber}`);
      setIsModalOpen(false);
      setFormData({ destination: "", product: "", priority: "Medium", eta: "", delivery_status: "not_assigned" });
      getHistory(); 
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

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
      case 'in_transit': return { background: "#dbeafe", color: "#1e40af" };
      case 'not_assigned': return { background: "#ffedd5", color: "#9a3412" };
      case 'delivered': return { background: "#dcfce7", color: "#166534" };
      default: return { background: "#f1f5f9", color: "#475569" };
    }
  };

  return (
    <div className={styles.pageStack} style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#2d1a5a" }}>Deliveries</h2>
        <button onClick={() => setIsModalOpen(true)} style={{ display: "flex", gap: "8px", alignItems: "center", background: "#7c3aed", color: "white", padding: "10px 20px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "600" }}>
          <PlusCircle size={18} /> New Delivery
        </button>
      </div>

      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "40px", borderRadius: "24px", width: "100%", maxWidth: "500px" }}>
            <h3 style={{ marginBottom: "24px", color: "#1e1b4b", fontWeight: "700", fontSize: "1.5rem", textAlign: "center" }}>Assign New Delivery</h3>
            <form onSubmit={handleSubmitOrder} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <input required placeholder="Destination" value={formData.destination} onChange={(e) => setFormData({...formData, destination: e.target.value})} style={{ padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }} />
              <input required placeholder="Product" value={formData.product} onChange={(e) => setFormData({...formData, product: e.target.value})} style={{ padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }} />
              
              <div style={{ display: "flex", gap: "10px" }}>
                <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} style={{ flex: 1, padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "white" }}>
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>

                <select value={formData.delivery_status} onChange={(e) => setFormData({...formData, delivery_status: e.target.value})} style={{ flex: 1, padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "white" }}>
                  <option value="not_assigned">Pending</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Completed</option>
                </select>
              </div>

              <input placeholder="ETA (e.g. 30 min)" value={formData.eta} onChange={(e) => setFormData({...formData, eta: e.target.value})} style={{ padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }} />

              <button type="submit" disabled={loading} style={{ background: "#7c3aed", color: "white", padding: "16px", borderRadius: "12px", border: "none", fontWeight: "700", cursor: "pointer", marginTop: "10px" }}>
                {loading ? "Processing..." : "Confirm Assignment"}
              </button>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "0.9rem" }}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      <div style={{ background: "white", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#64748b", fontSize: "0.85rem", borderBottom: "1px solid #f1f5f9" }}>
              <th style={{ padding: "12px" }}>ID</th>
              <th>Destination</th>
              <th>Status</th>
              <th>Priority</th>
              <th>ETA</th>
            </tr>
          </thead>
          <tbody>
            {history.map((order) => (
              <tr key={order.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                <td style={{ padding: "16px 12px", fontWeight: "700", color: "#4338ca" }}>{order.order_number}</td>
                <td>{order.delivery_address}</td>
                <td>
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
                    <option value="not_assigned">Pending</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Completed</option>
                  </select>
                </td>
                <td>
                  <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "700", ...getPriorityStyles(order.priority) }}>
                    {order.priority}
                  </span>
                </td>
                <td style={{ color: "#64748b", fontSize: "0.85rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Clock size={14} /> {order.eta}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}