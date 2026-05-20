"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Search, Loader2, X, Package, Truck, Clock, CheckCircle, Eye, Filter, Flag, MessageSquare, AlertTriangle } from "lucide-react";

interface Order { 
  id: string; 
  order_number: string;
  product_name: string; 
  supplier_name: string; 
  supplier_id?: string;
  product_id?: string;
  custom_product_id: string; 
  category: string; 
  total_amount: number; 
  quantity: number; 
  status: string;
  priority?: string;
  notes?: string;
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  
  const [formData, setFormData] = useState({ 
    product_name: "", 
    supplier_name: "", 
    supplier_id: "", 
    custom_product_id: "", 
    category: "", 
    total_price: "", 
    quantity: "", 
    selected_product_id: "",
    priority: "medium",
    notes: ""
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
          priority,
          notes,
          total_amount,
          created_at,
          supplier_id,
          suppliers:supplier_id (name)
        `)
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Orders fetch error:", error);
        toast.error("Failed to load orders: " + error.message);
      } else {
        const transformedOrders = (data || []).map((order: any) => ({
          id: order.id,
          order_number: order.order_number || order.id.slice(0, 8),
          product_name: "Purchase Order",
          supplier_name: (order.suppliers as any)?.name || (order.suppliers as any)?.[0]?.name || "Unknown Supplier",
          supplier_id: order.supplier_id,
          custom_product_id: order.order_number || order.id.slice(0, 8),
          category: "Purchase Order",
          total_amount: order.total_amount || 0,
          quantity: 1,
          status: order.status,
          priority: order.priority || "medium",
          notes: order.notes || "",
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

  const fetchOrderItems = useCallback(async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from("order_items")
        .select(`
          product_id,
          quantity,
          unit_price,
          products:product_id (id, name, selling_price, sku, category_id, categories:category_id (name))
        `)
        .eq("purchase_order_id", orderId)
        .maybeSingle();

      if (error) {
        console.error("Order items fetch error:", error);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error("Unexpected error:", err);
      return null;
    }
  }, [supabase]);

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

  const getStatusIcon = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'pending': return <Clock size={14} />;
      case 'approved': return <CheckCircle size={14} />;
      case 'shipped': return <Truck size={14} />;
      case 'delivered': return <Package size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'shipped': return '#3b82f6';
      case 'delivered': return '#059669';
      default: return '#6b7280';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch(priority?.toLowerCase()) {
      case 'high': return <AlertTriangle size={14} />;
      case 'medium': return <Flag size={14} />;
      case 'low': return <Flag size={14} />;
      default: return <Flag size={14} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority?.toLowerCase()) {
      case 'high': return '#dc2626';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      (order.product_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.supplier_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.custom_product_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.order_number || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesPriority = priorityFilter === "all" || order.priority?.toLowerCase() === priorityFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

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
      selected_product_id: "",
      priority: "medium",
      notes: ""
    });
    setViewMode("form");
  };

  const handleEditClick = async (order: Order) => {
    setFormMode("edit");
    setEditingId(order.id);
    
    // Fetch order items to get product details
    const orderItem = await fetchOrderItems(order.id);
    
    if (orderItem && orderItem.product_id) {
      // Fetch product details to populate the form
      const { data: productData } = await supabase
        .from("products")
        .select("id, name, selling_price, sku, category_id, categories:category_id (name)")
        .eq("id", orderItem.product_id)
        .single();
      
      if (productData) {
        setFormData({ 
          product_name: productData.name || "", 
          supplier_name: order.supplier_name || "", 
          supplier_id: order.supplier_id || "", 
          custom_product_id: productData.sku || "", 
          category: getCategoryName(productData as any), 
          total_price: orderItem.unit_price?.toString() || "0", 
          quantity: orderItem.quantity?.toString() || "1", 
          selected_product_id: orderItem.product_id,
          priority: order.priority || "medium",
          notes: order.notes || ""
        });
        
        // Load products for this supplier
        if (order.supplier_id) {
          await fetchProducts(order.supplier_id);
        }
      } else {
        setFormData({ 
          product_name: "", 
          supplier_name: order.supplier_name || "", 
          supplier_id: order.supplier_id || "", 
          custom_product_id: "", 
          category: "", 
          total_price: "0", 
          quantity: "1", 
          selected_product_id: "",
          priority: order.priority || "medium",
          notes: order.notes || ""
        });
        
        if (order.supplier_id) {
          await fetchProducts(order.supplier_id);
        }
      }
    } else {
      setFormData({ 
        product_name: "", 
        supplier_name: order.supplier_name || "", 
        supplier_id: order.supplier_id || "", 
        custom_product_id: "", 
        category: "", 
        total_price: "0", 
        quantity: "1", 
        selected_product_id: "",
        priority: order.priority || "medium",
        notes: order.notes || ""
      });
      
      if (order.supplier_id) {
        await fetchProducts(order.supplier_id);
      }
    }
    
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
      quantity: "",
      priority: formData.priority,
      notes: formData.notes
    });
    if (supplierId) {
      fetchProducts(supplierId);
    } else {
      setProducts([]);
    }
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
            priority: formData.priority,
            notes: formData.notes || `Product: ${formData.product_name}, Quantity: ${quantity}`,
            total_amount: total_price * quantity
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
        // Update purchase order
        const { error: updateError } = await supabase
          .from("purchase_orders")
          .update({
            priority: formData.priority,
            notes: formData.notes || `Product: ${formData.product_name}, Quantity: ${quantity}`,
            total_amount: total_price * quantity
          })
          .eq("id", editingId);

        if (updateError) {
          toast.error("Failed to update order: " + updateError.message);
          setSubmitting(false);
          return;
        }

        // Update or insert order item
        if (formData.selected_product_id) {
          // Check if order item exists
          const { data: existingItem } = await supabase
            .from("order_items")
            .select("id")
            .eq("purchase_order_id", editingId)
            .maybeSingle();

          if (existingItem) {
            // Update existing order item
            const { error: itemError } = await supabase
              .from("order_items")
              .update({
                product_id: formData.selected_product_id,
                quantity: quantity,
                unit_price: total_price,
                total_price: total_price * quantity
              })
              .eq("purchase_order_id", editingId);

            if (itemError) {
              console.error("Failed to update order item:", itemError);
            }
          } else {
            // Insert new order item
            const { error: itemError } = await supabase
              .from("order_items")
              .insert([{
                purchase_order_id: editingId,
                product_id: formData.selected_product_id,
                quantity: quantity,
                unit_price: total_price,
                total_price: total_price * quantity
              }]);

            if (itemError) {
              console.error("Failed to add order item:", itemError);
            }
          }
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

  const totalOrders = filteredOrders.length;
  const totalAmount = filteredOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const pendingOrders = filteredOrders.filter(o => o.status === 'pending').length;
  const highPriorityOrders = filteredOrders.filter(o => o.priority === 'high').length;

  return (
    <>
      <div className="po-container">
        {viewMode === "list" && (
          <>
            <div className="po-header">
              <div>
                <h1 className="po-title">Purchase Orders</h1>
                <p className="po-subtitle">Manage and track all your purchase orders</p>
              </div>
              <button className="po-btn-primary" onClick={handleAddClick}>
                <Plus size={18} />
                <span>Create Order</span>
              </button>
            </div>

            <div className="po-stats-grid">
              <div className="po-stat-card">
                <div className="po-stat-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                  <Package size={22} />
                </div>
                <div className="po-stat-info">
                  <h3>{totalOrders}</h3>
                  <p>Total Orders</p>
                </div>
              </div>
              <div className="po-stat-card">
                <div className="po-stat-icon" style={{ background: '#d1fae5', color: '#059669' }}>
                  <Clock size={22} />
                </div>
                <div className="po-stat-info">
                  <h3>{pendingOrders}</h3>
                  <p>Pending Orders</p>
                </div>
              </div>
              <div className="po-stat-card">
                <div className="po-stat-icon" style={{ background: '#fed7aa', color: '#ea580c' }}>
                  <AlertTriangle size={22} />
                </div>
                <div className="po-stat-info">
                  <h3>{highPriorityOrders}</h3>
                  <p>High Priority</p>
                </div>
              </div>
              <div className="po-stat-card">
                <div className="po-stat-icon" style={{ background: '#cffafe', color: '#0891b2' }}>
                  <CheckCircle size={22} />
                </div>
                <div className="po-stat-info">
                  <h3>₹{totalAmount.toLocaleString()}</h3>
                  <p>Total Value</p>
                </div>
              </div>
            </div>

            <div className="po-filters-bar">
              <div className="po-search-wrapper">
                <Search size={18} className="po-search-icon" />
                <input 
                  type="text" 
                  className="po-search-input" 
                  placeholder="Search by order number, supplier..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>
              <div className="po-filter-group">
                <Filter size={16} />
                <select 
                  className="po-filter-select" 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
              <div className="po-filter-group">
                <Flag size={16} />
                <select 
                  className="po-filter-select" 
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="all">All Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="po-table-container">
              {loading ? (
                <div className="po-loading-state">
                  <Loader2 size={32} className="spin" />
                  <p>Loading orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="po-empty-state">
                  <Package size={48} />
                  <h3>No orders found</h3>
                  <p>Create your first purchase order to get started</p>
                  <button className="po-btn-primary" onClick={handleAddClick}>
                    <Plus size={16} />
                    Create Order
                  </button>
                </div>
              ) : (
                <table className="po-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>
                        <input type="checkbox" className="po-checkbox" />
                      </th>
                      <th>Order #</th>
                      <th>Supplier</th>
                      <th>Amount</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th style={{ width: 100 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <input type="checkbox" className="po-checkbox" />
                        </td>
                        <td>
                          <div className="po-order-number">{order.order_number}</div>
                        </td>
                        <td>
                          <div className="po-supplier-cell">
                            <div className="po-supplier-avatar">
                              {order.supplier_name.charAt(0)}
                            </div>
                            <span>{order.supplier_name}</span>
                          </div>
                        </td>
                        <td className="po-amount">₹{Number(order.total_amount).toLocaleString()}</td>
                        <td>
                          <span 
                            className="po-priority-badge"
                            style={{ 
                              background: `${getPriorityColor(order.priority || 'medium')}15`,
                              color: getPriorityColor(order.priority || 'medium')
                            }}
                          >
                            {getPriorityIcon(order.priority || 'medium')}
                            {(order.priority || 'medium').charAt(0).toUpperCase() + (order.priority || 'medium').slice(1)}
                          </span>
                        </td>
                        <td>
                          <span 
                            className="po-status-badge"
                            style={{ 
                              background: `${getStatusColor(order.status)}15`,
                              color: getStatusColor(order.status)
                            }}
                          >
                            {getStatusIcon(order.status)}
                            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
                          </span>
                        </td>
                        <td className="po-date">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td>
                          <div className="po-action-buttons">
                            <button 
                              className="po-action-btn po-edit-btn"
                              onClick={() => handleEditClick(order)}
                              title="Edit Order"
                            >
                              <Pencil size={16} />
                            </button>
                            <button 
                              className="po-action-btn po-delete-btn"
                              onClick={() => handleDelete(order.id)}
                              title="Delete Order"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
        
        {viewMode === "form" && (
          <div className="po-form-wrapper">
            <div className="po-form-header">
              <div>
                <h2>{formMode === "add" ? "Create New Order" : "Edit Order"}</h2>
                <p>Fill in the details to {formMode === "add" ? "create a" : "update"} purchase order</p>
              </div>
              <button className="po-close-btn" onClick={() => setViewMode("list")}>
                <X size={20} />
              </button>
            </div>

            <div className="po-form-card">
              <div className="po-form-section">
                <h3>Order Information</h3>
                <div className="po-form-grid">
                  <div className="po-form-group">
                    <label className="po-form-label">Supplier <span className="po-required">*</span></label>
                    <select 
                      className="po-form-select" 
                      value={formData.supplier_id} 
                      onChange={(e) => handleSupplierSelect(e.target.value)}
                      disabled={formMode === "edit"}
                    >
                      <option value="">-- Select a supplier --</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="po-form-group">
                    <label className="po-form-label">Product <span className="po-required">*</span></label>
                    <select 
                      className="po-form-select" 
                      value={formData.selected_product_id} 
                      onChange={(e) => handleProductSelect(e.target.value)} 
                      disabled={!formData.supplier_id}
                    >
                      <option value="">
                        {formData.supplier_id ? "-- Select a product --" : "-- Choose supplier first --"}
                      </option>
                      {loadingProducts ? (
                        <option disabled>Loading products...</option>
                      ) : (
                        products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Stock: {p.current_stock})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="po-form-group">
                    <label className="po-form-label">Product Name</label>
                    <input 
                      type="text" 
                      className="po-form-input" 
                      placeholder="Product name" 
                      value={formData.product_name} 
                      onChange={(e) => setFormData({ ...formData, product_name: e.target.value })} 
                      readOnly={!!formData.selected_product_id} 
                    />
                  </div>

                  <div className="po-form-group">
                    <label className="po-form-label">SKU/Product ID</label>
                    <input 
                      type="text" 
                      className="po-form-input" 
                      placeholder="SKU" 
                      value={formData.custom_product_id} 
                      readOnly 
                    />
                  </div>

                  <div className="po-form-group">
                    <label className="po-form-label">Category</label>
                    <input 
                      type="text" 
                      className="po-form-input" 
                      placeholder="Category" 
                      value={formData.category} 
                      readOnly 
                    />
                  </div>

                  <div className="po-form-group">
                    <label className="po-form-label">Priority <span className="po-required">*</span></label>
                    <select 
                      className="po-form-select" 
                      value={formData.priority} 
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      <option value="high">🔴 High Priority</option>
                      <option value="medium">🟡 Medium Priority</option>
                      <option value="low">🟢 Low Priority</option>
                    </select>
                  </div>

                  <div className="po-form-group">
                    <label className="po-form-label">Unit Price (₹)</label>
                    <input 
                      type="number" 
                      className="po-form-input" 
                      placeholder="Unit price" 
                      value={formData.total_price} 
                      onChange={(e) => setFormData({ ...formData, total_price: e.target.value })}
                    />
                  </div>

                  <div className="po-form-group">
                    <label className="po-form-label">Quantity <span className="po-required">*</span></label>
                    <input 
                      type="number" 
                      className="po-form-input" 
                      placeholder="Quantity" 
                      min="1" 
                      step="1" 
                      value={formData.quantity} 
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} 
                    />
                  </div>

                  <div className="po-form-group">
                    <label className="po-form-label">Total Amount</label>
                    <div className="po-total-amount">
                      ₹{((parseFloat(formData.total_price) || 0) * (parseInt(formData.quantity) || 0)).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="po-form-section">
                <h3>Additional Information</h3>
                <div className="po-form-group">
                  <label className="po-form-label">
                    <MessageSquare size={14} style={{ display: 'inline', marginRight: 4 }} />
                    Message / Notes to Supplier
                  </label>
                  <textarea
                    className="po-form-textarea"
                    placeholder="Add any special instructions, delivery requirements, or notes for the supplier..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                  />
                  <p className="po-form-hint">
                    This message will be sent to the supplier with the purchase order
                  </p>
                </div>
              </div>

              <div className="po-form-actions">
                <button 
                  className="po-btn-cancel" 
                  onClick={() => setViewMode("list")}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  className="po-btn-submit" 
                  onClick={handleSaveClick}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 size={18} className="spin" /> : null}
                  {submitting ? "Saving..." : (formMode === "add" ? "Create Order" : "Update Order")}
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

        .po-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
        }

        .po-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .po-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0 0 4px 0;
        }

        .po-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0;
        }

        .po-btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .po-btn-primary:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .po-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .po-stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
        }

        .po-stat-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          transform: translateY(-2px);
        }

        .po-stat-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
        }

        .po-stat-info h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0 0 4px 0;
        }

        .po-stat-info p {
          font-size: 0.8rem;
          color: #64748b;
          margin: 0;
        }

        .po-filters-bar {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .po-search-wrapper {
          flex: 1;
          position: relative;
          min-width: 250px;
        }

        .po-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .po-search-input {
          width: 100%;
          padding: 10px 12px 10px 40px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
        }

        .po-search-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }

        .po-filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: white;
        }

        .po-filter-select {
          padding: 10px 8px;
          border: none;
          background: transparent;
          font-size: 0.875rem;
          outline: none;
          cursor: pointer;
        }

        .po-table-container {
          background: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          overflow: auto;
        }

        .po-table {
          width: 100%;
          border-collapse: collapse;
        }

        .po-table thead tr {
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .po-table th {
          text-align: left;
          padding: 16px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .po-table td {
          padding: 16px;
          font-size: 0.875rem;
          color: #1a1a2e;
          border-bottom: 1px solid #f1f5f9;
        }

        .po-table tbody tr:hover {
          background: #fafbff;
        }

        .po-checkbox {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .po-order-number {
          font-weight: 600;
          color: #3b82f6;
        }

        .po-supplier-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .po-supplier-avatar {
          width: 32px;
          height: 32px;
          background: #e0e7ff;
          color: #4f46e5;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .po-amount {
          font-weight: 600;
          color: #1a1a2e;
        }

        .po-priority-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .po-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .po-date {
          color: #64748b;
        }

        .po-action-buttons {
          display: flex;
          gap: 6px;
        }

        .po-action-btn {
          padding: 6px;
          border: none;
          background: transparent;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
        }

        .po-edit-btn:hover {
          background: #d1fae5;
          color: #059669;
        }

        .po-delete-btn:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .po-loading-state, .po-empty-state {
          text-align: center;
          padding: 60px;
          color: #64748b;
        }

        .po-empty-state h3 {
          margin: 16px 0 8px;
          color: #1a1a2e;
        }

        .po-form-wrapper {
          max-width: 800px;
          margin: 0 auto;
        }

        .po-form-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .po-form-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0 0 4px;
        }

        .po-form-header p {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0;
        }

        .po-close-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .po-close-btn:hover {
          background: #f1f5f9;
        }

        .po-form-card {
          background: white;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }

        .po-form-section {
          padding: 24px;
          border-bottom: 1px solid #f1f5f9;
        }

        .po-form-section h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #1a1a2e;
          margin: 0 0 20px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .po-form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .po-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .po-form-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .po-required {
          color: #ef4444;
        }

        .po-form-input, .po-form-select {
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
        }

        .po-form-textarea {
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
          font-family: inherit;
          resize: vertical;
        }

        .po-form-textarea:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }

        .po-form-input:focus, .po-form-select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }

        .po-form-input:read-only {
          background: #f8fafc;
          cursor: not-allowed;
        }

        .po-total-amount {
          padding: 10px 12px;
          background: #eff6ff;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #3b82f6;
        }

        .po-form-hint {
          font-size: 0.7rem;
          color: #94a3b8;
          margin: 4px 0 0 0;
        }

        .po-form-actions {
          display: flex;
          gap: 12px;
          padding: 20px 24px;
          background: #f8fafc;
        }

        .po-btn-cancel {
          flex: 1;
          padding: 10px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .po-btn-cancel:hover {
          background: #f1f5f9;
        }

        .po-btn-submit {
          flex: 1;
          padding: 10px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .po-btn-submit:hover:not(:disabled) {
          background: #2563eb;
        }

        .po-btn-submit:disabled, .po-btn-cancel:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .po-container {
            padding: 16px;
          }
          .po-form-grid {
            grid-template-columns: 1fr;
          }
          .po-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .po-filters-bar {
            flex-direction: column;
          }
          .po-table-container {
            overflow-x: auto;
          }
        }
      `}</style>
    </>
  );
}