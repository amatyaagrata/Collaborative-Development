"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import "./orders.css";

/**
 * Schema-aligned interfaces for purchase_orders.
 * purchase_orders: id, created_by, supplier_id, status, priority, order_number, notes,
 *                  expected_delivery_days, created_at, updated_at
 * order_items: id, purchase_order_id, supplier_product_id, quantity, price_at_order
 */
interface PurchaseOrder {
  id: string;
  order_number: string | null;
  status: string;
  priority: string;
  notes: string | null;
  created_at: string;
  // Joined
  supplier_name?: string;
  product_name?: string;
  total_quantity?: number;
  total_value?: number;
}

interface SupplierOption { id: string; name: string; }
interface SupplierProduct {
  id: string;
  name: string;
  price: number;
  current_stock: number;
  supplier_id: string;
}

export default function IMStockPage() {
  const supabase = createClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    supplier_id: "",
    selected_supplier_product_id: "",
    quantity: "",
    notes: "",
    priority: "medium" as "high" | "medium" | "low",
  });

  /**
   * Fetch purchase_orders created by the current IM user.
   * Joins supplier name and first order_item for display.
   */
  const fetchOrders = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const { data: userRow } = await supabase
      .from("users")
      .select("id, organization_id")
      .eq("auth_user_id", userData.user?.id || "")
      .single();

    if (!userRow) { setLoading(false); return; }
    setCurrentUserId(userRow.id);
    setOrgId(userRow.organization_id);

    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        notes,
        created_at,
        suppliers:supplier_id ( name ),
        order_items (
          quantity,
          unit_price
        )
      `)
      .eq("user_id", userRow.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load orders: " + error.message);
    } else {
      const mapped: PurchaseOrder[] = (data || []).map((o: any) => ({
        id: o.id,
        order_number: o.order_number,
        status: o.status,
        priority: "medium", // legacy compatibility
        notes: o.notes,
        created_at: o.created_at,
        supplier_name: o.suppliers?.name ?? "N/A",
        total_quantity: (o.order_items || []).reduce((s: number, i: any) => s + (i.quantity || 0), 0),
        total_value: (o.order_items || []).reduce((s: number, i: any) => s + ((i.quantity || 0) * (i.unit_price || 0)), 0),
      }));
      setOrders(mapped);
    }
    setLoading(false);
  }, [supabase]);

  /** Fetch all active suppliers */
  const fetchSuppliers = useCallback(async () => {
    const { data, error } = await supabase
      .from("suppliers")
      .select("id, name")
      .eq("is_active", true)
      .order("name");
    if (!error) setSuppliers(data || []);
  }, [supabase]);

  /** Fetch supplier_products for a given supplier */
  const fetchSupplierProducts = useCallback(async (supplierId: string) => {
    if (!supplierId) { setSupplierProducts([]); return; }
    setLoadingProducts(true);
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price, stock, supplier_id")
      .eq("supplier_id", supplierId)
      .eq("is_active", true);

    if (!error) {
      setSupplierProducts(
        (data || []).map((p: any) => ({
          id: p.id,
          name: p.name || "Product",
          price: p.price || 0,
          current_stock: p.stock || 0,
          supplier_id: p.supplier_id,
        }))
      );
    }
    setLoadingProducts(false);
  }, [supabase]);

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
  }, [fetchOrders, fetchSuppliers]);

  const filteredOrders = orders.filter(
    (o) =>
      (o.order_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.supplier_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.status || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClick = () => {
    setFormMode("add");
    setFormData({ supplier_id: "", selected_supplier_product_id: "", quantity: "", notes: "", priority: "medium" });
    setSupplierProducts([]);
    setViewMode("form");
  };

  const handleSupplierSelect = (supplierId: string) => {
    setFormData({ ...formData, supplier_id: supplierId, selected_supplier_product_id: "" });
    fetchSupplierProducts(supplierId);
  };

  /** Create a purchase_order + order_item (aligned with schema) */
  const handleSaveClick = async () => {
    if (!formData.supplier_id) { toast.error("Please select a supplier."); return; }
    if (!formData.selected_supplier_product_id) { toast.error("Please select a product."); return; }
    const qty = parseInt(formData.quantity, 10);
    if (isNaN(qty) || qty <= 0) { toast.error("Please enter a valid quantity."); return; }
    if (!currentUserId) { toast.error("User session not loaded."); return; }

    const selectedProduct = supplierProducts.find(sp => sp.id === formData.selected_supplier_product_id);
    const priceAtOrder = selectedProduct?.price ?? 0;

    if (formMode === "add") {
      // 1. Insert order
      const { data: newOrder, error: orderErr } = await supabase
        .from("orders")
        .insert([{
          user_id: currentUserId,
          organization_id: orgId,
          supplier_id: formData.supplier_id,
          status: "pending",
          notes: formData.notes || null,
          total_amount: qty * priceAtOrder,
        }])
        .select()
        .single();

      if (orderErr) { toast.error("Failed to create order: " + orderErr.message); return; }

      // 2. Insert order_item
      const { error: itemErr } = await supabase
        .from("order_items")
        .insert([{
          order_id: newOrder.id,
          product_id: formData.selected_supplier_product_id,
          quantity: qty,
          unit_price: priceAtOrder,
          total_price: qty * priceAtOrder,
        }]);

      if (itemErr) {
        console.error("order_items insert failed:", itemErr);
        toast.warning("Order created but item failed to save.");
      } else {
        toast.success("Order created successfully!");
      }
    } else if (formMode === "edit" && editingId) {
      // Only update mutable fields (status, notes)
      const { error } = await supabase
        .from("orders")
        .update({ notes: formData.notes || null })
        .eq("id", editingId);
      if (error) { toast.error("Failed to update: " + error.message); return; }
      toast.success("Order updated successfully!");
    }

    setLoading(true);
    fetchOrders();
    setViewMode("list");
  };

  const handleEditClick = (order: PurchaseOrder) => {
    setFormMode("edit");
    setEditingId(order.id);
    setFormData({
      supplier_id: "",
      selected_supplier_product_id: "",
      quantity: String(order.total_quantity || ""),
      notes: order.notes || "",
      priority: (order.priority as "high" | "medium" | "low") || "medium",
    });
    setViewMode("form");
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this order?")) {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) toast.error("Failed to delete: " + error.message);
      else { toast.success("Order deleted."); setLoading(true); fetchOrders(); }
    }
  };

  const priorityStyles: Record<string, { background: string; color: string }> = {
    high:   { background: "#fee2e2", color: "#991b1b" },
    medium: { background: "#fef3c7", color: "#92400e" },
    low:    { background: "#dcfce7", color: "#166534" },
  };

  return (
    <>
      <div className="orders-content">
        {viewMode === "list" && (
          <>
            <div className="orders-header-row">
              <h2 className="orders-title">Orders</h2>
            </div>
            <div className="orders-toolbar">
              <div className="orders-search-wrapper">
                <Search size={16} className="orders-search-icon" />
                <input
                  type="text"
                  className="orders-search-input"
                  placeholder="Search by order #, supplier, or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="orders-toolbar-actions">
                <button className="orders-add-btn" onClick={handleAddClick}>
                  <Plus size={16} />New Order
                </button>
              </div>
            </div>

            <div className="orders-table-card">
              <div className="orders-table-wrapper">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Supplier</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Total Qty</th>
                      <th>Total Value</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "#8c8a94" }}>Loading orders...</td></tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "#8c8a94" }}>No orders found</td></tr>
                    ) : filteredOrders.map((order) => {
                      const ps = priorityStyles[order.priority] ?? priorityStyles.medium;
                      return (
                        <tr key={order.id}>
                          <td style={{ fontWeight: 600 }}>{order.order_number || `#${order.id.slice(0, 8)}`}</td>
                          <td>{order.supplier_name}</td>
                          <td>
                            <span style={{ padding: "3px 10px", borderRadius: "10px", fontSize: "0.7rem", fontWeight: 700, ...ps }}>
                              {order.priority}
                            </span>
                          </td>
                          <td>
                            <span className={order.total_quantity! > 50 ? "orders-quantity-high" : "orders-quantity-low"}>
                              {order.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td>{order.total_quantity ?? 0}</td>
                          <td>Rs. {(order.total_value ?? 0).toLocaleString()}</td>
                          <td style={{ color: "#64748b", fontSize: "0.85rem" }}>
                            {new Date(order.created_at).toLocaleDateString()}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {viewMode === "form" && (
          <div className="orders-form-container">
            <h3 className="orders-form-breadcrumb">{formMode === "add" ? "New Order" : "Edit Order"}</h3>
            <div className="orders-form-card">
              {formMode === "add" && (
                <>
                  <div className="orders-form-row">
                    <div className="orders-form-group">
                      <label className="orders-form-label">Supplier *</label>
                      <select
                        className="orders-form-input"
                        value={formData.supplier_id}
                        onChange={(e) => handleSupplierSelect(e.target.value)}
                      >
                        <option value="">-- Select a supplier --</option>
                        {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="orders-form-group">
                      <label className="orders-form-label">Product *</label>
                      <select
                        className="orders-form-input"
                        value={formData.selected_supplier_product_id}
                        onChange={(e) => setFormData({ ...formData, selected_supplier_product_id: e.target.value })}
                        disabled={!formData.supplier_id}
                      >
                        <option value="">{formData.supplier_id ? "-- Select a product --" : "-- Choose supplier first --"}</option>
                        {loadingProducts
                          ? <option disabled>Loading...</option>
                          : supplierProducts.map((sp) => (
                              <option key={sp.id} value={sp.id}>
                                {sp.name} — Stock: {sp.current_stock} — Rs. {sp.price}
                              </option>
                            ))
                        }
                      </select>
                    </div>
                  </div>
                  <div className="orders-form-row">
                    <div className="orders-form-group">
                      <label className="orders-form-label">Quantity *</label>
                      <input
                        type="number"
                        className="orders-form-input"
                        placeholder="Quantity"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      />
                    </div>
                    <div className="orders-form-group">
                      <label className="orders-form-label">Priority</label>
                      <select
                        className="orders-form-input"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as "high" | "medium" | "low" })}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {formMode === "edit" && (
                <div className="orders-form-row">
                  <div className="orders-form-group">
                    <label className="orders-form-label">Priority</label>
                    <select
                      className="orders-form-input"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as "high" | "medium" | "low" })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="orders-form-row">
                <div className="orders-form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="orders-form-label">Notes (optional)</label>
                  <input
                    type="text"
                    className="orders-form-input"
                    placeholder="Any delivery notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="orders-form-actions">
                <button className="orders-btn orders-btn-secondary" onClick={() => setViewMode("list")}>Cancel</button>
                <button className="orders-btn orders-btn-primary" onClick={handleSaveClick}>
                  {formMode === "add" ? "Create Order" : "Update Order"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
