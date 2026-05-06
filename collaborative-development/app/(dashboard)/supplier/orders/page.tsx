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
  const [transporters, setTransporters] = useState<{id: string, name: string}[]>([]);
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
        order.organizations?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.order_number?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [orders, searchQuery, statusFilter]);

  const fetchOrders = useCallback(async (): Promise<SupplierOrder[]> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    // Step 1: Find the supplier record linked to this auth user
    // The suppliers table has a user_id FK that links to users.id,
    // and users.auth_user_id links to auth.users.id
    const { data: userRow } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", userData.user.id)
      .single();

    if (!userRow) {
      console.error("No users row found for auth user:", userData.user.id);
      return [];
    }

    const { data: supplierRow } = await supabase
      .from("suppliers")
      .select("id")
      .eq("user_id", userRow.id)
      .single();

    if (!supplierRow) {
      // Fallback: try matching by email
      const { data: supplierByEmail } = await supabase
        .from("suppliers")
        .select("id")
        .eq("contact_email", userData.user.email)
        .single();

      if (!supplierByEmail) {
        console.error("No supplier record found for this user");
        return [];
      }

      // Use the email-matched supplier
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            quantity,
            unit_price,
            total_price,
            products:product_id (
              name
            )
          ),
          organizations:organization_id (
            id,
            name,
            address,
            phone,
            email
          )
        `)
        .eq("supplier_id", supplierByEmail.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
        return [];
      }
      return data as SupplierOrder[];
    }

    // Step 2: Fetch orders assigned to this supplier
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          quantity,
          unit_price,
          total_price,
          products:product_id (
            name
          )
        ),
        organizations:organization_id (
          id,
          name,
          address,
          phone,
          email
        )
      `)
      .eq("supplier_id", supplierRow.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      return [];
    }
    return data as SupplierOrder[];
  }, [supabase]);

  useEffect(() => {
    const loadOrders = async () => {
      const data = await fetchOrders();
      setOrders(data);
      
      // Fetch transporters from the SAME organization only
      const { data: currentUser } = await supabase
        .from('users')
        .select('organization_id')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id || '')
        .single();

      if (currentUser?.organization_id) {
        const { data: transData } = await supabase
          .from('users')
          .select('id, name')
          .eq('role', 'transporter')
          .eq('organization_id', currentUser.organization_id);
        if (transData) {
          setTransporters(transData);
        }
      }

      setLoading(false);
    };
    loadOrders();

    // Real-time subscription: auto-refresh when orders change (e.g. transporter rejects)
    const channel = supabase
      .channel("supplier_order_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, async (payload) => {
        const updated = await fetchOrders();
        setOrders(updated);

        // Show a toast if a delivery was just rejected
        if (payload.eventType === 'UPDATE' && payload.new?.delivery_status === 'rejected') {
          toast.error(`Transporter rejected delivery for order ${payload.new?.order_number || ''}. Please reassign.`);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders, supabase]);

  async function updateOrderStatus(orderId: string, newStatus: string) {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (!error) {
      toast.success(`Order status updated to ${newStatus}`);
      const updatedOrders = await fetchOrders();
      setOrders(updatedOrders);
    }
  }

  async function assignTransporter(orderId: string, transporterId: string) {
    const { error } = await supabase
      .from("orders")
      .update({ transporter_id: transporterId || null, delivery_status: transporterId ? 'pending_acceptance' : 'not_assigned' })
      .eq("id", orderId);

    if (!error) {
      toast.success("Transporter assigned successfully!");
      const updatedOrders = await fetchOrders();
      setOrders(updatedOrders);
    } else {
      toast.error("Failed to assign transporter: " + error.message);
    }
  }

  return (
    <>
      <div className={styles.pageStack}>
        <div className={styles.heroCard}>
          <div className={styles.productsHeaderRow}>
            <div>
              <h2 className={styles.heroTitle}>Supplier Orders</h2>
              <p className={styles.heroText}>Manage and process incoming orders from organizations.</p>
            </div>
          </div>

          <div className={styles.filters}>
            <div className={styles.searchBox}>
              <Search size={18} />
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Search by organization or order number..."
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
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready_for_delivery">Ready for Pickup</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>

        {/* REJECTED DELIVERY ALERTS */}
        {!loading && orders.filter(o => o.delivery_status === 'rejected').length > 0 && (
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
                Delivery Rejected ({orders.filter(o => o.delivery_status === 'rejected').length})
              </h3>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: "0.85rem", color: "#991b1b" }}>
              The following orders were rejected by the assigned transporter. Reassign a new driver below.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {orders.filter(o => o.delivery_status === 'rejected').map(order => (
                <div key={order.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "white", padding: "14px 16px", borderRadius: "12px",
                  border: "1px solid #fecaca", gap: "12px", flexWrap: "wrap"
                }}>
                  <div style={{ minWidth: "180px" }}>
                    <span style={{ fontWeight: 700, color: "#4338ca" }}>Order #{order.order_number}</span>
                    <span style={{ marginLeft: "12px", fontSize: "0.8rem", color: "#64748b" }}>
                      {order.organizations?.name || ""}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "200px" }}>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) assignTransporter(order.id, e.target.value);
                      }}
                      style={{
                        flex: 1, padding: "8px 12px", borderRadius: "8px",
                        border: "1px solid #fecaca", background: "#fff",
                        color: "#22054f", fontWeight: 600, fontSize: "0.85rem"
                      }}
                    >
                      <option value="">-- Pick a new driver --</option>
                      {transporters.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
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
                  transporters={transporters}
                  onAssignTransporter={(transporterId) => assignTransporter(order.id, transporterId)}
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
