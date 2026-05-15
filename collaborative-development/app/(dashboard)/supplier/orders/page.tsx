// src/app/supplier/orders/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Search, Inbox, Loader2, AlertTriangle, CheckCircle, XCircle, 
  Truck, User, Mail, Phone, MapPin, Calendar, DollarSign, 
  Package, Eye, ChevronDown, ChevronUp, Send, RefreshCw,
  MessageSquare, AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products: { id: string; name: string; selling_price: number };
}

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  license_number: string;
  rating: number;
  is_available: boolean;
}

interface Vehicle {
  id: string;
  license_plate: string;
  vehicle_type: string;
  model: string;
  capacity_kg: number;
}

interface PurchaseOrder {
  id: string;
  order_number: string;
  status: string;
  priority: string;
  total_amount: number;
  expected_delivery_date: string;
  notes: string;
  created_at: string;
  supplier_id: string;
  order_items: OrderItem[];
  suppliers: { name: string; email: string };
  organizations: { name: string; address: string; phone: string };
}

export default function SupplierOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  
  // Rejection Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectOrder, setRejectOrder] = useState<PurchaseOrder | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  
  // Driver Assignment Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignOrder, setAssignOrder] = useState<PurchaseOrder | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  const supabase = createClient();

  const filteredOrders = useMemo(() => {
    let filtered = [...orders];
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.order_number?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [orders, searchQuery, statusFilter]);

  const getSupplierId = useCallback(async (): Promise<string | null> => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;
    
    const { data: supplierByEmail } = await supabase
      .from("suppliers")
      .select("id")
      .eq("email", user.email)
      .single();
    
    return supplierByEmail?.id || null;
  }, [supabase]);

  const fetchDrivers = useCallback(async () => {
    const { data, error } = await supabase
      .from("drivers")
      .select(`
        id,
        name,
        phone,
        license_number,
        rating,
        is_available,
        users:user_id (email)
      `)
      .eq("is_available", true);
    
    if (!error && data) {
      const formattedDrivers = data.map((d: any) => ({
        id: d.id,
        name: d.name,
        email: d.users?.email || "",
        phone: d.phone || "",
        license_number: d.license_number,
        rating: d.rating,
        is_available: d.is_available,
      }));
      setDrivers(formattedDrivers);
    }
  }, [supabase]);

  const fetchVehiclesForDriver = useCallback(async (driverId: string) => {
    if (!driverId) {
      setVehicles([]);
      return;
    }
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("driver_id", driverId)
      .eq("is_available", true);
    
    if (!error && data) {
      setVehicles(data);
    } else {
      setVehicles([]);
    }
  }, [supabase]);

  const fetchOrders = useCallback(async () => {
    try {
      const id = await getSupplierId();
      if (!id) {
        setOrders([]);
        return;
      }
      setSupplierId(id);
      
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          id,
          order_number,
          status,
          priority,
          total_amount,
          expected_delivery_date,
          notes,
          created_at,
          supplier_id,
          order_items(
            id,
            quantity,
            unit_price,
            total_price,
            products(
              id,
              name,
              selling_price
            )
          ),
          suppliers!supplier_id(name, email),
          organizations!org_id(name, address, phone)
        `)
        .eq("supplier_id", id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      toast.error("Failed to load orders");
    }
  }, [supabase, getSupplierId]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchOrders(), fetchDrivers()]);
      setLoading(false);
    };
    loadData();
  }, [fetchOrders, fetchDrivers]);

  const handleApproveOrder = async (order: PurchaseOrder) => {
    const { error } = await supabase
      .from("purchase_orders")
      .update({ status: "approved" })
      .eq("id", order.id);
    
    if (!error) {
      toast.success(`Order #${order.order_number} approved successfully!`);
      await fetchOrders();
    } else {
      toast.error("Failed to approve order");
    }
  };

  const handleRejectOrder = async () => {
    if (!rejectOrder || !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    
    setRejecting(true);
    const { error } = await supabase
      .from("purchase_orders")
      .update({ 
        status: "rejected",
        notes: `Rejected: ${rejectionReason}`
      })
      .eq("id", rejectOrder.id);
    
    if (!error) {
      toast.success(`Order #${rejectOrder.order_number} rejected`);
      setShowRejectModal(false);
      setRejectionReason("");
      setRejectOrder(null);
      await fetchOrders();
    } else {
      toast.error("Failed to reject order");
    }
    setRejecting(false);
  };

  const handleAssignDriver = async () => {
    if (!assignOrder || !selectedDriver) {
      toast.error("Please select a driver");
      return;
    }
    
    setAssigning(true);
    const { error } = await supabase
      .from("order_driver_assignments")
      .insert({
        purchase_order_id: assignOrder.id,
        driver_id: selectedDriver,
        vehicle_id: selectedVehicle || null,
        assigned_by: supplierId,
        status: "pending",
        assigned_at: new Date().toISOString(),
      });
    
    if (!error) {
      await supabase
        .from("purchase_orders")
        .update({ status: "driver_assigned" })
        .eq("id", assignOrder.id);
      
      toast.success(`Driver assigned to order #${assignOrder.order_number}`);
      setShowAssignModal(false);
      setSelectedDriver("");
      setSelectedVehicle("");
      setAssignOrder(null);
      await fetchOrders();
    } else {
      toast.error("Failed to assign driver: " + error.message);
    }
    setAssigning(false);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; color: string; label: string }> = {
      pending: { bg: '#fef3c7', color: '#d97706', label: 'Pending Approval' },
      approved: { bg: '#dcfce7', color: '#16a34a', label: 'Approved' },
      rejected: { bg: '#fee2e2', color: '#dc2626', label: 'Rejected' },
      driver_assigned: { bg: '#dbeafe', color: '#2563eb', label: 'Driver Assigned' },
      in_transit: { bg: '#dbeafe', color: '#2563eb', label: 'In Transit' },
      delivered: { bg: '#d1fae5', color: '#059669', label: 'Delivered' },
    };
    return configs[status] || { bg: '#f3f4f6', color: '#6b7280', label: status };
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    approved: orders.filter(o => o.status === 'approved').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    totalValue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
  };

  return (
    <div className="supplier-orders-container">
      {/* Header */}
      <div className="orders-header">
        <div>
          <h1 className="orders-title">Purchase Orders</h1>
          <p className="orders-subtitle">Manage, approve, and assign drivers to orders</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total"><Package size={22} /></div>
          <div className="stat-info"><p className="stat-label">Total Orders</p><p className="stat-value">{stats.total}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending"><ClockIcon size={22} /></div>
          <div className="stat-info"><p className="stat-label">Pending</p><p className="stat-value">{stats.pending}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon approved"><CheckCircle size={22} /></div>
          <div className="stat-info"><p className="stat-label">Approved</p><p className="stat-value">{stats.approved}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon delivered"><Truck size={22} /></div>
          <div className="stat-info"><p className="stat-label">Delivered</p><p className="stat-value">{stats.delivered}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon value"><DollarSign size={22} /></div>
          <div className="stat-info"><p className="stat-label">Total Value</p><p className="stat-value">₹{stats.totalValue.toLocaleString()}</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Search by order number..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
        </div>
        <div className="filter-tabs">
          {['all', 'pending', 'approved', 'driver_assigned', 'in_transit', 'delivered', 'rejected'].map((status) => (
            <button key={status} className={`filter-tab ${statusFilter === status ? 'active' : ''}`} onClick={() => setStatusFilter(status)}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="filter-count">{orders.filter(o => o.status === status).length}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && <div className="loading-state"><Loader2 size={40} className="spin" /><p>Loading orders...</p></div>}

      {/* Empty */}
      {!loading && filteredOrders.length === 0 && (
        <div className="empty-state"><Inbox size={64} /><h3>No orders found</h3><p>No purchase orders match your current filters</p></div>
      )}

      {/* Orders Grid */}
      {!loading && filteredOrders.length > 0 && (
        <div className="orders-grid">
          {filteredOrders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            const totalItems = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
            const isExpanded = selectedOrder?.id === order.id;

            return (
              <div key={order.id} className="order-card">
                <div className="order-card-header">
                  <div className="order-header-left">
                    <div className="order-number-badge"><Package size={16} /><span>#{order.order_number || order.id.slice(0, 8)}</span></div>
                    <div className="order-badges">
                      <span className={`priority-badge ${order.priority}`}>{order.priority?.toUpperCase() || 'NORMAL'}</span>
                      <span className="status-badge" style={{ background: statusConfig.bg, color: statusConfig.color }}>{statusConfig.label}</span>
                    </div>
                  </div>
                  <div className="order-header-right">
                    <span className="order-amount">₹{order.total_amount?.toLocaleString()}</span>
                    <button className="expand-btn" onClick={() => setSelectedOrder(isExpanded ? null : order)}><Eye size={16} /></button>
                  </div>
                </div>

                <div className="order-card-body">
                  <div className="order-info-grid">
                    <div className="order-info-item"><Calendar size={14} /><span>{new Date(order.created_at).toLocaleDateString()}</span></div>
                    <div className="order-info-item"><Building2Icon size={14} /><span>{order.organizations?.name || 'N/A'}</span></div>
                    <div className="order-info-item"><Package size={14} /><span>{totalItems} items</span></div>
                    {order.expected_delivery_date && <div className="order-info-item"><Truck size={14} /><span>Due: {new Date(order.expected_delivery_date).toLocaleDateString()}</span></div>}
                  </div>
                </div>

                {isExpanded && (
                  <div className="order-card-expanded">
                    <div className="expanded-section"><h4>Order Items</h4>
                      <div className="items-table">
                        <div className="items-header"><span>Product</span><span>Qty</span><span>Unit Price</span><span>Total</span></div>
                        {order.order_items?.map((item, idx) => (
                          <div key={idx} className="items-row"><span className="product-name">{item.products?.name}</span><span>{item.quantity}</span><span>₹{item.unit_price?.toLocaleString()}</span><span>₹{(item.quantity * item.unit_price).toLocaleString()}</span></div>
                        ))}
                      </div>
                    </div>
                    {order.notes && <div className="expanded-section"><h4>Notes</h4><p className="order-notes">{order.notes}</p></div>}
                    <div className="expanded-section"><h4>Delivery Details</h4><div className="delivery-info"><p><strong>Organization:</strong> {order.organizations?.name}</p><p><strong>Address:</strong> {order.organizations?.address || 'N/A'}</p><p><strong>Phone:</strong> {order.organizations?.phone || 'N/A'}</p></div></div>

                    <div className="order-actions">
                      {order.status === 'pending' && (
                        <>
                          <button className="action-btn approve-btn" onClick={() => handleApproveOrder(order)}><CheckCircle size={16} /> Approve Order</button>
                          <button className="action-btn reject-btn" onClick={() => { setRejectOrder(order); setShowRejectModal(true); }}><XCircle size={16} /> Reject Order</button>
                        </>
                      )}
                      {order.status === 'approved' && (
                        <button className="action-btn assign-btn" onClick={() => { setAssignOrder(order); setShowAssignModal(true); fetchDrivers(); }}><Truck size={16} /> Assign Driver</button>
                      )}
                      {order.status === 'driver_assigned' && <div className="status-message info"><Truck size={16} /> Driver assigned - awaiting acceptance</div>}
                      {order.status === 'in_transit' && <div className="status-message info"><Truck size={16} /> Order is in transit</div>}
                      {order.status === 'delivered' && <div className="status-message success"><CheckCircle size={16} /> Order Delivered Successfully</div>}
                      {order.status === 'rejected' && <div className="status-message error"><XCircle size={16} /> Order Rejected</div>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && rejectOrder && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Reject Order</h3><button className="modal-close" onClick={() => setShowRejectModal(false)}>×</button></div>
            <div className="modal-body">
              <p className="modal-order-info">Order: #{rejectOrder.order_number}</p>
              <p className="modal-warning">Are you sure you want to reject this order?</p>
              <div className="form-group"><label>Reason for Rejection *</label><textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Please provide a reason for rejecting this order..." className="form-textarea" rows={4} /></div>
            </div>
            <div className="modal-footer"><button className="btn-cancel" onClick={() => setShowRejectModal(false)}>Cancel</button><button className="btn-reject" onClick={handleRejectOrder} disabled={rejecting || !rejectionReason.trim()}>{rejecting ? <Loader2 size={16} className="spin" /> : <XCircle size={16} />}{rejecting ? "Rejecting..." : "Confirm Rejection"}</button></div>
          </div>
        </div>
      )}

      {/* Assign Driver Modal */}
      {showAssignModal && assignOrder && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Assign Driver</h3><button className="modal-close" onClick={() => setShowAssignModal(false)}>×</button></div>
            <div className="modal-body">
              <p className="modal-order-info">Order: #{assignOrder.order_number}</p>
              <div className="form-group"><label>Select Driver *</label><select value={selectedDriver} onChange={(e) => { setSelectedDriver(e.target.value); fetchVehiclesForDriver(e.target.value); setSelectedVehicle(""); }} className="form-select"><option value="">-- Select a driver --</option>{drivers.map((driver) => (<option key={driver.id} value={driver.id}>{driver.name} - Rating: {driver.rating}⭐</option>))}</select></div>
              {vehicles.length > 0 && (<div className="form-group"><label>Select Vehicle (Optional)</label><select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} className="form-select"><option value="">-- Select a vehicle --</option>{vehicles.map((vehicle) => (<option key={vehicle.id} value={vehicle.id}>{vehicle.license_plate} - {vehicle.model} ({vehicle.vehicle_type})</option>))}</select></div>)}
              {vehicles.length === 0 && selectedDriver && <p className="info-text">No vehicles available for this driver</p>}
            </div>
            <div className="modal-footer"><button className="btn-cancel" onClick={() => setShowAssignModal(false)}>Cancel</button><button className="btn-submit" onClick={handleAssignDriver} disabled={assigning || !selectedDriver}>{assigning ? <Loader2 size={16} className="spin" /> : <Send size={16} />}{assigning ? "Assigning..." : "Assign Driver"}</button></div>
          </div>
        </div>
      )}

      <style jsx>{`
        .supplier-orders-container { padding: 24px; max-width: 1400px; margin: 0 auto; background: #f8fafc; min-height: 100vh; }
        .orders-title { font-size: 28px; font-weight: 700; color: #1e1b4b; margin: 0 0 8px 0; }
        .orders-subtitle { font-size: 14px; color: #64748b; margin: 0; }
        
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 28px; }
        .stat-card { background: white; border-radius: 16px; padding: 16px 20px; display: flex; align-items: center; gap: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; transition: all 0.2s; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .stat-icon.total { background: #e8f4ff; color: #2563eb; }
        .stat-icon.pending { background: #fef3c7; color: #d97706; }
        .stat-icon.approved { background: #dcfce7; color: #16a34a; }
        .stat-icon.delivered { background: #d1fae5; color: #059669; }
        .stat-icon.value { background: #f0fdf4; color: #10b981; }
        .stat-info { flex: 1; }
        .stat-label { font-size: 12px; font-weight: 500; color: #64748b; margin: 0 0 4px 0; }
        .stat-value { font-size: 24px; font-weight: 700; color: #1e1b4b; margin: 0; }
        
        .filters-section { background: white; border-radius: 16px; padding: 20px; margin-bottom: 24px; border: 1px solid #e2e8f0; }
        .search-container { position: relative; margin-bottom: 16px; }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
        .search-input { width: 100%; padding: 12px 14px 12px 42px; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 14px; outline: none; }
        .search-input:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
        .filter-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
        .filter-tab { padding: 8px 16px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; font-size: 13px; font-weight: 500; color: #64748b; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
        .filter-tab:hover { border-color: #7c3aed; color: #7c3aed; }
        .filter-tab.active { background: #7c3aed; border-color: #7c3aed; color: white; }
        .filter-count { background: rgba(0,0,0,0.1); padding: 2px 6px; border-radius: 10px; font-size: 11px; font-weight: 600; }
        .filter-tab.active .filter-count { background: rgba(255,255,255,0.2); }
        
        .loading-state { text-align: center; padding: 60px; color: #94a3b8; }
        .empty-state { text-align: center; padding: 60px; background: white; border-radius: 20px; border: 1px solid #e2e8f0; }
        .empty-state h3 { font-size: 18px; font-weight: 600; color: #1e1b4b; margin: 16px 0 8px; }
        
        .orders-grid { display: flex; flex-direction: column; gap: 16px; }
        .order-card { background: white; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; transition: all 0.2s; }
        .order-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        
        .order-card-header { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; }
        .order-header-left { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .order-number-badge { display: flex; align-items: center; gap: 8px; font-weight: 700; color: #7c3aed; background: #f3e8ff; padding: 6px 12px; border-radius: 10px; font-size: 13px; }
        .order-badges { display: flex; gap: 8px; }
        .priority-badge { padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; }
        .priority-badge.high { background: #fee2e2; color: #dc2626; }
        .priority-badge.medium { background: #fef3c7; color: #d97706; }
        .priority-badge.low { background: #dcfce7; color: #16a34a; }
        .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; }
        .order-header-right { display: flex; align-items: center; gap: 16px; }
        .order-amount { font-size: 20px; font-weight: 800; color: #1e1b4b; }
        .expand-btn { background: none; border: none; cursor: pointer; padding: 8px; border-radius: 8px; color: #64748b; transition: all 0.2s; }
        .expand-btn:hover { background: #f1f5f9; color: #7c3aed; }
        
        .order-card-body { padding: 16px 24px; background: #fafbfc; }
        .order-info-grid { display: flex; gap: 24px; flex-wrap: wrap; }
        .order-info-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #475569; }
        
        .order-card-expanded { padding: 20px 24px; border-top: 1px solid #f1f5f9; background: #fafbfc; }
        .expanded-section { margin-bottom: 24px; }
        .expanded-section h4 { font-size: 14px; font-weight: 700; color: #1e1b4b; margin: 0 0 12px 0; }
        
        .items-table { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
        .items-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; background: #f8fafc; padding: 12px 16px; font-size: 12px; font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0; }
        .items-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; padding: 12px 16px; font-size: 13px; color: #334155; border-bottom: 1px solid #f1f5f9; }
        .items-row:last-child { border-bottom: none; }
        .product-name { font-weight: 500; color: #1e1b4b; }
        
        .order-notes { font-size: 13px; color: #475569; background: #f8fafc; padding: 12px 16px; border-radius: 10px; margin: 0; }
        .delivery-info { background: #f8fafc; padding: 12px 16px; border-radius: 10px; }
        .delivery-info p { margin: 0 0 6px 0; font-size: 13px; color: #334155; }
        
        .order-actions { margin-top: 20px; display: flex; gap: 12px; justify-content: flex-end; }
        .action-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border: none; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .approve-btn { background: linear-gradient(135deg, #10b981, #059669); color: white; }
        .approve-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
        .reject-btn { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }
        .reject-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(239,68,68,0.3); }
        .assign-btn { background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; }
        .assign-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(124,58,237,0.3); }
        .status-message { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 600; }
        .status-message.success { background: #dcfce7; color: #059669; }
        .status-message.error { background: #fee2e2; color: #dc2626; }
        .status-message.info { background: #dbeafe; color: #2563eb; }
        
        /* Modal Styles */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; border-radius: 20px; width: 90%; max-width: 500px; max-height: 90vh; overflow: auto; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e2e8f0; }
        .modal-header h3 { font-size: 18px; font-weight: 700; color: #1e1b4b; margin: 0; }
        .modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #94a3b8; transition: color 0.2s; }
        .modal-close:hover { color: #1e1b4b; }
        .modal-body { padding: 20px 24px; }
        .modal-order-info { font-size: 14px; font-weight: 600; color: #7c3aed; margin-bottom: 16px; }
        .modal-warning { font-size: 14px; color: #dc2626; margin-bottom: 16px; }
        .info-text { font-size: 12px; color: #64748b; margin-top: 8px; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: 13px; font-weight: 600; color: #1e1b4b; margin-bottom: 6px; }
        .form-select, .form-textarea { width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; transition: all 0.2s; }
        .form-select:focus, .form-textarea:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
        .form-textarea { resize: vertical; font-family: inherit; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px; border-top: 1px solid #e2e8f0; }
        .btn-cancel { padding: 10px 20px; border: 1px solid #e2e8f0; background: white; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; color: #64748b; transition: all 0.2s; }
        .btn-cancel:hover { background: #f8fafc; }
        .btn-submit { padding: 10px 20px; border: none; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
        .btn-submit:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(124,58,237,0.3); }
        .btn-reject { padding: 10px 20px; border: none; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
        .btn-reject:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(239,68,68,0.3); }
        .btn-submit:disabled, .btn-reject:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

// Custom icon components to avoid duplicates
function ClockIcon({ size, ...props }: any) {
  return <svg {...props} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}

function Building2Icon({ size, ...props }: any) {
  return <svg {...props} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01"/></svg>;
}