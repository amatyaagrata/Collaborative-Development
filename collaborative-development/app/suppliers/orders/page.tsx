// src/app/supplier/orders/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import SupplierLayout from "@/components/layout/SupplierLayout";
import OrderCard from "@/components/supplier/orders/OrderCard";
import { Search } from "lucide-react";
import { toast } from "sonner";
import type { SupplierOrder } from "@/types/models";


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
          product_name,
          quantity,
          unit_price,
          total_price
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
  }, []); // supabase is a singleton — stable reference

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
      <div className="supplier-orders">
        <div className="orders-header">
          <h1>My Orders</h1>
          
          <div className="filters-bar">
            <div className="search-wrapper">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by organization or order number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready for Pickup</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <p>No orders found</p>
          </div>
        ) : (
          <div className="orders-list">
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