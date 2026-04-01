"use client";

import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import "./orders.css";

interface Order {
  id: string; // UUID from supabase
  product_name: string;
  supplier_name: string;
  custom_product_id: string;
  category: string;
  total_price: number;
  quantity: number;
  created_at?: string;
}

export default function OrdersPage() {
  const supabase = createClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    product_name: "",
    supplier_name: "",
    custom_product_id: "",
    category: "",
    total_price: "",
    quantity: "",
  });

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load orders: " + error.message);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    Promise.resolve().then(() => fetchOrders());
  }, [fetchOrders]);

  const filteredOrders = orders.filter((order) =>
    (order.product_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.supplier_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.custom_product_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.category || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClick = () => {
    setFormMode("add");
    setFormData({ product_name: "", supplier_name: "", custom_product_id: "", category: "", total_price: "", quantity: "" });
    setViewMode("form");
  };

  const handleEditClick = (order: Order) => {
    setFormMode("edit");
    setEditingId(order.id);
    setFormData({
      product_name: order.product_name || "",
      supplier_name: order.supplier_name || "",
      custom_product_id: order.custom_product_id || "",
      category: order.category || "",
      total_price: (order.total_price || 0).toString(),
      quantity: (order.quantity || 0).toString(),
    });
    setViewMode("form");
  };

  const handleCancelClick = () => {
    setViewMode("list");
  };

  const handleSaveClick = async () => {
    if (!formData.product_name || !formData.category) {
      toast.error("Please fill in the required fields (Product and Category).");
      return;
    }

    const payload = {
      product_name: formData.product_name,
      supplier_name: formData.supplier_name || "Unknown",
      custom_product_id: formData.custom_product_id || `#${Math.floor(Math.random() * 9999)}`,
      category: formData.category,
      total_price: parseFloat(formData.total_price) || 0,
      quantity: parseInt(formData.quantity, 10) || 0,
    };

    if (formMode === "add") {
      const { error } = await supabase.from("orders").insert([payload]);
      if (error) {
        toast.error("Failed to add order: " + error.message);
        return;
      }
      toast.success("Order added successfully!");
    } else if (formMode === "edit" && editingId !== null) {
      const { error } = await supabase.from("orders").update(payload).eq("id", editingId);
      if (error) {
        toast.error("Failed to update order: " + error.message);
        return;
      }
      toast.success("Order updated successfully!");
    }

    setLoading(true);
    fetchOrders();
    setViewMode("list");
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this order?")) {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete order: " + error.message);
      } else {
        toast.success("Order deleted.");
        setLoading(true);
        fetchOrders();
      }
    }
  };

  const headerTitle = viewMode === "list" ? "Orders" : formMode === "add" ? "New Order" : "Edit Order";

  return (
    <AppLayout title={headerTitle}>
      <div className="orders-content">
        
        {viewMode === "list" && (
          <>
            <div className="orders-header-row">
              <h2 className="orders-title">All Orders</h2>
            </div>

            <div className="orders-toolbar">
              <div className="orders-search-wrapper">
                <Search size={16} className="orders-search-icon" />
                <input
                  type="text"
                  className="orders-search-input"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="orders-toolbar-actions">
                <button className="orders-add-btn" onClick={handleAddClick}>
                  <Plus size={16} />
                  Add New Order
                </button>
              </div>
            </div>

            <div className="orders-table-card">
              <div className="orders-table-wrapper">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>
                        <input type="checkbox" className="orders-checkbox" />
                      </th>
                      <th>Product</th>
                      <th>Suppliers</th>
                      <th>Product Id</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "#8c8a94" }}>Loading orders from database...</td>
                      </tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "#8c8a94" }}>No orders found</td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.id}>
                          <td>
                            <input type="checkbox" className="orders-checkbox" />
                          </td>
                          <td style={{ fontWeight: 600 }}>{order.product_name}</td>
                          <td>{order.supplier_name}</td>
                          <td>{order.custom_product_id}</td>
                          <td>{order.category}</td>
                          <td>${Number(order.total_price).toLocaleString()}</td>
                          <td>
                            <span className={order.quantity > 50 ? "orders-quantity-high" : "orders-quantity-low"}>
                              {order.quantity}
                            </span>
                          </td>
                          <td>
                            <div className="orders-action-buttons">
                              <button className="orders-action-btn" onClick={() => handleEditClick(order)}>
                                <Pencil size={16} />
                              </button>
                              <button className="orders-action-btn delete" onClick={() => handleDelete(order.id)}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {viewMode === "form" && (
          <div className="orders-form-container">
            <h3 className="orders-form-breadcrumb">Order Details</h3>

            <div className="orders-form-card">
              <div className="orders-form-row">
                <div className="orders-form-group">
                  <label className="orders-form-label">Product Name *</label>
                  <input
                    type="text"
                    className="orders-form-input"
                    placeholder="Enter product name"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  />
                </div>
                <div className="orders-form-group">
                  <label className="orders-form-label">Suppliers</label>
                  <input
                    type="text"
                    className="orders-form-input"
                    placeholder="Supplier name"
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="orders-form-row">
                <div className="orders-form-group">
                  <label className="orders-form-label">Product ID</label>
                  <input
                    type="text"
                    className="orders-form-input"
                    placeholder="#364738"
                    value={formData.custom_product_id}
                    onChange={(e) => setFormData({ ...formData, custom_product_id: e.target.value })}
                  />
                </div>
                <div className="orders-form-group">
                  <label className="orders-form-label">Category *</label>
                  <input
                    type="text"
                    className="orders-form-input"
                    placeholder="Category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
              </div>

              <div className="orders-form-row">
                <div className="orders-form-group">
                  <label className="orders-form-label">Price</label>
                  <input
                    type="number"
                    className="orders-form-input"
                    placeholder="$.00"
                    value={formData.total_price}
                    onChange={(e) => setFormData({ ...formData, total_price: e.target.value })}
                  />
                </div>
                <div className="orders-form-group">
                  <label className="orders-form-label">Quantity</label>
                  <input
                    type="number"
                    className="orders-form-input"
                    placeholder="Quantity"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
              </div>

              <div className="orders-form-actions">
                <button className="orders-btn orders-btn-secondary" onClick={handleCancelClick}>
                  Cancel
                </button>
                <button className="orders-btn orders-btn-primary" onClick={handleSaveClick}>
                  Save Order
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}