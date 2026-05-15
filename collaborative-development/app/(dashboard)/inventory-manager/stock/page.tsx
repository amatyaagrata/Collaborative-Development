"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Search, Loader2 } from "lucide-react";
import "./orders.css";

interface Order { 
  id: string; 
  order_number: string;
  product_name: string; 
  supplier_name: string; 
  custom_product_id: string; 
  category: string; 
  total_amount: number; 
  quantity: number; 
  status: string;
  created_at?: string; 
}

interface Product { 
  id: string; 
  name: string; 
  selling_price: number;
  current_stock: number;
  supplier_id?: string; 
  sku?: string; 
  categories?: { name?: string }[] | { name?: string } | null; 
}

interface SupplierOption { 
  id: string; 
  name: string; 
}

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
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({ 
    product_name: "", 
    supplier_name: "", 
    supplier_id: "", 
    custom_product_id: "", 
    category: "", 
    total_price: "", 
    quantity: "", 
    selected_product_id: "" 
  });

  const getCurrentOrgId = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data: userRow } = await supabase
      .from('users')
      .select('org_id')
      .eq('auth_user_id', user.id)
      .single();
    
    return userRow?.org_id || null;
  }, [supabase]);

  const fetchOrders = useCallback(async () => {
    try {
      const orgId = await getCurrentOrgId();
      if (!orgId) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          id,
          order_number,
          status,
          total_amount,
          created_at,
          suppliers:supplier_id (name)
        `)
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Orders fetch error:", error);
        toast.error("Failed to load orders: " + error.message);
      } else {
        const transformedOrders = (data || []).map(order => ({
          id: order.id,
          order_number: order.order_number || order.id.slice(0, 8),
          product_name: "Purchase Order",
          supplier_name: order.suppliers?.name || "Unknown",
          custom_product_id: order.order_number || order.id.slice(0, 8),
          category: "Purchase Order",
          total_amount: order.total_amount || 0,
          quantity: 1,
          status: order.status,
          created_at: order.created_at
        }));
        setOrders(transformedOrders);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [supabase, getCurrentOrgId]);

  // FIXED: Removed all comments from the select string
  const fetchProducts = useCallback(async (supplierId?: string) => {
    setLoadingProducts(true);
    
    try {
      const orgId = await getCurrentOrgId();
      if (!orgId) return;

      let query = supabase
        .from("products")
        .select(`
          id,
          name,
          selling_price,
          current_stock,
          supplier_id,
          sku,
          categories:category_id (name)
        `)
        .eq("org_id", orgId)
        .order("name", { ascending: true });
      
      if (supplierId) {
        query = query.eq("supplier_id", supplierId);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Products fetch error:", error);
        toast.error("Failed to load products: " + error.message);
      } else {
        setProducts(data || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoadingProducts(false);
    }
  }, [supabase, getCurrentOrgId]);

  const fetchSuppliers = useCallback(async () => {
    try {
      const orgId = await getCurrentOrgId();
      if (!orgId) {
        setCurrentOrgId(null);
        return;
      }
      
      setCurrentOrgId(orgId);
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, name")
        .eq("org_id", orgId)
        .eq("is_active", true)
        .order("name");
      
      if (error) {
        console.error("Failed to load suppliers:", error.message);
      } else {
        setSuppliers(data || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  }, [supabase, getCurrentOrgId]);

  useEffect(() => {
    Promise.resolve().then(() => { 
      fetchOrders(); 
      fetchProducts(); 
      fetchSuppliers(); 
    });
  }, [fetchOrders, fetchProducts, fetchSuppliers]);

  const filteredOrders = orders.filter((order) =>
    (order.product_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.supplier_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.custom_product_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.category || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClick = () => {
    setFormMode("add");
    setFormData({ 
      product_name: "", 
      supplier_name: "", 
      supplier_id: "", 
      custom_product_id: "", 
      category: "", 
      total_price: "", 
      quantity: "", 
      selected_product_id: "" 
    });
    setViewMode("form");
  };

  const handleProductSelect = (productId: string) => {
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      setFormData({ 
        ...formData, 
        selected_product_id: productId, 
        product_name: selectedProduct.name, 
        category: getCategoryName(selectedProduct), 
        total_price: selectedProduct.selling_price.toString(),
        custom_product_id: selectedProduct.sku || "",
      });
    }
  };

  const handleSupplierSelect = (supplierId: string) => {
    const s = suppliers.find(sup => sup.id === supplierId);
    setFormData({ 
      ...formData, 
      supplier_id: supplierId, 
      supplier_name: s?.name || "",
      selected_product_id: "",
      product_name: "",
      category: "",
      total_price: "",
      custom_product_id: "",
      quantity: ""
    });
    if (supplierId) {
      fetchProducts(supplierId);
    } else {
      setProducts([]);
    }
  };

  const handleEditClick = (order: Order) => {
    setFormMode("edit");
    setEditingId(order.id);
    setFormData({ 
      product_name: order.product_name || "", 
      supplier_name: order.supplier_name || "", 
      supplier_id: "", 
      custom_product_id: order.custom_product_id || "", 
      category: order.category || "", 
      total_price: (order.total_amount || 0).toString(), 
      quantity: (order.quantity || 0).toString(), 
      selected_product_id: "" 
    });
    setViewMode("form");
  };

  const handleSaveClick = async () => {
    if (!formData.product_name || !formData.supplier_id) { 
      toast.error("Please select a Product and a Supplier."); 
      return; 
    }
    
    const total_price = parseFloat(formData.total_price) || 0;
    const quantity = parseInt(formData.quantity, 10);
    
    if (isNaN(quantity) || quantity <= 0) { 
      toast.error("Please enter a quantity greater than 0."); 
      return; 
    }

    let orgId = currentOrgId;
    if (!orgId) {
      orgId = await getCurrentOrgId();
    }

    if (!orgId) {
      toast.error("Organization not found. Please log in again.");
      return;
    }

    setSubmitting(true);

    try {
      if (formMode === "add") {
        const orderNumber = `PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        const { data: newOrder, error: orderError } = await supabase
          .from("purchase_orders")
          .insert([{
            org_id: orgId,
            order_number: orderNumber,
            supplier_id: formData.supplier_id,
            status: "pending",
            total_amount: total_price * quantity,
            notes: `Product: ${formData.product_name}, Quantity: ${quantity}`
          }])
          .select()
          .single();

        if (orderError) {
          toast.error("Failed to add order: " + orderError.message);
          setSubmitting(false);
          return;
        }

        if (formData.selected_product_id) {
          const { error: itemError } = await supabase
            .from("order_items")
            .insert([{
              purchase_order_id: newOrder.id,
              product_id: formData.selected_product_id,
              quantity: quantity,
              unit_price: total_price,
              total_price: total_price * quantity
            }]);

          if (itemError) {
            console.error("Failed to add order item:", itemError);
          }
        }

        toast.success("Purchase order created successfully!");
      } else if (formMode === "edit" && editingId) {
        const { error } = await supabase
          .from("purchase_orders")
          .update({
            total_amount: total_price * quantity,
            notes: `Product: ${formData.product_name}, Quantity: ${quantity}`
          })
          .eq("id", editingId);

        if (error) {
          toast.error("Failed to update order: " + error.message);
          setSubmitting(false);
          return;
        }
        toast.success("Order updated successfully!");
      }
      
      await fetchOrders();
      setViewMode("list");
    } catch (err) {
      console.error("Save error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this order?")) {
      const { error } = await supabase.from("purchase_orders").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete order: " + error.message);
      } else {
        toast.success("Order deleted successfully.");
        fetchOrders();
      }
    }
  };

  return (
    <>
      <div className="orders-content">
        {viewMode === "list" && (
          <>
            <div className="orders-header-row">
              <h2 className="orders-title">Purchase Orders</h2>
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
                  <Plus size={16} />Add New Order
                </button>
              </div>
            </div>
            <div className="orders-table-card">
              <div className="orders-table-wrapper">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th><input type="checkbox" className="orders-checkbox" /></th>
                      <th>Order #</th>
                      <th>Supplier</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", padding: "32px" }}>
                          <Loader2 size={24} className="spin" /> Loading orders...
                        </td>
                      </tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", padding: "32px" }}>
                          No orders found
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.id}>
                          <td><input type="checkbox" className="orders-checkbox" /></td>
                          <td style={{ fontWeight: 600 }}>{order.order_number}</td>
                          <td>{order.supplier_name}</td>
                          <td>₹{Number(order.total_amount).toLocaleString()}</td>
                          <td>
                            <span className={`status-badge ${order.status}`}>
                              {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
                            </span>
                          </td>
                          <td>{order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}</td>
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
                  <label className="orders-form-label">Supplier *</label>
                  <select 
                    className="orders-form-input" 
                    value={formData.supplier_id} 
                    onChange={(e) => handleSupplierSelect(e.target.value)}
                    disabled={formMode === "edit"}
                  >
                    <option value="">-- Select a supplier --</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="orders-form-group">
                  <label className="orders-form-label">Select Product *</label>
                  <select 
                    className="orders-form-input" 
                    value={formData.selected_product_id} 
                    onChange={(e) => handleProductSelect(e.target.value)} 
                    disabled={formMode === "edit" || !formData.supplier_id}
                  >
                    <option value="">
                      {formData.supplier_id ? "-- Select a product --" : "-- Choose supplier first --"}
                    </option>
                    {loadingProducts ? (
                      <option disabled>Loading products...</option>
                    ) : (
                      products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} - Stock: {p.current_stock} - Price: ₹{p.selling_price}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
              
              <div className="orders-form-row">
                <div className="orders-form-group">
                  <label className="orders-form-label">Product Name *</label>
                  <input 
                    type="text" 
                    className="orders-form-input" 
                    placeholder="Enter product name" 
                    value={formData.product_name} 
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })} 
                    readOnly={!!formData.selected_product_id} 
                  />
                </div>
                <div className="orders-form-group">
                  <label className="orders-form-label">Product ID (SKU)</label>
                  <input 
                    type="text" 
                    className="orders-form-input" 
                    placeholder="#364738" 
                    value={formData.custom_product_id} 
                    readOnly 
                  />
                </div>
              </div>
              
              <div className="orders-form-row">
                <div className="orders-form-group">
                  <label className="orders-form-label">Category</label>
                  <input 
                    type="text" 
                    className="orders-form-input" 
                    placeholder="Category" 
                    value={formData.category} 
                    readOnly 
                  />
                </div>
                <div className="orders-form-group">
                  <label className="orders-form-label">Quantity</label>
                  <input 
                    type="number" 
                    className="orders-form-input" 
                    placeholder="Quantity" 
                    min="0" 
                    step="1" 
                    value={formData.quantity} 
                    onChange={(e) => { 
                      const val = e.target.value; 
                      if (val === "" || parseInt(val, 10) >= 0) {
                        setFormData({ ...formData, quantity: val });
                      } 
                    }} 
                  />
                </div>
              </div>
              
              <div className="orders-form-actions">
                <button 
                  className="orders-btn orders-btn-secondary" 
                  onClick={() => setViewMode("list")}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  className="orders-btn orders-btn-primary" 
                  onClick={handleSaveClick}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 size={16} className="spin" /> : null}
                  {submitting ? "Saving..." : "Save Order"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
        .status-badge.pending {
          background: #fef3c7;
          color: #d97706;
        }
        .status-badge.approved {
          background: #dcfce7;
          color: #16a34a;
        }
        .status-badge.shipped {
          background: #dbeafe;
          color: #2563eb;
        }
        .status-badge.delivered {
          background: #d1fae5;
          color: #059669;
        }
      `}</style>
    </>
  );
}