// src/app/supplier/orders/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import OrderCard from "@/components/supplier/orders/OrderCard";
import { Search, Inbox, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { SupplierOrder } from "@/types/models";
import styles from "@/components/layout/PortalLayout.module.css";


export default function SupplierOrders() {
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [drivers, setDrivers] = useState<{id: string, name: string}[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

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

  /**
   * Fetch purchase_orders belonging to this supplier via the suppliers table.
   * Schema: purchase_orders.supplier_id → suppliers.id → suppliers.user_id → users.id → users.auth_user_id
   */
  const fetchOrders = useCallback(async (): Promise<SupplierOrder[]> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    // Resolve internal user id
    const { data: userRow } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", userData.user.id)
      .single();

    if (!userRow) return [];

    // Resolve supplier id from the suppliers table
    const { data: supplierRow } = await supabase
      .from("suppliers")
      .select("id")
      .eq("user_id", userRow.id)
      .single();

    // Email fallback if supplier not matched by user_id
    const supplierId = supplierRow?.id ?? (await (async () => {
      const { data } = await supabase
        .from("suppliers")
        .select("id")
        .eq("contact_email", userData.user!.email)
        .single();
      return data?.id;
    })());

    if (!supplierId) {
      console.error("No supplier record found for this user");
      return [];
    }

    // Fetch purchase_orders for this supplier, with order_items
    const { data, error } = await supabase
      .from("purchase_orders")
      .select(`
        *,
        order_items (
          id,
          quantity,
          price_at_order,
          supplier_products:supplier_product_id (
            products:product_id ( name )
          )
        ),
        order_driver_assignments (
          id,
          status,
          driver_id
        )
      `)
      .eq("supplier_id", supplierId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching purchase_orders:", error);
      return [];
    }
    return (data ?? []) as unknown as SupplierOrder[];
  }, [supabase]);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchOrders();
      setOrders(data);

      // Fetch available drivers (role = 'driver' per schema)
      const { data: driverData } = await supabase
        .from("users")
        .select("id, name")
        .eq("role", "driver")
        .eq("is_approved", true);

      if (driverData) setDrivers(driverData);
      setLoading(false);
    };
    loadData();

    // Realtime: listen to both tables
    const channel = supabase
      .channel("supplier_order_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "purchase_orders" }, async () => {
        const updated = await fetchOrders();
        setOrders(updated);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "order_driver_assignments" }, async (payload) => {
        const updated = await fetchOrders();
        setOrders(updated);
        if (payload.eventType === "UPDATE" && payload.new?.status === "rejected") {
          toast.error("Driver rejected a delivery. Please reassign.");
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders, supabase]);

  /** Update purchase_order status directly */
  async function updateOrderStatus(orderId: string, newStatus: string) {
    const { error } = await supabase
      .from("purchase_orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (!error) {
      toast.success(`Order status updated to ${newStatus}`);
      const updatedOrders = await fetchOrders();
      setOrders(updatedOrders);
    } else {
      toast.error("Failed to update: " + error.message);
    }
  }

  /**
   * Assign a driver: insert into order_driver_assignments (not orders.transporter_id).
   * Also updates purchase_orders.status → 'driver_assigned'.
   */
  async function assignDriver(orderId: string, driverId: string) {
    if (!driverId) return;

    // Upsert into order_driver_assignments
    const { error: assignErr } = await supabase
      .from("order_driver_assignments")
      .upsert({
        purchase_order_id: orderId,
        driver_id: driverId,
        status: "pending",
        assigned_at: new Date().toISOString(),
      }, { onConflict: "purchase_order_id,driver_id" });

    if (assignErr) {
      toast.error("Failed to assign driver: " + assignErr.message);
      return;
    }

    // Update purchase_order status to reflect assignment
    await supabase
      .from("purchase_orders")
      .update({ status: "driver_assigned" })
      .eq("id", orderId);

    toast.success("Driver assigned successfully!");
    const updatedOrders = await fetchOrders();
    setOrders(updatedOrders);
  }

  // Orders where all driver assignments were rejected (need reassignment)
  const rejectedOrders = orders.filter(o =>
    (o as any).order_driver_assignments?.every((a: any) => a.status === "rejected") &&
    (o as any).order_driver_assignments?.length > 0
  );

  return (
    <>
      <div className={styles.pageStack}>
        <div className={styles.heroCard}>
          <div className={styles.productsHeaderRow}>
            <div>
              <h2 className={styles.heroTitle}>Purchase Orders</h2>
              <p className={styles.heroText}>Manage and process incoming purchase orders.</p>
            </div>
          </div>

          <div className={styles.filters}>
            <div className={styles.searchBox}>
              <Search size={18} />
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Search by order number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className={styles.select}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="driver_assigned">Driver Assigned</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="ended">Ended</option>
            </select>
          </div>
        </div>

        {/* REJECTED DELIVERY ALERTS */}
        {!loading && rejectedOrders.length > 0 && (
          <div style={{
            background: "linear-gradient(135deg, #fef2f2, #fff1f2)",
            border: "2px solid #fecaca",
            borderRadius: "16px",
            padding: "20px 24px",
            marginBottom: "8px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <AlertTriangle size={20} color="#dc2626" />
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#dc2626" }}>
                Driver Rejected ({rejectedOrders.length})
              </h3>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: "0.85rem", color: "#991b1b" }}>
              The following orders were rejected by the assigned driver. Reassign below.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {rejectedOrders.map(order => (
                <div key={order.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "white", padding: "14px 16px", borderRadius: "12px",
                  border: "1px solid #fecaca", gap: "12px", flexWrap: "wrap"
                }}>
                  <div style={{ minWidth: "180px" }}>
                    <span style={{ fontWeight: 700, color: "#4338ca" }}>
                      Order #{order.order_number || order.id.slice(0, 8)}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "200px" }}>
                    <select
                      defaultValue=""
                      onChange={(e) => { if (e.target.value) assignDriver(order.id, e.target.value); }}
                      style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid #fecaca", background: "#fff", color: "#22054f", fontWeight: 600, fontSize: "0.85rem" }}
                    >
                      <option value="">-- Pick a new driver --</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className={styles.loadingState}>
            <Loader2 className="animate-spin" size={32} style={{ margin: "0 auto 12px", color: "#6008f8" }} />
            <p>Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className={styles.emptyState}>
            <Inbox size={48} style={{ margin: "0 auto 16px", color: "#d1cbe0" }} />
            <p>No orders found matching your criteria</p>
          </div>
        ) : (
          <div className={styles.cardList}>
            {filteredOrders.map((order) => (
              <div key={order.id} id={`order-${order.id}`}>
                <OrderCard
                  order={order}
                  onStatusChange={(newStatus) => updateOrderStatus(order.id, newStatus)}
                  transporters={drivers}
                  onAssignTransporter={(driverId) => assignDriver(order.id, driverId)}
                  showActions={true}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
