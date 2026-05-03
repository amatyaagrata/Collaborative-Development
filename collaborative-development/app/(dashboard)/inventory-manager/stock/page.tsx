"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import "./orders.css";

interface Order { id: string; product_name: string; supplier_name: string; custom_product_id: string; category: string; total_price: number; quantity: number; created_at?: string; }
interface Product { id: string; name: string; price: number; stock: number; supplier_id?: string; categories?: { name?: string }[] | { name?: string } | null; }
interface SupplierOption { id: string; name: string; }

function getCategoryName(product: Product): string {
  if (Array.isArray(product.categories)) return product.categories[0]?.name || "";
  return (product.categories as { name?: string })?.name || "";
}

export default function IMStockPage() {
  const supabase = createClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ product_name: "", supplier_name: "", supplier_id: "", custom_product_id: "", category: "", total_price: "", quantity: "", selected_product_id: "" });

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Failed to load orders: " + error.message);
    else setOrders(data || []);
    setLoading(false);
  }, [supabase]);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    const { data, error } = await supabase.from("products").select("id, name, price, stock, supplier_id, categories:category_id(name)").order("name", { ascending: true });
    if (error) toast.error("Failed to load products: " + error.message);
    else setProducts(data || []);
    setLoadingProducts(false);
  }, [supabase]);

  const fetchSuppliers = useCallback(async () => {
    const { data, error } = await supabase.from("suppliers").select("id, name").eq("is_active", true).order("name");
    if (error) console.error("Failed to load suppliers:", error.message);
    else setSuppliers(data || []);
  }, [supabase]);

  useEffect(() => { Promise.resolve().then(() => { fetchOrders(); fetchProducts(); fetchSuppliers(); }); }, [fetchOrders, fetchProducts, fetchSuppliers]);

  const filteredOrders = orders.filter((order) =>
    (order.product_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.supplier_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.custom_product_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.category || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClick = () => {
    setFormMode("add");
    setFormData({ product_name: "", supplier_name: "", supplier_id: "", custom_product_id: "", category: "", total_price: "", quantity: "", selected_product_id: "" });
    setViewMode("form");
  };

  const handleProductSelect = (productId: string) => {
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      const supId = selectedProduct.supplier_id || "";
      const supMatch = suppliers.find(s => s.id === supId);
      
      setFormData({ 
        ...formData, 
        selected_product_id: productId, 
        product_name: selectedProduct.name, 
        category: getCategoryName(selectedProduct), 
        total_price: selectedProduct.price.toString(),
        supplier_id: supId,
        supplier_name: supMatch?.name || formData.supplier_name
      });
    }
  };

  const handleEditClick = (order: Order) => {
    setFormMode("edit");
    setEditingId(order.id);
    setFormData({ product_name: order.product_name || "", supplier_name: order.supplier_name || "", supplier_id: "", custom_product_id: order.custom_product_id || "", category: order.category || "", total_price: (order.total_price || 0).toString(), quantity: (order.quantity || 0).toString(), selected_product_id: "" });
    setViewMode("form");
  };

  const handleSaveClick = async () => {
    if (!formData.product_name || !formData.supplier_id) { toast.error("Please select a Product and a Supplier."); return; }
    const total_price = parseFloat(formData.total_price);
    const quantity = parseInt(formData.quantity, 10);
    if (isNaN(total_price) || total_price < 0) { toast.error("Please enter a valid price."); return; }
    if (isNaN(quantity) || quantity < 0) { toast.error("Please enter a valid quantity."); return; }

    const payload: Record<string, unknown> = {
      product_name: formData.product_name, supplier_name: formData.supplier_name || "Unknown",
      custom_product_id: formData.custom_product_id || `#${Math.floor(Math.random() * 9999)}`,
      category: formData.category, total_price: total_price || 0, quantity: quantity || 0,
      total_amount: (total_price || 0) * (quantity || 0),
    };

    if (formData.supplier_id) payload.supplier_id = formData.supplier_id;

    if (formMode === "add") {
      const { data: newOrder, error } = await supabase.from("orders").insert([{ ...payload, status: "pending" }]).select().single();
      if (error) { toast.error("Failed to add order: " + error.message); return; }
      
      if (formData.selected_product_id) {
        const { error: itemError } = await supabase.from("order_items").insert([{
          order_id: newOrder.id,
          product_id: formData.selected_product_id,
          quantity: quantity,
          unit_price: total_price,
          total_price: total_price * quantity
        }]);
        if (itemError) console.error("Failed to add order item:", itemError);
      }
      
      toast.success("Order added successfully!");
    } else if (formMode === "edit" && editingId !== null) {
      const { error } = await supabase.from("orders").update(payload).eq("id", editingId);
      if (error) { toast.error("Failed to update order: " + error.message); return; }
      toast.success("Order updated successfully!");
    }
    setLoading(true); fetchOrders(); setViewMode("list");
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this order?")) {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) toast.error("Failed to delete order: " + error.message);
      else { toast.success("Order deleted successfully."); setLoading(true); fetchOrders(); }
    }
  };

  return (
    <>
      <div className="orders-content">
        {viewMode === "list" && (
          <>
            <div className="orders-header-row"><h2 className="orders-title">All Stock Orders</h2></div>
            <div className="orders-toolbar">
              <div className="orders-search-wrapper"><Search size={16} className="orders-search-icon" /><input type="text" className="orders-search-input" placeholder="Search orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
              <div className="orders-toolbar-actions"><button className="orders-add-btn" onClick={handleAddClick}><Plus size={16} />Add New Order</button></div>
            </div>
            <div className="orders-table-card">
              <div className="orders-table-wrapper">
                <table className="orders-table">
                  <thead><tr><th style={{ width: 40 }}><input type="checkbox" className="orders-checkbox" /></th><th>Product</th><th>Suppliers</th><th>Product Id</th><th>Price</th><th>Quantity</th><th>Action</th></tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#8c8a94" }}>Loading orders from database...</td></tr>
                    : filteredOrders.length === 0 ? <tr><td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#8c8a94" }}>No orders found</td></tr>
                    : filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td><input type="checkbox" className="orders-checkbox" /></td>
                        <td style={{ fontWeight: 600 }}>{order.product_name}</td><td>{order.supplier_name}</td><td>{order.custom_product_id}</td><td>${Number(order.total_price).toLocaleString()}</td>
                        <td><span className={order.quantity > 50 ? "orders-quantity-high" : "orders-quantity-low"}>{order.quantity}</span></td>
                        <td><div className="orders-action-buttons"><button className="orders-action-btn" onClick={() => handleEditClick(order)}><Pencil size={16} /></button><button className="orders-action-btn delete" onClick={() => handleDelete(order.id)}><Trash2 size={16} /></button></div></td>
                      </tr>
                    ))}
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
                <div className="orders-form-group"><label className="orders-form-label">Select Product *</label><select className="orders-form-input" value={formData.selected_product_id} onChange={(e) => handleProductSelect(e.target.value)} disabled={formMode === "edit"}><option value="">-- Select a product --</option>{loadingProducts ? <option disabled>Loading products...</option> : products.map((p) => <option key={p.id} value={p.id}>{p.name} - Stock: {p.stock} - Price: ${p.price}</option>)}</select>{formMode === "edit" && <small style={{ color: "#666", marginTop: "4px", display: "block" }}>Product cannot be changed in edit mode</small>}</div>
                <div className="orders-form-group"><label className="orders-form-label">Product Name *</label><input type="text" className="orders-form-input" placeholder="Enter product name" value={formData.product_name} onChange={(e) => setFormData({ ...formData, product_name: e.target.value })} readOnly={!!formData.selected_product_id} /></div>
              </div>
              <div className="orders-form-row">
                <div className="orders-form-group"><label className="orders-form-label">Supplier *</label><select className="orders-form-input" value={formData.supplier_id} onChange={(e) => { const s = suppliers.find(sup => sup.id === e.target.value); setFormData({ ...formData, supplier_id: e.target.value, supplier_name: s?.name || "" }); }}><option value="">-- Select a supplier --</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div className="orders-form-group"><label className="orders-form-label">Product ID</label><input type="text" className="orders-form-input" placeholder="#364738" value={formData.custom_product_id} onChange={(e) => setFormData({ ...formData, custom_product_id: e.target.value })} /></div>
              </div>
              <div className="orders-form-row">
                <div className="orders-form-group"><label className="orders-form-label">Price</label><input type="number" className="orders-form-input" placeholder="$.00" min="0" step="0.01" value={formData.total_price} onChange={(e) => { const val = e.target.value; if (val === "" || parseFloat(val) >= 0) setFormData({ ...formData, total_price: val }); }} readOnly={!!formData.selected_product_id} /></div>
                <div className="orders-form-group"><label className="orders-form-label">Quantity</label><input type="number" className="orders-form-input" placeholder="Quantity" min="0" step="1" value={formData.quantity} onChange={(e) => { const val = e.target.value; if (val === "" || parseInt(val, 10) >= 0) setFormData({ ...formData, quantity: val }); }} /></div>
              </div>
              <div className="orders-form-actions"><button className="orders-btn orders-btn-secondary" onClick={() => setViewMode("list")}>Cancel</button><button className="orders-btn orders-btn-primary" onClick={handleSaveClick}>Save Order</button></div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
