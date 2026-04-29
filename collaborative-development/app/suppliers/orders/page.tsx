// src/app/supplier/orders/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import SupplierLayout from "@/components/layout/SupplierLayout";
import OrderCard from "@/components/supplier/orders/OrderCard";
import { Search } from "lucide-react";
import { toast } from "sonner";
import type { SupplierOrder } from "@/types/models";
import styles from "@/components/layout/PortalLayout.module.css";


export default function SupplierOrders() {
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
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
        organizations (
          id,
          name,
          address,
          phone,
          email
        )
      `)
      .eq("supplier_id", userData.user?.id)
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
      setLoading(false);
    };
    loadOrders();
  }, [fetchOrders]);

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

  return (
    <SupplierLayout>
      <div className={styles.pageStack}>
        <div className={styles.heroCard}>
          <h1 className={styles.heroTitle}>My Orders</h1>
          <p className={styles.heroText}>Search, filter, and update the status of every supplier order in one place.</p>
          
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
          <div className={styles.loadingState}>Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No orders found</p>
          </div>
        ) : (
          <div className={styles.cardList}>
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={(newStatus) => updateOrderStatus(order.id, newStatus)}
                showActions={true}
              />
            ))}
          </div>
        )}
      </div>
    </SupplierLayout>
  );
}
