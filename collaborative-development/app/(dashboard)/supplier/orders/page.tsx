// src/app/supplier/orders/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import OrderCard from "@/components/supplier/orders/OrderCard";
import { Search, Inbox, Loader2 } from "lucide-react";
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
      
      const { data: transData } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'transporter');
      if (transData) {
        setTransporters(transData);
      }

      setLoading(false);
    };
    loadOrders();
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
      .update({ transporter_id: transporterId || null, delivery_status: transporterId ? 'in_transit' : 'not_assigned' })
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
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={(newStatus) => updateOrderStatus(order.id, newStatus)}
                transporters={transporters}
                onAssignTransporter={(transporterId) => assignTransporter(order.id, transporterId)}
                showActions={true}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
